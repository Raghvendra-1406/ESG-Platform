import React from 'react'

export default function EmptyState({ message = 'No records found' }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 shadow-sm">
      {message}
    </div>
  )
}
