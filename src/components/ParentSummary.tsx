import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { buildParentSummary, summaryToPlainText } from '../lib/summary'

export default function ParentSummary({ onClose }: { onClose: () => void }) {
  const name = useStore((s) => s.name)
  const concepts = useStore((s) => s.getConcepts())
  const cards = useStore((s) => s.getCards())
  const cardStates = useStore((s) => s.card_states)
  const appStates = useStore((s) => s.application_states)
  const sessionLogs = useStore((s) => s.session_logs)
  const currentStreak = useStore((s) => s.current_streak)
  const longestStreak = useStore((s) => s.longest_streak)

  const summary = useMemo(
    () =>
      buildParentSummary(concepts, cards, cardStates, appStates, sessionLogs, {
        current: currentStreak,
        longest: longestStreak,
      }),
    [concepts, cards, cardStates, appStates, sessionLogs, currentStreak, longestStreak]
  )

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryToPlainText(summary, name))
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      alert('Copy failed — your browser blocked clipboard access. Use the plain-text view below.')
    }
  }

  const hasAnyData = sessionLogs.length > 0 || Object.keys(cardStates).length > 0

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Parent summary</h1>
        <button
          onClick={onClose}
          className="text-slate-500 px-2 hover:bg-slate-100 rounded"
        >
          Close
        </button>
      </div>

      <div className="text-xs text-slate-500">
        Week of {fmtDate(summary.weekStartISO)} – {fmtDate(summary.generatedAt.slice(0, 10))}
      </div>

      {!hasAnyData && (
        <div className="card text-slate-700">
          No activity yet. Once {name || 'she'} does a session or two, this page fills in with
          what she's learned, what she's struggling with, and what to ask her about.
        </div>
      )}

      {hasAnyData && (
        <>
          <div className="card space-y-1">
            <div className="text-sm text-slate-600">Streak</div>
            <div className="text-2xl font-bold tabular-nums">
              {summary.streak.current} day{summary.streak.current === 1 ? '' : 's'}{' '}
              <span className="text-base font-normal text-slate-500">
                (longest {summary.streak.longest})
              </span>
            </div>
            <div className="text-sm text-slate-600 mt-1">
              This week: {summary.weeklyActivity.sessionCount} session
              {summary.weeklyActivity.sessionCount === 1 ? '' : 's'} ·{' '}
              {summary.weeklyActivity.totalMinutes} min
            </div>
          </div>

          {summary.justUnlocked.length > 0 && (
            <Section title="Just unlocked" emoji="🔓" tone="emerald">
              {summary.justUnlocked.slice(0, 5).map((c) => (
                <div key={c.id}>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm text-slate-600">{c.summary}</div>
                </div>
              ))}
            </Section>
          )}

          {summary.workingOn.length > 0 && (
            <Section title="Currently working on" emoji="📚" tone="sky">
              {summary.workingOn.slice(0, 6).map((c) => (
                <div key={c.id} className="text-sm">
                  • {c.title}
                </div>
              ))}
            </Section>
          )}

          {summary.strugglingWith.length > 0 && (
            <Section title="Struggling with" emoji="🤔" tone="amber">
              {summary.strugglingWith.slice(0, 3).map(({ concept, cards }) => (
                <div key={concept.id}>
                  <div className="font-medium">{concept.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {cards.length} card{cards.length === 1 ? '' : 's'} she's missed 2+ times
                  </div>
                </div>
              ))}
            </Section>
          )}

          {summary.masteredThisWeek.length > 0 && (
            <Section title="Mastered this week" emoji="✓" tone="emerald">
              {summary.masteredThisWeek.map((c) => (
                <div key={c.id} className="text-sm">
                  {c.title}
                </div>
              ))}
            </Section>
          )}

          <div className="card space-y-1">
            <div className="text-sm font-medium text-slate-700">All-time progress</div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Stat
                label="Concepts"
                value={`${summary.masteredAllTime.length}/${summary.totalConcepts}`}
              />
              <Stat label="Cards" value={String(summary.totalCardsMastered)} />
              <Stat label="Days" value={String(summary.daysActive)} />
            </div>
            <div className="text-xs text-slate-500 mt-2">
              "Cards" = individual flashcards she's reviewed enough to hit long-term memory (interval ≥ 30 days).
            </div>
          </div>

          {summary.conversationStarter && (
            <Section title="Conversation starter" emoji="💬" tone="slate">
              <div className="text-sm text-slate-700 mb-1">
                Ask her about{' '}
                <span className="font-medium">{summary.conversationStarter.conceptTitle}</span>:
              </div>
              <div className="italic text-slate-800">
                "{summary.conversationStarter.question}"
              </div>
            </Section>
          )}

          <button className="btn-primary w-full" onClick={handleCopy}>
            {copied ? '✓ Copied to clipboard' : 'Copy plain-text summary'}
          </button>
        </>
      )}
    </div>
  )
}

function Section({
  title,
  emoji,
  tone,
  children,
}: {
  title: string
  emoji: string
  tone: 'emerald' | 'sky' | 'amber' | 'slate'
  children: React.ReactNode
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50',
    sky: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900/50',
    amber: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50',
    slate: 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
  }[tone]
  return (
    <div className={`rounded-2xl border ${toneClasses} p-4 space-y-2`}>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
        <span className="mr-2">{emoji}</span>
        {title}
      </div>
      <div className="space-y-2 text-slate-800 dark:text-slate-200">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-2 text-center border border-slate-200 dark:border-slate-700">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  )
}

function fmtDate(iso: string): string {
  // YYYY-MM-DD → "Mon DD"
  const [, m, d] = iso.split('-').map(Number)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[m - 1]} ${d}`
}
