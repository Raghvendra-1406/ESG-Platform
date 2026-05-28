import React from 'react'

export default function Loader() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
    </div>
  )
}
