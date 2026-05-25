import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { Application } from '../types'

interface Payload {
  initial_amount: number
  monthly_contribution: number
  years: number
  instruments: { key: 'stocks' | 'bonds' | 'cash'; label: string; color: string }[]
  annual_returns: Record<'stocks' | 'bonds' | 'cash', number[]>
}

export default function PortfolioSim({
  app,
  onComplete,
}: {
  app: Application
  onComplete: (passed: boolean) => void
}) {
  const payload = app.payload as Payload
  const [pct, setPct] = useState<{ stocks: number; bonds: number; cash: number }>({
    stocks: 70,
    bonds: 20,
    cash: 10,
  })
  const [ran, setRan] = useState(false)

  const total = pct.stocks + pct.bonds + pct.cash
  const valid = total === 100

  const { series, finalValue, totalContributions } = useMemo(() => {
    if (!valid) return { series: [], finalValue: 0, totalContributions: 0 }
    // Simulate year by year
    const years = payload.years
    let balance = payload.initial_amount
    let contribs = payload.initial_amount
    const data: { year: number; value: number; contributed: number }[] = [
      { year: 0, value: Math.round(balance), contributed: Math.round(contribs) },
    ]
    const weights = {
      stocks: pct.stocks / 100,
      bonds: pct.bonds / 100,
      cash: pct.cash / 100,
    }
    for (let y = 0; y < years; y++) {
      const blendedReturn =
        payload.annual_returns.stocks[y] * weights.stocks +
        payload.annual_returns.bonds[y] * weights.bonds +
        payload.annual_returns.cash[y] * weights.cash
      const monthly = payload.monthly_contribution
      // Apply returns, then add contributions monthly (approximate with end-of-year)
      balance = balance * (1 + blendedReturn) + monthly * 12
      contribs += monthly * 12
      data.push({ year: y + 1, value: Math.round(balance), contributed: Math.round(contribs) })
    }
    return { series: data, finalValue: Math.round(balance), totalContributions: Math.round(contribs) }
  }, [pct, valid, payload])

  const passed = ran && pct.stocks >= 50 && finalValue > totalContributions * 1.5

  return (
    <div className="card space-y-4">
      <div className="text-xs uppercase tracking-wider text-emerald-700">Apply it</div>
      <div className="text-xl font-semibold">{app.title}</div>
      <div className="text-slate-800 text-sm">{app.intro}</div>

      <div className="space-y-3">
        {payload.instruments.map((inst) => (
          <div key={inst.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">{inst.label}</span>
              <span className="tabular-nums">{pct[inst.key]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={pct[inst.key]}
              onChange={(e) =>
                setPct((prev) => ({ ...prev, [inst.key]: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-emerald-600"
            />
          </div>
        ))}
        <div className={`text-xs ${valid ? 'text-emerald-700' : 'text-rose-700'}`}>
          Total: {total}% {valid ? '✓' : '(must equal 100%)'}
        </div>
      </div>

      {!ran && (
        <button
          disabled={!valid}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => setRan(true)}
        >
          Run 30 years
        </button>
      )}

      {ran && (
        <>
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <div className="text-sm text-slate-600">After 30 years</div>
            <div className="text-2xl font-bold tabular-nums">
              ${finalValue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">
              From ${totalContributions.toLocaleString()} of your money. The rest is growth.
            </div>
          </div>

          <div className="h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v: number) => `$${v.toLocaleString()}`}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="contributed"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                  name="What you put in"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={false}
                  name="What it grew to"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            {pct.stocks >= 70
              ? `Heavy on stocks — that's right for a 30-year horizon. Notice the dips around 2000, 2008, and 2022. They recovered.`
              : pct.stocks >= 50
                ? `Balanced allocation. Lower highs, smaller dips — fine for shorter horizons or if dips would freak you out.`
                : `Mostly cash and bonds. Safer day-to-day, but you barely beat inflation over 30 years.`}
          </div>

          <button className="btn-primary w-full" onClick={() => onComplete(passed)}>
            Continue
          </button>
        </>
      )}
    </div>
  )
}
