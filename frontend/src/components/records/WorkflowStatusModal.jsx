import React, { useState } from 'react'

import ConfirmDialog from '../common/ConfirmDialog'
import { updateRecordWorkflow } from '../../services/recordsService'

const WORKFLOW_STATUSES = ['UPLOADED', 'VALIDATED', 'NORMALIZED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']

export default function WorkflowStatusModal({ record, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const [workflowStatus, setWorkflowStatus] = useState(record.workflow_status || record.review_status || 'UNDER_REVIEW')
  const [note, setNote] = useState(record.analyst_notes || '')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!note.trim()) {
      setError('A change note is required.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await updateRecordWorkflow(record.id, {
        workflow_status: workflowStatus,
        analyst_notes: note,
        reason_for_change: note,
      })
      if (onUpdated) onUpdated()
      onClose()
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.detail || err?.response?.data?.reason_for_change || 'Could not update workflow status'
      setError(Array.isArray(message) ? message[0] : message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open
      title="Edit workflow status"
      description={
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Update the normalized record workflow state and record a note explaining the change.</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Workflow status</label>
            <select
              value={workflowStatus}
              onChange={(event) => setWorkflowStatus(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            >
              {WORKFLOW_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Change note</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              placeholder="Explain why this status is changing"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          {error ? <div className="text-sm text-rose-600">{error}</div> : null}
        </div>
      }
      confirmLabel="Save changes"
      cancelLabel="Cancel"
      onConfirm={handleSubmit}
      onCancel={onClose}
      loading={loading}
    />
  )
}
