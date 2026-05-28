export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const AUTH_ENDPOINTS = {
	login: '/api/auth/login/',
	me: '/api/auth/me/',
	logout: '/api/auth/logout/',
}

export const AUTH_STORAGE_KEYS = {
	token: 'breathe_esg_token',
	user: 'breathe_esg_user',
}

export const ROLES = {
	PLATFORM_ADMIN: 'PLATFORM_ADMIN',
	ANALYST: 'ANALYST',
	AUDITOR: 'AUDITOR',
}

export const SOURCES = ['SAP', 'UTILITY', 'TRAVEL']

export const WORKFLOW_STATES = ['UPLOADED', 'VALIDATED', 'NORMALIZED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'LOCKED']

export const QUALITY_SCORES = ['HIGH', 'MEDIUM', 'LOW']

export const REVIEW_STATUS = ['PENDING', 'APPROVED', 'REJECTED']
