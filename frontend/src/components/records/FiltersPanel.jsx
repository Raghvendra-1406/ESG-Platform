import React from 'react'

export default function FiltersPanel({ filters, setFilters }) {
  const onChange = (key) => (e) => setFilters({ ...filters, [key]: e.target.value || undefined })

  return (
    <div className="bg-white p-3 rounded shadow mb-4 flex items-center space-x-3">
      <select onChange={onChange('scope')} className="border rounded p-1">
        <option value="">All scopes</option>
        <option value="SCOPE_1">Scope 1</option>
        <option value="SCOPE_2">Scope 2</option>
        <option value="SCOPE_3">Scope 3</option>
      </select>

      <input placeholder="Category" onChange={onChange('category')} className="border rounded p-1" />

      <select onChange={onChange('review_status')} className="border rounded p-1">
        <option value="">All status</option>
        <option value="PENDING">PENDING</option>
        <option value="APPROVED">APPROVED</option>
        <option value="REJECTED">REJECTED</option>
      </select>

      <select onChange={onChange('suspicious')} className="border rounded p-1">
        <option value="">Suspicious</option>
        <option value="true">Only suspicious</option>
      </select>
    </div>
  )
}
