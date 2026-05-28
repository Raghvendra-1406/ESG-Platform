import React, { useEffect, useMemo, useState } from 'react'

import useRecords from '../../hooks/useRecords'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getEmissionValue, getEmissionUnit, getReportingPeriod, getSourceType } from '../../utils/recordView'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import RecordFilters from '../../components/records/RecordFilters'
import WorkflowStatusModal from '../../components/records/WorkflowStatusModal'

const PAGE_SIZE = 10
const CURRENT_YEAR = String(new Date().getFullYear())

const defaultFilters = {
  search: '',
  date: '',
  source_type: '',
  workflow_status: '',
  quality_score: '',
  scope: '',
  year: CURRENT_YEAR,
  month: '',
  suspicious_only: false,
}

export default function RecordsPage() {
  const [draftFilters, setDraftFilters] = useState(defaultFilters)
  const [appliedQuery, setAppliedQuery] = useState({ ...defaultFilters, sort_by: 'id', sort_direction: 'asc' })
  const [sortKey, setSortKey] = useState('id')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)

  const { records, loading, error, reload } = useRecords(appliedQuery)

  const applyQuery = (nextFilters = draftFilters, nextSortKey = sortKey, nextSortDirection = sortDirection) => {
    setPage(1)
    setAppliedQuery({
      ...nextFilters,
      year: nextFilters.year || CURRENT_YEAR,
      sort_by: nextSortKey,
      sort_direction: nextSortDirection,
    })
  }

  useEffect(() => {
    setPage(1)
  }, [appliedQuery])

  const pageItems = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))

  const metrics = useMemo(
    () => ({
      total: records.length,
      suspicious: records.filter((record) => record.suspicious_flag).length,
      lowQuality: records.filter((record) => record.quality_score === 'LOW').length,
      locked: records.filter((record) => record.workflow_status === 'LOCKED').length,
    }),
    [records]
  )

  const handleRecordUpdated = async () => {
    await reload()
    setSelectedRecord(null)
  }

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Analyst records</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Tenant record review</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Browse normalized ESG records, search across the current tenant, and focus on suspicious or low-quality rows that need a correction reason.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Records" value={metrics.total} note="Tenant-scoped normalized rows" />
        <StatsCard label="Suspicious" value={metrics.suspicious} note="Rows that need investigation" tone="amber" />
        <StatsCard label="Low quality" value={metrics.lowQuality} note="Warnings or failed validations" tone="rose" />
        <StatsCard label="Locked" value={metrics.locked} note="Finalized and immutable" tone="emerald" />
      </section>

      <RecordFilters
        value={draftFilters}
        onChange={(nextFilters) => {
          setDraftFilters(nextFilters)
        }}
        onApply={() => applyQuery()}
        onReset={() => {
          setDraftFilters(defaultFilters)
          setAppliedQuery({ ...defaultFilters, sort_by: 'id', sort_direction: 'asc' })
          setSortKey('id')
          setSortDirection('asc')
          setPage(1)
        }}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Records table</h2>
            <p className="text-sm text-slate-500">Use the table for operational review and tenant-safe filtering.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-slate-500">Sort by</label>
            <select
              value={sortKey}
              onChange={(event) => {
                const nextSortKey = event.target.value
                setSortKey(nextSortKey)
                applyQuery(draftFilters, nextSortKey, sortDirection)
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <option value="id">Record ID</option>
              <option value="updated_at">Updated</option>
              <option value="created_at">Created</option>
              <option value="reporting_period">Reporting period</option>
              <option value="source_type">Source type</option>
              <option value="quality_score">Quality</option>
              <option value="workflow_status">Workflow</option>
              <option value="scope">Scope</option>
              <option value="emission_value">Emissions</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const nextSortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
                setSortDirection(nextSortDirection)
                applyQuery(draftFilters, sortKey, nextSortDirection)
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </div>

        {pageItems.length ? (
          <>
            <DataTable
              columns={[
                { key: 'id', label: 'Record ID' },
                { key: 'source_type', label: 'Source type' },
                { key: 'emission_value', label: 'Emission value', className: 'text-right' },
                { key: 'unit', label: 'Unit' },
                { key: 'workflow', label: 'Workflow status' },
                { key: 'quality', label: 'Quality score' },
                { key: 'suspicious', label: 'Suspicious' },
                { key: 'period', label: 'Reporting period' },
                { key: 'updated', label: 'Updated' },
                { key: 'actions', label: 'Actions' },
              ]}
              data={pageItems}
              renderRow={(record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
                  <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(getEmissionValue(record))}</td>
                  <td className="px-4 py-3 text-slate-700">{getEmissionUnit(record)}</td>
                  <td className="px-4 py-3 text-slate-700">{record.workflow_status || record.review_status || 'PENDING'}</td>
                  <td className="px-4 py-3 text-slate-700">{record.quality_score || 'MEDIUM'}</td>
                  <td className="px-4 py-3 text-slate-700">{record.suspicious_flag ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-slate-700">{getReportingPeriod(record)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit workflow status
                    </button>
                  </td>
                </tr>
              )}
            />

            <div className="flex flex-col gap-3 border-t border-slate-100 px-2 py-4 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-500">
                Showing {pageItems.length} of {records.length} records
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Previous</button>
                <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                  {page} / {totalPages}
                </span>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState message="No records matched the current filters." />
        )}
      </div>

      {selectedRecord ? (
        <WorkflowStatusModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onUpdated={handleRecordUpdated}
        />
      ) : null}
    </div>
  )
}