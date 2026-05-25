// Static content shipped with the bundle
export type TrackId = '1' | '2' | '3' | '4' | '5'
export type AgeRange = '8-10' | '11-13' | '14-16' | '17+'
export type CardType = 'recall' | 'explain' | 'multiple_choice' | 'scenario'
export type ConceptState = 'locked' | 'seen' | 'familiar' | 'mastered'

export interface Track {
  id: TrackId
  name: string
  blurb: string
}

export interface Concept {
  id: string
  track_id: TrackId
  audience_age_range: AgeRange
  title: string
  summary: string
  why_it_matters: string
  depends_on: string[]
  application_id?: string
}

export interface Card {
  id: string
  concept_id: string
  type: CardType
  prompt: string
  // for multiple_choice
  choices?: string[]
  correct_choice_index?: number
  // canonical answer text shown after reveal
  answer: string
  explanation: string
}

export interface Application {
  id: string
  concept_ids: string[]
  type: 'decision' | 'portfolio' | 'calculator'
  title: string
  intro: string
  // schema differs per type — kept loose for content authoring
  payload: any
}

// Per-user persisted state
export interface CardState {
  card_id: string
  ease: number
  interval_days: number
  due_date: string // ISO date
  lapse_count: number
  consecutive_good: number
  last_reviewed_at?: string
}

export interface ApplicationState {
  application_id: string
  passed: boolean
  attempts: number
  last_attempt_at?: string
}

export interface SessionLog {
  id: string
  date: string
  duration_seconds: number
  reviews_completed: number
  correct_count: number
  incorrect_count: number
  new_concepts_introduced: string[]
}

export interface UserSettings {
  preferred_session_minutes: 5 | 8 | 15
  daily_reminder_time?: string
}

export interface UserState {
  name: string
  created_at: string
  current_streak: number
  longest_streak: number
  last_session_date?: string
  settings: UserSettings
  card_states: Record<string, CardState>
  application_states: Record<string, ApplicationState>
  session_logs: SessionLog[]
  active_track_age_range: AgeRange
}

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'
