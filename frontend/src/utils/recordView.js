const SOURCE_FROM_CATEGORY = {
  Fuel: 'SAP',
  Electricity: 'UTILITY',
  Travel: 'TRAVEL',
}

export function getSourceType(record) {
  return (
    record.source_type ||
    record.sourceType ||
    record.source ||
    record.raw_record__data_source__source_type ||
    SOURCE_FROM_CATEGORY[record.category] ||
    'UNKNOWN'
  )
}

export function getReportingPeriod(record) {
  return (
    record.reporting_period ||
    record.batch_reporting_period ||
    record.data_source_batch_reporting_period ||
    record.raw_record__data_source__batch__reporting_period ||
    '—'
  )
}

export function getUpdatedAt(record) {
  return record.updated_at || record.modified_at || record.updated || record.created_at || record.timestamp || null
}

export function getEmissionValue(record) {
  return record.estimated_emissions ?? record.emission_value ?? record.normalized_quantity ?? null
}

export function getEmissionUnit(record) {
  return record.emission_unit || 'kgCO2e'
}
