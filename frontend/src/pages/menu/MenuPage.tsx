import { useEffect, useState } from 'react';
import { productApi } from '../../api/productApi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

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
interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}
interface Ingredient {
  id: string;
  itemId: string;
  variantId: string | null;
  quantity: number;
  item: InventoryItem;
}

const isDrink = (categoryName?: string | null) => {
  if (!categoryName) return false;
  const n = categoryName.toLowerCase();
  return (
    n.includes('uống') ||
    n.includes('cafe') ||
    n.includes('cà phê') ||
    n.includes('ca phe') ||
    n.includes('trà') ||
    n.includes('tra') ||
    n.includes('nước') ||
    n.includes('nuoc') ||
    n.includes('tea') ||
    n.includes('juice') ||
    n.includes('sinh tố')
  );
};

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    basePrice: '',
    description: '',
    categoryId: '',
    imageUrl: '',
  });
  const [formVariants, setFormVariants] = useState<
    { id?: string; name: string; priceModifier: string }[]
  >([]);
  const [newVariant, setNewVariant] = useState({ name: '', priceModifier: '0' });

  // Ingredient modal
  const [showIngredients, setShowIngredients] = useState(false);
  const [ingProduct, setIngProduct] = useState<Product | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [savingIng, setSavingIng] = useState(false);
  // null = áp dụng chung, variantId = theo size cụ thể
  const [activeVariantTab, setActiveVariantTab] = useState<string | null>(null);
  const [newIng, setNewIng] = useState({ itemId: '', quantity: '' });
  const [branchId, setBranchId] = useState('');

  const user = useAuthStore((s) => s.user);
  const canDelete = user?.role === 'OWNER' || user?.role === 'MANAGER';

  useEffect(() => {
    if (user?.branch?.id) {
      setBranchId(user.branch.id);
      return;
    }
    const token = localStorage.getItem('token');
    import('axios').then(({ default: axios }) => {
      axios.get('/api/branches', { headers: { Authorization: `Bearer ${token}` } }).then((r) => {
        if (r.data.data?.[0]) setBranchId(r.data.data[0].id);
      });
    });
  }, [user]);

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

  const getFormCategory = () => categories.find((c) => c.id === form.categoryId);
  const formSizeSuggestions = isDrink(getFormCategory()?.name)
    ? ['S', 'M', 'L', 'XL']
    : ['Nhỏ', 'Vừa', 'Lớn'];

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', basePrice: '', description: '', categoryId: '', imageUrl: '' });
    setFormVariants([]);
    setNewVariant({ name: '', priceModifier: '0' });
    setShowForm(true);
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
    setFormVariants(
      product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        priceModifier: v.priceModifier.toString(),
      })),
    );
    setNewVariant({ name: '', priceModifier: '0' });
    setShowForm(true);
  };

  const openIngredients = async (product: Product) => {
    setIngProduct(product);
    setShowIngredients(true);
    setActiveVariantTab(null);
    try {
      const [ingRes, invRes] = await Promise.all([
        api.get(`/products/${product.id}/ingredients`),
        api.get(`/inventory?branchId=${branchId}`),
      ]);
      setIngredients(ingRes.data.data);
      setInventoryItems(invRes.data.data);
    } catch {
      setIngredients([]);
      setInventoryItems([]);
    }
  };

  // Lọc nguyên liệu theo tab đang chọn
  const currentIngredients = ingredients.filter((i) =>
    activeVariantTab === null ? i.variantId === null : i.variantId === activeVariantTab,
  );

  const addIngredient = () => {
    if (!newIng.itemId || !newIng.quantity) return;
    const item = inventoryItems.find((i) => i.id === newIng.itemId);
    if (!item) return;
    const dup = ingredients.find(
      (i) => i.itemId === newIng.itemId && i.variantId === activeVariantTab,
    );
    if (dup) {
      toast.error('Nguyên liệu này đã được thêm cho size này');
      return;
    }
    setIngredients((prev) => [
      ...prev,
      {
        id: '',
        itemId: newIng.itemId,
        variantId: activeVariantTab,
        quantity: parseFloat(newIng.quantity),
        item,
      },
    ]);
    setNewIng({ itemId: '', quantity: '' });
  };

  const removeIngredient = (itemId: string, variantId: string | null) => {
    setIngredients((prev) =>
      prev.filter((i) => !(i.itemId === itemId && i.variantId === variantId)),
    );
  };

  const saveIngredients = async () => {
    if (!ingProduct) return;
    setSavingIng(true);
    try {
      await api.post(`/products/${ingProduct.id}/ingredients`, {
        ingredients: ingredients.map((i) => ({
          itemId: i.itemId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      });
      toast.success('Lưu nguyên liệu thành công!');
      setShowIngredients(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi lưu nguyên liệu');
    } finally {
      setSavingIng(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const { default: axios } = await import('axios');
      const res = await axios.post('/api/upload/image', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
      toast.success('Upload ảnh thành công!');
    } catch {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploading(false);
    }
  };

  const addFormVariant = () => {
    if (!newVariant.name.trim()) return;
    setFormVariants((prev) => [
      ...prev,
      { name: newVariant.name, priceModifier: newVariant.priceModifier },
    ]);
    setNewVariant({ name: '', priceModifier: '0' });
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
        const oldIds = editing.variants.map((v) => v.id);
        const keepIds = formVariants.filter((v) => v.id).map((v) => v.id!);
        for (const id of oldIds.filter((id) => !keepIds.includes(id)))
          await productApi.deleteVariant(id);
        for (const v of formVariants) {
          if (v.id)
            await productApi.updateVariant(v.id, {
              name: v.name,
              priceModifier: parseInt(v.priceModifier) || 0,
            });
          else
            await productApi.createVariant(editing.id, {
              name: v.name,
              priceModifier: parseInt(v.priceModifier) || 0,
            });
        }
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        const res = await productApi.createProduct(payload);
        for (const v of formVariants)
          await productApi.createVariant(res.data.data.id, {
            name: v.name,
            priceModifier: parseInt(v.priceModifier) || 0,
          });
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
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Xoá "${product.name}"?`)) return;
    try {
      await productApi.deleteProduct(product.id);
      toast.success('Đã xoá sản phẩm');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi xoá sản phẩm');
    }
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
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá (VNĐ) *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Mô tả ngắn về sản phẩm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh sản phẩm
                  </label>
                  <div className="flex items-start gap-4">
                    {form.imageUrl ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={form.imageUrl}
                          alt=""
                          className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, imageUrl: '' })}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-3xl flex-shrink-0">
                        🖼️
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <label
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${uploading ? 'border-orange-300 bg-orange-50' : 'border-orange-200 bg-orange-50 hover:bg-orange-100'}`}
                      >
                        {uploading ? (
                          <span className="text-orange-500 text-sm">⏳ Đang upload...</span>
                        ) : (
                          <>
                            <span className="text-2xl">📁</span>
                            <div>
                              <p className="text-sm font-medium text-orange-600">
                                Chọn ảnh từ máy / điện thoại
                              </p>
                              <p className="text-xs text-gray-400">JPG, PNG, WEBP — tối đa 5MB</p>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadImage(file);
                          }}
                        />
                      </label>
                      <input
                        value={form.imageUrl}
                        onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="Hoặc dán link ảnh https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">📐 Quản lý size</p>
                {formVariants.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formVariants.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="flex-1 text-sm text-gray-700">{v.name}</span>
                        <span className="text-xs text-gray-400">
                          {parseInt(v.priceModifier) > 0 ? '+' : ''}
                          {parseInt(v.priceModifier) !== 0
                            ? fmt(parseInt(v.priceModifier))
                            : 'Giá gốc'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormVariants((prev) => prev.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 text-xs ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 flex-wrap mb-2">
                  <span className="text-xs text-gray-400 self-center">Gợi ý:</span>
                  {formSizeSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewVariant({ ...newVariant, name: s })}
                      className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newVariant.name}
                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Tên size"
                  />
                  <input
                    type="number"
                    value={newVariant.priceModifier}
                    onChange={(e) =>
                      setNewVariant({ ...newVariant, priceModifier: e.target.value })
                    }
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="+/- giá"
                  />
                  <button
                    type="button"
                    onClick={addFormVariant}
                    className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
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
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            '🍽️'
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
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${product.isAvailable ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-500 hover:bg-red-200'}`}
                      >
                        {product.isAvailable ? '✓ Đang bán' : '✗ Hết hàng'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openIngredients(product);
                          }}
                          className="text-xs text-purple-500 hover:text-purple-700 font-medium"
                        >
                          🧪 NL
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(product);
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                        >
                          Sửa
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(product);
                            }}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Xoá
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cấu hình nguyên liệu */}
      {showIngredients && ingProduct && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowIngredients(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg text-gray-800">🧪 Nguyên liệu</h2>
                <p className="text-sm text-gray-500">{ingProduct.name}</p>
              </div>
              <button
                onClick={() => setShowIngredients(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            {/* Tabs: Chung + từng size */}
            <div className="flex gap-1 flex-wrap mb-4">
              <button
                onClick={() => {
                  setActiveVariantTab(null);
                  setNewIng({ itemId: '', quantity: '' });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeVariantTab === null ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                🌐 Chung (tất cả size)
              </button>
              {ingProduct.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveVariantTab(v.id);
                    setNewIng({ itemId: '', quantity: '' });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeVariantTab === v.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {v.name}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 mb-3">
              {activeVariantTab === null
                ? '💡 Nguyên liệu chung áp dụng cho tất cả size. Nếu size có nguyên liệu riêng, hệ thống dùng nguyên liệu của size đó.'
                : `💡 Nguyên liệu riêng cho size "${ingProduct.variants.find((v) => v.id === activeVariantTab)?.name}".`}
            </p>

            {/* Danh sách nguyên liệu theo tab */}
            <div className="space-y-2 mb-4 max-h-44 overflow-auto">
              {currentIngredients.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Chưa có nguyên liệu nào</p>
              ) : (
                currentIngredients.map((ing) => (
                  <div
                    key={`${ing.itemId}-${ing.variantId}`}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{ing.item.name}</p>
                      <p className="text-xs text-gray-400">
                        Tồn: {ing.item.quantity} {ing.item.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={ing.quantity}
                        onChange={(e) =>
                          setIngredients((prev) =>
                            prev.map((i) =>
                              i.itemId === ing.itemId && i.variantId === ing.variantId
                                ? { ...i, quantity: parseFloat(e.target.value) || 0 }
                                : i,
                            ),
                          )
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                      />
                      <span className="text-xs text-gray-400">{ing.item.unit}</span>
                      <button
                        onClick={() => removeIngredient(ing.itemId, ing.variantId)}
                        className="text-red-400 hover:text-red-600 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Thêm nguyên liệu */}
            <div className="border border-gray-200 rounded-xl p-3 mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Thêm nguyên liệu</p>
              <div className="flex gap-2">
                <select
                  value={newIng.itemId}
                  onChange={(e) => setNewIng({ ...newIng, itemId: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {inventoryItems
                    .filter((i) => !currentIngredients.find((ing) => ing.itemId === i.id))
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  value={newIng.quantity}
                  onChange={(e) => setNewIng({ ...newIng, quantity: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="SL"
                />
                <button
                  onClick={addIngredient}
                  className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200"
                >
                  + Thêm
                </button>
              </div>
            </div>

            <button
              onClick={saveIngredients}
              disabled={savingIng}
              className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {savingIng ? 'Đang lưu...' : '💾 Lưu nguyên liệu'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
