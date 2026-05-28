import React, { useState } from 'react'
import { useEffect } from 'react'

import ConfirmDialog from './ConfirmDialog'

export default function NotesModal({ open, title, noteLabel = 'Reason', notePlaceholder = 'Add a clear reason or note', onCancel, onSubmit, loading }) {
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) {
      setNote('')
    }
  }, [open])

  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={
        <div className="space-y-3">
          <div className="text-sm text-slate-600">{noteLabel} is required before this action is submitted.</div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={notePlaceholder}
            className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
          />
        </div>
      }
      confirmLabel="Submit"
      onCancel={() => {
        setNote('')
        onCancel?.()
      }}
      onConfirm={async () => {
        await onSubmit(note)
        setNote('')
      }}
      loading={loading}
    />
  )
}
