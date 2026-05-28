import api from '../api/axios'

const compactParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))

export const fetchAuditLogs = (params = {}) =>
  api.get('/api/audits/logs/', { params: compactParams(params) }).then((response) => response.data)

export const fetchAuditTrail = fetchAuditLogs
