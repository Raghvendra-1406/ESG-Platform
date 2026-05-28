import React from 'react'
import { NavLink } from 'react-router-dom'

import useAuth from '../../hooks/useAuth'
import { getMenuItems } from '../../utils/roleUtils'

const baseLinkClass = ({ isActive }) =>
  [
    'flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

export default function RoleBasedMenu() {
  const { user } = useAuth()
  const items = getMenuItems(user)

  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={baseLinkClass}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}