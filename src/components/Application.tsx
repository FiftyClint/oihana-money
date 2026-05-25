import { useState } from 'react'
import type { Application } from '../types'
import PortfolioSim from './PortfolioSim'
import TimeTravel from './TimeTravel'

export default function ApplicationView({
  application,
  onComplete,
}: {
  application: Application
  onComplete: (passed: boolean) => void
}) {
  if (application.type === 'portfolio') {
    return <PortfolioSim app={application} onComplete={onComplete} />
  }
  if (application.type === 'calculator') {
    return <TimeTravel app={application} onComplete={onComplete} />
  }
  return <DecisionSim app={application} onComplete={onComplete} />
}

function DecisionSim({
  app,
  onComplete,
}: {
  app: Application
  onComplete: (passed: boolean) => void
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const choices: { label: string; outcome: 'correct' | 'wrong' | 'ok'; feedback: string }[] =
    app.payload.choices

  const showFeedback = picked !== null
  const chosen = picked !== null ? choices[picked] : null

  return (
    <div className="card space-y-4">
      <div className="text-xs uppercase tracking-wider text-emerald-700">Apply it</div>
      <div className="text-xl font-semibold">{app.title}</div>
      <div className="text-slate-800">{app.intro}</div>

      <div className="space-y-2">
        {choices.map((c, i) => {
          let cls = 'btn-secondary w-full text-left justify-start whitespace-normal'
          if (showFeedback) {
            if (i === picked && c.outcome === 'correct') {
              cls = 'btn w-full text-left justify-start whitespace-normal bg-emerald-100 text-emerald-900 border border-emerald-300'
            } else if (i === picked && c.outcome === 'ok') {
              cls = 'btn w-full text-left justify-start whitespace-normal bg-amber-100 text-amber-900 border border-amber-300'
            } else if (i === picked) {
              cls = 'btn w-full text-left justify-start whitespace-normal bg-rose-100 text-rose-900 border border-rose-300'
            } else {
              cls = 'btn w-full text-left justify-start whitespace-normal bg-white text-slate-500 border border-slate-200'
            }
          }
          return (
            <button
              key={i}
              disabled={showFeedback}
              onClick={() => setPicked(i)}
              className={cls}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {chosen && (
        <div className="bg-slate-50 rounded-xl p-3 text-slate-900">
          {chosen.feedback}
        </div>
      )}

      {chosen && (
        <button
          className="btn-primary w-full"
          onClick={() => onComplete(chosen.outcome === 'correct')}
        >
          Continue
        </button>
      )}
    </div>
  )
}
