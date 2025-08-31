# CentomoMD Dashboard Implementation Plan

## 📋 Overview
Transform the existing CentomoMD app into a comprehensive dashboard with collapsible sidebar navigation, New Case workspace, and minimal dictation integration while preserving the current architecture.

## 🏗️ Current Architecture Analysis
- **Framework**: Vite + React + TypeScript (NOT Next.js)
- **Styling**: TailwindCSS + shadcn/ui + lucide-react
- **State**: Zustand stores (existing AppState, TranscriptionState)
- **Routing**: React Router DOM (already installed)
- **Current Structure**: Single-page app with dictation/templates toggle

## 🎯 Implementation Phases

### Phase 1: Foundation & Routing Setup
**Duration**: 2-3 days
**Priority**: Critical

#### 1.1 Router Configuration
- [x] Set up React Router with nested routes
- [x] Create route structure:
  ```
  / → Dashboard (default)
  /dashboard → Dashboard page
  /case/new → New Case workspace
  /templates → Template Management (existing)
  /dictation → Dedicated dictation page
  /settings → Settings page
  /profile → Profile page
  ```

#### 1.2 Layout Components
- [x] Create `AppLayout.tsx` - Main layout wrapper
- [x] Create `PrimarySidebar.tsx` - Collapsible sidebar (280px/80px)
- [x] Create `AppHeader.tsx` - Sticky header with breadcrumbs
- [x] Update `App.tsx` to use new layout structure

#### 1.3 State Management Extensions
- [x] Extend existing Zustand stores:
  ```typescript
  // uiStore.ts
  interface UIState {
    sidebarCollapsed: boolean;
    language: 'fr' | 'en';
    toasts: Toast[];
  }
  
  // caseStore.ts (new)
  interface CaseState {
    activeSectionId: string;
    sections: Section[];
    autosaveTimestamps: Record<string, string>;
  }
  ```

### Phase 2: Dashboard Page
**Duration**: 2-3 days
**Priority**: High

#### 2.1 Dashboard Components
- [x] Create `DashboardPage.tsx` - Main dashboard
- [x] Create `DashboardCards.tsx` - 5-card grid layout
- [x] Create individual card components:
  - [x] `NewCaseCard.tsx` - CTA to /case/new
  - [x] `FormsCompletedCard.tsx` - Statistics stub
  - [x] `TranscriptionsCard.tsx` - AI transcriptions count
  - [x] `PatientsCard.tsx` - Patient management stub
  - [x] `StartDictationCard.tsx` - CTA to /dictation

#### 2.2 Dashboard Data
- [x] Create mock data for dashboard statistics
- [x] Add seed counts for development
- [x] Prepare for future backend integration

### Phase 3: New Case Workspace
**Duration**: 4-5 days
**Priority**: High

#### 3.1 CNESST Form Structure
- [x] Define exact CNESST Form 204 sections:
  ```typescript
  const CNESST_SECTIONS = [
    { id: 'section_a', title: 'A. Renseignements sur le travailleur', audioRequired: false },
    { id: 'section_b', title: 'B. Renseignements sur le médecin', audioRequired: false },
    // ... all 15 sections
    { id: 'section_7', title: '7. Identification', audioRequired: true },
    { id: 'section_8', title: '8. Antécédents', audioRequired: true },
    { id: 'section_11', title: '11. Examen physique', audioRequired: true },
  ];
  ```

#### 3.2 New Case Components
- [x] Create `NewCasePage.tsx` - Main workspace
- [x] Create `SecondarySectionNav.tsx` - Left sidebar with sections
- [x] Create `SectionForm.tsx` - Individual section form
- [x] Create `SectionFooter.tsx` - Sticky footer with navigation
- [x] Create `ExportModal.tsx` - Export options modal

#### 3.3 Form Integration
- [x] Use existing `react-hook-form` + `zod` patterns
- [x] Create form schemas for each section
- [x] Implement autosave with Zustand persistence
- [x] Add validation and error handling

### Phase 4: Minimal Dictation Integration
**Duration**: 2-3 days
**Priority**: Medium

#### 4.1 Dictation Panel
- [ ] Create `DictationPanel.tsx` - Minimal right-side panel
- [ ] Show only for sections with `audioRequired: true`
- [ ] Single button: "Go to Dictation page" → `/dictation`
- [ ] Info text about dedicated dictation workflow

#### 4.2 Dictation Page
- [ ] Create `DictationPage.tsx` - Dedicated dictation experience
- [ ] Move existing `TranscriptionInterface` here
- [ ] Add tabs: Live | History (stubs)
- [ ] Ensure all dictation CTAs route here

### Phase 5: Settings & Profile
**Duration**: 2-3 days
**Priority**: Medium

#### 5.1 Settings Page
- [ ] Create `SettingsPage.tsx`
- [ ] General settings (language, timezone, clinic logo)
- [ ] Compliance toggles (Quebec Law 25, PIPEDA, Zero-retention)
- [ ] Dictation defaults, Export defaults, Data settings

#### 5.2 Profile Page
- [ ] Create `ProfilePage.tsx`
- [ ] Basic user info display
- [ ] Change password functionality (stub)

### Phase 6: Polish & Integration
**Duration**: 2-3 days
**Priority**: Medium

#### 6.1 UI/UX Enhancements
- [ ] Smooth sidebar collapse animations
- [ ] Tooltip labels for collapsed sidebar
- [ ] Breadcrumb navigation
- [ ] Mobile responsive design
- [ ] WCAG AA accessibility compliance

#### 6.2 i18n Integration
- [x] Create i18n helper if not exists
- [x] Add French/English translations
- [x] Persist language preference in localStorage
- [x] Use French as default (Quebec clinics)
- [x] Ensure language toggle affects all components
- [x] Update CNESST section titles based on language
- [x] Add missing translation keys for new components

## 🛠️ Technical Implementation Details

### File Structure (extending existing)
```
frontend/src/
├── components/
│   ├── ui/ (existing shadcn components)
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── PrimarySidebar.tsx
│   │   ├── AppHeader.tsx
│   │   └── SecondarySectionNav.tsx
│   ├── dashboard/
│   │   ├── DashboardCards.tsx
│   │   ├── NewCaseCard.tsx
│   │   ├── FormsCompletedCard.tsx
│   │   ├── TranscriptionsCard.tsx
│   │   ├── PatientsCard.tsx
│   │   └── StartDictationCard.tsx
│   ├── case/
│   │   ├── SectionForm.tsx
│   │   ├── SectionFooter.tsx
│   │   ├── ExportModal.tsx
│   │   └── DictationPanel.tsx
│   └── transcription/ (existing)
├── pages/
│   ├── DashboardPage.tsx
│   ├── NewCasePage.tsx
│   ├── DictationPage.tsx
│   ├── SettingsPage.tsx
│   ├── ProfilePage.tsx
│   └── TemplateManagement.tsx (existing)
├── stores/
│   ├── uiStore.ts (extend existing)
│   ├── caseStore.ts (new)
│   └── transcriptionStore.ts (existing)
├── types/
│   └── index.ts (extend existing)
└── lib/
    ├── utils.ts (existing)
    ├── i18n.ts (new)
    └── constants.ts (new)
```

### State Management (Zustand)
```typescript
// uiStore.ts (extend existing)
interface UIState {
  sidebarCollapsed: boolean;
  language: 'fr' | 'en';
  toasts: Toast[];
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  addToast: (toast: Toast) => void;
  removeToast: (id: string) => void;
}

// caseStore.ts (new)
interface CaseState {
  activeSectionId: string;
  sections: Section[];
  autosaveTimestamps: Record<string, string>;
  setActiveSection: (sectionId: string) => void;
  updateSection: (sectionId: string, data: any) => void;
  saveSection: (sectionId: string) => void;
}
```

### Routing Configuration
```typescript
// App.tsx with React Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/case/new" element={<NewCasePage />} />
          <Route path="/templates" element={<TemplateManagement />} />
          <Route path="/dictation" element={<DictationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
```

## 🎨 Design System Integration

### Theme Consistency
- **Primary**: blue-600 (existing)
- **Backgrounds**: blue-50 (existing)
- **Text**: slate-700 (existing)
- **Sidebar**: 280px expanded / 80px collapsed
- **Animations**: Smooth transitions with Tailwind

### Component Patterns
- Use existing shadcn/ui components
- Extend existing component APIs where possible
- Follow current naming conventions
- Maintain existing import patterns

## 🔄 Migration Strategy

### Phase 1: Parallel Development
1. Create new components alongside existing ones
2. Keep existing `App.tsx` functional
3. Test new routing without breaking current features

### Phase 2: Gradual Migration
1. Update `App.tsx` to use new layout
2. Move existing dictation to `/dictation` route
3. Preserve all existing functionality

### Phase 3: Cleanup
1. Remove old navigation patterns
2. Consolidate duplicate components
3. Update imports and references

## 🧪 Testing Strategy

### Component Testing
- [ ] Unit tests for new components
- [ ] Integration tests for form workflows
- [ ] E2E tests for critical user journeys

### Accessibility Testing
- [ ] WCAG AA compliance verification
- [ ] Keyboard navigation testing
- [ ] Screen reader compatibility

### Performance Testing
- [ ] Bundle size analysis
- [ ] Component render performance
- [ ] State management efficiency

## 📋 Acceptance Criteria

### Functional Requirements
- [ ] Clicking "New Case" opens `/case/new` with Section 1 form
- [ ] All dictation CTAs navigate to `/dictation`
- [ ] Secondary nav shows exact CNESST 204 sections
- [ ] Export button pinned to secondary nav bottom
- [ ] Minimal dictation panel shows only button + info
- [ ] Language toggle persists in localStorage
- [ ] Sidebar collapse state persists

### Technical Requirements
- [ ] No regressions to existing components
- [ ] TypeScript compilation passes
- [ ] All imports resolve correctly
- [ ] Existing Zustand stores remain functional
- [ ] shadcn/ui patterns maintained
- [ ] Tailwind classes follow existing conventions

### UI/UX Requirements
- [ ] Blue/white theme consistency
- [ ] Smooth sidebar animations
- [ ] Responsive design (mobile drawer)
- [ ] Tooltip labels when sidebar collapsed
- [ ] Breadcrumb navigation
- [ ] WCAG AA accessibility

## 🚀 Deployment Considerations

### Build Process
- [ ] Vite build configuration updates
- [ ] Environment variable management
- [ ] Asset optimization

### Performance
- [ ] Code splitting for new routes
- [ ] Lazy loading for heavy components
- [ ] Bundle size monitoring

### Monitoring
- [ ] Error tracking for new components
- [ ] Performance monitoring
- [ ] User analytics for new features

## 📝 Development Notes

### Key Decisions
1. **Extend existing architecture** - No framework changes
2. **Preserve existing components** - Extend rather than replace
3. **Maintain current patterns** - Follow existing naming and structure
4. **Gradual migration** - Parallel development approach
5. **Type safety first** - Full TypeScript coverage

### Risk Mitigation
- [ ] Backup current working state
- [ ] Feature flags for gradual rollout
- [ ] Comprehensive testing before migration
- [ ] Rollback plan if issues arise

### Future Considerations
- [ ] Backend API integration for dashboard data
- [ ] Real-time collaboration features
- [ ] Advanced export capabilities
- [ ] Mobile app considerations

---

**Total Estimated Duration**: 14-20 days
**Team Size**: 1-2 developers
**Priority**: High (core user experience enhancement)
