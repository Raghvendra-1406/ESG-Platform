import React, { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import { fetchCompanies, fetchUsers } from '../../services/adminService'
import StatsCard from '../../components/common/StatsCard'
import ChartCard from '../../components/common/ChartCard'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

export default function AdminDashboard() {
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [companyData, userData] = await Promise.all([fetchCompanies(), fetchUsers()])
        if (mounted) {
          setCompanies(Array.isArray(companyData) ? companyData : companyData.results || [])
          setUsers(Array.isArray(userData) ? userData : userData.results || [])
        }
      } catch (nextError) {
        if (mounted) setError(nextError)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const roleCounts = useMemo(() => {
    const counts = users.reduce(
      (accumulator, user) => {
        const role = user.role || user.tenant_profile?.role || 'UNKNOWN'
        if (role !== 'UNKNOWN') {
          accumulator[role] = (accumulator[role] || 0) + 1
        }
        return accumulator
      },
      { ANALYST: 0, AUDITOR: 0 }
    )

    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [users])

  const tenantCounts = useMemo(
    () =>
      companies.map((company) => ({
        name: company.name,
        value: users.filter((user) => user.tenant?.name === company.name || user.tenant_profile?.tenant?.name === company.name).length || 1,
      })),
    [companies, users]
  )

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Platform admin dashboard</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Tenant and user administration</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create companies, bootstrap users, and assign roles without exposing company ESG operational data.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Companies" value={companies.length} note="Tenant records only" tone="blue" />
        <StatsCard label="Users" value={users.length} note="Role-based accounts" tone="slate" />
        <StatsCard label="Active tenants" value={companies.length} note="Onboarded organizations" tone="emerald" />
        <StatsCard label="Operational ESG data" value="Restricted" note="Admin never sees company records" tone="amber" />
      </section>

      <ChartCard title="User distribution" subtitle="Company users by role">
        {roleCounts.some((entry) => entry.value > 0) ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No users were returned by the admin API yet." />
        )}
      </ChartCard>

      <ChartCard title="Tenants" subtitle="Tenant names and how many users each one has">
        {tenantCounts.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tenantCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No tenants were returned by the admin API yet." />
        )}
      </ChartCard>
    </div>
  )
}