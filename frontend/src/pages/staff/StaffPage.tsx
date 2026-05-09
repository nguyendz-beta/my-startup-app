import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'

interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: string
  branch: { id: string; name: string } | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface Branch {
  id: string
  name: string
}

const ROLES = ['CASHIER', 'KITCHEN', 'WAITER', 'MANAGER']
const ROLE_LABEL: Record<string, string> = {
  OWNER: '👑 Chủ quán',
  MANAGER: '🧑‍💼 Quản lý',
  CASHIER: '💰 Thu ngân',
  KITCHEN: '👨‍🍳 Bếp',
  WAITER: '🛎️ Phục vụ',
}

export default function StaffPage() {
  const user = useAuthStore((s) => s.user)
  const [staff, setStaff] = useState<Staff[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'CASHIER', branchId: ''
  })
  const [error, setError] = useState('')

  const tenantId = user?.tenant?.id

  const loadStaff = () => {
    api.get('/users').then((r) => setStaff(r.data.data)).finally(() => setLoading(false))
  }

  const loadBranches = () => {
    api.get(`/branches`).catch(() => {})
  }

  useEffect(() => { loadStaff() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/users', form)
      setForm({ name: '', email: '', password: '', phone: '', role: 'CASHIER', branchId: '' })
      setShowForm(false)
      loadStaff()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi tạo nhân viên')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (staffId: string, isActive: boolean) => {
    await api.put(`/users/${staffId}`, { isActive: !isActive })
    loadStaff()
  }

  const fmt = (s: string) => new Date(s).toLocaleDateString('vi-VN')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nhân viên</h1>
          <p className="text-gray-500 text-sm mt-1">{staff.length} nhân viên</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Thêm nhân viên
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Thêm nhân viên mới</h2>
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg mb-3">{error}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Họ tên', placeholder: 'Nguyễn Văn A' },
              { key: 'email', label: 'Email', placeholder: 'nv@cafe.vn' },
              { key: 'password', label: 'Mật khẩu', placeholder: '••••••••' },
              { key: 'phone', label: 'Số điện thoại', placeholder: '0901234567' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.key === 'password' ? 'password' : 'text'}
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder={f.placeholder}
                  required={f.key !== 'phone'}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Lưu nhân viên'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nhân viên', 'Vai trò', 'Chi nhánh', 'Đăng nhập lần cuối', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                      {ROLE_LABEL[s.role] || s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {s.branch?.name || 'Tất cả'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {s.lastLoginAt ? fmt(s.lastLoginAt) : 'Chưa đăng nhập'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      s.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                    }`}>
                      {s.isActive ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.role !== 'OWNER' && (
                      <button
                        onClick={() => handleToggle(s.id, s.isActive)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        {s.isActive ? 'Khoá' : 'Mở khoá'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
