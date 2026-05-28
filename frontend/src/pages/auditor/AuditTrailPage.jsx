import React, { useEffect, useMemo, useState } from 'react'

import useRecords from '../../hooks/useRecords'
import { fetchAuditTrail } from '../../services/auditService'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import DataTable from '../../components/common/DataTable'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getEmissionValue, getEmissionUnit, getReportingPeriod, getSourceType } from '../../utils/recordView'
import AuditTimeline from '../../components/audit/AuditTimeline'

export default function AuditTrailPage() {
  const { records, loading, error: recordsError } = useRecords({})
  const [auditLogs, setAuditLogs] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const normalizedRecords = useMemo(() => [...records].sort((left, right) => Number(left.id || 0) - Number(right.id || 0)), [records])

  useEffect(() => {
    let mounted = true

    const loadHistory = async () => {
      if (!selectedRecord) {
        setAuditLogs([])
        return
      }

      setHistoryLoading(true)
      setHistoryError(null)
      try {
        const data = await fetchAuditTrail({ record_id: selectedRecord.id })
        if (mounted) setAuditLogs(Array.isArray(data) ? data : [])
      } catch (nextError) {
        if (mounted) setHistoryError(nextError)
      } finally {
        if (mounted) setHistoryLoading(false)
      }
    }

    loadHistory()
    return () => {
      mounted = false
    }
  }, [selectedRecord])

  const stats = useMemo(
    () => ({
      total: normalizedRecords.length,
      updateCount: normalizedRecords.filter((record) => record.workflow_status === 'UNDER_REVIEW' || record.review_status === 'PENDING').length,
      reviewCount: normalizedRecords.filter((record) => record.review_status === 'APPROVED' || record.review_status === 'REJECTED').length,
      lockCount: normalizedRecords.filter((record) => record.workflow_status === 'LOCKED' || record.is_locked).length,
    }),
    [normalizedRecords]
  )

  if (loading) return <Loader />
  if (recordsError) return <ErrorState error={recordsError} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Audit trail</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Normalized records and change history</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Click any normalized record to inspect who changed it, when, and why. This view is read-only and tenant-scoped.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Normalized rows" value={stats.total} note="Current tenant batch" tone="blue" />
        <StatsCard label="Pending / under review" value={stats.updateCount} note="Needs attention" tone="amber" />
        <StatsCard label="Reviewed" value={stats.reviewCount} note="Approved or rejected" tone="emerald" />
        <StatsCard label="Locked" value={stats.lockCount} note="Finalized evidence" tone="slate" />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Normalized records</h2>
            <p className="text-sm text-slate-500">Click a row to see the record’s change history.</p>
          </div>
          {selectedRecord ? (
            <button type="button" onClick={() => setSelectedRecord(null)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Clear selection
            </button>
          ) : null}
        </div>

        {normalizedRecords.length ? (
          <DataTable
            columns={[
              { key: 'id', label: 'Record ID' },
              { key: 'source_type', label: 'Source' },
              { key: 'value', label: 'Emission', className: 'text-right' },
              { key: 'unit', label: 'Unit' },
              { key: 'workflow', label: 'Workflow status' },
              { key: 'quality', label: 'Quality' },
              { key: 'period', label: 'Reporting period' },
              { key: 'updated', label: 'Updated' },
              { key: 'actions', label: 'Actions' },
            ]}
            data={normalizedRecords}
            renderRow={(record) => (
              <tr key={record.id} className={`cursor-pointer hover:bg-slate-50 ${selectedRecord?.id === record.id ? 'bg-slate-50' : ''}`} onClick={() => setSelectedRecord(record)}>
                <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
                <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
                <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(getEmissionValue(record))}</td>
                <td className="px-4 py-3 text-slate-700">{getEmissionUnit(record)}</td>
                <td className="px-4 py-3 text-slate-700">{record.workflow_status || record.review_status || 'PENDING'}</td>
                <td className="px-4 py-3 text-slate-700">{record.quality_score || 'MEDIUM'}</td>
                <td className="px-4 py-3 text-slate-700">{getReportingPeriod(record)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">View history</span>
                </td>
              </tr>
            )}
          />
        ) : (
          <EmptyState message="No normalized records were returned for this tenant." />
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-950">Change history</h2>
          <p className="text-sm text-slate-500">
            {selectedRecord ? `History for record #${selectedRecord.id} — ${getSourceType(selectedRecord)} • ${getReportingPeriod(selectedRecord)}` : 'Select a record above to inspect its audit history.'}
          </p>
        </div>

        {selectedRecord ? (
          historyLoading ? <Loader /> : historyError ? <ErrorState error={historyError} /> : auditLogs.length ? <AuditTimeline items={auditLogs} /> : <EmptyState message="No audit history found for the selected record." />
        ) : (
          <EmptyState message="Choose a normalized record to view its change history." />
        )}
      </section>
    </div>
  )
}