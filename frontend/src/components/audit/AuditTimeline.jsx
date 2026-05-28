import React from 'react'

import { formatDate } from '../../utils/formatters'

export default function AuditTimeline({ items = [] }) {
  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">No audit events found.</div>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={item.id || `${item.timestamp}-${item.field_name}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-950">{item.action_type || item.action || 'UPDATE'} • {item.field_name || 'record'}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.user_role || 'Unknown role'} • {item.performed_by || item.changed_by_user || 'Unknown user'}</div>
            </div>
            <div className="text-sm text-slate-500">{formatDate(item.timestamp)}</div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Before</div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-slate-700">{JSON.stringify(item.old_value || item.previous_state || '-', null, 2)}</pre>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">After</div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-slate-700">{JSON.stringify(item.new_value || item.new_state || '-', null, 2)}</pre>
            </div>
          </div>
          {item.reason_for_change ? <div className="mt-3 text-sm text-slate-600"><span className="font-medium text-slate-900">Reason:</span> {item.reason_for_change}</div> : null}
        </article>
      ))}
    </div>
  )
}
