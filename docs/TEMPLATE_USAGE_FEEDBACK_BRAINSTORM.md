# Template Usage & Feedback System - Brainstorming

**Date:** 2025-01-09  
**Branch:** `cases/templates-enhanced`  
**Purpose:** Brainstorm usage tracking, feedback loops, and RAG integration for templates

**Context:** This document is for external consultation. It includes system architecture, existing implementations, and proposed features.

---

## 🎯 **Goals**

1. **Usage Visibility** - See who uses templates and how often
2. **Template Feedback** - Star rating 2 minutes after template application
3. **User Identification** - Track who gives feedback (user vs. admin/system)
4. **Feedback Collection** - Relate ratings to transcripts/templates
5. **RAG Integration** - Feed feedback into RAG system (overall, with existing Section 7 R&D RAG)

---

## 📚 **System Context for External Consultant**

### **Current Architecture**

**Technology Stack:**
- **Frontend:** React + TypeScript, Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Drizzle ORM
- **Authentication:** Supabase Auth (JWT)

**Template System:**
- **Storage:** Database (`template_combinations` table) + Static config fallback
- **Frontend:** React Context (`TemplateContext`)
- **Backend:** Service layer (`TemplateCombinationService`)
- **API:** `/api/template-combinations` endpoints

**Database Schema:**
```sql
-- Template combinations table (already exists)
CREATE TABLE template_combinations (
  id varchar(255) PRIMARY KEY,
  name varchar(255) NOT NULL,
  name_fr varchar(255) NOT NULL,
  name_en varchar(255) NOT NULL,
  compatible_sections jsonb,
  compatible_modes jsonb,
  language text,
  is_active boolean,
  is_default boolean,
  features jsonb,
  config jsonb,
  usage_stats jsonb DEFAULT '{"count": 0, "successRate": 0}',
  created_at timestamp,
  updated_at timestamp
);
```

**Current Template IDs:**
- `word-for-word-formatter`
- `word-for-word-with-ai`
- `section7-rd` - **Section 7 - R&D Pipeline (HAS EXISTING RAG)**
- `section7-ai-formatter`
- `section8-ai-formatter`
- `section-7-only`
- `section-7-verbatim`
- `section-7-full`
- `history-evolution-ai-formatter`
- `section7-clinical-extraction`

### **Existing RAG System**

**Section 7 R&D Pipeline Template:**
- **Template ID:** `section7-rd`
- **Name:** "Section 7 - R&D Pipeline"
- **Description:** "Section 7 - Historique de faits et évolution (R&D Pipeline with CNESST compliance checking and quality assurance)"
- **Has Existing RAG:** ✅ YES - This template already has RAG integration
- **RAG Details:** 
  - Processes input through evaluation engine
  - 9 compliance rules
  - CNESST compliance checking
  - Quality assurance pipeline
  - Manager review workflow

**Note:** When implementing overall RAG system, must integrate with existing Section 7 R&D RAG without breaking it.

### **User Authentication System**

**User Model:**
```typescript
interface User {
  user_id: string;        // UUID from Supabase auth.users
  email: string;
  display_name: string;
  role?: string;          // Optional role (user, admin, manager, etc.)
  created_at: timestamp;
  updated_at: timestamp;
}
```

**User Roles (Planned):**
- `user` - Regular end-user
- `admin` - Administrator
- `manager` - Manager/reviewer (for Section 7 R&D)
- `system` - System-generated feedback (for testing/migrations)

**Authentication:**
- Supabase Auth (JWT tokens)
- User ID extracted from JWT in backend
- Frontend uses `useAuth` hook to get current user

---

## 👥 **User Identification in Feedback**

---

## 📊 **1. Usage Statistics UI**

### **1.1 What to Show**

#### **Template Management Page** 📋
- **Usage Count** - Total number of times template used
- **Active Users** - List of users who used the template
- **Usage Timeline** - Graph showing usage over time
- **Last Used** - Most recent usage timestamp
- **Success Rate** - Percentage of successful applications

#### **Template Card/Badge** 🏷️
- **Usage Badge** - Small badge showing usage count
- **Popular Badge** - "🔥 Popular" if usage > threshold
- **User Count** - "Used by X users"
- **Success Rate** - Visual indicator (progress bar)

#### **Template Dropdown** 📝
- **Usage Indicator** - Show usage count next to template name
- **Sort by Usage** - Option to sort templates by popularity
- **Recommended** - Highlight templates with high success rates

### **1.2 Data to Track**

```typescript
interface TemplateUsageStats {
  // Overall usage
  totalUsageCount: number;           // Total times template applied
  uniqueUsers: number;                // Number of unique users
  lastUsedAt: string | null;          // Most recent usage
  
  // Time-based
  usageLast7Days: number;             // Usage in last week
  usageLast30Days: number;             // Usage in last month
  
  // User tracking (optional - privacy considerations)
  userIds: string[];                  // Users who used template (hashed?)
  userUsageCounts: Record<string, number>; // Per-user usage count
  
  // Success metrics
  successRate: number;                // Percentage of successful applications
  averageRating: number;              // Average star rating (if feedback enabled)
  ratingCount: number;                // Number of ratings received
  
  // Section/Mode usage
  sectionUsage: Record<string, number>;  // Usage by section (section_7, section_8, etc.)
  modeUsage: Record<string, number>;     // Usage by mode (mode1, mode2, etc.)
}
```

### **1.3 Privacy Considerations** 🔒

**Option A: Aggregate Only**
- Show only aggregated counts
- No individual user tracking
- Privacy-friendly

**Option B: Anonymized User Tracking**
- Hash user IDs before storing
- Show "Used by X users" without names
- Still track usage patterns

**Option C: Full User Tracking** (with consent)
- Show user names/emails (with permission)
- Full analytics dashboard
- Requires user consent

**Recommendation:** **Option B** - Balance between insights and privacy

---

## ⭐ **2. Template Feedback Loop**

### **2.1 When to Show Rating**

#### **Timing** ⏰
- **2 minutes after template application** - As specified
- **Trigger:** After template is applied to transcript
- **Location:** In-place notification/banner (non-intrusive)
- **Dismissible:** Yes, can be dismissed (track as "no feedback")
- **One-time:** Show once per template application session

#### **Display Options** 🎨

**Option A: Inline Banner** (Recommended)
```
┌─────────────────────────────────────────────────┐
│ ⭐ Rate this template: "Section 7 AI Formatter" │
│ ⭐⭐⭐⭐⭐ (click to rate)                         │
│                    [Dismiss]                     │
└─────────────────────────────────────────────────┘
```

**Option B: Modal Popup**
- Overlay modal after 2 minutes
- More noticeable but potentially annoying
- Better for collecting feedback

**Option C: Sidebar Panel**
- Persistent panel that slides in
- Less intrusive
- Can be ignored but stays visible

**Recommendation:** **Option A** - Inline banner, dismissible, non-intrusive

### **2.2 What to Collect**

```typescript
interface TemplateFeedback {
  // Core feedback
  templateId: string;                 // Template that was rated
  rating: 1 | 2 | 3 | 4 | 5;        // Star rating
  
  // Context
  transcriptId?: string;             // Related transcript (if applicable)
  sessionId?: string;                // Transcription session
  caseId?: string;                   // Case if applicable
  sectionId?: string;                // Section where template was applied
  modeId?: string;                   // Mode used (mode1, mode2, etc.)
  
  // User Identification (CRITICAL)
  userId: string;                    // REQUIRED - User who rated (from Supabase auth)
  userEmail?: string;                // User email (for admin visibility)
  userDisplayName?: string;          // User display name (for admin visibility)
  userRole: 'user' | 'admin' | 'manager' | 'system'; // REQUIRED - Who gave feedback
  isSystemGenerated: boolean;        // Whether feedback is system-generated (testing/migrations)
  
  // Admin/System Context
  adminUserId?: string;              // If admin rated on behalf of user
  adminActionReason?: string;        // Why admin rated (optional)
  systemReason?: string;             // If system-generated, why (migration, test, etc.)
  
  // Timing
  appliedAt: string;                // When template was applied
  ratedAt: string;                  // When rating was submitted
  timeToRate: number;               // Seconds between apply and rating
  
  // Optional feedback
  comment?: string;                 // Optional text feedback
  tags?: string[];                  // Tags (e.g., "too slow", "accurate", "missing context")
  
  // Outcome
  wasDismissed: boolean;             // Whether user dismissed without rating
  interactionTime: number;          // Time user spent looking at feedback prompt
}
```

### **User Identification Requirements**

**1. Always Track User Identity** ✅
- **userId:** REQUIRED - Always capture user ID from authentication
- **userRole:** REQUIRED - Distinguish between user, admin, manager, system
- **isSystemGenerated:** Flag for system-generated feedback (testing, migrations)

**2. Distinguish Feedback Sources** 🔍
- **User Feedback:** `userRole: 'user'` - End-user ratings
- **Admin Feedback:** `userRole: 'admin'` - Admin ratings (e.g., quality review)
- **Manager Feedback:** `userRole: 'manager'` - Manager ratings (Section 7 R&D review)
- **System Feedback:** `userRole: 'system'` - System-generated (testing, migrations)

**3. Admin Actions** 👤
- **adminUserId:** If admin rates on behalf of user (with permission)
- **adminActionReason:** Why admin rated (quality review, testing, etc.)

**4. Privacy & Compliance** 🔒
- **User Email/Name:** Only visible to admins (GDPR/PIPEDA compliant)
- **User Consent:** Users must consent to feedback collection
- **Data Retention:** Clear retention policy for feedback

### **Feedback Source Identification**

**Question:** "Does this ensure we know who is giving feedback?"

**Answer:** ✅ YES - Comprehensive user identification:

1. **User Identity:** `userId` (always captured from auth)
2. **User Role:** `userRole` (user/admin/manager/system)
3. **System Flag:** `isSystemGenerated` (for testing/migrations)
4. **Admin Context:** `adminUserId` (if admin rates on behalf of user)

**Use Cases:**
- **User Feedback:** `userRole: 'user'` - Regular end-user ratings
- **Admin Review:** `userRole: 'admin'` - Admin quality reviews
- **Manager Review:** `userRole: 'manager'` - Manager reviews (Section 7 R&D)
- **System Testing:** `userRole: 'system'` - System-generated for testing

**Example Queries:**
- "Show all user feedback" → `WHERE userRole = 'user'`
- "Show admin reviews" → `WHERE userRole = 'admin'`
- "Show manager reviews" → `WHERE userRole = 'manager'`
- "Exclude system feedback" → `WHERE isSystemGenerated = false`

### **2.3 Storage Strategy**

#### **Database Schema** 💾

```sql
-- Template feedback table
CREATE TABLE template_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id varchar(255) NOT NULL REFERENCES template_combinations(id),
  user_id uuid NOT NULL REFERENCES profiles(user_id),
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  transcript_id uuid REFERENCES transcripts(id),
  session_id uuid REFERENCES sessions(id),
  case_id uuid REFERENCES cases(id),
  section_id text,
  mode_id text,
  comment text,
  tags jsonb DEFAULT '[]'::jsonb,
  applied_at timestamp NOT NULL,
  rated_at timestamp NOT NULL,
  time_to_rate integer, -- seconds
  was_dismissed boolean DEFAULT false,
  interaction_time integer, -- seconds
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX template_feedback_template_id_idx ON template_feedback(template_id);
CREATE INDEX template_feedback_user_id_idx ON template_feedback(user_id);
CREATE INDEX template_feedback_rated_at_idx ON template_feedback(rated_at);
CREATE INDEX template_feedback_rating_idx ON template_feedback(rating);
```

---

## 🔗 **3. Feedback Relationship Strategy**

### **3.1 What Should Rating Be Linked To?**

#### **Option A: Template Only** 🎯
```
Rating → Template
- Simple relationship
- Template-level metrics
- Easy to aggregate
- Misses context (which transcript, which section)
```

**Pros:**
- ✅ Simple data model
- ✅ Easy aggregation
- ✅ Fast queries

**Cons:**
- ❌ Loses context (which transcript was rated)
- ❌ Can't analyze specific use cases
- ❌ Harder to understand why rating was given

#### **Option B: Template + Transcript** 🔗
```
Rating → Template + Transcript
- More context
- Can analyze transcript quality
- Can see which transcripts worked well
- Understand template performance per use case
```

**Pros:**
- ✅ Rich context
- ✅ Can analyze transcript quality
- ✅ Better understanding of when templates work
- ✅ Future RAG integration easier

**Cons:**
- ❌ More complex data model
- ❌ Need transcript storage/retrieval
- ❌ More storage required

#### **Option C: Template + Session + Context** 📦
```
Rating → Template + Session + Section + Mode + Transcript (optional)
- Maximum context
- Full picture of template usage
- Can analyze patterns (which sections/modes work best)
- Most flexible for future analysis
```

**Pros:**
- ✅ Maximum context
- ✅ Can analyze patterns
- ✅ Best for RAG integration
- ✅ Most flexible

**Cons:**
- ❌ Most complex
- ❌ More storage
- ❌ Harder queries

### **3.2 Recommendation** 💡

**Hybrid Approach: Template + Session + Optional Transcript**

```typescript
interface TemplateFeedback {
  templateId: string;        // REQUIRED - Always linked to template
  sessionId?: string;        // REQUIRED - Session context
  sectionId?: string;       // OPTIONAL - Section context
  modeId?: string;          // OPTIONAL - Mode context
  transcriptId?: string;    // OPTIONAL - Link to transcript if available
  caseId?: string;          // OPTIONAL - Case context
}
```

**Rationale:**
1. **Template is always required** - Core of feedback
2. **Session provides context** - When/where template was used
3. **Transcript is optional** - Link if available, but don't require
4. **Section/Mode for patterns** - Understand which combinations work best

**Benefits:**
- ✅ Template-level metrics (aggregate all feedback for template)
- ✅ Context-aware analysis (understand when templates work)
- ✅ Flexible storage (transcript link optional)
- ✅ Future-proof for RAG integration

---

## 🤖 **4. RAG System Integration**

### **4.1 RAG Architecture Options**

#### **Important Context: Existing RAG System** ⚠️

**Section 7 R&D Pipeline Template (`section7-rd`):**
- **Status:** ✅ ALREADY HAS RAG SYSTEM
- **Details:**
  - Processes through evaluation engine
  - 9 CNESST compliance rules
  - Quality assurance pipeline
  - Manager review workflow
  - Existing RAG for compliance checking

**Consideration:** New overall RAG system must integrate with existing Section 7 R&D RAG without breaking it.

#### **Option A: Single RAG System** 🎯 (RECOMMENDED START)
```
All Template Feedback → Single RAG System
- One knowledge base for all templates
- General template improvement insights
- Simpler architecture
- Less specific per-template insights
- EXCLUDE section7-rd (has its own RAG)
```

**Structure:**
```typescript
interface RAGDocument {
  templateId: string;              // Template ID (exclude section7-rd)
  rating: number;
  feedback: string;
  userId: string;                  // Who gave feedback
  userRole: 'user' | 'admin' | 'manager' | 'system';
  context: {
    section: string;
    mode: string;
    transcript?: string;           // Optional excerpt
  };
  embedding: number[];             // Vector embedding
  createdAt: string;
}
```

**Integration with Section 7 R&D:**
- **Section 7 R&D:** Keep existing RAG separate
- **Overall RAG:** All other templates feed into single system
- **Coordination:** Both systems can query each other if needed

#### **Option B: Per-Template RAG Systems** 🎯🎯🎯
```
Template 1 Feedback → RAG System 1
Template 2 Feedback → RAG System 2
...
- Separate knowledge base per template
- Template-specific insights
- More targeted improvements
- More complex to manage
- Section 7 R&D already has one
```

**Structure:**
```typescript
interface TemplateRAGSystem {
  templateId: string;
  documents: RAGDocument[];
  embeddingModel: string;
  retrievalStrategy: 'semantic' | 'hybrid';
  isExistingSystem: boolean;       // true for section7-rd
}
```

#### **Option C: Hybrid RAG System** 🔄
```
Template-Specific RAG + Global RAG
- Per-template RAG for specific insights
- Global RAG for cross-template patterns
- Best of both worlds
- Most complex
- Section 7 R&D RAG + Global RAG
```

**Structure:**
```typescript
interface HybridRAGSystem {
  globalRAG: RAGSystem;                    // Cross-template insights
  templateRAGs: Map<string, RAGSystem>;    // Per-template insights
  existingRAGs: Map<string, RAGSystem>;    // Existing RAGs (section7-rd)
  routing: 'template-first' | 'global-first';
}
```

### **4.2 Recommendation** 💡

**Start with Option A, evolve to Option C:**

**Phase 1: Single RAG System** (START HERE)
- Collect all feedback (except section7-rd uses existing RAG)
- Build single knowledge base for all templates
- Learn patterns across all templates
- Simpler to implement and validate
- **Exclude section7-rd** (has its own RAG)

**Phase 2: Hybrid RAG System** (EVOLVE LATER)
- Add per-template RAG when templates have enough feedback (>100 ratings)
- Keep global RAG for cross-template insights
- Integrate with existing Section 7 R&D RAG
- Route queries intelligently

**Rationale:**
- ✅ Start simple, validate approach
- ✅ Respect existing Section 7 R&D RAG (don't break it)
- ✅ Can always add per-template systems later
- ✅ Don't over-engineer initially
- ✅ Can analyze patterns before specializing

**Integration Strategy:**
- **Section 7 R&D:** Keep existing RAG separate and working
- **Overall RAG:** Feed all other templates into single system
- **Future:** May integrate both systems later if beneficial

### **4.3 RAG Data Flow**

```
User applies template
  ↓
Template processes transcript
  ↓
User rates template (2 min later)
  ↓
Feedback stored in database
  ↓
Feedback aggregated (daily batch)
  ↓
Feedback processed into RAG documents
  ↓
Embeddings generated
  ↓
Stored in vector database
  ↓
RAG system can query for insights
```

---

## 📋 **5. Implementation Plan**

### **Phase 1: Usage Statistics** (Week 1-2)
1. ✅ Track template usage in database
2. ✅ Update `usage_stats` on template application
3. ✅ Create API endpoint for usage statistics
4. ✅ Add usage display to template management UI
5. ✅ Add usage badges to template cards

### **Phase 2: Feedback Collection** (Week 3-4)
1. ✅ Create `template_feedback` table
2. ✅ Implement 2-minute feedback trigger
3. ✅ Add star rating UI component
4. ✅ Store feedback in database
5. ✅ Show feedback in template management UI

### **Phase 3: Feedback Analysis** (Week 5-6)
1. ✅ Aggregate feedback by template
2. ✅ Calculate average ratings
3. ✅ Show feedback trends
4. ✅ Filter templates by rating
5. ✅ Export feedback for analysis

### **Phase 4: RAG Integration** (Week 7-8)
1. ✅ Design RAG document structure
2. ✅ Create embedding pipeline
3. ✅ Set up vector database
4. ✅ Build retrieval system
5. ✅ Create insights dashboard

---

## 🎨 **6. UI/UX Design Ideas**

### **6.1 Template Management Page**

```
┌────────────────────────────────────────────────────────────┐
│ Template Management                                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│ │ Section 7 AI    │  │ Section 8 AI    │  │ Word-for-Word ││
│ │ Formatter       │  │ Formatter       │  │ (with AI)     ││
│ │                 │  │                 │  │               ││
│ │ ⭐⭐⭐⭐⭐ 4.8    │  │ ⭐⭐⭐⭐ 4.2     │  │ ⭐⭐⭐⭐⭐ 4.9  ││
│ │ (156 ratings)   │  │ (89 ratings)    │  │ (234 ratings)  ││
│ │                 │  │                 │  │               ││
│ │ 🔥 1,234 uses   │  │ 🔥 567 uses     │  │ 🔥 2,145 uses ││
│ │ Used by 45 users│  │ Used by 32 users│  │ Used by 78    ││
│ │                 │  │                 │  │               ││
│ │ [View Details]  │  │ [View Details]  │  │ [View Details]││
│ └─────────────────┘  └─────────────────┘  └──────────────┘│
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### **6.2 Template Detail Modal**

```
┌────────────────────────────────────────────────────────────┐
│ Section 7 AI Formatter                                     │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Usage Statistics:                                            │
│ • Total Uses: 1,234                                        │
│ • Unique Users: 45                                          │
│ • Last Used: 2 hours ago                                    │
│ • Usage Last 7 Days: 89                                     │
│ • Usage Last 30 Days: 456                                   │
│                                                              │
│ Ratings:                                                     │
│ • Average Rating: ⭐⭐⭐⭐⭐ 4.8                           │
│ • Total Ratings: 156                                        │
│ • 5 Stars: 120 (77%)                                        │
│ • 4 Stars: 25 (16%)                                         │
│ • 3 Stars: 8 (5%)                                           │
│ • 2 Stars: 2 (1%)                                           │
│ • 1 Star: 1 (1%)                                            │
│                                                              │
│ Usage by Section:                                            │
│ • Section 7: 856 (69%)                                     │
│ • Section 8: 234 (19%)                                     │
│ • Section 11: 144 (12%)                                    │
│                                                              │
│ Usage by Mode:                                               │
│ • Mode 2: 987 (80%)                                        │
│ • Mode 1: 178 (14%)                                        │
│ • Mode 3: 69 (6%)                                          │
│                                                              │
│ [Close]                                                      │
└────────────────────────────────────────────────────────────┘
```

### **6.3 Feedback Banner**

```
┌────────────────────────────────────────────────────────────┐
│ ⭐ How did this template work for you?                     │
│                                                              │
│ "Section 7 AI Formatter"                                    │
│                                                              │
│ ⭐⭐⭐⭐⭐ (Click to rate)                                   │
│                                                              │
│                              [Not now] [Submit Rating]       │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 **7. Analytics & Insights**

### **7.1 Metrics to Track**

**Template Performance:**
- Average rating per template
- Rating distribution (how many 5-star, 4-star, etc.)
- Rating trends over time
- Success rate (high rating = successful)

**Usage Patterns:**
- Most used templates
- Templates used by most users
- Usage by section/mode
- Time-based usage patterns

**User Behavior:**
- Average time to rate
- Rating completion rate
- Dismissal rate
- Correlation between usage and rating

### **7.2 Dashboards**

**Template Analytics Dashboard:**
- Template performance overview
- Usage trends
- Rating trends
- Comparative analysis

**User Insights Dashboard:**
- User template preferences
- User feedback patterns
- Template adoption rates

---

## 🤔 **8. Open Questions**

### **8.1 Privacy & Data Retention**
- Should we show user names in usage statistics?
- How long should we keep feedback data?
- Should users be able to delete their feedback?
- **Answer:** User names/emails only visible to admins (GDPR/PIPEDA compliant)

### **8.2 Feedback Timing**
- Is 2 minutes the optimal time?
- Should timing be adjustable?
- What if user navigates away before 2 minutes?
- **Answer:** 2 minutes default, configurable per template if needed

### **8.3 Rating Scale**
- Is 5-star rating scale sufficient?
- Should we add thumbs up/down as well?
- Should we collect written feedback?
- **Answer:** Start with 5-star, add written feedback as optional

### **8.4 RAG Integration Timing**
- When should we start building RAG system?
- How much feedback do we need before RAG is useful?
- Should RAG be real-time or batch?
- **Answer:** Start with overall RAG after 1000+ ratings collected (batch processing)

### **8.5 Existing RAG Integration**
- How do we integrate with existing Section 7 R&D RAG?
- Should Section 7 R&D feedback also go to overall RAG?
- **Answer:** Keep Section 7 R&D RAG separate, exclude from overall RAG initially

### **8.6 User Identification**
- How do we distinguish user vs. admin feedback?
- Should admins be able to rate on behalf of users?
- **Answer:** Use user_role field, admin can rate with admin_user_id and reason

---

## 💡 **9. Recommendations**

### **9.1 Start Simple**
1. ✅ Track basic usage statistics
2. ✅ Implement 2-minute feedback banner
3. ✅ Collect star ratings only (start simple)
4. ✅ Link feedback to Template + Session (optional transcript)
5. ✅ Store in database, aggregate later

### **9.2 Iterate Based on Data**
1. 📊 Analyze feedback patterns after 1 month
2. 🔍 Understand which templates need improvement
3. 🤖 Build RAG system once we have enough data (>1000 ratings)
4. 📈 Add more sophisticated analytics as needed

### **9.3 Privacy First**
1. 🔒 Hash user IDs in usage statistics
2. 🔒 Allow users to opt-out of usage tracking
3. 🔒 Don't require transcript linking for feedback
4. 🔒 Clear data retention policy

---

## 📝 **10. Next Steps**

1. **Review & Feedback** - Review this brainstorming doc
2. **Prioritize Features** - Decide what to build first
3. **Design UI/UX** - Create mockups for feedback UI
4. **Database Schema** - Finalize feedback table design
5. **Implementation** - Start with Phase 1 (Usage Statistics)

---

---

## 📚 **External Consultant Review**

**See:** `docs/TEMPLATE_USAGE_FEEDBACK_CONSULTANT_REVIEW.md` for detailed production-ready recommendations

### **Key Improvements from Consultant:**

1. **Event Tables** - Use event tables instead of JSON counters
2. **Server-Scheduled Prompts** - Server-side queue instead of client timers
3. **RLS & Consent** - Row Level Security with consent flags
4. **Materialized Views** - Fast aggregates via materialized views
5. **Minimal API** - Clean API surface with idempotency keys

### **Status:** ✅ **Production-ready** with consultant recommendations

---

**End of Brainstorming Document**

