import { pgTable, text, timestamp, boolean, integer, json, jsonb, uuid, varchar, decimal, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Users table - REMOVED: Now using auth.users + public.profiles

// Profiles table (extends Supabase auth.users)
export const profiles = pgTable('profiles', {
  user_id: uuid('user_id').primaryKey(), // References auth.users(id) in Supabase
  email: varchar('email', { length: 255 }), // User's email address for easier identification
  display_name: varchar('display_name', { length: 255 }),
  locale: text('locale', { enum: ['en-CA', 'fr-CA'] }).notNull().default('fr-CA'),
  consent_pipeda: boolean('consent_pipeda').notNull().default(false),
  consent_marketing: boolean('consent_marketing').notNull().default(false),
  consent_analytics: boolean('consent_analytics').notNull().default(true),
  default_clinic_id: uuid('default_clinic_id').references(() => clinics.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Memberships table (for multi-clinic support)
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(), // References auth.users(id) in Supabase
  clinic_id: uuid('clinic_id').notNull().references(() => clinics.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'physician', 'staff', 'it_support'] }).notNull().default('physician'),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userClinicUnique: unique().on(table.user_id, table.clinic_id),
}));

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(), // References auth.users(id) - FK handled at DB level
  clinic_id: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
  patient_id: varchar('patient_id', { length: 255 }).notNull(), // External patient identifier
  consent_verified: boolean('consent_verified').notNull().default(false),
  status: text('status', { enum: ['active', 'paused', 'completed', 'cancelled'] }).notNull().default('active'),
  mode: text('mode', { enum: ['word_for_word', 'smart_dictation', 'ambient'] }).notNull().default('smart_dictation'),
  current_section: text('current_section', { enum: ['section_7', 'section_8', 'section_11'] }).notNull().default('section_7'),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at'),
  duration_seconds: integer('duration_seconds'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Transcripts table
export const transcripts = pgTable('transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  section: text('section', { enum: ['section_7', 'section_8', 'section_11'] }).notNull(),
  content: text('content').notNull(), // Encrypted transcript content
  is_final: boolean('is_final').notNull().default(false),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }),
  language_detected: varchar('language_detected', { length: 10 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Templates table
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  section: text('section', { enum: ['section_7', 'section_8', 'section_11'] }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content').notNull(), // Template content
  language: text('language', { enum: ['fr', 'en'] }).notNull().default('fr'),
  version: varchar('version', { length: 50 }).notNull().default('1.0.0'),
  is_active: boolean('is_active').notNull().default(true),
  voice_commands: json('voice_commands').$type<Array<{
    trigger: string;
    action: string;
    parameters?: Record<string, any>;
  }>>(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Template Combinations table (new - for frontend template combinations)
export const templateCombinations = pgTable('template_combinations', {
  id: varchar('id', { length: 255 }).primaryKey(), // Use template ID from config (e.g., 'word-for-word-with-ai')
  name: varchar('name', { length: 255 }).notNull(),
  name_fr: varchar('name_fr', { length: 255 }).notNull(),
  name_en: varchar('name_en', { length: 255 }).notNull(),
  description: text('description'),
  description_fr: text('description_fr'),
  description_en: text('description_en'),
  type: text('type', { enum: ['formatter', 'ai-formatter', 'template-combo'] }).notNull(),
  compatible_sections: jsonb('compatible_sections').$type<string[]>().notNull().default([]),
  compatible_modes: jsonb('compatible_modes').$type<string[]>().notNull().default([]),
  language: text('language', { enum: ['fr', 'en', 'both'] }).notNull().default('both'),
  complexity: text('complexity', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  tags: jsonb('tags').$type<string[]>().default([]),
  is_active: boolean('is_active').notNull().default(true),
  is_default: boolean('is_default').notNull().default(false),
  features: jsonb('features').$type<{
    verbatimSupport: boolean;
    voiceCommandsSupport: boolean;
    aiFormatting: boolean;
    postProcessing: boolean;
  }>().default({
    verbatimSupport: false,
    voiceCommandsSupport: false,
    aiFormatting: false,
    postProcessing: false,
  }),
  prompt: text('prompt'),
  prompt_fr: text('prompt_fr'),
  content: text('content'),
  config: jsonb('config').$type<Record<string, any>>().default({}),
  usage_stats: jsonb('usage_stats').$type<{
    count: number;
    lastUsed?: string;
    successRate: number;
  }>().default({ count: 0, successRate: 0 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Template Usage Events table (tracks every template application)
export const templateUsageEvents = pgTable('template_usage_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_id: varchar('template_id', { length: 255 }).notNull().references(() => templateCombinations.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull(), // References auth.users(id) in Supabase
  case_id: uuid('case_id').references(() => cases.id, { onDelete: 'set null' }),
  session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  section_id: text('section_id'),
  mode_id: text('mode_id'),
  applied_at: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
});

// Template Feedback table (one feedback per template/session/user)
export const templateFeedback = pgTable('template_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_id: varchar('template_id', { length: 255 }).notNull().references(() => templateCombinations.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull(), // References auth.users(id) in Supabase
  session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  case_id: uuid('case_id').references(() => cases.id, { onDelete: 'set null' }),
  section_id: text('section_id'),
  mode_id: text('mode_id'),
  transcript_id: uuid('transcript_id').references(() => transcripts.id, { onDelete: 'set null' }),
  rating: integer('rating'), // CHECK (rating BETWEEN 1 AND 5) - added in SQL migration
  comment: text('comment'),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  applied_at: timestamp('applied_at', { withTimezone: true }).notNull(),
  rated_at: timestamp('rated_at', { withTimezone: true }).defaultNow().notNull(),
  time_to_rate: integer('time_to_rate'), // Computed: EXTRACT(EPOCH FROM (rated_at - applied_at))
  was_dismissed: boolean('was_dismissed').notNull().default(false),
  interaction_time: integer('interaction_time'),
}, (t) => ({
  uniq_feedback_once: unique().on(t.template_id, t.session_id, t.user_id),
}));

// Feedback Prompts Queue table (schedules feedback prompts)
export const feedbackPromptsQueue = pgTable('feedback_prompts_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_id: varchar('template_id', { length: 255 }).notNull(),
  user_id: uuid('user_id').notNull(), // References auth.users(id) in Supabase
  session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  scheduled_at: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Audit logs table
export const audit_logs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(), // References auth.users(id) - FK handled at DB level
  session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
  clinic_id: uuid('clinic_id').references(() => clinics.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 255 }).notNull(),
  resource_type: varchar('resource_type', { length: 100 }).notNull(),
  resource_id: uuid('resource_id'),
  metadata: json('metadata').$type<Record<string, any>>(),
  ip_address: varchar('ip_address', { length: 45 }),
  user_agent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Clinics table (for multi-tenant support)
export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Cases table (for CNESST form cases)
export const cases = pgTable('cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  clinic_id: uuid('clinic_id'),
  name: varchar('name', { length: 255 }).default('Nouveau cas'),
  status: text('status', { enum: ['draft', 'in_progress', 'completed'] }).notNull().default('draft'),
  draft: jsonb('draft').notNull().default({}),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Case sessions table (links dictation sessions to case sections)
export const case_sessions = pgTable('case_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  case_id: uuid('case_id').notNull().references(() => cases.id, { onDelete: 'cascade' }),
  section_id: varchar('section_id', { length: 50 }).notNull(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  content: text('content'),
  formatted_content: text('formatted_content'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Voice command mappings table
export const voice_command_mappings = pgTable('voice_command_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  template_id: uuid('template_id').references(() => templates.id, { onDelete: 'cascade' }),
  trigger: varchar('trigger', { length: 255 }).notNull(),
  action: varchar('action', { length: 255 }).notNull(),
  parameters: json('parameters').$type<Record<string, any>>(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Export history table
export const export_history = pgTable('export_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull(), // References auth.users(id) - FK handled at DB level
  format: text('format', { enum: ['docx', 'pdf'] }).notNull(),
  fidelity: text('fidelity', { enum: ['low', 'medium', 'high'] }).notNull(),
  sections: json('sections').$type<string[]>().notNull(),
  file_path: varchar('file_path', { length: 500 }),
  file_size_bytes: integer('file_size_bytes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Artifacts table for Mode 3 pipeline outputs
export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  ir: jsonb('ir').notNull(),
  role_map: jsonb('role_map').notNull(),
  narrative: jsonb('narrative').notNull(),
  processing_time: jsonb('processing_time'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Feedback table for user feedback with server sync
export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id'), // Nullable to allow anonymous feedback; FK handled in DB
  session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  meta: jsonb('meta').notNull().default({}),
  ratings: jsonb('ratings').notNull().default({}),
  artifacts: jsonb('artifacts').default({}),
  highlights: jsonb('highlights').default([]),
  comment: text('comment'),
  attachments: text('attachments').array().default([]),
  status: text('status', { enum: ['open', 'triaged', 'resolved'] }).notNull().default('open'),
  ttl_days: integer('ttl_days').notNull().default(30),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations - usersRelations removed (using auth.users + profiles)

export const profilesRelations = relations(profiles, () => ({
  // user relation removed - profiles.user_id references auth.users.id directly
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  // user relation removed - memberships.user_id references auth.users.id directly
  clinic: one(clinics, {
    fields: [memberships.clinic_id],
    references: [clinics.id],
  }),
}));

export const clinicsRelations = relations(clinics, ({ many }) => ({
  memberships: many(memberships),
  cases: many(cases),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  user: one(profiles, {
    fields: [cases.user_id],
    references: [profiles.user_id],
  }),
  clinic: one(clinics, {
    fields: [cases.clinic_id],
    references: [clinics.id],
  }),
  case_sessions: many(case_sessions),
}));

export const caseSessionsRelations = relations(case_sessions, ({ one }) => ({
  case: one(cases, {
    fields: [case_sessions.case_id],
    references: [cases.id],
  }),
  session: one(sessions, {
    fields: [case_sessions.session_id],
    references: [sessions.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  // user relation removed - sessions.user_id references auth.users.id directly
  clinic: one(clinics, {
    fields: [sessions.clinic_id],
    references: [clinics.id],
  }),
  transcripts: many(transcripts),
  audit_logs: many(audit_logs),
  export_history: many(export_history),
  artifacts: many(artifacts),
  feedback: many(feedback),
  case_sessions: many(case_sessions),
}));

export const transcriptsRelations = relations(transcripts, ({ one }) => ({
  session: one(sessions, {
    fields: [transcripts.session_id],
    references: [sessions.id],
  }),
}));

export const templatesRelations = relations(templates, ({ many }) => ({
  voice_command_mappings: many(voice_command_mappings),
}));

export const voiceCommandMappingsRelations = relations(voice_command_mappings, ({ one }) => ({
  template: one(templates, {
    fields: [voice_command_mappings.template_id],
    references: [templates.id],
  }),
}));

export const auditLogsRelations = relations(audit_logs, ({ one }) => ({
  // user relation removed - audit_logs.user_id references auth.users.id directly
  session: one(sessions, {
    fields: [audit_logs.session_id],
    references: [sessions.id],
  }),
  clinic: one(clinics, {
    fields: [audit_logs.clinic_id],
    references: [clinics.id],
  }),
}));

export const exportHistoryRelations = relations(export_history, ({ one }) => ({
  session: one(sessions, {
    fields: [export_history.session_id],
    references: [sessions.id],
  }),
  // user relation removed - export_history.user_id references auth.users.id directly
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  session: one(sessions, {
    fields: [artifacts.session_id],
    references: [sessions.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  session: one(sessions, {
    fields: [feedback.session_id],
    references: [sessions.id],
  }),
}));

// Database schema type
export type DatabaseSchema = {
  // users: removed - using auth.users + public.profiles
  profiles: typeof profiles;
  memberships: typeof memberships;
  sessions: typeof sessions;
  transcripts: typeof transcripts;
  templates: typeof templates;
  template_combinations: typeof templateCombinations;
  template_usage_events: typeof templateUsageEvents;
  template_feedback: typeof templateFeedback;
  feedback_prompts_queue: typeof feedbackPromptsQueue;
  audit_logs: typeof audit_logs;
  clinics: typeof clinics;
  cases: typeof cases;
  case_sessions: typeof case_sessions;
  voice_command_mappings: typeof voice_command_mappings;
  export_history: typeof export_history;
  artifacts: typeof artifacts;
  feedback: typeof feedback;
};

// Row types - User/NewUser types removed (using auth.users + profiles)
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type TemplateCombination = typeof templateCombinations.$inferSelect;
export type NewTemplateCombination = typeof templateCombinations.$inferInsert;
export type TemplateUsageEvent = typeof templateUsageEvents.$inferSelect;
export type NewTemplateUsageEvent = typeof templateUsageEvents.$inferInsert;
export type TemplateFeedbackRow = typeof templateFeedback.$inferSelect;
export type NewTemplateFeedbackRow = typeof templateFeedback.$inferInsert;
export type FeedbackPromptQueue = typeof feedbackPromptsQueue.$inferSelect;
export type NewFeedbackPromptQueue = typeof feedbackPromptsQueue.$inferInsert;
export type AuditLog = typeof audit_logs.$inferSelect;
export type NewAuditLog = typeof audit_logs.$inferInsert;
export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type CaseSession = typeof case_sessions.$inferSelect;
export type NewCaseSession = typeof case_sessions.$inferInsert;
export type VoiceCommandMapping = typeof voice_command_mappings.$inferSelect;
export type NewVoiceCommandMapping = typeof voice_command_mappings.$inferInsert;
export type ExportHistory = typeof export_history.$inferSelect;
export type NewExportHistory = typeof export_history.$inferInsert;
export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
