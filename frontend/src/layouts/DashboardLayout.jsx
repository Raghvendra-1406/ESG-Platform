import React from 'react'
import { Outlet } from 'react-router-dom'

import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.06),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] text-slate-900 md:flex">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}