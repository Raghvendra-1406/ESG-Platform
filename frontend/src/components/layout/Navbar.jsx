import React from 'react'
import { Link } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'
import { getRoleLabel, getUserTenantName } from '../../utils/roleUtils'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Enterprise ESG</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">Workflow, audit, and review operations</div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">{getUserTenantName(user)}</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">{getRoleLabel(user)}</span>
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
