import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts'

import useRecords from '../../hooks/useRecords'
import { buildRecordMetrics } from '../../utils/dashboardMetrics'
import { formatDate, formatQuantity } from '../../utils/formatters'
import { getSourceType } from '../../utils/recordView'
import Loader from '../../components/common/Loader'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import StatsCard from '../../components/common/StatsCard'
import ChartCard from '../../components/common/ChartCard'
import DataTable from '../../components/common/DataTable'
import { Link } from 'react-router-dom'

const COLORS = ['#0f172a', '#475569', '#64748b', '#94a3b8', '#cbd5e1']

export default function AnalystDashboard() {
  const stableFilters = useMemo(() => ({}), [])
  const { records, loading, error, reload } = useRecords(stableFilters)

  const metrics = useMemo(() => buildRecordMetrics(records), [records])

  const recentRecords = useMemo(() => [...records].sort((left, right) => Number(left.id || 0) - Number(right.id || 0)).slice(0, 5), [records])
  const currentBatchPeriod = records[0]?.reporting_period || 'Latest complete batch'

  const scopeSeries = metrics.scopeData.length ? metrics.scopeData : []
  const qualitySeries = metrics.qualityData.length ? metrics.qualityData : []
  const uploadSeries = metrics.sourceData.length ? metrics.sourceData : []

  const trendSeries = useMemo(() => {
    const grouped = records.reduce((accumulator, record) => {
      const key = formatDate(record.updated_at || record.created_at || record.timestamp)
      if (!key) return accumulator
      accumulator[key] = (accumulator[key] || 0) + 1
      return accumulator
    }, {})

    return Object.entries(grouped)
      .slice(-7)
      .map(([name, value]) => ({ name, value }))
  }, [records])

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Analyst dashboard</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Operational ESG intake and review</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Upload source files, inspect normalization results, and resolve suspicious rows before auditor review. All records remain tenant-scoped.
            </p>
            <div className="mt-4 inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              Current batch: <span className="ml-2 font-semibold text-slate-950">{currentBatchPeriod}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/analyst/upload" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Upload files</Link>
            <Link to="/analyst/records" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">Open records</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total records" value={metrics.totals.total} note="From the current tenant" />
        <StatsCard label="Pending reviews" value={metrics.totals.pendingReviews} note="Awaiting analyst or auditor action" tone="blue" />
        <StatsCard label="Suspicious rows" value={metrics.totals.suspicious} note="Require explanation or correction" tone="amber" />
        <StatsCard label="Estimated emissions" value={formatQuantity(metrics.totals.emissions)} note="Simple backend-aligned estimate" tone="emerald" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Scope distribution" subtitle="Tenant-normalized records by ESG scope">
          {scopeSeries.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={scopeSeries} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                    {scopeSeries.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No scope data available yet." />
          )}
        </ChartCard>

        <ChartCard title="Quality score" subtitle="How the current tenant’s records are distributed by quality">
          {qualitySeries.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qualitySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No quality score data available yet." />
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <ChartCard title="Upload activity" subtitle="Recent record creation trend">
          {trendSeries.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No recent activity available yet." />
          )}
        </ChartCard>

        <ChartCard title="Recent uploads" subtitle="Latest tenant records by source type">
          {uploadSeries.length ? (
            <div className="space-y-3">
              {uploadSeries.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <span className="font-medium text-slate-700">{entry.name}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">{entry.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No upload activity yet." />
          )}
        </ChartCard>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Recent records</h2>
            <p className="text-sm text-slate-500">Latest tenant records surfaced for quick analyst review.</p>
          </div>
          <Link to="/analyst/records" className="text-sm font-medium text-slate-700 hover:text-slate-950">View all</Link>
        </div>

        <DataTable
          columns={[
            { key: 'id', label: 'Record ID' },
            { key: 'source_type', label: 'Source' },
            { key: 'scope', label: 'Scope' },
            { key: 'emission', label: 'Emissions', className: 'text-right' },
            { key: 'quality', label: 'Quality' },
            { key: 'status', label: 'Workflow' },
            { key: 'timestamp', label: 'Updated' },
          ]}
          data={recentRecords}
          emptyState="No records available yet."
          renderRow={(record) => (
            <tr key={record.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{record.id}</td>
              <td className="px-4 py-3 text-slate-700">{getSourceType(record)}</td>
              <td className="px-4 py-3 text-slate-700">{record.scope}</td>
              <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(record.emission_value)} {record.emission_unit}</td>
              <td className="px-4 py-3 text-slate-700">{record.quality_score || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{record.workflow_status || record.review_status || 'PENDING'}</td>
              <td className="px-4 py-3 text-slate-500">{formatDate(record.updated_at)}</td>
            </tr>
          )}
        />
      </section>
    </div>
  )
}