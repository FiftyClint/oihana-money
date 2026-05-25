import { useMemo, useState } from 'react'
import type { Application } from '../types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Payload {
  defaults: {
    monthly_amount: number
    start_age: number
    end_age: number
    annual_rate: number
  }
  min_monthly: number
  max_monthly: number
}

export default function TimeTravel({
  app,
  onComplete,
}: {
  app: Application
  onComplete: (passed: boolean) => void
}) {
  const payload = app.payload as Payload
  const [monthly, setMonthly] = useState(payload.defaults.monthly_amount)
  const [startAge, setStartAge] = useState(payload.defaults.start_age)
  const [endAge, setEndAge] = useState(payload.defaults.end_age)
  const [rate, setRate] = useState(payload.defaults.annual_rate)

  const series = useMemo(() => {
    const years = Math.max(0, endAge - startAge)
    let balance = 0
    let contributed = 0
    const data: { age: number; value: number; contributed: number }[] = [
      { age: startAge, value: 0, contributed: 0 },
    ]
    for (let y = 0; y < years; y++) {
      balance = balance * (1 + rate) + monthly * 12
      contributed += monthly * 12
      data.push({ age: startAge + y + 1, value: Math.round(balance), contributed })
    }
    return data
  }, [monthly, startAge, endAge, rate])

  const final = series[series.length - 1]?.value ?? 0
  const totalContributed = series[series.length - 1]?.contributed ?? 0
  const growth = final - totalContributed

  return (
    <div className="card space-y-4">
      <div className="text-xs uppercase tracking-wider text-emerald-700">Apply it</div>
      <div className="text-xl font-semibold">{app.title}</div>
      <div className="text-slate-800 text-sm">{app.intro}</div>

      <div className="space-y-4">
        <Slider
          label="Monthly amount"
          value={monthly}
          min={payload.min_monthly}
          max={payload.max_monthly}
          step={10}
          format={(v) => `$${v}`}
          onChange={setMonthly}
        />
        <Slider
          label="Start age"
          value={startAge}
          min={10}
          max={60}
          step={1}
          format={(v) => String(v)}
          onChange={(v) => {
            setStartAge(v)
            if (v >= endAge) setEndAge(v + 1)
          }}
        />
        <Slider
          label="End age"
          value={endAge}
          min={startAge + 1}
          max={80}
          step={1}
          format={(v) => String(v)}
          onChange={setEndAge}
        />
        <Slider
          label="Annual rate"
          value={rate}
          min={0.02}
          max={0.12}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={setRate}
        />
      </div>

      <div className="bg-slate-50 rounded-xl p-3 space-y-1">
        <div className="text-sm text-slate-600">At age {endAge}</div>
        <div className="text-2xl font-bold tabular-nums">${final.toLocaleString()}</div>
        <div className="text-xs text-slate-500">
          You put in ${totalContributed.toLocaleString()}. Growth: ${growth.toLocaleString()}.
        </div>
      </div>

      <div className="h-48 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="age" tick={{ fontSize: 11 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => `$${v.toLocaleString()}`}
              labelFormatter={(l) => `Age ${l}`}
            />
            <Line type="monotone" dataKey="contributed" stroke="#94a3b8" strokeWidth={2} dot={false} name="What you put in" />
            <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} dot={false} name="What it grew to" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
        Try moving the start age slider. Starting 10 years earlier with the same monthly amount
        usually doubles the final number. That's compounding.
      </div>

      <button className="btn-primary w-full" onClick={() => onComplete(true)}>
        Continue
      </button>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-600"
      />
    </div>
  )
}
