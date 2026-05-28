import React, { useMemo, useState } from 'react'

import useRecords from '../../hooks/useRecords'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getEmissionValue, getEmissionUnit, getReportingPeriod, getSourceType } from '../../utils/recordView'

export default function ApprovalsPage() {
  const { records, loading, error } = useRecords({})
  const [view, setView] = useState('APPROVED')

  const approvals = useMemo(
    () => records.filter((record) => record.review_status === 'APPROVED' || record.review_status === 'REJECTED' || record.workflow_status === 'LOCKED'),
    [records]
  )

  const filtered = approvals.filter((record) => (view === 'ALL' ? true : record.review_status === view || record.workflow_status === view))

  const stats = useMemo(
    () => ({
      approved: records.filter((record) => record.review_status === 'APPROVED').length,
      rejected: records.filter((record) => record.review_status === 'REJECTED').length,
      locked: records.filter((record) => record.workflow_status === 'LOCKED').length,
      total: approvals.length,
    }),
    [records, approvals.length]
  )

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Manager approval history</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Approved and rejected records</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Track approval decisions, lock status, and reasons without exposing cross-tenant data.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Approved" value={stats.approved} note="Signed off by managers" tone="emerald" />
        <StatsCard label="Rejected" value={stats.rejected} note="Returned for correction" tone="rose" />
        <StatsCard label="Locked" value={stats.locked} note="Finalized records" tone="slate" />
        <StatsCard label="History rows" value={stats.total} note="Visible audit-history subset" tone="blue" />
      </section>

      <div className="flex gap-2">
        {['APPROVED', 'REJECTED', 'LOCKED', 'ALL'].map((option) => (
          <button key={option} type="button" onClick={() => setView(option)} className={`rounded-full px-4 py-2 text-sm font-medium ${view === option ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
            {option}
          </button>
        ))}
      </div>

      {filtered.length ? (
        <DataTable
          columns={[
            { key: 'id', label: 'Record ID' },
            { key: 'source', label: 'Source' },
            { key: 'value', label: 'Emission', className: 'text-right' },
            { key: 'status', label: 'Decision' },
            { key: 'reason', label: 'Reason' },
            { key: 'period', label: 'Reporting period' },
            { key: 'timestamp', label: 'Decision timestamp' },
          ]}
          data={filtered}
          renderRow={(record) => (
            <tr key={record.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
              <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(getEmissionValue(record))} {getEmissionUnit(record)}</td>
              <td className="px-4 py-3 text-slate-700">{record.review_status || record.workflow_status}</td>
              <td className="px-4 py-3 text-slate-700">{record.analyst_notes || record.suspicious_reason || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{getReportingPeriod(record)}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message="No approval history in the selected view." />
      )}
    </div>
  )
}