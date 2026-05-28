import React from 'react'

import UploadForm from '../../components/upload/UploadForm'

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Analyst upload</div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Upload ESG source files</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Upload SAP, Utility, and Travel files into the current tenant and reporting batch. The backend stages them as raw data first, then normalizes the batch when all three sources are present.
        </p>
      </section>
      <UploadForm />
    </div>
  )
}