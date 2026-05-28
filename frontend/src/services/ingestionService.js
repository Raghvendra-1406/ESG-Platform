import api from '../api/axios'

export async function uploadDataSource(file, sourceType, tenantId, reportingPeriod) {
  const form = new FormData()
  form.append('uploaded_file', file)
  form.append('source_type', sourceType)

  if (tenantId) {
    form.append('tenant', tenantId)
  }

  if (reportingPeriod) {
    form.append('reporting_period', reportingPeriod)
  }

  const res = await api.post('/api/ingestion/upload/', form)
  return res.data
}

export async function fetchUploadBatchStatus(tenantId, reportingPeriod) {
  const params = new URLSearchParams()

  if (tenantId) {
    params.set('tenant', tenantId)
  }

  if (reportingPeriod) {
    params.set('reporting_period', reportingPeriod)
  }

  const query = params.toString()
  const res = await api.get(`/api/ingestion/status/${query ? `?${query}` : ''}`)
  return res.data
}

export async function normalizeUploadBatch(tenantId, reportingPeriod) {
  const payload = {}

  if (tenantId) {
    payload.tenant = tenantId
  }

  if (reportingPeriod) {
    payload.reporting_period = reportingPeriod
  }

  const res = await api.post('/api/ingestion/normalize/', payload)
  return res.data
}
