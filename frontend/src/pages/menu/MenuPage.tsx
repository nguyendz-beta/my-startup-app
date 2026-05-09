import { useEffect, useState } from 'react'
import { productApi } from '../../api/productApi'

interface Product {
  id: string; name: string; basePrice: number
  isAvailable: boolean; category: { name: string } | null
  variants: { id: string; name: string; priceModifier: number }[]
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', basePrice: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadProducts = () => {
    productApi.getProducts().then((r) => setProducts(r.data.data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await productApi.createProduct({
        name: form.name,
        basePrice: parseInt(form.basePrice),
        description: form.description,
      })
      setForm({ name: '', basePrice: '', description: '' })
      setShowForm(false)
      loadProducts()
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi tạo sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (product: Product) => {
    await productApi.updateProduct(product.id, { isAvailable: !product.isAvailable })
    loadProducts()
  }

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thực đơn</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} sản phẩm</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Thêm sản phẩm
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">Thêm sản phẩm mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Cà phê sữa đá"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="35000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Mô tả ngắn"
              />
            </div>
            <div className="col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-12">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Sản phẩm', 'Danh mục', 'Giá', 'Variants', 'Trạng thái', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{product.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {product.category?.name || 'Chưa phân loại'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-orange-600">{fmt(product.basePrice)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {product.variants.map((v) => (
                        <span key={v.id} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(product)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                        product.isAvailable
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-500 hover:bg-red-200'
                      }`}
                    >
                      {product.isAvailable ? 'Đang bán' : 'Hết hàng'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => productApi.deleteProduct(product.id).then(loadProducts)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Xoá
                    </button>
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