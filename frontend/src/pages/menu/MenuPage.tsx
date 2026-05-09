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
        toast.success('Cap nhat san pham thanh cong!');
      } else {
        await productApi.createProduct(payload);
        toast.success('Them san pham thanh cong!');
      }
      setShowForm(false);
      setEditing(null);
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Loi luu san pham');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (product: Product) => {
    await productApi.updateProduct(product.id, { isAvailable: !product.isAvailable });
    toast.success(product.isAvailable ? 'Da tat san pham' : 'Da bat san pham');
    loadProducts();
    if (selected?.id === product.id)
      setSelected({ ...selected, isAvailable: !product.isAvailable });
  };

  const handleDelete = async (product: Product) => {
    if (!confirm('Xoa "' + product.name + '"?')) return;
    await productApi.deleteProduct(product.id);
    toast.success('Da xoa san pham');
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
      toast.success('Them size thanh cong!');
      setVariantForm({ name: '', priceModifier: '0' });
      setAddingVariant(false);
      const r = await productApi.getProductById(selected.id);
      setSelected(r.data.data);
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Loi them size');
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
      toast.success('Cap nhat size thanh cong!');
      setEditingVariant(null);
      if (selected) {
        const r = await productApi.getProductById(selected.id);
        setSelected(r.data.data);
      }
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Loi sua size');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Xoa size nay?')) return;
    await productApi.deleteVariant(variantId);
    toast.success('Da xoa size');
    if (selected) {
      const r = await productApi.getProductById(selected.id);
      setSelected(r.data.data);
    }
    loadProducts();
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'd';
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Thuc don</h1>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>{products.length} san pham</p>
          </div>
          <button
            onClick={openCreate}
            style={{
              background: '#f97316',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            + Them san pham
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '14px',
            marginBottom: '16px',
            boxSizing: 'border-box',
          }}
          placeholder="Tim san pham..."
        />

        {showForm && (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              border: '1px solid #f3f4f6',
            }}
          >
            <h2 style={{ fontWeight: '600', color: '#374151', marginBottom: '16px' }}>
              {editing ? 'Sua san pham' : 'Them san pham moi'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Ten san pham *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Ca phe sua da"
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Gia (VND) *
                  </label>
                  <input
                    type="number"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="35000"
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Danh muc
                  </label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">-- Chon danh muc --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Link anh
                  </label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="https://..."
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '4px',
                    }}
                  >
                    Mo ta
                  </label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Mo ta ngan"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: '#f97316',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    opacity: saving ? 0.5 : 1,
                  }}
                >
                  {saving ? 'Dang luu...' : editing ? 'Cap nhat' : 'Luu san pham'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                  style={{
                    background: '#f3f4f6',
                    color: '#4b5563',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Huy
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px' }}>Dang tai...</div>
        ) : (
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  {['San pham', 'Danh muc', 'Gia', 'Size', 'Trang thai', 'Thao tac'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#6b7280',
                        padding: '12px 16px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr
                    key={product.id}
                    style={{
                      borderTop: '1px solid #f9fafb',
                      cursor: 'pointer',
                      background: selected?.id === product.id ? '#fff7ed' : 'white',
                    }}
                    onClick={() => setSelected(selected?.id === product.id ? null : product)}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#fff7ed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            '☕'
                          )}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          background: '#f3f4f6',
                          color: '#4b5563',
                          padding: '2px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        {product.category?.name || 'Chua phan loai'}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#ea580c',
                      }}
                    >
                      {fmt(product.basePrice)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {product.variants.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#d1d5db' }}>—</span>
                        ) : (
                          product.variants.map((v) => (
                            <span
                              key={v.id}
                              style={{
                                fontSize: '12px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                padding: '2px 8px',
                                borderRadius: '999px',
                              }}
                            >
                              {v.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(product);
                        }}
                        style={{
                          fontSize: '12px',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '500',
                          background: product.isAvailable ? '#dcfce7' : '#fee2e2',
                          color: product.isAvailable ? '#16a34a' : '#ef4444',
                        }}
                      >
                        {product.isAvailable ? 'Dang ban' : 'Het hang'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(product);
                          }}
                          style={{
                            fontSize: '12px',
                            color: '#3b82f6',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '500',
                          }}
                        >
                          Sua
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product);
                          }}
                          style={{
                            fontSize: '12px',
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Xoa
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
        <div
          style={{
            width: '280px',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontWeight: '600', fontSize: '14px', color: '#1f2937' }}>
                Quan ly size
              </h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                {selected.name}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '20px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {selected.variants.length === 0 ? (
              <p
                style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}
              >
                Chua co size nao
              </p>
            ) : (
              selected.variants.map((v) => (
                <div key={v.id} style={{ marginBottom: '8px' }}>
                  {editingVariant?.id === v.id ? (
                    <form
                      onSubmit={handleEditVariant}
                      style={{ background: '#fff7ed', borderRadius: '8px', padding: '12px' }}
                    >
                      <input
                        value={editVariantForm.name}
                        onChange={(e) =>
                          setEditVariantForm({ ...editVariantForm, name: e.target.value })
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '12px',
                          marginBottom: '6px',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Ten size"
                        required
                      />
                      <input
                        type="number"
                        value={editVariantForm.priceModifier}
                        onChange={(e) =>
                          setEditVariantForm({ ...editVariantForm, priceModifier: e.target.value })
                        }
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '12px',
                          marginBottom: '6px',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Chenh lech gia"
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="submit"
                          disabled={saving}
                          style={{
                            flex: 1,
                            background: '#f97316',
                            color: 'white',
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                          }}
                        >
                          Luu
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVariant(null)}
                          style={{
                            flex: 1,
                            background: '#f3f4f6',
                            color: '#4b5563',
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Huy
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                          {v.name}
                        </p>
                        {v.priceModifier !== 0 && (
                          <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {v.priceModifier > 0 ? '+' : ''}
                            {fmt(v.priceModifier)}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingVariant(v);
                            setEditVariantForm({
                              name: v.name,
                              priceModifier: v.priceModifier.toString(),
                            });
                          }}
                          style={{
                            fontSize: '12px',
                            color: '#3b82f6',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Sua
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(v.id)}
                          style={{
                            fontSize: '12px',
                            color: '#ef4444',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Xoa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6' }}>
            {addingVariant ? (
              <form onSubmit={handleAddVariant}>
                <input
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Ten size (VD: Nho, Vua, Lon)"
                  required
                />
                <input
                  type="number"
                  value={variantForm.priceModifier}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, priceModifier: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Chenh lech gia (0 = khong doi)"
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      flex: 1,
                      background: '#f97316',
                      color: 'white',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? '...' : 'Them size'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingVariant(false)}
                    style={{
                      flex: 1,
                      background: '#f3f4f6',
                      color: '#4b5563',
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Huy
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingVariant(true)}
                style={{
                  width: '100%',
                  border: '2px dashed #e5e7eb',
                  background: 'none',
                  color: '#9ca3af',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                + Them size moi
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

