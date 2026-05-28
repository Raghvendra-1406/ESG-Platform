import React from 'react'

export default function ErrorState({ error }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
      {error?.message || String(error)}
    </div>
  )
}
