import api from '../api/axios'

export const fetchCompanies = () => api.get('/api/admin/tenants/').then((response) => response.data)

export const fetchUsers = (params = {}) => api.get('/api/admin/users/', { params }).then((response) => response.data)

export const createCompany = (payload) => api.post('/api/admin/tenants/', payload).then((response) => response.data)

export const createUser = (payload) => api.post('/api/admin/users/', payload).then((response) => response.data)
