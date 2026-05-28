import React from 'react'

export default function FilterPanel({ children, onApply, onReset }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
        <div className="flex flex-wrap gap-2">
          {onApply ? (
            <button type="button" onClick={onApply} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Apply filters
            </button>
          ) : null}
          {onReset ? (
            <button type="button" onClick={onReset} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Reset filters
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
