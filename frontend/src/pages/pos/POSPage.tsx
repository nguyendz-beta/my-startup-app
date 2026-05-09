import { useEffect, useState } from 'react'
import { productApi } from '../../api/productApi'
import { orderApi } from '../../api/orderApi'
import { useAuthStore } from '../../store/authStore'

interface Product {
  id: string
  name: string
  basePrice: number
  categoryId: string | null
  imageUrl: string | null
  variants: { id: string; name: string; priceModifier: number }[]
}
interface Category { id: string; name: string }
interface CartItem {
  productId: string; variantId?: string; name: string
  variantName?: string; quantity: number; unitPrice: number
}
export default function POSPage() {
  const user = useAuthStore((s) => s.user)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [activeCat, setActiveCat] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    productApi.getCategories().then((r) => {
      setCategories(r.data.data)
      if (r.data.data.length > 0) setActiveCat(r.data.data[0].id)
    })
    productApi.getProducts({ isAvailable: true }).then((r) => setProducts(r.data.data))
  }, [])

  const filteredProducts = activeCat
    ? products.filter((p) => p.categoryId === activeCat)
    : products

  const addToCart = (product: Product, variant?: { id: string; name: string; priceModifier: number }) => {
    const unitPrice = product.basePrice + (variant?.priceModifier || 0)
    const key = product.id + (variant?.id || '')
    setCart((prev) => {
      const existing = prev.find((i) => i.productId + (i.variantId || '') === key)
      if (existing) return prev.map((i) =>
        i.productId + (i.variantId || '') === key ? { ...i, quantity: i.quantity + 1 } : i
      )
      return [...prev, {
        productId: product.id,
        variantId: variant?.id,
        name: product.name,
        variantName: variant?.name,
        quantity: 1,
        unitPrice,
      }]
    })
  }

  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index))

  const total = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      await orderApi.createOrder({
        source: 'DINE_IN',
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      })
      setCart([])
      setSuccess('Đã tạo đơn hàng thành công!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Lỗi tạo đơn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Menu */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCat === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-orange-300 transition-colors"
              onClick={() => addToCart(product)}
            >
              <div className="w-full h-24 bg-orange-50 rounded-lg flex items-center justify-center text-3xl mb-3">
                ☕
              </div>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{product.name}</p>
              <p className="text-orange-600 font-semibold text-sm mt-1">{fmt(product.basePrice)}</p>
              {product.variants.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={(e) => { e.stopPropagation(); addToCart(product, v) }}
                      className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600 hover:bg-orange-100"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">🛒 Đơn hàng</h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-8">Chưa có món nào</p>
          ) : (
            cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                  {item.variantName && (
                    <p className="text-xs text-gray-400">{item.variantName}</p>
                  )}
                  <p className="text-xs text-orange-600">{fmt(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => removeFromCart(i)}
                    className="w-5 h-5 rounded-full bg-red-100 text-red-500 text-xs flex items-center justify-center hover:bg-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between font-semibold">
            <span>Tổng cộng</span>
            <span className="text-orange-600">{fmt(total)}</span>
          </div>

          {success && (
            <div className="bg-green-50 text-green-600 text-xs px-3 py-2 rounded-lg">{success}</div>
          )}

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang tạo đơn...' : '✓ Tạo đơn hàng'}
          </button>
        </div>
      </div>
    </div>
  )
}