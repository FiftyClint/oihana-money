import { useState } from 'react'
import { useStore } from '../lib/store'
import type { Concept } from '../types'

export default function SkillTree({ onClose }: { onClose: () => void }) {
  const tracks = useStore((s) => s.getTracks())
  const concepts = useStore((s) => s.getConcepts())
  const stateMap = useStore((s) => s.getConceptStateMap())
  const cardStates = useStore((s) => s.card_states)
  const [selected, setSelected] = useState<Concept | null>(null)

  const isAvailable = (c: Concept): boolean => {
    return c.depends_on.every((d) => stateMap[d] === 'mastered')
  }

  const visualState = (c: Concept): 'locked' | 'available' | 'seen' | 'familiar' | 'mastered' => {
    const cs = stateMap[c.id]
    const touched = concepts
      .filter((x) => x.id === c.id)
      .flatMap((x) => x.id)
      .some(() => Object.keys(cardStates).some((k) => k.startsWith(`card-${c.id.replace('c-', '')}`)))
    if (cs === 'mastered') return 'mastered'
    if (cs === 'familiar') return 'familiar'
    if (cs === 'seen' || touched) return 'seen'
    if (isAvailable(c)) return 'available'
    return 'locked'
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Skill map</h1>
        <button onClick={onClose} className="text-slate-500 px-2 hover:bg-slate-100 rounded">
          Close
        </button>
      </div>

      {tracks.map((track) => {
        const trackConcepts = concepts.filter((c) => c.track_id === track.id)
        return (
          <div key={track.id} className="space-y-2">
            <div>
              <div className="text-sm uppercase tracking-wider text-slate-500">
                Track {track.id} · {track.name}
              </div>
              <div className="text-xs text-slate-500">{track.blurb}</div>
            </div>
            <div className="space-y-2">
              {trackConcepts.length === 0 && (
                <div className="card text-sm text-slate-500 italic">Coming next.</div>
              )}
              {trackConcepts.map((c) => {
                const vs = visualState(c)
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`card w-full text-left flex items-center gap-3 hover:shadow-md transition ${
                      vs === 'locked' ? 'opacity-50' : ''
                    }`}
                  >
                    <NodeDot state={vs} />
                    <div className="flex-1">
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{c.summary}</div>
                    </div>
                    <div className="text-xs text-slate-400">{stateLabel(vs)}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {selected && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs uppercase tracking-wider text-slate-500">Concept</div>
            <div className="text-xl font-bold">{selected.title}</div>
            <div className="text-slate-800">{selected.summary}</div>
            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
              <span className="font-medium">Why it matters: </span>
              {selected.why_it_matters}
            </div>
            {selected.depends_on.length > 0 && (
              <div className="text-xs text-slate-500">
                Unlocks after:{' '}
                {selected.depends_on
                  .map((d) => concepts.find((c) => c.id === d)?.title ?? d)
                  .join(', ')}
              </div>
            )}
            <button className="btn-primary w-full" onClick={() => setSelected(null)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NodeDot({ state }: { state: 'locked' | 'available' | 'seen' | 'familiar' | 'mastered' }) {
  const map: Record<string, string> = {
    locked: 'bg-slate-300',
    available: 'bg-sky-400',
    seen: 'bg-sky-500',
    familiar: 'bg-amber-400',
    mastered: 'bg-emerald-500',
  }
  return <div className={`w-3 h-3 rounded-full shrink-0 ${map[state]}`} />
}

function stateLabel(s: string): string {
  switch (s) {
    case 'mastered':
      return 'Mastered'
    case 'familiar':
      return 'Familiar'
    case 'seen':
      return 'Seen'
    case 'available':
      return 'Ready'
    default:
      return 'Locked'
  }
}
