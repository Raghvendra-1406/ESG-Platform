import { ROLES } from './constants'

const roleHomePaths = {
  [ROLES.PLATFORM_ADMIN]: '/admin',
  [ROLES.ANALYST]: '/analyst',
  [ROLES.AUDITOR]: '/auditor',
}

const menuByRole = {
  [ROLES.PLATFORM_ADMIN]: [
    { label: 'Overview', to: '/admin' },
    { label: 'Companies', to: '/admin/companies' },
    { label: 'Users', to: '/admin/users' },
  ],
  [ROLES.ANALYST]: [
    { label: 'Overview', to: '/analyst' },
    { label: 'Upload', to: '/analyst/upload' },
    { label: 'Records', to: '/analyst/records' },
    { label: 'Suspicious', to: '/analyst/suspicious' },
  ],
  [ROLES.AUDITOR]: [
    { label: 'Overview', to: '/auditor' },
    { label: 'Audit Trail', to: '/auditor/audit-trail' },
    { label: 'Locked Records', to: '/auditor/locked-records' },
  ],
}

export function isPlatformAdmin(user) {
  return Boolean(user?.is_platform_admin || user?.is_superuser || user?.role === ROLES.PLATFORM_ADMIN)
}

export function getUserRole(user) {
  if (!user) return null
  if (isPlatformAdmin(user)) return ROLES.PLATFORM_ADMIN
  return user.role || user?.tenant_profile?.role || user?.profile?.role || null
}

export function getUserTenantName(user) {
  return user?.tenant?.name || user?.tenant_name || user?.tenant_profile?.tenant?.name || 'Company'
}

export function getRoleLabel(user) {
  const role = getUserRole(user)
  return role ? role.replaceAll('_', ' ') : 'Guest'
}

export function getHomePath(user) {
  return roleHomePaths[getUserRole(user)] || '/login'
}

export function getMenuItems(user) {
  return menuByRole[getUserRole(user)] || []
}

export function canAccessRole(user, allowedRoles = []) {
  if (!allowedRoles.length) return true
  return allowedRoles.includes(getUserRole(user))
}