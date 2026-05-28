import React, { useEffect, useMemo, useState } from 'react'
import { fetchUploadBatchStatus, normalizeUploadBatch, uploadDataSource } from '../../services/ingestionService'
import UploadSummaryModal from '../common/UploadSummaryModal'
import useToast from '../../hooks/useToast'
import useAuth from '../../hooks/useAuth'

const getErrorMessage = (err) => {
  const data = err?.response?.data
  if (!data) return 'Upload failed'
  if (typeof data === 'string') return data
  if (data.detail) return data.detail

  const firstKey = Object.keys(data)[0]
  if (!firstKey) return 'Upload failed'

  const value = data[firstKey]
  if (Array.isArray(value)) return value[0]
  return String(value)
}

export default function UploadForm() {
  const toast = useToast()
  const { user } = useAuth()
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' })
  const [file, setFile] = useState(null)
  const [sourceType, setSourceType] = useState('SAP')
  const [reportingYear, setReportingYear] = useState(String(new Date().getFullYear()))
  const [reportingMonth, setReportingMonth] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [normalizing, setNormalizing] = useState(false)
  const [message, setMessage] = useState(null)
  const [summary, setSummary] = useState(null)
  const [batchStatus, setBatchStatus] = useState({ sources: [], can_normalize: false, reporting_period: '' })
  const [statusLoading, setStatusLoading] = useState(false)

  const tenantId = user?.tenant?.id || user?.tenant_profile?.tenant?.id
  const reportingPeriod = useMemo(
    () => [reportingMonth.trim() || currentMonthName, reportingYear.trim()].filter(Boolean).join(' '),
    [currentMonthName, reportingMonth, reportingYear]
  )

  const loadBatchStatus = async () => {
    if (!tenantId) return
    setStatusLoading(true)
    try {
      const data = await fetchUploadBatchStatus(tenantId, reportingPeriod)
      setBatchStatus({
        sources: Array.isArray(data?.sources) ? data.sources : [],
        can_normalize: Boolean(data?.can_normalize),
        reporting_period: data?.reporting_period || reportingPeriod || '—',
      })
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) })
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    loadBatchStatus()
  }, [tenantId, reportingPeriod])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setMessage({ type: 'error', text: 'Please select a CSV, XLS, or XLSX file.' })
    setLoading(true)
    setMessage(null)
    setSummary(null)
    try {
      if (!tenantId) {
        throw new Error('No tenant is associated with this analyst account.')
      }

      const response = await uploadDataSource(file, sourceType, tenantId, reportingPeriod)
      setSummary({
        sourceType,
        reportingPeriod: response?.reporting_period || reportingPeriod || '—',
        comments: comments || '—',
        normalized_records: response?.normalized_records ?? response?.normalized_records_count ?? response?.normalized_count ?? '-',
        failed_rows: response?.failed_rows ?? response?.failed_count ?? '-',
        suspicious_rows: response?.suspicious_rows ?? response?.suspicious_count ?? '-',
        quality_score: response?.quality_score ?? response?.quality ?? '-',
        status: response?.message || 'Upload processed',
      })
      setMessage({ type: 'success', text: 'File uploaded into the raw batch.' })
      toast?.pushToast?.({ type: 'success', title: 'Upload complete', message: 'The file was uploaded into the batch.' })
      await loadBatchStatus()
      setFile(null)
      setComments('')
      e.target.reset()
    } catch (err) {
      const errorMessage = err instanceof Error && !err.response ? err.message : getErrorMessage(err)
      setMessage({ type: 'error', text: errorMessage })
      toast?.pushToast?.({ type: 'error', title: 'Upload failed', message: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleNormalize = async () => {
    if (!tenantId) {
      setMessage({ type: 'error', text: 'No tenant is associated with this analyst account.' })
      return
    }
    setNormalizing(true)
    setMessage(null)
    try {
      const response = await normalizeUploadBatch(tenantId, reportingPeriod)
      setSummary({
        reportingPeriod: response?.reporting_period || reportingPeriod || '—',
        normalized_records: response?.normalized_records ?? '-',
        failed_rows: response?.failed_rows ?? '-',
        suspicious_rows: response?.suspicious_rows ?? '-',
        quality_score: response?.quality_score ?? '-',
        status: response?.message || 'Normalization completed',
      })
      setMessage({ type: 'success', text: 'Batch normalized successfully.' })
      toast?.pushToast?.({ type: 'success', title: 'Normalization complete', message: 'The complete batch was normalized.' })
      window.dispatchEvent(new CustomEvent('records:refresh'))
      await loadBatchStatus()
    } catch (err) {
      const errorMessage = err instanceof Error && !err.response ? err.message : getErrorMessage(err)
      setMessage({ type: 'error', text: errorMessage })
      toast?.pushToast?.({ type: 'error', title: 'Normalization failed', message: errorMessage })
    } finally {
      setNormalizing(false)
    }
  }

  const sourceCards = ['SAP', 'UTILITY', 'TRAVEL'].map((sourceTypeName) => {
    const source = batchStatus.sources.find((item) => item.source_type === sourceTypeName) || { status: 'PENDING', rows_uploaded: 0, file_name: null, uploaded_at: null }
    return { ...source, source_type: sourceTypeName }
  })

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Uploaded sources</div>
            <div className="mt-2 text-sm text-slate-300">Current reporting period: {batchStatus.reporting_period || reportingPeriod || '—'}</div>
          </div>
          <button
            type="button"
            onClick={handleNormalize}
            disabled={!batchStatus.can_normalize || normalizing || loading || statusLoading}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {normalizing ? 'Normalizing...' : 'Normalize Data'}
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {sourceCards.map((source) => (
            <div key={source.source_type} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{source.source_type}</div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white ring-1 ring-inset ring-white/15">
                  {source.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-300">
                <div>File: {source.file_name || 'Not uploaded'}</div>
                <div>Rows: {source.rows_uploaded ?? 0}</div>
                <div>Uploaded: {source.uploaded_at ? new Date(source.uploaded_at).toLocaleString() : '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700">Source Type</label>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option value="SAP">SAP</option>
            <option value="UTILITY">UTILITY</option>
            <option value="TRAVEL">TRAVEL</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700">Reporting year</label>
            <input value={reportingYear} onChange={(e) => setReportingYear(e.target.value)} placeholder="2026" className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700">Reporting month</label>
            <input value={reportingMonth} onChange={(e) => setReportingMonth(e.target.value)} placeholder="May" className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-700">Notes / comments</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3} placeholder="Optional context for the upload" className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700">File</label>
          <input type="file" accept=".csv,.xls,.xlsx" onChange={(e) => setFile(e.target.files[0])} className="mt-1 block w-full text-sm text-slate-600" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" disabled={loading || statusLoading}>
            {loading ? 'Uploading...' : 'Upload raw file'}
          </button>
          <div className="text-sm text-slate-500">
            Normalize stays disabled until SAP, Utility, and Travel are all uploaded for this batch.
          </div>
        </div>

        {message ? (
          <div className={`mt-4 text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{message.text}</div>
        ) : null}

        <UploadSummaryModal open={Boolean(summary)} summary={summary} onClose={() => setSummary(null)} />
      </form>
    </div>
  )
}
