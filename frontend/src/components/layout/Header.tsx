import { useAuthStore } from '../../store/authStore'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const now = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <p className="text-sm text-gray-500">{now}</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
          {user?.name?.charAt(0)}
        </div>
        <span className="text-sm font-medium text-gray-700">{user?.name}</span>
      </div>
    </header>
  )
}