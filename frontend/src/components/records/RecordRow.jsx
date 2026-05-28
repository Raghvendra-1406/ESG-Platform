import React, { useState } from 'react'
import StatusBadge from './StatusBadge'
import ReviewModal from './ReviewModal'

export default function RecordRow({ record, onUpdated }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr className={`${record.suspicious_flag ? 'bg-yellow-50' : ''}`}>
        <td className="px-4 py-2">{record.category}</td>
        <td className="px-4 py-2">{record.scope}</td>
        <td className="px-4 py-2 text-right">{record.normalized_quantity}</td>
        <td className="px-4 py-2">{record.normalized_unit}</td>
        <td className="px-4 py-2"><StatusBadge status={record.review_status} /></td>
        <td className="px-4 py-2 text-center">{record.suspicious_flag ? 'Yes' : 'No'}</td>
        <td className="px-4 py-2 text-center">{record.is_locked ? 'Locked' : 'Open'}</td>
        <td className="px-4 py-2">
          <button onClick={() => setOpen(true)} className="text-sm text-blue-600">Review</button>
        </td>
      </tr>

      {open && (
        <ReviewModal record={record} onClose={() => setOpen(false)} onUpdated={onUpdated} />
      )}
    </>
  )
}
