# Feedback Server Sync Architecture Flowchart

## System Architecture Overview

```mermaid
graph TB
    %% User Interface Layer
    subgraph "Frontend Layer"
        UI[Transcription Interface]
        FAB[Feedback FAB]
        Modal[Feedback Modal]
        Store[Feedback Store<br/>Zustand + IndexedDB]
    end

    %% API Layer
    subgraph "Backend API Layer"
        Auth[Authentication<br/>Middleware]
        API[Feedback API<br/>Endpoints]
        Service[Feedback Service<br/>Business Logic]
        Validation[Input Validation<br/>& Sanitization]
    end

    %% Database Layer
    subgraph "Database Layer"
        Supabase[(Supabase PostgreSQL)]
        FeedbackTable[(feedback table)]
        UsersTable[(auth.users)]
        ProfilesTable[(profiles)]
        SessionsTable[(sessions)]
    end

    %% External Services
    subgraph "External Services"
        Storage[File Storage<br/>Blob Attachments]
        Audit[Audit Logging<br/>HIPAA Compliance]
    end

    %% User Flow
    UI --> FAB
    FAB --> Modal
    Modal --> Store
    
    %% Sync Flow
    Store -->|"Sync to Server"| API
    API --> Auth
    Auth --> Validation
    Validation --> Service
    Service --> FeedbackTable
    
    %% Database Relationships
    FeedbackTable -->|"user_id FK"| UsersTable
    FeedbackTable -->|"session_id FK"| SessionsTable
    UsersTable -->|"user_id FK"| ProfilesTable
    
    %% File Handling
    Service --> Storage
    Service --> Audit
    
    %% Data Flow Labels
    Store -.->|"Offline Storage<br/>IndexedDB"| Store
    API -.->|"Conflict Resolution<br/>& Retry Logic"| Store
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef external fill:#fff3e0
    
    class UI,FAB,Modal,Store frontend
    class Auth,API,Service,Validation backend
    class Supabase,FeedbackTable,UsersTable,ProfilesTable,SessionsTable database
    class Storage,Audit external
```

## Feedback Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Feedback Store
    participant IDB as IndexedDB
    participant API as Backend API
    participant DB as Database
    participant A as Audit Log

    %% User Creates Feedback
    U->>F: Click Feedback FAB
    F->>S: Open Modal
    U->>F: Fill Feedback Form
    F->>S: Submit Feedback
    S->>IDB: Store Locally (Offline)
    S->>API: POST /api/feedback
    
    %% Server Processing
    API->>API: Validate Input
    API->>API: Authenticate User
    API->>DB: Insert Feedback Record
    API->>A: Log Audit Event
    API->>S: Return Success + ID
    
    %% Sync Confirmation
    S->>IDB: Update Local Record with Server ID
    S->>F: Show Success Message
    
    %% Offline Scenario
    Note over S,API: If Network Fails
    S->>IDB: Mark as Pending Sync
    S->>F: Show "Will sync when online"
    
    %% Background Sync
    Note over S,API: When Network Restored
    S->>IDB: Get Pending Items
    S->>API: Retry Failed Syncs
    API->>DB: Process Pending Items
    API->>S: Confirm Sync Success
```

## Database Schema Design

```mermaid
erDiagram
    auth_users {
        uuid id PK
        string email
        timestamp created_at
    }
    
    profiles {
        uuid user_id PK,FK
        string display_name
        string locale
        boolean consent_pipeda
        uuid default_clinic_id FK
    }
    
    sessions {
        uuid id PK
        uuid user_id FK
        uuid clinic_id FK
        string patient_id
        string mode
        timestamp started_at
    }
    
    feedback {
        uuid id PK
        uuid user_id FK
        uuid session_id FK
        jsonb meta
        jsonb ratings
        jsonb artifacts
        jsonb highlights
        string comment
        string[] attachments
        string status
        integer ttl_days
        timestamp created_at
        timestamp updated_at
    }
    
    clinics {
        uuid id PK
        string name
        string address
    }
    
    memberships {
        uuid id PK
        uuid user_id FK
        uuid clinic_id FK
        string role
        boolean active
    }
    
    %% Relationships
    auth_users ||--o{ profiles : "has profile"
    auth_users ||--o{ sessions : "creates"
    auth_users ||--o{ feedback : "submits"
    auth_users ||--o{ memberships : "belongs to"
    sessions ||--o{ feedback : "contains"
    clinics ||--o{ memberships : "has members"
    profiles }o--|| clinics : "default clinic"
```

## Implementation Phases

```mermaid
gantt
    title Feedback Server Sync Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1: Database
    Create feedback table     :2025-01-15, 2d
    Add RLS policies         :2025-01-17, 1d
    Update Drizzle schema    :2025-01-18, 1d
    Create migrations        :2025-01-19, 1d
    
    section Phase 2: Backend
    Feedback service         :2025-01-20, 2d
    API endpoints           :2025-01-22, 2d
    Authentication          :2025-01-24, 1d
    Validation & errors     :2025-01-25, 1d
    
    section Phase 3: Frontend
    Sync logic              :2025-01-26, 2d
    Conflict resolution     :2025-01-28, 2d
    UI indicators          :2025-01-30, 1d
    Error handling         :2025-01-31, 1d
    
    section Phase 4: Testing
    Unit tests             :2025-02-01, 2d
    Integration tests      :2025-02-03, 2d
    E2E tests             :2025-02-05, 2d
    Performance tests     :2025-02-07, 1d
```

## Key Implementation Details

### 1. Database Schema
```sql
CREATE TABLE public.feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
    meta jsonb NOT NULL,
    ratings jsonb NOT NULL,
    artifacts jsonb,
    highlights jsonb DEFAULT '[]',
    comment text,
    attachments text[] DEFAULT '{}',
    status text DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'resolved')),
    ttl_days integer DEFAULT 30,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 2. Row Level Security
```sql
-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "users_can_view_own_feedback" ON public.feedback
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own feedback
CREATE POLICY "users_can_insert_own_feedback" ON public.feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own feedback
CREATE POLICY "users_can_update_own_feedback" ON public.feedback
    FOR UPDATE USING (user_id = auth.uid());
```

### 3. API Endpoints
- `POST /api/feedback` - Create new feedback
- `GET /api/feedback` - List user's feedback
- `GET /api/feedback/:id` - Get specific feedback
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback
- `POST /api/feedback/sync` - Sync pending items

### 4. Sync Strategy
- **Offline First**: Store in IndexedDB immediately
- **Background Sync**: Sync to server when online
- **Conflict Resolution**: Server wins, merge metadata
- **Retry Logic**: Exponential backoff for failed syncs
- **Status Tracking**: Track sync status per item

### 5. Compliance Considerations
- **HIPAA**: No PHI in feedback content
- **PIPEDA**: User consent for data collection
- **Law 25**: Quebec privacy compliance
- **Audit Logging**: Track all feedback operations
- **Data Retention**: TTL-based cleanup (30 days default)
