const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function buildRecordMetrics(records = []) {
  const totals = records.reduce(
    (accumulator, record) => {
      const reviewStatus = record.review_status || 'PENDING'
      const workflowStatus = record.workflow_status || reviewStatus
      const scope = record.scope || 'UNKNOWN'
      const quality = record.quality_score || 'MEDIUM'

      accumulator.total += 1
      accumulator.byReview[reviewStatus] = (accumulator.byReview[reviewStatus] || 0) + 1
      accumulator.byWorkflow[workflowStatus] = (accumulator.byWorkflow[workflowStatus] || 0) + 1
      accumulator.byScope[scope] = (accumulator.byScope[scope] || 0) + 1
      accumulator.byQuality[quality] = (accumulator.byQuality[quality] || 0) + 1
      accumulator.emissions += toNumber(record.estimated_emissions)
      accumulator.uploadsBySource[record.source_type || record.raw_record__data_source__source_type || 'UNKNOWN'] =
        (accumulator.uploadsBySource[record.source_type || record.raw_record__data_source__source_type || 'UNKNOWN'] || 0) + 1

      if (record.suspicious_flag) {
        accumulator.suspicious += 1
      }

      if (record.normalization_status === 'FAILED' || record.validation_status === 'FAILED') {
        accumulator.failed += 1
      }

      if (record.validation_status === 'WARNING' || record.data_quality_flag === 'MISSING_VALUES') {
        accumulator.warning += 1
      }

      if (reviewStatus === 'PENDING') {
        accumulator.pendingReviews += 1
      }

      return accumulator
    },
    {
      total: 0,
      suspicious: 0,
      failed: 0,
      warning: 0,
      pendingReviews: 0,
      emissions: 0,
      byReview: {},
      byWorkflow: {},
      byScope: {},
      byQuality: {},
      uploadsBySource: {},
    }
  )

  return {
    totals,
    scopeData: Object.entries(totals.byScope).map(([name, value]) => ({ name, value })),
    qualityData: Object.entries(totals.byQuality).map(([name, value]) => ({ name, value })),
    workflowData: Object.entries(totals.byWorkflow).map(([name, value]) => ({ name, value })),
    sourceData: Object.entries(totals.uploadsBySource).map(([name, value]) => ({ name, value })),
  }
}

export function buildAuditMetrics(auditLogs = []) {
  return auditLogs.reduce(
    (accumulator, entry) => {
      accumulator.total += 1
      accumulator.byAction[entry.action_type || entry.action || 'UPDATE'] =
        (accumulator.byAction[entry.action_type || entry.action || 'UPDATE'] || 0) + 1
      return accumulator
    },
    { total: 0, byAction: {} }
  )
}
