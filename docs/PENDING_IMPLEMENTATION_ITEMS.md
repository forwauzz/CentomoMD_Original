# Pending Implementation Items

**Date:** 2025-01-09  
**Status:** Review of implemented vs. planned features

---

## ✅ **What's Been Implemented**

### **Phase 1: Database Schema** ✅
- ✅ `template_usage_events` table
- ✅ `template_feedback` table
- ✅ `feedback_prompts_queue` table
- ✅ `mv_template_stats` materialized view
- ✅ `consent_analytics` column in `profiles` table
- ✅ Indexes created
- ⏸️ RLS policies (DEFERRED - when roles are defined)

### **Phase 1b: Backend Security** ✅
- ✅ Consent check in API endpoints (before insert)
- ✅ Authentication middleware (JWT)
- ✅ Return aggregates only (not raw rows)
- ❌ **MISSING:** User opt-out in settings API

### **Phase 2: Backend API** ⚠️ **PARTIAL**
- ✅ `POST /api/templates/:id/apply`
- ✅ `POST /api/templates/:id/feedback`
- ✅ `GET /api/templates/:id/summary`
- ❌ **MISSING:** Worker for feedback queue (currently using client-side timers)
- ✅ Idempotency checks (unique constraints)

### **Phase 3: Frontend Integration** ⚠️ **PARTIAL**
- ✅ Template apply tracking (`useTemplateTracking` hook)
- ✅ Feedback banner component (`TemplateFeedbackBanner`)
- ❌ **MISSING:** WebSocket subscription for feedback prompts (using client-side 2-minute timer)
- ❌ **MISSING:** Usage statistics display in UI
- ❌ **MISSING:** Consent checkbox in settings

---

## ❌ **Missing Items**

### **1. Feedback Queue Worker** ⚠️ **CRITICAL**

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:** Currently using client-side 2-minute timer. If user navigates away or closes browser, feedback prompt is lost.

**What's Needed:**
- Server-side worker/cron job to process `feedback_prompts_queue`
- Poll queue for `scheduled_at <= now()`
- Send feedback prompts to users (via WebSocket or polling)
- Remove processed prompts from queue

**Implementation:**
```typescript
// backend/src/workers/feedbackQueueWorker.ts
export class FeedbackQueueWorker {
  static async processDuePrompts() {
    const duePrompts = await FeedbackQueueService.getDueFeedbackPrompts();
    
    for (const prompt of duePrompts) {
      // Send via WebSocket or notify frontend
      // Frontend shows feedback banner
      // Remove from queue after notification
    }
  }
}

// Run every 30 seconds or as cron job
setInterval(() => FeedbackQueueWorker.processDuePrompts(), 30 * 1000);
```

**Or use pg_cron:**
```sql
SELECT cron.schedule(
  'process-feedback-queue',
  '*/30 * * * * *',  -- Every 30 seconds
  $$
  SELECT process_feedback_queue_worker();
  $$
);
```

---

### **2. WebSocket Subscription for Feedback Prompts** ⚠️ **HIGH PRIORITY**

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:** Frontend uses client-side timer. If user navigates, timer is lost.

**What's Needed:**
- WebSocket connection for real-time feedback prompts
- Subscribe to feedback prompts for current user
- Receive prompt when `scheduled_at <= now()`
- Show feedback banner when prompt received

**Implementation:**
```typescript
// frontend/src/hooks/useTemplateTracking.ts
useEffect(() => {
  // Subscribe to WebSocket for feedback prompts
  const ws = new WebSocket(`wss://api.alie.app/ws/feedback/${userId}`);
  
  ws.onmessage = (event) => {
    const prompt = JSON.parse(event.data);
    if (prompt.type === 'feedback-due') {
      setShowFeedbackBanner(true);
    }
  };
  
  return () => ws.close();
}, [userId]);
```

**Backend WebSocket Handler:**
```typescript
// backend/src/websocket/feedbackHandler.ts
export function handleFeedbackWebSocket(ws: WebSocket, userId: string) {
  // Subscribe user to feedback prompts
  // Send prompt when scheduled_at <= now()
}
```

---

### **3. Consent Checkbox in Settings** ⚠️ **HIGH PRIORITY**

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:** Users can't opt out of analytics in UI. Must be done via database or API.

**What's Needed:**
- Add consent checkbox in Settings page
- Allow users to toggle `consent_analytics`
- Update profile via API
- Respect consent in tracking

**Implementation:**
```typescript
// frontend/src/pages/SettingsPage.tsx
const [consentAnalytics, setConsentAnalytics] = useState(profile.consent_analytics);

const handleConsentChange = async (value: boolean) => {
  await apiJSON('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ consent_analytics: value }),
  });
  setConsentAnalytics(value);
};
```

**API Endpoint:**
```typescript
// backend/src/routes/profile.ts
router.patch('/', async (req, res) => {
  const user = (req as any).user;
  const { consent_analytics } = req.body;
  
  await db.update(profiles)
    .set({ consent_analytics })
    .where(eq(profiles.user_id, user.user_id));
    
  return res.json({ success: true });
});
```

---

### **4. Usage Statistics Display in UI** ⚠️ **MEDIUM PRIORITY**

**Status:** ❌ **NOT IMPLEMENTED**

**Issue:** Usage statistics are tracked but not displayed to users.

**What's Needed:**
- UI component to show template usage stats
- Display: total usage, avg rating, success rate
- Show per-template or aggregate stats
- Optional: Admin dashboard for detailed stats

**Implementation:**
```typescript
// frontend/src/components/stats/TemplateUsageStats.tsx
export const TemplateUsageStats: React.FC = () => {
  const { data } = useQuery(['template-stats'], async () => {
    return await apiJSON('/api/templates/stats');
  });
  
  return (
    <div>
      <h3>Template Usage Statistics</h3>
      {data?.map(stat => (
        <div key={stat.template_id}>
          <p>{stat.template_name}: {stat.total_usage} uses</p>
          <p>Average Rating: {stat.avg_rating}/5</p>
        </div>
      ))}
    </div>
  );
};
```

---

### **5. RLS (Row Level Security)** ⏸️ **DEFERRED**

**Status:** ⏸️ **DEFERRED** - As documented, waiting for roles to be defined

**Note:** This is intentionally deferred. Backend consent checks are sufficient for now.

---

### **6. Admin Endpoints** ⏸️ **SKIPPED**

**Status:** ⏸️ **SKIPPED** - As per user request

**Note:** Admin endpoints for viewing detailed usage/feedback were skipped per user request.

---

## 📋 **Priority Order**

### **High Priority:**
1. ✅ **Feedback Queue Worker** - Critical for reliable feedback prompts
2. ✅ **WebSocket Subscription** - Better UX than client-side timers
3. ✅ **Consent Checkbox in Settings** - Required for compliance

### **Medium Priority:**
4. ✅ **Usage Statistics Display** - Nice to have, but not critical

### **Low Priority:**
5. ⏸️ **RLS** - Deferred until roles defined
6. ⏸️ **Admin Endpoints** - Skipped per user request

---

## 🎯 **Recommended Next Steps**

### **Option 1: Complete Feedback System** (Recommended)
1. Implement feedback queue worker
2. Add WebSocket subscription for real-time prompts
3. Add consent checkbox in settings
4. Add usage statistics display

### **Option 2: Minimal Viable Product**
1. Add consent checkbox in settings (compliance requirement)
2. Keep client-side timers (simple, works for now)
3. Add usage statistics display (nice to have)

### **Option 3: Server-Side Only**
1. Implement feedback queue worker
2. Frontend polls API for due prompts (simpler than WebSocket)
3. Add consent checkbox in settings

---

## 📝 **Implementation Checklist**

### **Immediate (High Priority):**
- [ ] Implement feedback queue worker (cron job or interval)
- [ ] Add WebSocket subscription for feedback prompts
- [ ] Add consent checkbox in Settings page
- [ ] Add API endpoint for updating consent

### **Future (Medium Priority):**
- [ ] Add usage statistics display component
- [ ] Create admin dashboard (if needed)
- [ ] Implement RLS when roles are defined

---

**Ready to implement!** 🚀

