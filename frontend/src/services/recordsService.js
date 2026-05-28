import api from '../api/axios'

const compactParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )

export const fetchNormalizedRecords = (params = {}) =>
  api.get('/api/records/normalized-records/', { params: compactParams(params) }).then((r) => r.data)

export const reviewRecord = (id, data) =>
  api.patch(`/api/records/normalized-records/${id}/review/`, data).then((r) => r.data)

export const updateRecordWorkflow = (id, data) =>
  api.patch(`/api/records/normalized-records/${id}/review/`, data).then((r) => r.data)

export const lockRecord = (id, data = {}) => api.patch(`/api/records/normalized-records/${id}/lock/`, data).then((r) => r.data)

export const fetchAuditTrail = (params = {}) => api.get('/api/audits/logs/', { params: compactParams(params) }).then((r) => r.data)
