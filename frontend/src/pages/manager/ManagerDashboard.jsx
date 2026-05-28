import React, { useMemo } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

import useRecords from '../../hooks/useRecords'
import { buildRecordMetrics } from '../../utils/dashboardMetrics'
import StatsCard from '../../components/common/StatsCard'
import ChartCard from '../../components/common/ChartCard'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import { Link } from 'react-router-dom'

const COLORS = ['#0f172a', '#475569', '#64748b', '#94a3b8']

export default function ManagerDashboard() {
  const { records, loading, error } = useRecords({})
  const metrics = useMemo(() => buildRecordMetrics(records), [records])
  const reviewQueue = records.filter((record) => record.review_status === 'PENDING' || record.workflow_status === 'UNDER_REVIEW')

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Manager dashboard</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Approval and locking operations</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review analyst changes, approve or reject records, and lock finalized data. The backend keeps the workflow and audit trail tenant-safe.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/manager/review" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Review queue</Link>
            <Link to="/manager/approvals" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Approval history</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Pending approvals" value={metrics.totals.pendingReviews} note="Requires manager decision" tone="blue" />
        <StatsCard label="Rejected records" value={metrics.totals.byReview.REJECTED || 0} note="Sent back to analysts" tone="rose" />
        <StatsCard label="Locked records" value={metrics.totals.byWorkflow.LOCKED || 0} note="Finalized and immutable" tone="emerald" />
        <StatsCard label="Analyst activity" value={metrics.totals.byReview.APPROVED || 0} note="Records cleared by review" tone="slate" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Review status" subtitle="Tenant workflow distribution">
          {metrics.workflowData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.workflowData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={4}>
                    {metrics.workflowData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No workflow data available yet." />
          )}
        </ChartCard>

        <ChartCard title="Scope mix" subtitle="Scope distribution for approved review queues">
          {metrics.scopeData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.scopeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No scope data available yet." />
          )}
        </ChartCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Review queue preview</h2>
            <p className="text-sm text-slate-500">Records waiting for manager attention.</p>
          </div>
          <Link to="/manager/review" className="text-sm font-medium text-slate-700 hover:text-slate-950">Open queue</Link>
        </div>

        {reviewQueue.length ? (
          <div className="space-y-3">
            {reviewQueue.slice(0, 5).map((record) => (
              <div key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold text-slate-950">Record #{record.id}</div>
                    <div className="text-slate-600">{record.category} • {record.scope} • {record.quality_score || 'MEDIUM'}</div>
                  </div>
                  <div className="text-slate-600">{record.suspicious_reason || 'Awaiting review'}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No records are currently awaiting review." />
        )}
      </section>
    </div>
  )
}