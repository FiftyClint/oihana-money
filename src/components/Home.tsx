import { useStore } from '../lib/store'

export default function Home({
  onStartSession,
  onOpenTree,
}: {
  onStartSession: (minutes: 5 | 8 | 15) => void
  onOpenTree: () => void
}) {
  const name = useStore((s) => s.name)
  const streak = useStore((s) => s.current_streak)
  const longest = useStore((s) => s.longest_streak)
  const preferred = useStore((s) => s.settings.preferred_session_minutes)
  const dueCount = useStore((s) => s.getDueCards().length)
  const nextConcept = useStore((s) => s.getNewConceptToTeach())
  const concepts = useStore((s) => s.getConcepts())
  const conceptStateMap = useStore((s) => s.getConceptStateMap())

  const masteredCount = Object.values(conceptStateMap).filter((v) => v === 'mastered').length
  const totalConcepts = concepts.length

  return (
    <div className="space-y-4 mt-2">
      <div className="card">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Hi, {name}</div>
            <div className="text-2xl font-bold mt-0.5">
              {streak === 0 ? 'Ready to start?' : `${streak}-day streak 🔥`}
            </div>
          </div>
          {longest > 0 && (
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              Longest: {longest}d
            </div>
          )}
        </div>
        <div className="mt-4 text-sm text-slate-700 dark:text-slate-300">
          {nextConcept ? (
            <>Today you'll unlock <span className="font-semibold">{nextConcept.title}</span>.</>
          ) : dueCount > 0 ? (
            <>You've got {dueCount} review{dueCount === 1 ? '' : 's'} due. Lock them in.</>
          ) : (
            <>All caught up. New content unlocks as you master previous concepts.</>
          )}
        </div>
      </div>

      <div className="card">
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Pick a session length</div>
        <div className="grid grid-cols-3 gap-2">
          {([5, 8, 15] as const).map((m) => (
            <button
              key={m}
              onClick={() => onStartSession(m)}
              className={`btn ${preferred === m ? 'btn-primary' : 'btn-secondary'} flex-col py-4`}
            >
              <div className="text-lg font-semibold">{m} min</div>
              <div className="text-xs opacity-80 mt-0.5">
                {m === 5 ? 'quick' : m === 8 ? 'usual' : 'deep'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onOpenTree}
        className="card w-full text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Skill map</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              {masteredCount} / {totalConcepts} concepts mastered
            </div>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-2xl">›</div>
        </div>
        <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(masteredCount / Math.max(1, totalConcepts)) * 100}%` }}
          />
        </div>
      </button>
    </div>
  )
}
