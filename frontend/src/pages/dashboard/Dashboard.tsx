import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

interface Summary {
  totalOrders: number
  totalRevenue: number
  ordersByStatus: { status: string; _count: { id: number }; _sum: { total: number } }[]
  topProducts: { productId: string; product: { name: string }; _sum: { quantity: number; subtotal: number } }[]
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user?.branch?.id) return
    api.get(`/dashboard/summary?branchId=${user.branch.id}&date=${today}`)
      .then((res) => setSummary(res.data.data))
      .finally(() => setLoading(false))
  }, [user])

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Đang tải...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Hôm nay, {new Date().toLocaleDateString('vi-VN')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(summary?.totalRevenue || 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Đơn hoàn thành</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {summary?.ordersByStatus?.find((s) => s.status === 'COMPLETED')?._count?.id || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Top sản phẩm bán chạy</h2>
        {summary?.topProducts?.length === 0 ? (
          <p className="text-gray-400 text-sm">Chưa có dữ liệu hôm nay</p>
        ) : (
          <div className="space-y-3">
            {summary?.topProducts?.map((item, i) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{item.product?.name}</span>
                </div>
                <span className="text-sm text-gray-500">{item._sum.quantity} ly</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}