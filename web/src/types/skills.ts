// ═══════════════════════════════════════════════════════════
// Skills Module v2.0 (Scholar Protocol) — TypeScript Interfaces
// ═══════════════════════════════════════════════════════════

// ── Shared Enum/Literal Types ──

export type RoadmapPlanType = 'crash_course' | 'standard' | 'deep_dive'
export type RoadmapStatus = 'active' | 'paused' | 'completed' | 'abandoned'
export type ResourceType = 'video' | 'article' | 'documentation' | 'interactive'
export type SessionStatus = 'not_started' | 'in_progress' | 'completed'
export type TestQuestionType = 'multiple_choice' | 'short_answer' | 'code_snippet'
export type SkillTrackingMode = 'roadmap' | 'manual' | 'hybrid'
export type TopicType = 'theory' | 'practical' | 'project' | 'quiz'

// ── AI-Generated Roadmap (from Gemma response) ──

export interface GeneratedRoadmap {
  title: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  plan_type: RoadmapPlanType;
  estimated_weeks: number;
  daily_study_minutes: number;
  includes_tests: boolean;
  phases: GeneratedPhase[];
}

export interface GeneratedPhase {
  phase_number: number;
  phase_name: string;
  estimated_weeks: number;
  milestones: GeneratedMilestone[];
  xp_bonus: number;
}

export interface GeneratedMilestone {
  order_index: number;
  title: string;
  description: string;
  estimated_hours: number;
  topics: GeneratedTopic[];
  xp_reward: number;
  requires_test: boolean;
}

export interface GeneratedTopic {
  order_index: number;
  title: string;
  type: TopicType;
  estimated_minutes: number;
  xp_reward: number;
  search_queries: string[]; // Used to find resources
}

// ── AI-Generated Test (from Gemma response) ──

export interface GeneratedTest {
  title: string;
  passing_score_pct: number;
  questions: GeneratedTestQuestion[];
  xp_on_pass: number;
  xp_on_fail: number;
}

export interface GeneratedTestQuestion {
  id: string; // Unique string for the question
  type: TestQuestionType;
  question_text: string;
  options?: string[]; // Only for multiple_choice
  correct_answer?: string; // For evaluating simple text/MCQ
  evaluation_rubric?: string; // For evaluating open-ended/code
  points: number;
}

// ── Database Row Types (Mapping to database.ts) ──

export interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean | null;
  is_mastered: boolean | null;
  is_primary: boolean | null;
  tracking_mode: SkillTrackingMode | null;
  total_hours: number | null;
  total_points: number | null;
  streak: number | null;
  streak_last_date: string | null;
  created_at: string | null;
}

export interface SkillRoadmapRow {
  id: string;
  user_id: string;
  skill_id: string;
  title: string;
  goal: string | null;
  difficulty: string | null;
  plan_type: RoadmapPlanType;
  status: RoadmapStatus | null;
  daily_study_minutes: number | null;
  weekly_study_days: string[] | null;
  is_ai_generated: boolean | null;
  includes_tests: boolean | null;
  aicoin_cost: number | null;
  shift_on_miss: boolean | null;
  start_date: string | null;
  end_date: string | null;
  scheduled_time: string | null;
  deactivated_at: string | null;
  created_at: string | null;
  
  // Relationships
  skill?: SkillRow;
  phases?: SkillPhaseRow[];
}

export interface SkillPhaseRow {
  id: string;
  roadmap_id: string;
  phase_number: number;
  phase_name: string;
  estimated_weeks: number | null;
  is_completed: boolean | null;
  completed_at: string | null;
  xp_bonus: number | null;
  
  // Relationships
  milestones?: SkillMilestoneRow[];
}

export interface SkillMilestoneRow {
  id: string;
  roadmap_id: string;
  phase_id: string | null;
  order_index: number | null;
  title: string;
  description: string | null;
  estimated_hours: number | null;
  is_completed: boolean | null;
  completed_at: string | null;
  test_id: string | null;
  xp_reward: number | null;
  
  // Relationships
  topics?: SkillTopicRow[];
  test?: MilestoneTestRow;
}

export interface SkillTopicRow {
  id: string;
  milestone_id: string | null;
  study_day_id: string | null;
  order_index: number | null;
  title: string;
  type: TopicType | null;
  estimated_minutes: number | null;
  is_completed: boolean | null;
  completed_at: string | null;
  xp_reward: number | null;
  
  // Relationships
  resources?: TopicResourceRow[];
}

export interface TopicResourceRow {
  id: string;
  topic_id: string;
  title: string;
  url: string | null;
  type: ResourceType | null;
  source: string | null; // e.g., 'youtube', 'library', 'custom'
  channel: string | null;
  duration_minutes: number | null;
  is_primary: boolean | null;
  video_query: string | null;
}

export interface SkillStudyDayRow {
  id: string;
  roadmap_id: string;
  day_number: number;
  day_label: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  estimated_minutes: number | null;
  has_test: boolean | null;
  is_completed: boolean | null;
  is_missed: boolean | null;
  daily_id: string | null;
  xp_reward: number | null;
  
  // Relationships
  topics?: SkillTopicRow[];
}

export interface SkillSessionRow {
  id: string;
  user_id: string;
  skill_id: string;
  study_day_id: string | null;
  session_date: string;
  duration_minutes: number | null;
  topics_completed: number | null;
  topics_total: number | null;
  xp_earned: number | null;
  session_bonus_xp: number | null;
  status: SessionStatus | null;
  mood: number | null;
  has_notes: boolean | null;
  notes: string | null;
  created_at: string | null;
}

export interface MilestoneTestRow {
  id: string;
  roadmap_id: string;
  milestone_id: string | null;
  study_day_id: string | null;
  title: string;
  is_ad_hoc: boolean | null;
  questions: GeneratedTestQuestion[];
  passing_score_pct: number | null;
  xp_on_pass: number | null;
  xp_on_fail: number | null;
  created_at: string | null;
}

export interface TestAttemptRow {
  id: string;
  test_id: string;
  user_id: string;
  attempt_number: number | null;
  answers: Record<string, string> | null;
  score_pct: number | null;
  passed: boolean | null;
  feedback: Record<string, any> | null; // Detailed AI feedback per question
  xp_earned: number | null;
  attempted_at: string | null;
}

export interface ResourceLibraryRow {
  id: string;
  skill_category: string;
  topic_name: string;
  title: string;
  url: string;
  resource_type: ResourceType | null;
  source: string | null;
  channel: string | null;
  duration_minutes: number | null;
  quality_score: number | null;
  created_at: string | null;
}

// ── Interview Data ──

export interface SkillInterviewData {
  skill_name: string;
  current_level: string;
  goal: string;
  preferred_learning_style: string;
  time_commitment_hours_per_week: number;
  preferred_study_days: string[];
  preferred_time: string;
  project_based: boolean;
  needs_certification: boolean;
  budget_bdt: number;
}

export interface RoadmapPreview {
  roadmap_meta: Omit<GeneratedRoadmap, 'phases'>;
  phases_summary: { name: string; weeks: number; topics_count: number }[];
  total_xp_projected: number;
  coin_cost: number;
}
