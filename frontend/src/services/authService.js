import api from '../api/axios'
import { AUTH_ENDPOINTS, AUTH_STORAGE_KEYS } from '../utils/constants'

export async function login(credentials) {
  const response = await api.post(AUTH_ENDPOINTS.login, credentials)
  const payload = response.data || {}

  const token = payload.token || payload.access || payload.auth_token
  if (token) {
    localStorage.setItem(AUTH_STORAGE_KEYS.token, token)
  }

  return payload
}

export async function getCurrentUser() {
  const response = await api.get(AUTH_ENDPOINTS.me)
  return response.data
}

export async function logout() {
  try {
    await api.post(AUTH_ENDPOINTS.logout)
  } finally {
    localStorage.removeItem(AUTH_STORAGE_KEYS.token)
    localStorage.removeItem(AUTH_STORAGE_KEYS.user)
  }
}