import React from 'react'

import ConfirmDialog from './ConfirmDialog'

export default function UploadSummaryModal({ open, summary, onClose }) {
  if (!open) return null

  return (
    <ConfirmDialog
      open={open}
      title="Upload summary"
      description={
        <div className="space-y-2 text-sm text-slate-600">
          <div>Normalized records: <span className="font-medium text-slate-900">{summary?.normalized_records ?? '-'}</span></div>
          <div>Failed rows: <span className="font-medium text-slate-900">{summary?.failed_rows ?? '-'}</span></div>
          <div>Suspicious rows: <span className="font-medium text-slate-900">{summary?.suspicious_rows ?? '-'}</span></div>
          <div>Quality score: <span className="font-medium text-slate-900">{summary?.quality_score ?? '-'}</span></div>
          <div>Reporting period: <span className="font-medium text-slate-900">{summary?.reportingPeriod ?? '—'}</span></div>
          <div>Status: <span className="font-medium text-slate-900">{summary?.status ?? '-'}</span></div>
        </div>
      }
      confirmLabel="Close"
      cancelLabel="Dismiss"
      onConfirm={onClose}
      onCancel={onClose}
    />
  )
}
