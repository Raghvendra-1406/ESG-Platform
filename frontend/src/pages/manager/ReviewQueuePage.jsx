import React, { useMemo, useState } from 'react'

import useRecords from '../../hooks/useRecords'
import StatsCard from '../../components/common/StatsCard'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import DataTable from '../../components/common/DataTable'
import NotesModal from '../../components/common/NotesModal'
import { reviewRecord, lockRecord } from '../../services/recordsService'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getEmissionValue, getEmissionUnit, getReportingPeriod, getSourceType } from '../../utils/recordView'

export default function ReviewQueuePage() {
  const { records, loading, error, reload } = useRecords({ workflow_status: 'UNDER_REVIEW' })
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [actionType, setActionType] = useState('approve')
  const [saving, setSaving] = useState(false)

  const queue = useMemo(
    () => records.filter((record) => record.review_status === 'PENDING' || record.workflow_status === 'UNDER_REVIEW' || record.suspicious_flag),
    [records]
  )

  const submit = async (reason) => {
    if (!selectedRecord) return
    setSaving(true)
    try {
      const nextStatus = actionType === 'reject' ? 'REJECTED' : 'APPROVED'
      await reviewRecord(selectedRecord.id, {
        review_status: nextStatus,
        analyst_notes: selectedRecord.analyst_notes || '',
        reason_for_change: reason,
      })

      if (nextStatus === 'APPROVED') {
        await lockRecord(selectedRecord.id, { reason_for_change: reason })
      }

      setSelectedRecord(null)
      await reload()
    } finally {
      setSaving(false)
    }
  }

  const queueSize = queue.length
  const approvedCount = records.filter((record) => record.review_status === 'APPROVED').length
  const rejectedCount = records.filter((record) => record.review_status === 'REJECTED').length
  const lockedCount = records.filter((record) => record.workflow_status === 'LOCKED' || record.is_locked).length

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Manager review queue</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Approve, reject, and lock records</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review analyst notes, suspicious reasons, and audit context before finalizing records.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Queue" value={queueSize} note="Ready for decision" tone="blue" />
        <StatsCard label="Approved" value={approvedCount} note="Cleared for locking" tone="emerald" />
        <StatsCard label="Rejected" value={rejectedCount} note="Returned to analysts" tone="rose" />
        <StatsCard label="Locked" value={lockedCount} note="Finalized evidence set" tone="slate" />
      </section>

      {queue.length ? (
        <DataTable
          columns={[
            { key: 'id', label: 'Record ID' },
            { key: 'source_type', label: 'Source' },
            { key: 'value', label: 'Emission', className: 'text-right' },
            { key: 'status', label: 'Workflow' },
            { key: 'quality', label: 'Quality' },
            { key: 'reason', label: 'Suspicious reason' },
            { key: 'period', label: 'Reporting period' },
            { key: 'updated', label: 'Updated' },
            { key: 'actions', label: 'Actions' },
          ]}
          data={queue}
          renderRow={(record) => (
            <tr key={record.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
              <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(getEmissionValue(record))} {getEmissionUnit(record)}</td>
              <td className="px-4 py-3 text-slate-700">{record.workflow_status || record.review_status}</td>
              <td className="px-4 py-3 text-slate-700">{record.quality_score || 'MEDIUM'}</td>
              <td className="px-4 py-3 text-slate-700">{record.suspicious_reason || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{getReportingPeriod(record)}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => { setActionType('approve'); setSelectedRecord(record) }} className="rounded-full bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    Approve
                  </button>
                  <button type="button" onClick={() => { setActionType('reject'); setSelectedRecord(record) }} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message="No records are currently waiting in the review queue." />
      )}

      <NotesModal
        open={Boolean(selectedRecord)}
        title={actionType === 'reject' ? 'Reject record with reason' : 'Approve record with reason'}
        noteLabel="Manager reason"
        notePlaceholder="Add a decision reason"
        loading={saving}
        onCancel={() => setSelectedRecord(null)}
        onSubmit={submit}
      />
    </div>
  )
}