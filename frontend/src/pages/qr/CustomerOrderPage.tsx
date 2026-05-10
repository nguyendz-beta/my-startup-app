import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'

interface Product {
  id: string
  name: string
  basePrice: number
  imageUrl: string | null
  description: string | null
  isAvailable: boolean
  category: { name: string } | null
  variants: { id: string; name: string; priceModifier: number }[]
}

interface CartItem {
  productId: string
  variantId?: string
  name: string
  variantName?: string
  price: number
  quantity: number
}

export default function CustomerOrderPage() {
  const [params] = useSearchParams()
  const branchId = params.get('branchId') || ''
  const tableId = params.get('tableId') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [ordering, setOrdering] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [tableName, setTableName] = useState('')
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    if (!branchId) return
    Promise.all([
      axios.get(`/api/products?branchId=${branchId}`),
      tableId ? axios.get(`/api/tables/${branchId}/${tableId}`) : Promise.resolve(null),
    ]).then(([prodRes, tableRes]) => {
      const prods = prodRes.data.data || []
      setProducts(prods)
      const cats = ['Tất cả', ...Array.from(new Set(prods.map((p: Product) => p.category?.name).filter(Boolean))) as string[]]
      setCategories(cats)
      if (tableRes) setTableName(tableRes.data.data?.name || '')
    }).finally(() => setLoading(false))
  }, [branchId, tableId])

  const filtered = activeCategory === 'Tất cả'
    ? products
    : products.filter(p => p.category?.name === activeCategory)

  const addToCart = (product: Product, variant?: { id: string; name: string; priceModifier: number }) => {
    const price = product.basePrice + (variant?.priceModifier || 0)
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id && i.variantId === variant?.id)
      if (existing) return prev.map(i => i.productId === product.id && i.variantId === variant?.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { productId: product.id, variantId: variant?.id, name: product.name, variantName: variant?.name, price, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string, variantId?: string) => {
    setCart(prev => prev.map(i => i.productId === productId && i.variantId === variantId
      ? { ...i, quantity: i.quantity - 1 }
      : i
    ).filter(i => i.quantity > 0))
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ'

  const handleOrder = async () => {
    if (cart.length === 0) return
    setOrdering(true)
    try {
      await axios.post('/api/orders/public', {
        branchId,
        tableId,
        source: 'QR_ORDER',
        items: cart.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      })
      setOrdered(true)
      setCart([])
    } catch {
      alert('Lỗi đặt món, vui lòng thử lại!')
    } finally {
      setOrdering(false)
    }
  }

  if (!branchId) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Link QR không hợp lệ
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Đang tải thực đơn...
    </div>
  )

  if (ordered) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-orange-50">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt món thành công!</h1>
      <p className="text-gray-500 mb-6">Nhân viên sẽ phục vụ bạn ngay.</p>
      <button onClick={() => setOrdered(false)}
        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600">
        Đặt thêm món
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-orange-500 text-white px-4 py-4 sticky top-0 z-10">
        <h1 className="font-bold text-lg">☕ Thực đơn</h1>
        {tableName && <p className="text-orange-100 text-sm">{tableName}</p>}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 bg-white border-b sticky top-[60px] z-10">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="px-4 py-4 space-y-3">
        {filtered.filter(p => p.isAvailable).map(product => (
          <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm flex gap-3">
            {product.imageUrl && (
              <img src={product.imageUrl} alt={product.name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{product.name}</p>
              {product.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>}
              <p className="text-orange-500 font-bold mt-1">{fmt(product.basePrice)}</p>

              {product.variants.length > 0 ? (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {product.variants.map(v => (
                    <button key={v.id} onClick={() => addToCart(product, v)}
                      className="text-xs px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100">
                      {v.name} {v.priceModifier > 0 ? `+${fmt(v.priceModifier)}` : ''}
                    </button>
                  ))}
                </div>
              ) : (
                <button onClick={() => addToCart(product)}
                  className="mt-2 text-sm bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600">
                  + Thêm
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cart button */}
      {totalItems > 0 && !showCart && (
        <div className="fixed bottom-6 left-4 right-4 z-20">
          <button onClick={() => setShowCart(true)}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-between px-6">
            <span className="bg-white text-orange-500 rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm">
              {totalItems}
            </span>
            <span>Xem giỏ hàng</span>
            <span>{fmt(total)}</span>
          </button>
        </div>
      )}

      {/* Cart modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-800">Giỏ hàng</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="space-y-3 mb-6">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                    <p className="text-orange-500 text-sm font-semibold">{fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => removeFromCart(item.productId, item.variantId)}
                      className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">−</button>
                    <span className="font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => setCart(prev => prev.map(i2 => i2.productId === item.productId && i2.variantId === item.variantId ? { ...i2, quantity: i2.quantity + 1 } : i2))}
                      className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-gray-800">Tổng cộng</span>
              <span className="font-bold text-orange-500 text-lg">{fmt(total)}</span>
            </div>
            <button onClick={handleOrder} disabled={ordering}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 disabled:opacity-50">
              {ordering ? 'Đang đặt món...' : '🍽️ Đặt món ngay'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}