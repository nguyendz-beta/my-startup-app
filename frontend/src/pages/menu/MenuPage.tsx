import { useEffect, useState } from 'react';
import { productApi } from '../../api/productApi';
import toast from 'react-hot-toast';

interface Variant {
  id: string;
  name: string;
  priceModifier: number;
}
interface Product {
  id: string;
  name: string;
  basePrice: number;
  description: string | null;
  isAvailable: boolean;
  imageUrl: string | null;
  category: { id: string; name: string } | null;
  variants: Variant[];
}
interface Category {
  id: string;
  name: string;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    basePrice: '',
    description: '',
    categoryId: '',
    imageUrl: '',
  });
  const [variantForm, setVariantForm] = useState({ name: '', priceModifier: '0' });
  const [addingVariant, setAddingVariant] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [editVariantForm, setEditVariantForm] = useState({ name: '', priceModifier: '0' });

  const loadProducts = () => {
    productApi
      .getProducts()
      .then((r) => setProducts(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
    productApi.getCategories().then((r) => setCategories(r.data.data));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', basePrice: '', description: '', categoryId: '', imageUrl: '' });
    setShowForm(true);
    setSelected(null);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      basePrice: product.basePrice.toString(),
      description: product.description || '',
      categoryId: product.category?.id || '',
      imageUrl: product.imageUrl || '',
    });
    setShowForm(true);
    setSelected(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        basePrice: parseInt(form.basePrice),
        description: form.description,
        categoryId: form.categoryId || null,
        imageUrl: form.imageUrl || null,
      };
      if (editing) {
        await productApi.updateProduct(editing.id, payload);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await productApi.createProduct(payload);
        toast.success('Thêm sản phẩm thành công!');
      }
      setShowForm(false);
      setEditing(null);
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (product: Product) => {
    await productApi.updateProduct(product.id, { isAvailable: !product.isAvailable });
    toast.success(product.isAvailable ? 'Đã tắt sản phẩm' : 'Đã bật sản phẩm');
    loadProducts();
    if (selected?.id === product.id)
      setSelected({ ...selected, isAvailable: !product.isAvailable });
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Xoá "${product.name}"?`)) return;
    await productApi.deleteProduct(product.id);
    toast.success('Đã xoá sản phẩm');
    setSelected(null);
    loadProducts();
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await productApi.createVariant(selected.id, {
        name: variantForm.name,
        priceModifier: parseInt(variantForm.priceModifier) || 0,
      });
      toast.success('Thêm size thành công!');
      setVariantForm({ name: '', priceModifier: '0' });
      setAddingVariant(false);
      const r = await productApi.getProductById(selected.id);
      setSelected(r.data.data);
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi thêm size');
    } finally {
      setSaving(false);
    }
  };

  const handleEditVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant) return;
    setSaving(true);
    try {
      await productApi.updateVariant(editingVariant.id, {
        name: editVariantForm.name,
        priceModifier: parseInt(editVariantForm.priceModifier) || 0,
      });
      toast.success('Cập nhật size thành công!');
      setEditingVariant(null);
      if (selected) {
        const r = await productApi.getProductById(selected.id);
        setSelected(r.data.data);
      }
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi sửa size');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Xoá size này?')) return;
    await productApi.deleteVariant(variantId);
    toast.success('Đã xoá size');
    if (selected) {
      const r = await productApi.getProductById(selected.id);
      setSelected(r.data.data);
    }
    loadProducts();
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 space-y-4 overflow-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Thực đơn</h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} sản phẩm</p>
          </div>
          <button
            onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Thêm sản phẩm
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="🔍 Tìm sản phẩm..."
        />

        {showForm && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">
              {editing ? '✏️ Sửa sản phẩm' : '+ Thêm sản phẩm mới'}
            </h2>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Cà phê sữa đá"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ) *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link ảnh</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="https://..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Mô tả ngắn về sản phẩm"
                />
              </div>
              <div className="col-span-2 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Lưu sản phẩm'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
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
                  {['Sản phẩm', 'Danh mục', 'Giá', 'Size', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selected?.id === product.id ? 'bg-orange-50' : ''}`}
                    onClick={() => setSelected(selected?.id === product.id ? null : product)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-lg overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            '☕'
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800">{product.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {product.category?.name || 'Chưa phân loại'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-orange-600">
                        {fmt(product.basePrice)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {product.variants.length === 0 ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          product.variants.map((v) => (
                            <span
                              key={v.id}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                            >
                              {v.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(product);
                        }}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          product.isAvailable
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-500 hover:bg-red-200'
                        }`}
                      >
                        {product.isAvailable ? '✓ Đang bán' : '✗ Hết hàng'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(product);
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product);
                          }}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="w-72 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Quản lý size</h2>
              <p className="text-xs text-gray-400 mt-0.5">{selected.name}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-2">
            {selected.variants.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Chưa có size nào</p>
            ) : (
              selected.variants.map((v) => (
                <div key={v.id}>
                  {editingVariant?.id === v.id ? (
                    <form
                      onSubmit={handleEditVariant}
                      className="bg-orange-50 rounded-lg p-3 space-y-2"
                    >
                      <input
                        value={editVariantForm.name}
                        onChange={(e) =>
                          setEditVariantForm({ ...editVariantForm, name: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none"
                        placeholder="Tên size"
                        required
                      />
                      <input
                        type="number"
                        value={editVariantForm.priceModifier}
                        onChange={(e) =>
                          setEditVariantForm({ ...editVariantForm, priceModifier: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none"
                        placeholder="Chênh lệch giá"
                      />
                      <div className="flex gap-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 bg-orange-500 text-white py-1 rounded text-xs font-medium"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVariant(null)}
                          className="flex-1 bg-gray-100 text-gray-600 py-1 rounded text-xs"
                        >
                          Huỷ
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{v.name}</p>
                        {v.priceModifier !== 0 && (
                          <p className="text-xs text-gray-400">
                            {v.priceModifier > 0 ? '+' : ''}
                            {fmt(v.priceModifier)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingVariant(v);
                            setEditVariantForm({
                              name: v.name,
                              priceModifier: v.priceModifier.toString(),
                            });
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(v.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Xoá
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100">
            {addingVariant ? (
              <form onSubmit={handleAddVariant} className="space-y-2">
                <input
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Tên size (VD: Nhỏ, Vừa, Lớn)"
                  required
                />
                <input
                  type="number"
                  value={variantForm.priceModifier}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, priceModifier: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Chênh lệch giá (0 = không đổi)"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                  >
                    {saving ? '...' : 'Thêm size'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingVariant(false)}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium"
                  >
                    Huỷ
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingVariant(true)}
                className="w-full border-2 border-dashed border-gray-200 hover:border-orange-300 text-gray-400 hover:text-orange-500 py-2 rounded-lg text-sm transition-colors"
              >
                + Thêm size mới
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
