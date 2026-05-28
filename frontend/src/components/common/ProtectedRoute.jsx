import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import Loader from './Loader'
import useAuth from '../../hooks/useAuth'
import { canAccessRole, getHomePath } from '../../utils/roleUtils'

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loader />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!canAccessRole(user, allowedRoles)) {
    return <Navigate to={getHomePath(user)} replace />
  }

  return <Outlet />
}