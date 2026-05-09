import { create } from 'zustand'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  tenant: { id: string; name: string; slug: string }
  branch: { id: string; name: string } | null
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
    toast.success(`Xin chào, ${user.name}! 👋`)
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
    toast.success('Đã đăng xuất')
  },
}))