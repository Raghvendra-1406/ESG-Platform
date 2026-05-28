import React, { useEffect, useMemo, useState } from 'react'

import { createCompany, fetchCompanies } from '../../services/adminService'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import AdminFormModal from '../../components/common/AdminFormModal'
import { useToast } from '../../context/ToastContext'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', company_identifier: '', industry: '' })
  const toast = useToast()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const data = await fetchCompanies()
        if (mounted) setCompanies(Array.isArray(data) ? data : data.results || [])
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

  const sortedCompanies = useMemo(
    () => [...companies].sort((left, right) => Number(left.id || 0) - Number(right.id || 0)),
    [companies]
  )

  const stats = useMemo(() => ({ total: companies.length, active: companies.length }), [companies])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const created = await createCompany(form)
      setCompanies((current) => [...current, created].sort((left, right) => Number(left.id || 0) - Number(right.id || 0)))
      setCreateOpen(false)
      setForm({ name: '', company_identifier: '', industry: '' })
      toast?.pushToast?.({ type: 'success', title: 'Tenant created', message: 'Company was added to the platform.' })
    } catch (nextError) {
      toast?.pushToast?.({ type: 'error', title: 'Tenant creation failed', message: nextError?.response?.data?.detail || nextError?.response?.data?.name || 'Could not create tenant.' })
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Companies</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Tenant administration</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Manage company records and onboarding metadata. This view never includes ESG operational data.
          </p>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
            Create Tenant
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Tenants" value={stats.total} note="Company records" tone="blue" />
        <StatsCard label="Active tenants" value={stats.active} note="Available organizations" tone="emerald" />
      </section>

      {sortedCompanies.length ? (
        <DataTable
          columns={[
            { key: 'id', label: 'Tenant ID' },
            { key: 'company_identifier', label: 'Identifier' },
            { key: 'name', label: 'Name' },
            { key: 'industry', label: 'Industry' },
            { key: 'created_at', label: 'Created' },
          ]}
          data={sortedCompanies}
          renderRow={(company) => (
            <tr key={company.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{company.id}</td>
              <td className="px-4 py-3 text-slate-700">{company.company_identifier || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{company.name}</td>
              <td className="px-4 py-3 text-slate-700">{company.industry || '—'}</td>
              <td className="px-4 py-3 text-slate-500">{company.created_at || '—'}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message="No companies returned by the admin API yet." />
      )}

      <AdminFormModal
        open={createOpen}
        title="Create tenant"
        description="Create a new company record for platform administration."
        confirmLabel="Create tenant"
        loading={creating}
        onCancel={() => setCreateOpen(false)}
        onConfirm={handleCreate}
      >
        <label className="block text-sm font-medium text-slate-700">
          Company Name
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Company Identifier
          <input value={form.company_identifier} onChange={(event) => setForm((current) => ({ ...current, company_identifier: event.target.value }))} placeholder="Optional internal identifier" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Industry
          <input value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
      </AdminFormModal>
    </div>
  )
}