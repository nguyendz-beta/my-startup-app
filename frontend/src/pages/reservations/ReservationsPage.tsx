import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Reservation {
  id: string
  customerName: string
  customerPhone: string
  partySize: number
  reservedAt: string
  note: string | null
  status: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  table: { name: string } | null
  createdAt: string
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700' },
  SEATED:    { label: 'Đã vào bàn',   color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Hoàn thành',   color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã huỷ',       color: 'bg-red-100 text-red-500' },
  NO_SHOW:   { label: 'Không đến',    color: 'bg-gray-100 text-gray-500' },
}

export default function ReservationsPage() {
  const user = useAuthStore((s) => s.user)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    customerName: '', customerPhone: '', partySize: '2',
    reservedAt: '', note: ''
  })

  const branchId = user?.branch?.id || ''

  const fmtTime = (s: string) => new Date(s).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })

  const loadReservations = () => {
    const params = new URLSearchParams({ branchId })
    if (filterStatus) params.set('status', filterStatus)
    api.get(`/reservations?${params}`)
      .then((r) => setReservations(r.data.data))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (branchId) loadReservations() }, [branchId, filterStatus])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/reservations', {
        ...form,
        branchId,
        partySize: parseInt(form.partySize),
      })
      toast.success('Đặt bàn thành công!')
      setShowForm(false)
      setForm({ customerName: '', customerPhone: '', partySize: '2', reservedAt: '', note: '' })
      loadReservations()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi đặt bàn')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id: string, status: string) => {
    try {
      await api.put(`/reservations/${id}`, { status })
      toast.success('Cập nhật trạng thái thành công!')
      loadReservations()
      setSelected(null)
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const today = new Date().toISOString().slice(0, 16)

  const statuses = ['', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

  const todayReservations = reservations.filter((r) => {
    const d = new Date(r.reservedAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  if (!branchId) return (
    <div className="text-center py-20 text-gray-400">
      Vui lòng đăng nhập bằng tài khoản Cashier.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đặt bàn</h1>
          <p className="text-gray-500 text-sm mt-1">
            {reservations.length} đặt bàn · <span className="text-orange-600 font-medium">{todayReservations.length} hôm nay</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Đặt bàn mới
        </button>
      </div>

      {/* Hôm nay */}
      {todayReservations.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="font-semibold text-orange-700 mb-3">📅 Hôm nay — {todayReservations.length} lượt đặt</p>
          <div className="flex flex-wrap gap-2">
            {todayReservations.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="bg-white border border-orange-200 rounded-lg px-3 py-2 text-left hover:border-orange-400 transition-colors"
              >
                <p className="text-sm font-bold text-gray-800">{r.customerName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(r.reservedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{r.partySize} người
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_CONFIG[r.status]?.color}`}>
                  {STATUS_CONFIG[r.status]?.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s ? STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label : 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Form tạo đặt bàn */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-800">Đặt bàn mới</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách *</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0901234567"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số người *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.partySize}
                    onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian đặt *</label>
                  <input
                    type="datetime-local"
                    min={today}
                    value={form.reservedAt}
                    onChange={(e) => setForm({ ...form, reservedAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    rows={2}
                    placeholder="Dị ứng thực phẩm, yêu cầu đặc biệt..."
                  />
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang đặt...' : '✓ Xác nhận đặt bàn'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Danh sách */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p>Chưa có đặt bàn nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Khách hàng', 'SĐT', 'Thời gian', 'Số người', 'Bàn', 'Ghi chú', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.customerPhone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fmtTime(r.reservedAt)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{r.partySize} người</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.table?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-xs truncate">{r.note || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_CONFIG[r.status]?.color}`}>
                      {STATUS_CONFIG[r.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-gray-400 hover:text-gray-600">Chi tiết →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-800">{selected.customerName}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="space-y-2 text-sm mb-5">
              {[
                ['📞 SĐT', selected.customerPhone],
                ['👥 Số người', `${selected.partySize} người`],
                ['📅 Thời gian', fmtTime(selected.reservedAt)],
                ['🪑 Bàn', selected.table?.name || 'Chưa phân bàn'],
                ['📝 Ghi chú', selected.note || 'Không có'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium text-gray-700">{v}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[selected.status]?.color}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.status === 'PENDING' && (
                <button onClick={() => handleStatus(selected.id, 'CONFIRMED')}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
                  Xác nhận
                </button>
              )}
              {selected.status === 'CONFIRMED' && (
                <button onClick={() => handleStatus(selected.id, 'SEATED')}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-600">
                  Đã vào bàn
                </button>
              )}
              {selected.status === 'SEATED' && (
                <button onClick={() => handleStatus(selected.id, 'COMPLETED')}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600">
                  Hoàn thành
                </button>
              )}
              {['PENDING', 'CONFIRMED'].includes(selected.status) && (
                <>
                  <button onClick={() => handleStatus(selected.id, 'NO_SHOW')}
                    className="px-3 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Không đến
                  </button>
                  <button onClick={() => handleStatus(selected.id, 'CANCELLED')}
                    className="px-3 bg-red-50 text-red-500 py-2 rounded-lg text-sm font-medium hover:bg-red-100">
                    Huỷ
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}