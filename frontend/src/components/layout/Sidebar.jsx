import React from 'react'
import { Link } from 'react-router-dom'

import RoleBasedMenu from './RoleBasedMenu'
import useAuth from '../../hooks/useAuth'
import { getRoleLabel, getUserTenantName } from '../../utils/roleUtils'

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur md:w-72 md:border-b-0 md:border-r">
      <div className="mb-6 flex items-center justify-between md:block">
        <Link to="/" className="block">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Breathe ESG</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">Operations Console</div>
        </Link>
      </div>

      <div className="mb-5 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-sm">
        <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Tenant</div>
        <div className="mt-1 text-sm font-semibold">{getUserTenantName(user)}</div>
        <div className="mt-1 text-xs text-slate-300">{getRoleLabel(user)}</div>
      </div>

      <RoleBasedMenu />
    </aside>
  )
}