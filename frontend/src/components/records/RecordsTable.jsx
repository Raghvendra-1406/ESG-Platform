import React from 'react'
import RecordRow from './RecordRow'
import Loader from '../common/Loader'
import EmptyState from '../common/EmptyState'
import ErrorState from '../common/ErrorState'

export default function RecordsTable({ records, loading, error, onUpdated }) {
  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />
  if (!records || records.length === 0) return <EmptyState message="No normalized records" />

  return (
    <div className="overflow-x-auto bg-white rounded shadow">
      <table className="min-w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2">Category</th>
            <th className="px-4 py-2">Scope</th>
            <th className="px-4 py-2 text-right">Quantity</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-center">Suspicious</th>
            <th className="px-4 py-2 text-center">Locked</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <RecordRow key={r.id} record={r} onUpdated={onUpdated} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
