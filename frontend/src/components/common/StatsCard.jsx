import React from 'react'

export default function StatsCard({ label, value, note, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-200 bg-white text-slate-950',
    blue: 'border-blue-100 bg-blue-50 text-blue-950',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-950',
    amber: 'border-amber-100 bg-amber-50 text-amber-950',
    rose: 'border-rose-100 bg-rose-50 text-rose-950',
  }

  return (
    <article className={`rounded-2xl border p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {note ? <div className="mt-2 text-sm text-slate-600">{note}</div> : null}
    </article>
  )
}
