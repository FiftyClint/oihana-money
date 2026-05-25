import { useState } from 'react'
import { useStore } from '../lib/store'

export default function Welcome() {
  const [name, setName] = useState('')
  const setStoreName = useStore((s) => s.setName)
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="card max-w-md w-full space-y-5">
        <div>
          <div className="text-3xl font-bold">Money School</div>
          <div className="text-slate-600 mt-1">
            Learn money + investing the way you'd learn a language: small bites, every day.
          </div>
        </div>
        <ul className="text-sm text-slate-700 space-y-2">
          <li>5-15 minutes a day. That's it.</li>
          <li>No real money. No accounts. Just real ideas and practice.</li>
          <li>Streak counts kindly: skip a day a week, no penalty.</li>
        </ul>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            What should we call you?
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            autoFocus
          />
        </div>
        <button
          disabled={name.trim().length < 1}
          onClick={() => setStoreName(name.trim())}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Start
        </button>
      </div>
    </div>
  )
}
