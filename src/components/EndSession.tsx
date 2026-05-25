import { useStore } from '../lib/store'

export default function EndSession({
  stats,
  durationSec,
  onDone,
}: {
  stats: {
    reviews: number
    correct: number
    incorrect: number
    newConcepts: string[]
  }
  durationSec: number
  onDone: () => void
}) {
  const concepts = useStore((s) => s.getConcepts())
  const newConceptTitles = stats.newConcepts
    .map((id) => concepts.find((c) => c.id === id)?.title)
    .filter(Boolean) as string[]

  const minutes = Math.max(1, Math.round(durationSec / 60))
  const accuracy = stats.reviews > 0
    ? Math.round((stats.correct / stats.reviews) * 100)
    : 0

  return (
    <div className="card space-y-4 text-center mt-4">
      <div className="text-5xl">🎉</div>
      <div>
        <div className="text-2xl font-bold">Nice work.</div>
        <div className="text-slate-600 mt-1">
          {minutes} minute{minutes === 1 ? '' : 's'} · {stats.reviews} cards
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-left">
        <Stat label="Cards practiced" value={String(stats.reviews)} />
        <Stat label="Got it / easy" value={`${accuracy}%`} />
      </div>

      {newConceptTitles.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left">
          <div className="text-xs uppercase tracking-wider text-emerald-700 mb-1">
            Unlocked today
          </div>
          <ul className="text-slate-900">
            {newConceptTitles.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </div>
      )}

      <button className="btn-primary w-full" onClick={onDone}>
        Done
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
