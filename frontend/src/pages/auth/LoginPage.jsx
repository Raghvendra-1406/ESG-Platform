import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AuthLayout from '../../layouts/AuthLayout'
import useAuth from '../../hooks/useAuth'
import ErrorMessage from '../../components/common/ErrorMessage'
import { getHomePath } from '../../utils/roleUtils'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const user = await signIn(form)
      const target = location.state?.from || getHomePath(user)
      navigate(target, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.15fr_0.85fr]">
        <div className="bg-slate-950 px-8 py-10 text-white lg:px-10 lg:py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Breathe ESG</div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Enterprise ESG operations</h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
            Sign in to access tenant-scoped ingestion, review, approval, and audit workflows. Roles are controlled by the backend and reflected in the dashboard shell.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            {[
              'Tenant isolation enforced by backend',
              'Analyst uploads only',
              'Auditor reviews and record locking',
              'Auditor read-only audit trail',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                {item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-10 lg:px-10 lg:py-12">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Sign in</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Access your workspace</h2>
          <p className="mt-2 text-sm text-slate-600">Use your company account. Your tenant and role are loaded from the backend session.</p>

          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Username or email</span>
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="analyst@company.com"
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="Password"
                autoComplete="current-password"
              />
            </label>
          </div>

          {error ? <div className="mt-4"><ErrorMessage>{error}</ErrorMessage></div> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Platform admin access is restricted to organization management only. Company users see tenant-scoped dashboards by role.
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}