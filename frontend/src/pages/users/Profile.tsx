import { useAuthStore } from '../../store/authStore'

export default function Profile() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Tài khoản</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-600">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{user?.role}</span>
          </div>
        </div>
        <hr />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quán</span>
            <span className="font-medium">{user?.tenant.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chi nhánh</span>
            <span className="font-medium">{user?.branch?.name || 'Tất cả'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
