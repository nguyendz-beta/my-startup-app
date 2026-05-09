import { useEffect, useState } from 'react'
import { tableApi } from '../../api/tableApi'
import { useAuthStore } from '../../store/authStore'

interface Table {
  id: string
  name: string
  capacity: number
  status: string
  orders: { id: string; orderCode: string; status: string; total: number }[]
}

const STATUS = {
  AVAILABLE: { label: 'Trống',    color: 'bg-green-50 border-green-200 text-green-700' },
  OCCUPIED:  { label: 'Có khách', color: 'bg-orange-50 border-orange-300 text-orange-700' },
  RESERVED:  { label: 'Đặt trước',color: 'bg-blue-50 border-blue-200 text-blue-700' },
  CLEANING:  { label: 'Dọn dẹp',  color: 'bg-gray-50 border-gray-200 text-gray-500' },
}

export default function TablesPage() {
  const user = useAuthStore((s) => s.user)
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', capacity: '4' })
  const [saving, setSaving] = useState(false)

  const branchId = user?.branch?.id || ''

  const loadTables = () => {
    if (!branchId) return
    tableApi.getTables(branchId)
      .then((r) => setTables(r.data.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTables() }, [branchId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await tableApi.createTable(branchId, { name: form.name, capacity: parseInt(form.capacity) })
      setForm({ name: '', capacity: '4' })
      setShowForm(false)
      loadTables()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi tạo bàn')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (tableId: string, status: string) => {
    await tableApi.updateTable(branchId, tableId, { status })
    loadTables()
  }

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

  if (!branchId) return (
    <div className="text-center py-20 text-gray-400">
      Vui lòng đăng nhập bằng tài khoản Cashier để xem bàn.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sơ đồ bàn</h1>
          <p className="text-gray-500 text-sm mt-1">{tables.length} bàn</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadTables} className="text-sm text-orange-500 hover:underline">↻ Làm mới</button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Thêm bàn
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(STATUS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-3 h-3 rounded-full border ${v.color}`} />
            {v.label}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Thêm bàn mới</h2>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên bàn</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Bàn 05"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sức chứa</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                min="1" max="20"
              />
            </div>
            <button type="submit" disabled={saving}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Huỷ
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table) => {
            const s = STATUS[table.status as keyof typeof STATUS] || STATUS.AVAILABLE
            const activeOrder = table.orders?.[0]
            return (
              <div key={table.id} className={`rounded-xl border-2 p-4 transition-all ${s.color}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-800">{table.name}</p>
                    <p className="text-xs text-gray-400">{table.capacity} người</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                    {s.label}
                  </span>
                </div>

                {activeOrder && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <p className="text-xs font-mono font-bold">#{activeOrder.orderCode}</p>
                    <p className="text-xs font-semibold">{fmt(activeOrder.total)}</p>
                  </div>
                )}

                <div className="mt-3 flex gap-1 flex-wrap">
                  {table.status !== 'AVAILABLE' && (
                    <button
                      onClick={() => handleStatusChange(table.id, 'AVAILABLE')}
                      className="text-xs px-2 py-1 bg-white/60 rounded-lg hover:bg-white transition-colors"
                    >
                      Trống
                    </button>
                  )}
                  {table.status !== 'OCCUPIED' && (
                    <button
                      onClick={() => handleStatusChange(table.id, 'OCCUPIED')}
                      className="text-xs px-2 py-1 bg-white/60 rounded-lg hover:bg-white transition-colors"
                    >
                      Có khách
                    </button>
                  )}
                  {table.status !== 'CLEANING' && (
                    <button
                      onClick={() => handleStatusChange(table.id, 'CLEANING')}
                      className="text-xs px-2 py-1 bg-white/60 rounded-lg hover:bg-white transition-colors"
                    >
                      Dọn dẹp
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
