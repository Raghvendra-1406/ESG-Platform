import React, { useEffect, useMemo, useState } from 'react'

import { createUser, fetchCompanies, fetchUsers } from '../../services/adminService'
import DataTable from '../../components/common/DataTable'
import Loader from '../../components/common/Loader'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import StatsCard from '../../components/common/StatsCard'
import AdminFormModal from '../../components/common/AdminFormModal'
import { ROLES } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

const sortByIdAscending = (items = []) => [...items].sort((left, right) => Number(left.id || 0) - Number(right.id || 0))

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: ROLES.ANALYST,
    tenant_id: '',
  })
  const toast = useToast()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [userData, companyData] = await Promise.all([fetchUsers(), fetchCompanies()])
        if (mounted) {
          setUsers(Array.isArray(userData) ? userData : userData.results || [])
          setCompanies(Array.isArray(companyData) ? companyData : companyData.results || [])
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

  const stats = useMemo(
    () => ({
      total: users.length,
      analysts: users.filter((user) => (user.role || user.tenant_profile?.role) === 'ANALYST').length,
      auditors: users.filter((user) => (user.role || user.tenant_profile?.role) === 'AUDITOR').length,
    }),
    [users]
  )

  const needsTenant = form.role !== ROLES.PLATFORM_ADMIN

  const resetForm = () => setForm({ full_name: '', username: '', email: '', password: '', role: ROLES.ANALYST, tenant_id: '' })

  const handleCreate = async () => {
    setCreating(true)
    try {
      const payload = {
        ...form,
        tenant_id: form.role === ROLES.PLATFORM_ADMIN ? null : form.tenant_id,
      }
      const created = await createUser(payload)
      setUsers((current) => [created, ...current])
      setCreateOpen(false)
      resetForm()
      toast?.pushToast?.({ type: 'success', title: 'User created', message: 'The user was added successfully.' })
    } catch (nextError) {
      toast?.pushToast?.({ type: 'error', title: 'User creation failed', message: nextError?.response?.data?.detail || nextError?.response?.data?.tenant_id || nextError?.response?.data?.role || 'Could not create user.' })
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <ErrorState error={error} />

  const sortedUsers = sortByIdAscending(users)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Users</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Company users and role assignment</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Bootstrap analysts and auditors for each tenant. User records remain separate from ESG operational data.
          </p>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
            Create User
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Users" value={stats.total} note="Company accounts" tone="blue" />
        <StatsCard label="Analysts" value={stats.analysts} note="Upload and correction access" tone="emerald" />
        <StatsCard label="Auditors" value={stats.auditors} note="Read-only audit access" tone="slate" />
      </section>

      {sortedUsers.length ? (
        <DataTable
          columns={[
            { key: 'id', label: 'User ID' },
            { key: 'username', label: 'Username' },
            { key: 'role', label: 'Role' },
            { key: 'tenant', label: 'Tenant' },
            { key: 'email', label: 'Email' },
          ]}
          data={sortedUsers}
          renderRow={(user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">#{user.id}</td>
              <td className="px-4 py-3 text-slate-700">{user.username || user.email || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{user.role || user.tenant_profile?.role || '—'}</td>
              <td className="px-4 py-3 text-slate-700">{user.tenant?.name || user.tenant_profile?.tenant?.name || '—'}</td>
              <td className="px-4 py-3 text-slate-500">{user.email || '—'}</td>
            </tr>
          )}
        />
      ) : (
        <EmptyState message="No users returned by the admin API yet." />
      )}

      <AdminFormModal
        open={createOpen}
        title="Create user"
        description="Create a tenant-bound company user."
        confirmLabel="Create user"
        loading={creating}
        onCancel={() => {
          setCreateOpen(false)
          resetForm()
        }}
        onConfirm={handleCreate}
      >
        <label className="block text-sm font-medium text-slate-700">
          Full Name
          <input value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Username
          <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Role
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value, tenant_id: event.target.value === ROLES.PLATFORM_ADMIN ? '' : current.tenant_id }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <option value={ROLES.ANALYST}>ANALYST</option>
            <option value={ROLES.AUDITOR}>AUDITOR</option>
          </select>
        </label>
        {needsTenant ? (
          <label className="block text-sm font-medium text-slate-700">
            Tenant
            <select value={form.tenant_id} onChange={(event) => setForm((current) => ({ ...current, tenant_id: event.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <option value="">Select tenant</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Tenant: — Platform admins are global users and do not belong to a tenant.</div>
        )}
      </AdminFormModal>
    </div>
  )
}