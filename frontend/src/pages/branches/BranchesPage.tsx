import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Branch {
  id: string
  name: string
  address: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  _count?: { users: number; orders: number }
}

export default function BranchesPage() {
  const user = useAuthStore((s) => s.user)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })

  const loadBranches = () => {
    api.get('/branches').then((r) => setBranches(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadBranches() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', address: '', phone: '' })
    setShowForm(true)
  }

  const openEdit = (branch: Branch) => {
    setEditing(branch)
    setForm({ name: branch.name, address: branch.address || '', phone: branch.phone || '' })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/branches/${editing.id}`, form)
        toast.success('Cập nhật chi nhánh thành công!')
      } else {
        await api.post('/branches', form)
        toast.success('Tạo chi nhánh thành công!')
      }
      setShowForm(false)
      loadBranches()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi lưu chi nhánh')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (branch: Branch) => {
    try {
      await api.put(`/branches/${branch.id}`, { isActive: !branch.isActive })
      toast.success(branch.isActive ? 'Đã tắt chi nhánh' : 'Đã bật chi nhánh')
      loadBranches()
    } catch {
      toast.error('Lỗi cập nhật')
    }
  }

  const fmt = (s: string) => new Date(s).toLocaleDateString('vi-VN')

  if (user?.role !== 'OWNER' && user?.role !== 'MANAGER') return (
    <div className="text-center py-20 text-gray-400">
      Bạn không có quyền truy cập trang này.
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Chi nhánh</h1>
          <p className="text-gray-500 text-sm mt-1">{branches.length} chi nhánh</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Thêm chi nhánh
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editing ? 'Sửa chi nhánh' : 'Thêm chi nhánh mới'}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên chi nhánh *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Quán 1 - Hoàn Kiếm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="123 Đinh Tiên Hoàng, Hoàn Kiếm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0901234567"
              />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo chi nhánh'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div key={branch.id} className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all ${
              branch.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-800">{branch.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                    branch.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}>
                    {branch.isActive ? '● Đang hoạt động' : '○ Tạm đóng'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(branch)}
                    className="text-xs text-blue-500 hover:text-blue-700">
                    Sửa
                  </button>
                  <button onClick={() => handleToggle(branch)}
                    className={`text-xs ${branch.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}`}>
                    {branch.isActive ? 'Tắt' : 'Bật'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm text-gray-500">
                {branch.address && (
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <span>{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{branch.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Tạo ngày {fmt(branch.createdAt)}</span>
                </div>
              </div>

              {branch._count && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-800">{branch._count.users}</p>
                    <p className="text-xs text-gray-400">Nhân viên</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-orange-600">{branch._count.orders}</p>
                    <p className="text-xs text-gray-400">Đơn hàng</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
