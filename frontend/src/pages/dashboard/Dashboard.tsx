import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

interface BranchStats {
  id: string
  name: string
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  activeShift: boolean
}

interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
  completedOrders: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  revenueByHour: { hour: number; revenue: number }[]
  branches?: BranchStats[]
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
const fmtShort = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toString()
}

const QUICK_ACTIONS = [
  { to: '/pos',          icon: '🛒', label: 'Bán hàng' },
  { to: '/orders',       icon: '📋', label: 'Đơn hàng' },
  { to: '/tables',       icon: '🪑', label: 'Sơ đồ bàn' },
  { to: '/kitchen',      icon: '🍳', label: 'Bếp' },
  { to: '/reservations', icon: '📅', label: 'Đặt bàn' },
  { to: '/inventory',    icon: '📦', label: 'Kho hàng' },
]

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const isOwner = user?.role === 'OWNER'
  const branchId = user?.branch?.id || ''

  useEffect(() => {
    const params = branchId ? `?branchId=${branchId}` : ''
    api.get(`/dashboard/stats${params}`)
      .then((r) => setStats(r.data.data))
      .catch(() => {
        setStats({
          todayRevenue: 0,
          todayOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          topProducts: [],
          revenueByHour: Array.from({ length: 12 }, (_, i) => ({ hour: i + 8, revenue: 0 })),
          branches: [],
        })
      })
      .finally(() => setLoading(false))
  }, [branchId])

  const maxHourRevenue = Math.max(...(stats?.revenueByHour.map((h) => h.revenue) || [1]), 1)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-gray-400">
        <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Đang tải...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Xin chào, {user?.name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
          })}
          {isOwner && !branchId
            ? ' · Tổng quan toàn hệ thống'
            : ` · ${user?.branch?.name}`}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Doanh thu hôm nay', value: fmt(stats?.todayRevenue || 0),   icon: '💰', light: 'bg-orange-50', text: 'text-orange-600' },
          { label: 'Đơn hàng',          value: stats?.todayOrders || 0,           icon: '📋', light: 'bg-blue-50',   text: 'text-blue-600'   },
          { label: 'Chờ xử lý',         value: stats?.pendingOrders || 0,         icon: '⏳', light: 'bg-yellow-50', text: 'text-yellow-600' },
          { label: 'Hoàn thành',        value: stats?.completedOrders || 0,       icon: '✅', light: 'bg-green-50',  text: 'text-green-600'  },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className={`w-10 h-10 ${card.light} rounded-xl flex items-center justify-center text-xl`}>
                {card.icon}
              </span>
            </div>
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu theo giờ */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">📈 Doanh thu theo giờ</h2>
          {stats?.revenueByHour.every((h) => h.revenue === 0) ? (
            <div className="flex items-center justify-center h-32 text-gray-300">
              <p>Chưa có dữ liệu hôm nay</p>
            </div>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {stats?.revenueByHour.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-orange-400 rounded-t-sm hover:bg-orange-500 transition-all cursor-pointer"
                      style={{ height: `${Math.max(4, (h.revenue / maxHourRevenue) * 112)}px` }}
                    />
                    {h.revenue > 0 && (
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {fmtShort(h.revenue)}đ
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{h.hour}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top sản phẩm */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">🏆 Bán chạy hôm nay</h2>
          {!stats?.topProducts.length ? (
            <div className="flex items-center justify-center h-32 text-gray-300">
              <p className="text-sm">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.slice(0, 5).map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.quantity} phần · {fmt(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Owner — tổng quan đa chi nhánh */}
      {isOwner && stats?.branches && stats.branches.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">🏪 Tổng quan chi nhánh</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.branches.map((branch) => (
              <div key={branch.id} className="border border-gray-100 rounded-xl p-4 hover:border-orange-200 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{branch.name}</h3>
                  <span className={`w-2 h-2 rounded-full ${branch.activeShift ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-orange-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-orange-600">{fmtShort(branch.todayRevenue)}đ</p>
                    <p className="text-xs text-gray-400">Doanh thu</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-lg font-bold text-blue-600">{branch.todayOrders}</p>
                    <p className="text-xs text-gray-400">Đơn hàng</p>
                  </div>
                </div>
                {branch.pendingOrders > 0 && (
                  <div className="mt-2 text-center">
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      ⏳ {branch.pendingOrders} đơn chờ xử lý
                    </span>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2 text-center">
                  {branch.activeShift ? '🟢 Đang có ca làm' : '⚪ Không có ca'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-orange-600">
                {fmt(stats.branches.reduce((s, b) => s + b.todayRevenue, 0))}
              </p>
              <p className="text-xs text-gray-400">Tổng doanh thu</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">
                {stats.branches.reduce((s, b) => s + b.todayOrders, 0)}
              </p>
              <p className="text-xs text-gray-400">Tổng đơn hàng</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">
                {stats.branches.filter((b) => b.activeShift).length}/{stats.branches.length}
              </p>
              <p className="text-xs text-gray-400">Chi nhánh đang mở</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">⚡ Truy cập nhanh</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 hover:text-orange-600 transition-colors text-gray-600 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform inline-block">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}