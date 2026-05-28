import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '../components/common/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import LoginPage from '../pages/auth/LoginPage'
import AnalystDashboard from '../pages/analyst/AnalystDashboard'
import AnalystUploadPage from '../pages/analyst/UploadPage'
import AnalystRecordsPage from '../pages/analyst/RecordsPage'
import SuspiciousRecordsPage from '../pages/analyst/SuspiciousRecordsPage'
import AuditorDashboard from '../pages/auditor/AuditorDashboard'
import AuditTrailPage from '../pages/auditor/AuditTrailPage'
import LockedRecordsPage from '../pages/auditor/LockedRecordsPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import CompaniesPage from '../pages/admin/CompaniesPage'
import UsersPage from '../pages/admin/UsersPage'
import useAuth from '../hooks/useAuth'
import { getHomePath } from '../utils/roleUtils'
import { ROLES } from '../utils/constants'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={getHomePath(user)} replace />
}

function LoginRoute() {
  const { user } = useAuth()
  if (user) {
    return <Navigate to={getHomePath(user)} replace />
  }

  return <LoginPage />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<HomeRedirect />} />

          <Route element={<ProtectedRoute allowedRoles={[ROLES.ANALYST]} />}>
            <Route path="/analyst" element={<AnalystDashboard />} />
            <Route path="/analyst/upload" element={<AnalystUploadPage />} />
            <Route path="/analyst/records" element={<AnalystRecordsPage />} />
            <Route path="/analyst/suspicious" element={<SuspiciousRecordsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.AUDITOR]} />}>
            <Route path="/auditor" element={<AuditorDashboard />} />
            <Route path="/auditor/audit-trail" element={<AuditTrailPage />} />
            <Route path="/auditor/locked-records" element={<LockedRecordsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={[ROLES.PLATFORM_ADMIN]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/companies" element={<CompaniesPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}