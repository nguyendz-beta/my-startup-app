import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

interface DayRevenue {
  date: string
  revenue: number
  orders: number
}

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user)
  const [data, setData] = useState<DayRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7')
  const branchId = user?.branch?.id || ''

  const loadData = () => {
    if (!branchId) return
    const end = new Date().toISOString().split('T')[0]
    const start = new Date(Date.now() - parseInt(range) * 86400000).toISOString().split('T')[0]
    api.get(`/dashboard/revenue?branchId=${branchId}&startDate=${start}&endDate=${end}`)
      .then((r) => setData(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [range, branchId])

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const totalRevenue = data.reduce((s, d) => s + Number(d.revenue), 0)
  const totalOrders = data.reduce((s, d) => s + Number(d.orders), 0)
  const maxRevenue = Math.max(...data.map((d) => Number(d.revenue)), 1)

  if (!branchId) return (
    <div className="text-center py-20 text-gray-400">Vui lòng đăng nhập bằng tài khoản Cashier.</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo doanh thu</h1>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="7">7 ngày qua</option>
          <option value="14">14 ngày qua</option>
          <option value="30">30 ngày qua</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng doanh thu</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalOrders}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Doanh thu theo ngày</h2>
        {loading ? (
          <div className="text-center py-10 text-gray-400">Đang tải...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-gray-300">Không có dữ liệu</div>
        ) : (
          <div className="space-y-3">
            {data.map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-20 flex-shrink-0">
                  {new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-orange-400 h-full rounded-full flex items-center px-2"
                    style={{ width: `${(Number(d.revenue) / maxRevenue) * 100}%`, minWidth: '2%' }}
                  >
                    <span className="text-xs text-white font-medium truncate">{fmt(Number(d.revenue))}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">{d.orders} đơn</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}