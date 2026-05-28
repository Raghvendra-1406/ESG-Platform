import React, { useMemo, useState } from 'react'

import useRecords from '../../hooks/useRecords'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getEmissionValue, getEmissionUnit, getReportingPeriod, getSourceType } from '../../utils/recordView'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import NotesModal from '../../components/common/NotesModal'
import FilterPanel from '../../components/common/FilterPanel'
import { reviewRecord } from '../../services/recordsService'

const CURRENT_YEAR = String(new Date().getFullYear())
const monthOptions = [
  ['', 'All months'],
  ['1', 'Jan'],
  ['2', 'Feb'],
  ['3', 'Mar'],
  ['4', 'Apr'],
  ['5', 'May'],
  ['6', 'Jun'],
  ['7', 'Jul'],
  ['8', 'Aug'],
  ['9', 'Sep'],
  ['10', 'Oct'],
  ['11', 'Nov'],
  ['12', 'Dec'],
]

export default function SuspiciousRecordsPage() {
  const [draftFilters, setDraftFilters] = useState({ year: CURRENT_YEAR, month: '' })
  const [appliedFilters, setAppliedFilters] = useState({ suspicious_only: true, year: CURRENT_YEAR, month: '' })
  const { records, loading, error, reload } = useRecords(appliedFilters)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const suspiciousRecords = useMemo(
    () => [...records]
      .sort((left, right) => Number(left.id || 0) - Number(right.id || 0))
      .filter((record) => record.suspicious_flag || record.quality_score === 'LOW' || record.normalization_status === 'FAILED'),
    [records]
  )

  const metrics = useMemo(
    () => ({
      suspicious: suspiciousRecords.length,
      warnings: suspiciousRecords.filter((record) => record.validation_status === 'WARNING').length,
      failed: suspiciousRecords.filter((record) => record.normalization_status === 'FAILED' || record.validation_status === 'FAILED').length,
      lowQuality: suspiciousRecords.filter((record) => record.quality_score === 'LOW').length,
    }),
    [suspiciousRecords]
  )

  const handleSubmit = async (reason) => {
    if (!selectedRecord) return
    setSaving(true)
    setMessage('')
    try {
      await reviewRecord(selectedRecord.id, {
        review_status: selectedRecord.review_status || 'PENDING',
        analyst_notes: selectedRecord.analyst_notes || '',
        reason_for_change: reason,
      })
      setSelectedRecord(null)
      setMessage('Record updated successfully.')
      await reload()
    } catch (err) {
      setMessage(err?.response?.data?.detail || err?.response?.data?.error || 'Could not update record.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Analyst exceptions</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Suspicious and failed rows</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Review low-quality records, add a reason for any correction, and resubmit them back into the workflow.
          </p>
        </div>
      </section>

      <FilterPanel
        onApply={() => setAppliedFilters({ suspicious_only: true, year: draftFilters.year, month: draftFilters.month })}
        onReset={() => {
          const resetFilters = { year: CURRENT_YEAR, month: '' }
          setDraftFilters(resetFilters)
          setAppliedFilters({ suspicious_only: true, ...resetFilters })
        }}
      >
        <select
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          value={draftFilters.year}
          onChange={(event) => setDraftFilters((current) => ({ ...current, year: event.target.value }))}
        >
          {Array.from({ length: 4 }, (_, index) => String(Number(CURRENT_YEAR) - 2 + index)).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          value={draftFilters.month}
          onChange={(event) => setDraftFilters((current) => ({ ...current, month: event.target.value }))}
        >
          {monthOptions.map(([monthValue, label]) => (
            <option key={label} value={monthValue}>{label}</option>
          ))}
        </select>
      </FilterPanel>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Suspicious" value={metrics.suspicious} note="Rows flagged for investigation" tone="amber" />
        <StatsCard label="Warnings" value={metrics.warnings} note="Missing values or parsing issues" tone="blue" />
        <StatsCard label="Failed" value={metrics.failed} note="Normalization did not complete" tone="rose" />
        <StatsCard label="Low quality" value={metrics.lowQuality} note="Rows requiring attention" tone="slate" />
      </section>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{message}</div> : null}

      {suspiciousRecords.length ? (
        <DataTable
          columns={[
            { key: 'id', label: 'Record ID' },
            { key: 'source_type', label: 'Source' },
            { key: 'value', label: 'Emission value', className: 'text-right' },
            { key: 'unit', label: 'Unit' },
            { key: 'status', label: 'Status' },
            { key: 'reason', label: 'Suspicious reason' },
            { key: 'period', label: 'Reporting period' },
            { key: 'updated', label: 'Updated' },
            { key: 'actions', label: 'Actions' },
          ]}
          data={suspiciousRecords}
          renderRow={(record) => (
            <tr key={record.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
              <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(getEmissionValue(record))}</td>
              <td className="px-4 py-3 text-slate-700">{getEmissionUnit(record)}</td>
              <td className="px-4 py-3 text-slate-700">{record.normalization_status || record.validation_status || 'WARNING'}</td>
              <td className="px-4 py-3 text-slate-700">{record.suspicious_reason || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{getReportingPeriod(record)}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => setSelectedRecord(record)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Edit note
                </button>
              </td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message="No suspicious records found for the current tenant." />
      )}

      <NotesModal
        open={Boolean(selectedRecord)}
        title="Add reason for correction"
        noteLabel="Reason for change"
        notePlaceholder="Explain why this row is being corrected"
        loading={saving}
        onCancel={() => setSelectedRecord(null)}
        onSubmit={handleSubmit}
      />

    </div>
  )
}