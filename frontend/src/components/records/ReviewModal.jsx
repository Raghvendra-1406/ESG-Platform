import React, { useState } from 'react'
import { reviewRecord, lockRecord } from '../../services/recordsService'

export default function ReviewModal({ record, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState(record.analyst_notes || '')
  const [error, setError] = useState('')

  const handleReview = async (status) => {
    setLoading(true)
    setError('')
    try {
      await reviewRecord(record.id, { review_status: status, analyst_notes: note })
      if (status === 'APPROVED') {
        await lockRecord(record.id)
      }
      if (onUpdated) onUpdated()
      onClose()
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.detail || 'Could not update record'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
      <div className="bg-white rounded shadow-lg w-11/12 max-w-lg p-4">
        <h3 className="text-lg font-semibold">Review Record</h3>
        <p className="text-sm text-gray-600">{record.category} — {record.scope}</p>

        <div className="mt-3">
          <label className="block text-sm text-gray-700">Analyst note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full border rounded p-2" rows={4} />
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button>
          <button onClick={() => handleReview('REJECTED')} className="px-3 py-2 bg-red-600 text-white rounded" disabled={loading}>Reject</button>
          <button onClick={() => handleReview('APPROVED')} className="px-3 py-2 bg-green-600 text-white rounded" disabled={loading}>Approve & Lock</button>
        </div>
      </div>
    </div>
  )
}
