import React from 'react'

const colors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  UNDER_REVIEW: 'bg-sky-100 text-sky-800',
  LOCKED: 'bg-slate-200 text-slate-800',
  VALID: 'bg-emerald-100 text-emerald-800',
  WARNING: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-rose-100 text-rose-800',
  HIGH: 'bg-emerald-100 text-emerald-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  LOW: 'bg-rose-100 text-rose-800',
}

export default function StatusBadge({ status }) {
  const cls = colors[status] || 'bg-gray-100 text-gray-800'
  return <span className={`px-2 py-1 rounded text-xs font-medium ${cls}`}>{status}</span>
}
