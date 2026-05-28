import React from 'react'

import ConfirmDialog from './ConfirmDialog'

export default function AdminFormModal({ open, title, description, children, confirmLabel = 'Save', cancelLabel = 'Cancel', onCancel, onConfirm, loading }) {
  if (!open) return null

  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={
        <div className="space-y-4 text-left">
          {description ? <div className="text-sm leading-6 text-slate-600">{description}</div> : null}
          <div className="space-y-4">{children}</div>
        </div>
      }
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      loading={loading}
    />
  )
}
