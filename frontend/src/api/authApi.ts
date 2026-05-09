import api from './axios'

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    tenantName: string
    tenantSlug: string
    ownerName: string
    email: string
    password: string
    phone?: string
  }) => api.post('/auth/register', data),

  me: () => api.get('/auth/me'),
}