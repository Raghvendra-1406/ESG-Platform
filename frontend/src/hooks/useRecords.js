import { useState, useEffect, useCallback } from 'react'
import * as recordsService from '../services/recordsService'
import {
  getSourceType,
  getReportingPeriod,
  getUpdatedAt,
  getEmissionValue,
  getEmissionUnit,
} from '../utils/recordView'

const mapRecord = (record) => ({
  ...record,
  normalized_unit: record.normalized_unit ?? record.unit ?? '',
  source_type: getSourceType(record),
  reporting_period: getReportingPeriod(record),
  updated_at: getUpdatedAt(record),
  emission_value: getEmissionValue(record),
  emission_unit: getEmissionUnit(record),
  suspicious_flag: Boolean(
    record.suspicious_flag ?? record.raw_record_suspicious_flag ?? record.raw_record__suspicious_flag ?? false
  ),
})

export default function useRecords(initialFilters = {}) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const initialFiltersKey = JSON.stringify(initialFilters)

  useEffect(() => {
    setFilters(initialFilters)
  }, [initialFiltersKey])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await recordsService.fetchNormalizedRecords(filters)
      setRecords(Array.isArray(data) ? data.map(mapRecord) : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const handleRefresh = () => {
      load()
    }

    window.addEventListener('records:refresh', handleRefresh)
    return () => window.removeEventListener('records:refresh', handleRefresh)
  }, [load])

  return { records, loading, error, filters, setFilters, reload: load, setRecords }
}
