import React from 'react'
import { Link } from 'react-router-dom'

export default function PlaceholderDashboard({
  eyebrow,
  title,
  description,
  stats = [],
  highlights = [],
  primaryAction,
  secondaryAction,
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryAction ? (
              <Link
                to={primaryAction.to}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                to={secondaryAction.to}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        )}
      </section>

      {stats.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
              <div className="mt-3 text-3xl font-semibold text-slate-950">{stat.value}</div>
              {stat.note ? <div className="mt-2 text-sm text-slate-600">{stat.note}</div> : null}
            </article>
          ))}
        </section>
      ) : null}

      {highlights.length ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.eyebrow}</div>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              {item.items?.length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {item.items.map((entry) => (
                    <li key={entry} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  )
}