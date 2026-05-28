import React from 'react'

export default function ErrorMessage({ children }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{children}</div>
}