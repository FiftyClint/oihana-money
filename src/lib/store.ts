import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AgeRange,
  Application,
  ApplicationState,
  Card,
  CardState,
  Concept,
  ReviewGrade,
  SessionLog,
  Track,
  UserState,
  UserSettings,
} from '../types'
import curriculum from '../content/curriculum.json'
import { applyGrade, isDue, isMastered, newCardState, todayISO } from './srs'

// Coerce JSON to typed shapes
const TRACKS = curriculum.tracks as Track[]
const CONCEPTS = curriculum.concepts as Concept[]
const CARDS = curriculum.cards as Card[]
const APPLICATIONS = curriculum.applications as Application[]

interface StoreState extends UserState {
  // derived getters
  getTracks: () => Track[]
  getConcepts: () => Concept[]
  getCards: () => Card[]
  getApplications: () => Application[]
  getCardsForConcept: (conceptId: string) => Card[]
  getApplicationById: (id: string) => Application | undefined
  getConceptById: (id: string) => Concept | undefined
  getConceptStateMap: () => Record<string, 'locked' | 'seen' | 'familiar' | 'mastered'>
  getDueCards: () => Card[]
  getNewConceptToTeach: () => Concept | undefined
  buildSessionQueue: (minutes: 5 | 8 | 15) => {
    reviews: Card[]
    newConcept: Concept | undefined
    newConceptCards: Card[]
    application: Application | undefined
  }
  // mutations
  setName: (n: string) => void
  setSettings: (s: Partial<UserSettings>) => void
  reviewCard: (cardId: string, grade: ReviewGrade) => void
  markConceptSeen: (conceptId: string) => void
  recordApplication: (applicationId: string, passed: boolean) => void
  endSession: (log: Omit<SessionLog, 'id'>) => void
  resetAllProgress: () => void
}

const initialState = (): UserState => ({
  name: '',
  created_at: new Date().toISOString(),
  current_streak: 0,
  longest_streak: 0,
  settings: { preferred_session_minutes: 8 },
  card_states: {},
  application_states: {},
  session_logs: [],
  active_track_age_range: '17+' as AgeRange,
})

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      getTracks: () => TRACKS,
      getConcepts: () => CONCEPTS,
      getCards: () => CARDS,
      getApplications: () => APPLICATIONS,
      getCardsForConcept: (conceptId) => CARDS.filter((c) => c.concept_id === conceptId),
      getApplicationById: (id) => APPLICATIONS.find((a) => a.id === id),
      getConceptById: (id) => CONCEPTS.find((c) => c.id === id),

      getConceptStateMap: () => {
        const map: Record<string, 'locked' | 'seen' | 'familiar' | 'mastered'> = {}
        const states = get().card_states
        const apps = get().application_states

        const conceptCardStatus = (conceptId: string) => {
          const cards = CARDS.filter((c) => c.concept_id === conceptId)
          if (cards.length === 0) return { hasState: false, masteredFrac: 0, anyTouched: false }
          let mastered = 0
          let touched = 0
          for (const c of cards) {
            const s = states[c.id]
            if (s) {
              touched++
              if (isMastered(s)) mastered++
            }
          }
          return {
            hasState: touched > 0,
            masteredFrac: mastered / cards.length,
            anyTouched: touched > 0,
          }
        }

        for (const concept of CONCEPTS) {
          // locked check: all deps mastered?
          const depsOk = concept.depends_on.every((d) => map[d] === 'mastered')
          if (!depsOk && concept.depends_on.length > 0) {
            // process later — but topological order: depends_on must already be in map
            // Since CONCEPTS list isn't topologically sorted, do two passes
          }
        }
        // Two-pass: first compute statuses for everything, then derive locked
        const baseStatus: Record<string, 'seen' | 'familiar' | 'mastered'> = {}
        for (const concept of CONCEPTS) {
          const { hasState, masteredFrac } = conceptCardStatus(concept.id)
          const appPassed = concept.application_id
            ? apps[concept.application_id]?.passed === true
            : true // no required app = treat as passed
          if (!hasState) continue
          if (masteredFrac >= 0.8 && appPassed) {
            baseStatus[concept.id] = 'mastered'
          } else if (masteredFrac >= 0.5) {
            baseStatus[concept.id] = 'familiar'
          } else {
            baseStatus[concept.id] = 'seen'
          }
        }
        // Now derive locked
        for (const concept of CONCEPTS) {
          const explicit = baseStatus[concept.id]
          const depsOk = concept.depends_on.every((d) => baseStatus[d] === 'mastered')
          if (explicit) {
            map[concept.id] = explicit
          } else if (concept.depends_on.length === 0 || depsOk) {
            map[concept.id] = 'locked' // unlocked-but-untouched still renders as "available" — we'll use a separate flag in UI
            // Treat as "available": mark as 'locked' visually but UI knows
            // Actually: use 'seen' state only if touched; here we'll re-flag in UI
            map[concept.id] = 'locked' // placeholder
          } else {
            map[concept.id] = 'locked'
          }
        }
        return map
      },

      getDueCards: () => {
        const states = get().card_states
        const today = todayISO()
        return CARDS.filter((card) => {
          const st = states[card.id]
          if (!st) return false
          return isDue(st, today)
        })
      },

      getNewConceptToTeach: () => {
        const states = get().card_states
        const apps = get().application_states
        const masteredConcepts = new Set<string>()
        // Compute mastered concepts inline
        for (const concept of CONCEPTS) {
          const cards = CARDS.filter((c) => c.concept_id === concept.id)
          if (cards.length === 0) continue
          const mastered = cards.filter((c) => {
            const s = states[c.id]
            return s ? isMastered(s) : false
          }).length
          const appOk = concept.application_id
            ? apps[concept.application_id]?.passed === true
            : true
          if (mastered / cards.length >= 0.8 && appOk) {
            masteredConcepts.add(concept.id)
          }
        }
        // Find first concept whose deps are mastered and which has no card_state yet
        for (const concept of CONCEPTS) {
          const cards = CARDS.filter((c) => c.concept_id === concept.id)
          if (cards.length === 0) continue
          const touched = cards.some((c) => states[c.id] != null)
          if (touched) continue
          const depsOk = concept.depends_on.every((d) => masteredConcepts.has(d))
          if (depsOk) return concept
        }
        return undefined
      },

      buildSessionQueue: (minutes) => {
        const reviewBudget = minutes === 5 ? 3 : minutes === 8 ? 5 : 8
        const dueCards = get().getDueCards()
        // Cap reviews to budget
        const reviews = dueCards.slice(0, reviewBudget)

        const newConcept = minutes === 5 ? undefined : get().getNewConceptToTeach()
        const newConceptCards = newConcept
          ? CARDS.filter((c) => c.concept_id === newConcept.id).slice(0, minutes === 15 ? 3 : 2)
          : []

        // Application: pick from a concept the user has seen but not yet passed app on
        const apps = get().application_states
        const states = get().card_states
        const candidateApp = (() => {
          for (const concept of CONCEPTS) {
            if (!concept.application_id) continue
            const appState = apps[concept.application_id]
            if (appState?.passed) continue
            // Has the user touched any cards on this concept?
            const touched = CARDS.some((c) => c.concept_id === concept.id && states[c.id])
            if (touched) {
              return APPLICATIONS.find((a) => a.id === concept.application_id)
            }
          }
          // Fallback: if newConcept has an app, use that
          if (newConcept?.application_id) {
            return APPLICATIONS.find((a) => a.id === newConcept.application_id)
          }
          return undefined
        })()

        return { reviews, newConcept, newConceptCards, application: candidateApp }
      },

      setName: (n) => set({ name: n }),
      setSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      reviewCard: (cardId, grade) => {
        set((state) => {
          const prev = state.card_states[cardId] ?? newCardState(cardId)
          const next = applyGrade(prev, grade)
          return {
            card_states: { ...state.card_states, [cardId]: next },
          }
        })
      },

      markConceptSeen: (conceptId) => {
        set((state) => {
          const updates: Record<string, CardState> = { ...state.card_states }
          const cards = CARDS.filter((c) => c.concept_id === conceptId)
          for (const card of cards) {
            if (!updates[card.id]) {
              updates[card.id] = newCardState(card.id)
            }
          }
          return { card_states: updates }
        })
      },

      recordApplication: (applicationId, passed) => {
        set((state) => {
          const prev: ApplicationState = state.application_states[applicationId] ?? {
            application_id: applicationId,
            passed: false,
            attempts: 0,
          }
          const next: ApplicationState = {
            ...prev,
            passed: prev.passed || passed,
            attempts: prev.attempts + 1,
            last_attempt_at: new Date().toISOString(),
          }
          return {
            application_states: { ...state.application_states, [applicationId]: next },
          }
        })
      },

      endSession: (log) => {
        set((state) => {
          const today = todayISO()
          const sessionLog: SessionLog = { ...log, id: `s-${Date.now()}` }
          // Streak logic
          const last = state.last_session_date
          let streak = state.current_streak
          if (!last) {
            streak = 1
          } else if (last === today) {
            // already counted today, no change
          } else {
            const yesterdayISO = (() => {
              const d = new Date()
              d.setUTCDate(d.getUTCDate() - 1)
              return d.toISOString().slice(0, 10)
            })()
            if (last === yesterdayISO) {
              streak += 1
            } else {
              streak = 1
            }
          }
          return {
            session_logs: [...state.session_logs, sessionLog].slice(-100),
            last_session_date: today,
            current_streak: streak,
            longest_streak: Math.max(state.longest_streak, streak),
          }
        })
      },

      resetAllProgress: () => {
        const name = get().name
        set({ ...initialState(), name })
      },
    }),
    {
      name: 'oihana-money-v1',
      partialize: (state) => ({
        name: state.name,
        created_at: state.created_at,
        current_streak: state.current_streak,
        longest_streak: state.longest_streak,
        last_session_date: state.last_session_date,
        settings: state.settings,
        card_states: state.card_states,
        application_states: state.application_states,
        session_logs: state.session_logs,
        active_track_age_range: state.active_track_age_range,
      }),
    }
  )
)
