import { useState } from 'react'
import type { Card, ReviewGrade } from '../types'

export default function CardView({
  card,
  onGrade,
}: {
  card: Card
  onGrade: (g: ReviewGrade) => void
}) {
  const [revealed, setRevealed] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)

  const isMC = card.type === 'multiple_choice' && card.choices && card.choices.length > 0

  const handleMCPick = (i: number) => {
    setPicked(i)
    setRevealed(true)
  }

  return (
    <div className="card space-y-4">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {labelForType(card.type)}
      </div>
      <div className="text-lg font-medium leading-snug">{card.prompt}</div>

      {isMC && (
        <div className="space-y-2">
          {card.choices!.map((choice, i) => {
            const isPicked = picked === i
            const isCorrect = i === card.correct_choice_index
            let cls = 'btn-secondary w-full text-left justify-start'
            if (revealed) {
              if (isCorrect) cls = 'btn w-full text-left justify-start bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
              else if (isPicked) cls = 'btn w-full text-left justify-start bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
              else cls = 'btn w-full text-left justify-start bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
            }
            return (
              <button
                key={i}
                disabled={revealed}
                onClick={() => handleMCPick(i)}
                className={cls}
              >
                {choice}
              </button>
            )
          })}
        </div>
      )}

      {!isMC && (
        <>
          {!revealed ? (
            <button className="btn-secondary w-full" onClick={() => setRevealed(true)}>
              Show answer
            </button>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Answer</div>
              <div className="text-slate-900 dark:text-slate-100">{card.answer}</div>
            </div>
          )}
        </>
      )}

      {revealed && (
        <>
          <div className="text-sm text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3">
            <span className="font-medium text-amber-900 dark:text-amber-300">Why: </span>
            {card.explanation}
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-2">How did that go?</div>
            <div className="grid grid-cols-4 gap-2">
              <GradeBtn label="Again" hint="forgot" color="bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200" onClick={() => onGrade('again')} />
              <GradeBtn label="Hard" hint="struggled" color="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200" onClick={() => onGrade('hard')} />
              <GradeBtn label="Good" hint="got it" color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200" onClick={() => onGrade('good')} />
              <GradeBtn label="Easy" hint="too easy" color="bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200" onClick={() => onGrade('easy')} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GradeBtn({
  label,
  hint,
  color,
  onClick,
}: {
  label: string
  hint: string
  color: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`btn flex-col py-3 ${color}`}>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-[10px] opacity-70 mt-0.5">{hint}</div>
    </button>
  )
}

function labelForType(t: Card['type']) {
  switch (t) {
    case 'recall':
      return 'Recall'
    case 'explain':
      return 'Explain it'
    case 'multiple_choice':
      return 'Pick one'
    case 'scenario':
      return 'Scenario'
  }
}
