import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Shift {
  id: string
  openedAt: string
  closedAt: string | null
  openCash: number
  closeCash: number | null
  totalOrders: number
  totalRevenue: number
  note: string | null
  openedBy: { name: string }
  closedBy: { name: string } | null
}

export default function ShiftsPage() {
  const user = useAuthStore((s) => s.user)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [activeShift, setActiveShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOpen, setShowOpen] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [openCash, setOpenCash] = useState('')
  const [closeCash, setCloseCash] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const branchId = user?.branch?.id || ''
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'
  const fmtTime = (s: string) => new Date(s).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  })

  const loadShifts = () => {
    if (!branchId) return
    api.get(`/shifts?branchId=${branchId}`)
      .then((r) => {
        const data: Shift[] = r.data.data
        setShifts(data)
        const active = data.find((s) => !s.closedAt)
        setActiveShift(active || null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadShifts() }, [branchId])

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/shifts', {
        branchId,
        openCash: parseFloat(openCash) || 0,
      })
      toast.success('Mở ca thành công!')
      setShowOpen(false)
      setOpenCash('')
      loadShifts()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi mở ca')
    } finally {
      setSaving(false)
    }
  }

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeShift) return
    setSaving(true)
    try {
      await api.put(`/shifts/${activeShift.id}/close`, {
        closeCash: parseFloat(closeCash) || 0,
        note,
      })
      toast.success('Đóng ca thành công!')
      setShowClose(false)
      setCloseCash('')
      setNote('')
      loadShifts()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi đóng ca')
    } finally {
      setSaving(false)
    }
  }

  if (!branchId) return (
    <div className="text-center py-20 text-gray-400">
      Vui lòng đăng nhập bằng tài khoản Cashier.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo ca</h1>
          <p className="text-gray-500 text-sm mt-1">{shifts.length} ca</p>
        </div>
        <div className="flex gap-2">
          {activeShift ? (
            <button
              onClick={() => setShowClose(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              🔒 Đóng ca
            </button>
          ) : (
            <button
              onClick={() => setShowOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              🔓 Mở ca
            </button>
          )}
        </div>
      </div>

      {/* Ca đang mở */}
      {activeShift && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-green-700">Ca đang mở</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Mở lúc</p>
              <p className="font-semibold text-gray-800">{fmtTime(activeShift.openedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tiền đầu ca</p>
              <p className="font-semibold text-gray-800">{fmt(activeShift.openCash)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Đơn hàng</p>
              <p className="font-semibold text-blue-600">{activeShift.totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Doanh thu</p>
              <p className="font-semibold text-orange-600">{fmt(activeShift.totalRevenue)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Nhân viên: {activeShift.openedBy.name}</p>
        </div>
      )}

      {/* Form mở ca */}
      {showOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold text-lg text-gray-800 mb-4">🔓 Mở ca mới</h2>
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiền mặt đầu ca</label>
                <input
                  type="number"
                  value={openCash}
                  onChange={(e) => setOpenCash(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="500000"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-medium hover:bg-green-600 disabled:opacity-50">
                  {saving ? 'Đang mở...' : 'Mở ca'}
                </button>
                <button type="button" onClick={() => setShowOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-200">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form đóng ca */}
      {showClose && activeShift && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-bold text-lg text-gray-800 mb-2">🔒 Đóng ca</h2>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tổng đơn</span>
                <span className="font-semibold">{activeShift.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doanh thu</span>
                <span className="font-semibold text-orange-600">{fmt(activeShift.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền đầu ca</span>
                <span className="font-semibold">{fmt(activeShift.openCash)}</span>
              </div>
            </div>
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiền mặt cuối ca</label>
                <input
                  type="number"
                  value={closeCash}
                  onChange={(e) => setCloseCash(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="1500000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  rows={2}
                  placeholder="Ghi chú cuối ca..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-medium hover:bg-red-600 disabled:opacity-50">
                  {saving ? 'Đang đóng...' : 'Đóng ca'}
                </button>
                <button type="button" onClick={() => setShowClose(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-200">
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lịch sử ca */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Lịch sử ca</h2>
        </div>
        {loading ? (
          <div className="text-center py-10 text-gray-400">Đang tải...</div>
        ) : shifts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">Chưa có ca nào</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Mở ca', 'Đóng ca', 'Tiền đầu ca', 'Tiền cuối ca', 'Đơn', 'Doanh thu', 'Trạng thái'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{fmtTime(shift.openedAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {shift.closedAt ? fmtTime(shift.closedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{fmt(shift.openCash)}</td>
                  <td className="px-4 py-3 text-sm">
                    {shift.closeCash !== null ? fmt(shift.closeCash) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{shift.totalOrders}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-orange-600">{fmt(shift.totalRevenue)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      shift.closedAt
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {shift.closedAt ? 'Đã đóng' : '🟢 Đang mở'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
