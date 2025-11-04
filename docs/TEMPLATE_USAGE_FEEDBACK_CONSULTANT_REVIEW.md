# Template Usage & Feedback System - Consultant Review & Recommendations

**Date:** 2025-01-09  
**Reviewer:** External Consultant (Uzziel)  
**Status:** Production-Ready Recommendations

---

## 📋 **Executive Summary**

**Original Plan Assessment:** ✅ **Solid foundation** - Clear goals, thoughtful schema, good UX

**Key Improvements Needed:**
1. **Event tables** instead of JSON counters (performance & scalability)
2. **Server-scheduled prompts** instead of client timers (reliability)
3. **RLS + consent** for compliance (PIPEDA/Law 25)

**Strategic Changes:**
- Event tables + materialized aggregates (ditch JSON counters)
- Server-scheduled feedback prompts (2-minute timer that survives navigation)
- Tight RLS + consent + aggregate-first UI (privacy by design)

---

## ✅ **What's Solid**

- Clear goals (visibility, delayed rating, attribution, RAG later)
- Thoughtful feedback schema (role-aware, session-aware, optional transcript)
- Sensible UX (inline, dismissible banner)
- Good separation for existing Section 7 R&D RAG

---

## 🔧 **Critical Fixes**

### **1. Don't Store Counters in JSON** ⚠️ **CRITICAL**

**Problem:**
- JSON counters in `template_combinations.usage_stats` cause:
  - Write-amplification (every read needs write)
  - Race conditions (concurrent updates)
  - Bad query plans (JSONB scans)

**Solution: Event + Aggregate Model**

#### **Event Table**
```sql
-- Every time a template is applied
CREATE TABLE template_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id varchar(255) NOT NULL REFERENCES template_combinations(id),
  user_id uuid NOT NULL REFERENCES profiles(user_id),
  case_id uuid REFERENCES cases(id),
  session_id uuid REFERENCES sessions(id),
  section_id text,
  mode_id text,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tue_template_time_idx ON template_usage_events(template_id, applied_at DESC);
CREATE INDEX tue_user_idx ON template_usage_events(user_id);
```

#### **Feedback Table (One per session)**
```sql
-- One feedback per (template_id, session_id, user_id)
CREATE TABLE template_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id varchar(255) NOT NULL REFERENCES template_combinations(id),
  user_id uuid NOT NULL REFERENCES profiles(user_id),
  session_id uuid REFERENCES sessions(id),
  case_id uuid REFERENCES cases(id),
  section_id text,
  mode_id text,
  transcript_id uuid REFERENCES transcripts(id),
  
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  comment text,
  tags text[] DEFAULT '{}',
  
  applied_at timestamptz NOT NULL,
  rated_at timestamptz NOT NULL DEFAULT now(),
  time_to_rate integer GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (rated_at - applied_at))) STORED,
  was_dismissed boolean DEFAULT false,
  interaction_time integer,
  
  CONSTRAINT uniq_feedback_once UNIQUE (template_id, session_id, user_id)
);

CREATE INDEX tf_template_time_idx ON template_feedback(template_id, rated_at DESC);
CREATE INDEX tf_rating_idx ON template_feedback(template_id, rating);
```

#### **Materialized View (Fast Aggregates)**
```sql
CREATE MATERIALIZED VIEW mv_template_stats AS
SELECT
  t.id AS template_id,
  COUNT(u.id) AS total_usage,
  COUNT(DISTINCT u.user_id) AS unique_users,
  MAX(u.applied_at) AS last_used_at,
  AVG(NULLIF(f.rating,0))::numeric(4,2) AS avg_rating,
  COUNT(f.id) AS rating_count
FROM template_combinations t
LEFT JOIN template_usage_events u ON u.template_id = t.id
LEFT JOIN template_feedback f ON f.template_id = t.id
GROUP BY t.id;

-- Refresh hook (call after batches):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_template_stats;
```

**Benefits:**
- ✅ No write-contention (append-only events)
- ✅ Fast aggregates (materialized view)
- ✅ Accurate counts (event-based)
- ✅ Time-series queries (indexed by time)

---

### **2. RLS & Consent (PIPEDA / Law 25)** 🔒 **DEFERRED**

**Status:** ⏸️ **Deferred until roles are defined** - Can be added later without breaking changes

**Must-Haves (Future):**
- Users can insert their own usage/feedback, read only aggregates
- Only admins/managers can see identifiable user fields (name/email)
- Consent flag on profile; block insert if consent = false (or anonymize)

**For Now:**
- ✅ Add `consent_analytics` column to `profiles` table (default: true)
- ⏸️ RLS policies can be added later when roles are defined
- ✅ Backend API should check consent before inserting
- ✅ Frontend should show opt-out option in settings

#### **Row Level Security (RLS)** ⏸️ **DEFERRED**

**For Phase 1 (Now):**
- ✅ Backend API handles authentication (JWT middleware)
- ✅ Backend checks `consent_analytics` before insert
- ✅ Backend returns aggregates only (not raw rows)
- ⏸️ RLS policies can be added later when roles are defined

**For Phase 2 (Later - When Roles Defined):**
```sql
-- Enable RLS
ALTER TABLE template_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events/feedback
CREATE POLICY ins_usage_self ON template_usage_events
  FOR INSERT WITH CHECK (
    user_id = uuid(current_setting('request.jwt.claims', true)::json->>'sub')
    AND (SELECT consent_analytics FROM profiles WHERE user_id = uuid(current_setting('request.jwt.claims', true)::json->>'sub')) = true
  );

CREATE POLICY ins_feedback_self ON template_feedback
  FOR INSERT WITH CHECK (
    user_id = uuid(current_setting('request.jwt.claims', true)::json->>'sub')
    AND (SELECT consent_analytics FROM profiles WHERE user_id = uuid(current_setting('request.jwt.claims', true)::json->>'sub')) = true
  );

-- Users cannot select others' rows (we'll serve aggregates via view)
CREATE POLICY sel_none ON template_usage_events FOR SELECT USING (false);
CREATE POLICY sel_none2 ON template_feedback FOR SELECT USING (false);

-- Admin may read rows (to investigate quality)
CREATE POLICY sel_admin_usage ON template_usage_events
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role') IN ('admin','manager')
  );

CREATE POLICY sel_admin_feedback ON template_feedback
  FOR SELECT USING (
    (current_setting('request.jwt.claims', true)::json->>'role') IN ('admin','manager')
  );

-- Aggregate view (public, no RLS needed - already aggregated)
CREATE VIEW v_template_stats AS
SELECT * FROM mv_template_stats;
```

**Note:** RLS can be added later without breaking changes - it's additive security.

#### **Consent Flag on Profile** ✅ **Implement Now**

```sql
ALTER TABLE profiles ADD COLUMN consent_analytics boolean DEFAULT true;

-- Users can opt-out
UPDATE profiles SET consent_analytics = false WHERE user_id = '...';
```

**Backend API Check (Now - Before RLS):**
```typescript
// In API endpoint, check consent before insert
const profile = await db.select()
  .from(profiles)
  .where(eq(profiles.user_id, userId))
  .limit(1);

if (!profile[0]?.consent_analytics) {
  // Option A: Block insert
  return res.status(403).json({ error: 'Analytics consent required' });
  
  // Option B: Anonymize (hash user_id)
  // const anonymizedUserId = hash(userId);
}
```

**Future (With RLS):**
- RLS policies will handle consent checks automatically
- Backend can rely on RLS instead of manual checks

---

### **3. Server-Scheduled Feedback Prompts** ⏰ **CRITICAL**

**Problem:** Client-only timers break when users navigate

**Solution:** Server-scheduled queue + worker

#### **Queue Table**
```sql
CREATE TABLE feedback_prompts_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id varchar(255) NOT NULL,
  user_id uuid NOT NULL,
  session_id uuid,
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX fpq_due_idx ON feedback_prompts_queue (scheduled_at);
```

#### **Implementation Flow**

**1. On Template Apply:**
```sql
-- Insert usage event
INSERT INTO template_usage_events (template_id, user_id, session_id, ...);

-- Enqueue feedback prompt (2 minutes later)
INSERT INTO feedback_prompts_queue (template_id, user_id, session_id, scheduled_at)
VALUES ('template-id', 'user-id', 'session-id', now() + interval '2 minutes');
```

**2. Worker (cron job or pg_cron):**
```typescript
// Every minute: check for due prompts
SELECT * FROM feedback_prompts_queue 
WHERE scheduled_at <= now() 
AND id NOT IN (SELECT id FROM template_feedback WHERE session_id = feedback_prompts_queue.session_id);

// Emit WebSocket notification or in-app notification
// If user not on page, show banner next time session opens (grace window: 24h)
```

**3. On Rating/Dismiss:**
```sql
-- Delete queue row
DELETE FROM feedback_prompts_queue 
WHERE template_id = ? AND session_id = ? AND user_id = ?;
```

**Benefits:**
- ✅ Survives navigation (server-scheduled)
- ✅ Graceful handling (24h grace window)
- ✅ No client-side timer issues
- ✅ Can batch notifications

---

### **4. Unambiguous Success Rate** 📊

**Definition:**
```sql
success_rate = COUNT(*) FILTER (WHERE rating >= 4 AND was_dismissed = false) / COUNT(*)
```

**Track Funnel:**
- **Banner Impressions:** Number of prompts shown
- **Submissions:** Number of ratings submitted
- **Dismissals:** Number of prompts dismissed
- **Success Rate:** Rating ≥ 4 AND not dismissed

**Materialized View Addition:**
```sql
CREATE MATERIALIZED VIEW mv_template_stats AS
SELECT
  t.id AS template_id,
  COUNT(u.id) AS total_usage,
  COUNT(DISTINCT u.user_id) AS unique_users,
  MAX(u.applied_at) AS last_used_at,
  AVG(NULLIF(f.rating,0))::numeric(4,2) AS avg_rating,
  COUNT(f.id) AS rating_count,
  COUNT(f.id) FILTER (WHERE f.rating >= 4 AND f.was_dismissed = false) AS success_count,
  COUNT(f.id) FILTER (WHERE f.was_dismissed = true) AS dismissal_count,
  COUNT(q.id) AS prompt_impressions
FROM template_combinations t
LEFT JOIN template_usage_events u ON u.template_id = t.id
LEFT JOIN template_feedback f ON f.template_id = t.id
LEFT JOIN feedback_prompts_queue q ON q.template_id = t.id
GROUP BY t.id;
```

---

### **5. Guardrails & Dedupe** 🛡️

**Idempotency Key (Client-Side):**
```typescript
// Generate idempotency key
const idempotencyKey = hash(`${templateId}+${sessionId}+${timestampBucket}`);

// Include in API request
POST /api/templates/:id/apply
{
  sessionId,
  caseId,
  sectionId,
  modeId,
  idempotencyKey  // Prevent double-fires
}
```

**Unique Constraint:**
```sql
-- Already in table: CONSTRAINT uniq_feedback_once UNIQUE (template_id, session_id, user_id)
-- Prevents duplicate feedback per session
```

---

### **6. Minimal API Surface** 🎯

**Clean & Future-Proof:**

```typescript
// Track template application
POST /api/templates/:id/apply
Body: { sessionId, caseId, sectionId, modeId, idempotencyKey }
→ Inserts usage event + enqueues prompt

// Submit feedback
POST /api/templates/:id/feedback
Body: { sessionId, rating, comment?, tags?, wasDismissed?, transcriptId? }
→ Inserts feedback; returns updated aggregates

// Get template summary
GET /api/templates/:id/summary
→ Returns aggregates from mv_template_stats + small 7/30-day slices
```

**Key Principles:**
- ✅ Keep transcript linking optional
- ✅ Never store raw PHI in vector DB
- ✅ If attaching context, store hashed pointer to secure blob

---

### **7. Frontend Flow (React)** ⚛️

**Implementation:**

```typescript
// On template apply
const handleTemplateApply = async (templateId: string) => {
  // Call apply API
  await api(`/api/templates/${templateId}/apply`, {
    sessionId,
    caseId,
    sectionId,
    modeId,
    idempotencyKey: generateIdempotencyKey(templateId, sessionId),
  });
  
  // Start local 2-min timer for instant UX (optimistic)
  setTimeout(() => {
    showFeedbackBanner(templateId);
  }, 2 * 60 * 1000);
  
  // Subscribe to WebSocket channel
  subscribeToChannel(`feedback:${userId}`, (notification) => {
    if (notification.type === 'feedback_due' && notification.templateId === templateId) {
      showFeedbackBanner(templateId);
    }
  });
};

// On feedback submit
const handleFeedbackSubmit = async (templateId: string, rating: number) => {
  await api(`/api/templates/${templateId}/feedback`, {
    sessionId,
    rating,
    wasDismissed: false,
  });
  
  // Disable future prompts for this (templateId, sessionId, userId)
  markPromptCompleted(templateId, sessionId);
};
```

**Benefits:**
- ✅ Instant UX (local timer)
- ✅ Reliable (WebSocket fallback)
- ✅ Survives navigation (server-scheduled)

---

### **8. RAG Integration (Safe & Staged)** 🤖

**Phase 1 (Now):**
- Store feedback rows
- Nightly job writes anonymized docs to global vector index (exclude section7-rd)

**Fields:**
```typescript
{
  template_id: string,
  rating: number,
  tags: string[],
  short_summary: string,  // max 512 chars, PHI-scrubbed
  section_id: string,
  mode_id: string,
  created_at: timestamp
}
```

**PHI Scrubber:**
- Strip emails/names
- No raw transcript text
- Only short summaries (max 512 chars)
- Use PHI detection/removal before embedding

**Phase 2 (Later):**
- When template hits ≥100 ratings, create per-template sub-index
- Keep Section 7 R&D RAG separate

---

### **9. Compliance Quick Wins** ✅

**Consent:**
```sql
ALTER TABLE profiles ADD COLUMN consent_analytics boolean DEFAULT true;

-- Block if consent = false (RLS handles this)
```

**Retention:**
- Keep identifiable feedback: 12 months
- After 12 months: hash user_id in old rows (or drop PII columns)

**Privacy:**
- Admin UI: Shows names/emails
- User UI: Shows only aggregates

**Privacy Notice:**
"We collect anonymized usage and optional ratings to improve templates. You can opt out in settings."

---

## 📊 **KPI Snapshot (Dashboard Metrics)**

### **Adoption:**
- `total_usage` - Total template applications
- `unique_users` - Number of unique users
- `usage_last_7d` - Usage in last 7 days
- `usage_last_30d` - Usage in last 30 days

### **Quality:**
- `avg_rating` - Average star rating
- `rating_count` - Number of ratings received
- `success_rate` - Percentage with rating ≥ 4 AND not dismissed
- `dismissal_rate` - Percentage dismissed

### **Engagement:**
- `prompt_impressions` - Number of prompts shown
- `submissions` - Number of ratings submitted
- `dismissals` - Number of prompts dismissed
- `conversion_rate` - Submissions / Impressions

### **Reliability:**
- `duplicate_event_rejection_count` - Duplicate events rejected
- `feedback_api_error_rate` - Feedback API error rate

---

## 🏗️ **Drizzle Schema Implementation**

```typescript
// drizzle/schema.ts

export const templateUsageEvents = pgTable('template_usage_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: varchar('template_id', { length: 255 }).notNull(),
  userId: uuid('user_id').notNull(),
  caseId: uuid('case_id'),
  sessionId: uuid('session_id'),
  sectionId: text('section_id'),
  modeId: text('mode_id'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
});

export const templateFeedback = pgTable('template_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: varchar('template_id', { length: 255 }).notNull(),
  userId: uuid('user_id').notNull(),
  sessionId: uuid('session_id'),
  caseId: uuid('case_id'),
  sectionId: text('section_id'),
  modeId: text('mode_id'),
  transcriptId: uuid('transcript_id'),
  rating: smallint('rating'),
  comment: text('comment'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull(),
  ratedAt: timestamp('rated_at', { withTimezone: true }).defaultNow().notNull(),
  timeToRate: integer('time_to_rate'), // Computed on read
  wasDismissed: boolean('was_dismissed').default(false),
  interactionTime: integer('interaction_time'),
}, (t) => ({
  uniqOnce: unique().on(t.templateId, t.sessionId, t.userId),
}));

export const feedbackPromptsQueue = pgTable('feedback_prompts_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: varchar('template_id', { length: 255 }).notNull(),
  userId: uuid('user_id').notNull(),
  sessionId: uuid('session_id'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## ✅ **Final Verdict**

**Original Plan:** ✅ **Good foundation**

**Production-Grade Changes:**
1. ✅ **Event tables + materialized aggregates** (ditch JSON counters)
2. ✅ **Server-scheduled feedback prompts** (2-minute timer that survives navigation)
3. ✅ **Tight RLS + consent + aggregate-first UI** (privacy by design)

**Status:** ✅ **Ready to implement** with these recommendations

---

## 📋 **Implementation Checklist**

### **Phase 1: Database Schema** (Week 1)
- [ ] Create `template_usage_events` table
- [ ] Create `template_feedback` table
- [ ] Create `feedback_prompts_queue` table
- [ ] Create `mv_template_stats` materialized view
- [ ] Add `consent_analytics` to `profiles` table
- [ ] Create indexes
- [⏸️] Set up RLS policies (DEFERRED - when roles are defined)

### **Phase 1b: Backend Security (Without RLS)**
- [ ] Add consent check in API endpoints (before insert)
- [ ] Add authentication middleware (JWT)
- [ ] Return aggregates only (not raw rows)
- [ ] Implement user opt-out in settings API

### **Phase 2: Backend API** (Week 2)
- [ ] Implement `POST /api/templates/:id/apply`
- [ ] Implement `POST /api/templates/:id/feedback`
- [ ] Implement `GET /api/templates/:id/summary`
- [ ] Create worker for feedback queue
- [ ] Add idempotency checks

### **Phase 3: Frontend Integration** (Week 3)
- [ ] Add template apply tracking
- [ ] Implement feedback banner component
- [ ] Add WebSocket subscription for feedback prompts
- [ ] Add usage statistics display
- [ ] Add consent checkbox in settings

### **Phase 4: Compliance & Testing** (Week 4)
- [ ] Test consent blocking (backend API)
- [ ] Test aggregate views
- [ ] Test feedback queue worker
- [ ] Privacy audit
- [⏸️] Test RLS policies (DEFERRED - when roles are defined)

### **Phase 5: RLS & Advanced Security (Later)**
- [ ] Define user roles (user, admin, manager, system)
- [ ] Enable RLS on tables
- [ ] Create RLS policies
- [ ] Test RLS policies
- [ ] Migrate backend consent checks to RLS

---

**End of Consultant Review**

