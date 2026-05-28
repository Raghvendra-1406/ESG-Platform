import React from 'react'

import { useToastState } from '../../context/ToastContext'

export default function ToastStack() {
  const { toasts = [], dismissToast } = useToastState() || {}

  if (!toasts.length) return null

  return (
    <div className="fixed right-4 top-4 z-[60] space-y-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={`w-80 rounded-2xl border px-4 py-3 shadow-lg ${toast.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{toast.title || (toast.type === 'error' ? 'Error' : 'Success')}</div>
              <div className="mt-1 text-sm leading-5">{toast.message}</div>
            </div>
            <button type="button" onClick={() => dismissToast?.(toast.id)} className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  )
}
