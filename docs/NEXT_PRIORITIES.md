# Next Priorities - Implementation Roadmap

**Date:** 2025-01-09  
**Status:** Consent checkbox completed ✅ - What's next?

---

## ✅ **Completed**

1. ✅ **Consent Checkbox in Settings** - COMPLETED
   - Users can opt out of analytics
   - Default: checked ON
   - Saves to profile API

---

## 🎯 **Remaining High-Priority Items**

### **Option 1: Usage Statistics Display** 📊 **MEDIUM PRIORITY** (Recommended Next)

**Why This:**
- ✅ **Simpler implementation** - Just UI component
- ✅ **No background workers needed** - Uses existing API
- ✅ **Immediate value** - Users can see their template usage
- ✅ **Completes the feedback loop** - Users see stats after giving feedback

**What's Needed:**
- UI component to display template usage stats
- Show: total usage, avg rating, success rate per template
- Can be simple card or detailed dashboard
- Uses existing `/api/templates/:id/summary` endpoint

**Estimated Complexity:** Low-Medium
**Files to Modify:** ~2-3 files (new component + integration)

---

### **Option 2: Feedback Queue Worker** ⚠️ **CRITICAL** (For Reliability)

**Why This:**
- ⚠️ **Critical for reliability** - Ensures feedback prompts work even if user navigates
- ⚠️ **Currently using client-side timers** - Prompts lost on navigation
- ⚠️ **Requires background worker** - More complex implementation

**What's Needed:**
- Server-side worker to process `feedback_prompts_queue`
- Poll queue every 30 seconds for `scheduled_at <= now()`
- Send prompts to users (via WebSocket or polling)
- Can be simple interval or proper cron job

**Estimated Complexity:** Medium-High
**Files to Modify:** ~2-3 files (worker + integration)

---

### **Option 3: WebSocket Subscription** ⚠️ **HIGH PRIORITY** (Better UX)

**Why This:**
- ✅ **Real-time notifications** - Better user experience
- ✅ **No polling needed** - More efficient
- ⚠️ **Requires WebSocket infrastructure** - More complex

**What's Needed:**
- WebSocket server for feedback prompts
- Frontend subscription to WebSocket
- Real-time prompt delivery
- Fallback to polling if WebSocket unavailable

**Estimated Complexity:** High
**Files to Modify:** ~4-5 files (WebSocket handler + frontend integration)

---

## 📋 **Recommended Order**

### **Option A: Quick Wins First** ✅ **RECOMMENDED**

1. **Usage Statistics Display** (Next)
   - Simple UI component
   - Completes user-facing features
   - Users can see value of feedback

2. **Feedback Queue Worker** (Then)
   - Improves reliability
   - Background worker (can use simple interval)

3. **WebSocket Subscription** (Later - if needed)
   - Better UX but more complex
   - Can be added after worker is stable

### **Option B: Reliability First**

1. **Feedback Queue Worker** (Next)
   - Most critical for system reliability
   - Ensures feedback prompts always work

2. **Usage Statistics Display** (Then)
   - Nice to have for users
   - Shows value of feedback

3. **WebSocket Subscription** (Later)
   - Nice to have for better UX
   - Can use polling for now

---

## 🎯 **My Recommendation**

**Start with Usage Statistics Display** because:
- ✅ Simplest implementation
- ✅ Immediate value to users
- ✅ Completes the user-facing features
- ✅ No infrastructure changes needed
- ✅ Can be done quickly following @Project.mdc rules

**Then do Feedback Queue Worker** because:
- ⚠️ Critical for system reliability
- ⚠️ Currently using client-side timers (unreliable)
- ✅ Can use simple interval (no complex cron setup needed)

---

## 📝 **What Would You Like Next?**

1. **Usage Statistics Display** - Show template usage stats to users (Recommended)
2. **Feedback Queue Worker** - Make feedback prompts more reliable (Critical)
3. **Something else?**

---

**Ready to proceed!** 🚀

