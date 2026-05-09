import { useAuthStore } from '../store/authStore'

export type Role = 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'WAITER'

export function useRole() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role as Role | undefined

  return {
    role,
    isOwner:   role === 'OWNER',
    isManager: role === 'MANAGER',
    isCashier: role === 'CASHIER',
    isKitchen: role === 'KITCHEN',
    isWaiter:  role === 'WAITER',
    canAccess: (allowedRoles: Role[]) => !!role && allowedRoles.includes(role),
  }
}