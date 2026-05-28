import React, { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

import { fetchAuditTrail } from '../../services/auditService'
import useRecords from '../../hooks/useRecords'
import { buildAuditMetrics, buildRecordMetrics } from '../../utils/dashboardMetrics'
import StatsCard from '../../components/common/StatsCard'
import ChartCard from '../../components/common/ChartCard'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import { Link } from 'react-router-dom'

const COLORS = ['#0f172a', '#475569', '#64748b', '#94a3b8']

export default function AuditorDashboard() {
  const { records, loading: recordsLoading, error: recordsError } = useRecords({})
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [auditError, setAuditError] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await fetchAuditTrail({})
        if (mounted) setAuditLogs(Array.isArray(data) ? data : [])
      } catch (error) {
        if (mounted) setAuditError(error)
      } finally {
        if (mounted) setAuditLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const recordMetrics = useMemo(() => buildRecordMetrics(records), [records])
  const auditMetrics = useMemo(() => buildAuditMetrics(auditLogs), [auditLogs])

  if (recordsLoading || auditLoading) return <Loader />
  if (recordsError) return <ErrorState error={recordsError} />
  if (auditError) return <ErrorState error={auditError} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Auditor dashboard</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Governance and traceability review</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Inspect audit activity, locked records, and workflow controls without modifying company data.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/auditor/audit-trail" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Audit trail</Link>
            <Link to="/auditor/locked-records" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Locked records</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Audit events" value={auditMetrics.total} note="Field-level traceability entries" tone="blue" />
        <StatsCard label="Suspicious modifications" value={recordMetrics.totals.suspicious} note="Requires extra review" tone="amber" />
        <StatsCard label="Locked records" value={recordMetrics.totals.byWorkflow.LOCKED || 0} note="Immutable evidence set" tone="emerald" />
        <StatsCard label="Governance actions" value={auditMetrics.byAction.CREATE || 0} note="Creates and workflow changes" tone="slate" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Audit actions" subtitle="What changed in the tenant">
          {Object.keys(auditMetrics.byAction).length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={Object.entries(auditMetrics.byAction).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {Object.entries(auditMetrics.byAction).map((entry, index) => (
                      <Cell key={entry[0]} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No audit events available yet." />
          )}
        </ChartCard>

        <ChartCard title="Locked vs open" subtitle="Current compliance posture">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Locked', value: recordMetrics.totals.byWorkflow.LOCKED || 0 },
                { name: 'Open', value: Math.max(recordMetrics.totals.total - (recordMetrics.totals.byWorkflow.LOCKED || 0), 0) },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>
    </div>
  )
}