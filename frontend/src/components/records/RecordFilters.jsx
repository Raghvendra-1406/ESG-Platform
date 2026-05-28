import React from 'react'

import FilterPanel from '../common/FilterPanel'

const inputClass = 'rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 4 }, (_, index) => String(currentYear - 2 + index))
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

export default function RecordFilters({ value, onChange, onApply, onReset }) {
  const update = (key) => (event) => onChange({ ...value, [key]: event.target.value || undefined })

  return (
    <FilterPanel onApply={onApply} onReset={onReset}>
      <select className={inputClass} value={value.source_type || ''} onChange={update('source_type')}>
        <option value="">All sources</option>
        <option value="SAP">SAP</option>
        <option value="UTILITY">Utilities</option>
        <option value="TRAVEL">Travel</option>
      </select>
      <select className={inputClass} value={value.workflow_status || ''} onChange={update('workflow_status')}>
        <option value="">All workflow states</option>
        <option value="UPLOADED">Uploaded</option>
        <option value="VALIDATED">Validated</option>
        <option value="NORMALIZED">Normalized</option>
        <option value="UNDER_REVIEW">Under review</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="LOCKED">Locked</option>
      </select>
      <select className={inputClass} value={value.quality_score || ''} onChange={update('quality_score')}>
        <option value="">All quality scores</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
      <select className={inputClass} value={value.scope || ''} onChange={update('scope')}>
        <option value="">All scopes</option>
        <option value="SCOPE_1">Scope 1</option>
        <option value="SCOPE_2">Scope 2</option>
        <option value="SCOPE_3">Scope 3</option>
      </select>
      <select className={inputClass} value={value.year || String(currentYear)} onChange={update('year')}>
        {yearOptions.map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
      <select className={inputClass} value={value.month || ''} onChange={update('month')}>
        {monthOptions.map(([monthValue, label]) => (
          <option key={label} value={monthValue}>{label}</option>
        ))}
      </select>
      <input className={inputClass} value={value.search || ''} onChange={update('search')} placeholder="Search records" />
      <input className={inputClass} type="date" value={value.date || ''} onChange={update('date')} />
      <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input type="checkbox" checked={Boolean(value.suspicious_only)} onChange={(event) => onChange({ ...value, suspicious_only: event.target.checked || undefined })} />
        Suspicious only
      </label>
    </FilterPanel>
  )
}
