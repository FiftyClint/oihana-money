import { useState } from 'react'
import { useStore } from '../lib/store'
import ParentSummary from './ParentSummary'

export default function Settings({ onClose }: { onClose: () => void }) {
  const [showSummary, setShowSummary] = useState(false)
  if (showSummary) {
    return <ParentSummary onClose={() => setShowSummary(false)} />
  }
  return <SettingsBody onClose={onClose} onOpenSummary={() => setShowSummary(true)} />
}

function SettingsBody({
  onClose,
  onOpenSummary,
}: {
  onClose: () => void
  onOpenSummary: () => void
}) {
  const name = useStore((s) => s.name)
  const setName = useStore((s) => s.setName)
  const settings = useStore((s) => s.settings)
  const setSettings = useStore((s) => s.setSettings)
  const reset = useStore((s) => s.resetAllProgress)
  const streak = useStore((s) => s.current_streak)
  const longest = useStore((s) => s.longest_streak)
  const sessionCount = useStore((s) => s.session_logs.length)

  const [confirmReset, setConfirmReset] = useState(false)
  const [exportText, setExportText] = useState('')

  const handleExport = () => {
    const raw = localStorage.getItem('oihana-money-v1') ?? '{}'
    setExportText(raw)
  }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      alert('Copied to clipboard.')
    } catch {
      alert('Copy failed — select and copy manually.')
    }
  }

  return (
    <div className="space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Settings</h1>
        <button onClick={onClose} className="text-slate-500 px-2 hover:bg-slate-100 rounded">
          Close
        </button>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 px-4 py-2 outline-none focus:border-slate-900 dark:focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default session length
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([5, 8, 15] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSettings({ preferred_session_minutes: m })}
                className={settings.preferred_session_minutes === m ? 'btn-primary' : 'btn-secondary'}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-1">
        <div className="text-sm font-medium text-slate-700">Your stats</div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <Stat label="Streak" value={`${streak}d`} />
          <Stat label="Longest" value={`${longest}d`} />
          <Stat label="Sessions" value={String(sessionCount)} />
        </div>
      </div>

      <button onClick={onOpenSummary} className="card w-full text-left hover:bg-slate-50 transition">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Parent summary</div>
            <div className="text-sm text-slate-600 mt-0.5">
              What she's learned, struggled with, and questions to ask her this week
            </div>
          </div>
          <div className="text-slate-400 text-2xl">›</div>
        </div>
      </button>

      <div className="card space-y-3">
        <div className="text-sm font-medium text-slate-700">Export / backup</div>
        <button className="btn-secondary w-full" onClick={handleExport}>
          Show my data
        </button>
        {exportText && (
          <>
            <textarea
              readOnly
              value={exportText}
              className="w-full h-32 text-xs font-mono p-2 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <button className="btn-secondary w-full" onClick={handleCopy}>
              Copy
            </button>
          </>
        )}
      </div>

      <div className="card space-y-2">
        <div className="text-sm font-medium text-rose-700 dark:text-rose-400">Danger zone</div>
        {!confirmReset ? (
          <button className="btn-secondary w-full text-rose-700 dark:text-rose-400" onClick={() => setConfirmReset(true)}>
            Reset all progress
          </button>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              This erases all card progress, streaks, and session history. Your name stays.
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button
                className="btn bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => {
                  reset()
                  setConfirmReset(false)
                }}
              >
                Yes, reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  )
}
