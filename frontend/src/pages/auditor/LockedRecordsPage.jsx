import React, { useMemo } from 'react'

import useRecords from '../../hooks/useRecords'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getEmissionValue, getEmissionUnit, getReportingPeriod, getSourceType } from '../../utils/recordView'

export default function LockedRecordsPage() {
  const { records, loading, error } = useRecords({ workflow_status: 'LOCKED' })

  const lockedRecords = useMemo(
    () => [...records].sort((left, right) => Number(left.id || 0) - Number(right.id || 0)).filter((record) => record.workflow_status === 'LOCKED' || record.is_locked),
    [records]
  )

  const stats = useMemo(
    () => ({
      total: lockedRecords.length,
      approved: lockedRecords.filter((record) => record.review_status === 'APPROVED').length,
      highQuality: lockedRecords.filter((record) => record.quality_score === 'HIGH').length,
      suspicious: lockedRecords.filter((record) => record.suspicious_flag).length,
    }),
    [lockedRecords]
  )

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Locked records</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Read-only finalized records</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Locked records are immutable evidence items. Auditors can inspect them, but no one can modify them from the frontend.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Locked rows" value={stats.total} note="Finalized evidence" tone="slate" />
        <StatsCard label="Approved" value={stats.approved} note="Final sign-off complete" tone="emerald" />
        <StatsCard label="High quality" value={stats.highQuality} note="Best-quality final rows" tone="blue" />
        <StatsCard label="Suspicious" value={stats.suspicious} note="Still visible for audit" tone="amber" />
      </section>

      {lockedRecords.length ? (
        <DataTable
          columns={[
            { key: 'id', label: 'Record ID' },
            { key: 'source', label: 'Source' },
            { key: 'value', label: 'Emission', className: 'text-right' },
            { key: 'status', label: 'Workflow' },
            { key: 'quality', label: 'Quality' },
            { key: 'reason', label: 'Suspicious reason' },
            { key: 'period', label: 'Reporting period' },
            { key: 'updated', label: 'Updated' },
          ]}
          data={lockedRecords}
          renderRow={(record) => (
            <tr key={record.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
              <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(getEmissionValue(record))} {getEmissionUnit(record)}</td>
              <td className="px-4 py-3 text-slate-700">{record.workflow_status || 'LOCKED'}</td>
              <td className="px-4 py-3 text-slate-700">{record.quality_score || 'MEDIUM'}</td>
              <td className="px-4 py-3 text-slate-700">{record.suspicious_reason || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{getReportingPeriod(record)}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message="No locked records found for the current tenant." />
      )}
    </div>
  )
}