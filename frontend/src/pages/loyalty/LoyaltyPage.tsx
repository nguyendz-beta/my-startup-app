import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  points: number
  totalSpent: number
  visitCount: number
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  createdAt: string
}

interface Voucher {
  id: string
  code: string
  discountType: 'PERCENT' | 'FIXED'
  discountValue: number
  minOrder: number
  maxDiscount: number | null
  usedCount: number
  maxUses: number | null
  expiresAt: string | null
  isActive: boolean
}

const TIER_CONFIG = {
  BRONZE:   { label: 'Đồng',   color: 'bg-amber-100 text-amber-700',   icon: '🥉', min: 0 },
  SILVER:   { label: 'Bạc',    color: 'bg-gray-100 text-gray-600',     icon: '🥈', min: 2000000 },
  GOLD:     { label: 'Vàng',   color: 'bg-yellow-100 text-yellow-700', icon: '🥇', min: 5000000 },
  PLATINUM: { label: 'Bạch kim', color: 'bg-purple-100 text-purple-700', icon: '💎', min: 15000000 },
}

export default function LoyaltyPage() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'customers' | 'vouchers'>('customers')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [showVoucherForm, setShowVoucherForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' })
  const [voucherForm, setVoucherForm] = useState({
    code: '', discountType: 'PERCENT', discountValue: '10',
    minOrder: '0', maxDiscount: '', maxUses: '', expiresAt: ''
  })

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, vRes] = await Promise.all([
        api.get('/loyalty/customers'),
        api.get('/loyalty/vouchers'),
      ])
      setCustomers(cRes.data.data)
      setVouchers(vRes.data.data)
    } catch {
      // API chưa có — dùng mock
      setCustomers([])
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/loyalty/customers', customerForm)
      toast.success('Thêm khách hàng thành công!')
      setShowCustomerForm(false)
      setCustomerForm({ name: '', phone: '', email: '' })
      loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi thêm khách hàng')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/loyalty/vouchers', {
        ...voucherForm,
        discountValue: parseFloat(voucherForm.discountValue),
        minOrder: parseFloat(voucherForm.minOrder) || 0,
        maxDiscount: voucherForm.maxDiscount ? parseFloat(voucherForm.maxDiscount) : null,
        maxUses: voucherForm.maxUses ? parseInt(voucherForm.maxUses) : null,
        expiresAt: voucherForm.expiresAt || null,
      })
      toast.success('Tạo voucher thành công!')
      setShowVoucherForm(false)
      loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi tạo voucher')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVoucher = async (voucher: Voucher) => {
    try {
      await api.put(`/loyalty/vouchers/${voucher.id}`, { isActive: !voucher.isActive })
      toast.success(voucher.isActive ? 'Đã tắt voucher' : 'Đã bật voucher')
      loadData()
    } catch {
      toast.error('Lỗi cập nhật voucher')
    }
  }

  const generateCode = () => {
    const code = 'SALE' + Math.random().toString(36).slice(2, 7).toUpperCase()
    setVoucherForm({ ...voucherForm, code })
  }

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Khách hàng thân thiết</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} khách · {vouchers.length} voucher</p>
        </div>
        <button
          onClick={() => tab === 'customers' ? setShowCustomerForm(true) : setShowVoucherForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + {tab === 'customers' ? 'Thêm khách' : 'Tạo voucher'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['customers', 'vouchers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === t ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'customers' ? '👥 Khách hàng' : '🎫 Voucher'}
          </button>
        ))}
      </div>

      {/* Customer Form */}
      {showCustomerForm && tab === 'customers' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Thêm khách hàng mới</h2>
          <form onSubmit={handleCreateCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Họ tên *', placeholder: 'Nguyễn Văn A' },
              { key: 'phone', label: 'Số điện thoại *', placeholder: '0901234567' },
              { key: 'email', label: 'Email', placeholder: 'email@example.com' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  value={(customerForm as any)[f.key]}
                  onChange={(e) => setCustomerForm({ ...customerForm, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder={f.placeholder}
                  required={f.key !== 'email'}
                />
              </div>
            ))}
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Thêm khách hàng'}
              </button>
              <button type="button" onClick={() => setShowCustomerForm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Voucher Form */}
      {showVoucherForm && tab === 'vouchers' && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Tạo voucher mới</h2>
          <form onSubmit={handleCreateVoucher} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher *</label>
              <div className="flex gap-2">
                <input
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="SALE10"
                  required
                />
                <button type="button" onClick={generateCode}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-xs hover:bg-gray-200">
                  Tạo tự động
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
              <select
                value={voucherForm.discountType}
                onChange={(e) => setVoucherForm({ ...voucherForm, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (đ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá trị {voucherForm.discountType === 'PERCENT' ? '(%)' : '(đ)'}
              </label>
              <input
                type="number"
                value={voucherForm.discountValue}
                onChange={(e) => setVoucherForm({ ...voucherForm, discountValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={voucherForm.discountType === 'PERCENT' ? '10' : '50000'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (đ)</label>
              <input
                type="number"
                value={voucherForm.minOrder}
                onChange={(e) => setVoucherForm({ ...voucherForm, minOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lần dùng tối đa</label>
              <input
                type="number"
                value={voucherForm.maxUses}
                onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Không giới hạn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn</label>
              <input
                type="date"
                value={voucherForm.expiresAt}
                onChange={(e) => setVoucherForm({ ...voucherForm, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang tạo...' : 'Tạo voucher'}
              </button>
              <button type="button" onClick={() => setShowVoucherForm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customers Tab */}
      {tab === 'customers' && (
        <>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="🔍 Tìm theo tên hoặc SĐT..."
          />

          {loading ? (
            <div className="text-center py-20 text-gray-400">Đang tải...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">👥</p>
              <p>Chưa có khách hàng thân thiết</p>
              <p className="text-sm mt-1">Thêm khách hàng đầu tiên để bắt đầu tích điểm</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Khách hàng', 'SĐT', 'Hạng', 'Điểm', 'Tổng chi tiêu', 'Lượt ghé', ''].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.map((c) => {
                    const tier = TIER_CONFIG[c.tier]
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{c.name}</p>
                          {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${tier.color}`}>
                            {tier.icon} {tier.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-orange-600">{c.points.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium">{fmt(c.totalSpent)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{c.visitCount} lần</td>
                        <td className="px-4 py-3">
                          <button className="text-xs text-blue-500 hover:text-blue-700">Chi tiết</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Vouchers Tab */}
      {tab === 'vouchers' && (
        <>
          {loading ? (
            <div className="text-center py-20 text-gray-400">Đang tải...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-3">🎫</p>
              <p>Chưa có voucher nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vouchers.map((v) => {
                const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date()
                return (
                  <div key={v.id} className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all ${
                    v.isActive && !isExpired ? 'border-orange-200' : 'border-gray-200 opacity-60'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono font-bold text-lg text-gray-800">{v.code}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {v.discountType === 'PERCENT'
                            ? `Giảm ${v.discountValue}%`
                            : `Giảm ${fmt(v.discountValue)}`}
                          {v.maxDiscount ? ` (tối đa ${fmt(v.maxDiscount)})` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isExpired ? 'bg-gray-100 text-gray-400' :
                        v.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                      }`}>
                        {isExpired ? 'Hết hạn' : v.isActive ? '● Đang dùng' : '○ Tắt'}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      {v.minOrder > 0 && <p>Đơn tối thiểu: {fmt(v.minOrder)}</p>}
                      <p>Đã dùng: {v.usedCount}{v.maxUses ? `/${v.maxUses}` : ''} lần</p>
                      {v.expiresAt && (
                        <p>Hết hạn: {new Date(v.expiresAt).toLocaleDateString('vi-VN')}</p>
                      )}
                    </div>

                    {!isExpired && (
                      <button
                        onClick={() => handleToggleVoucher(v)}
                        className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          v.isActive
                            ? 'bg-red-50 text-red-500 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {v.isActive ? 'Tắt voucher' : 'Bật voucher'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
