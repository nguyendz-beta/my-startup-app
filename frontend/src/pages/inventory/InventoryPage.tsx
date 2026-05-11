import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  category: string | null;
  updatedAt: string;
}

interface StockLog {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  IN: { label: 'Nhập kho', color: 'text-green-600 bg-green-50' },
  OUT: { label: 'Xuất kho', color: 'text-red-500 bg-red-50' },
  ADJUST: { label: 'Điều chỉnh', color: 'text-blue-600 bg-blue-50' },
};

const EMPTY_FORM = { name: '', unit: 'kg', quantity: '0', minQuantity: '10', costPrice: '0', category: '' };

export default function InventoryPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showStock, setShowStock] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [stockForm, setStockForm] = useState({ type: 'IN', quantity: '', note: '' });
  const [branchId, setBranchId] = useState(user?.branch?.id || '');

  useEffect(() => {
    if (user?.branch?.id) { setBranchId(user.branch.id); return; }
    const token = localStorage.getItem('token');
    import('axios').then(({ default: axios }) => {
      axios.get('/api/branches', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => { if (r.data.data?.[0]) setBranchId(r.data.data[0].id); });
    });
  }, [user]);

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  const loadItems = () => {
    api.get(`/inventory?branchId=${branchId}`)
      .then((r) => setItems(r.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (branchId) loadItems(); }, [branchId]);

  const openCreate = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity.toString(),
      minQuantity: item.minQuantity.toString(),
      costPrice: item.costPrice.toString(),
      category: item.category || '',
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, {
          name: form.name,
          unit: form.unit,
          minQuantity: parseFloat(form.minQuantity),
          costPrice: parseFloat(form.costPrice),
          category: form.category,
        });
        toast.success('Cập nhật thành công!');
      } else {
        await api.post('/inventory', {
          ...form,
          branchId,
          quantity: parseFloat(form.quantity),
          minQuantity: parseFloat(form.minQuantity),
          costPrice: parseFloat(form.costPrice),
        });
        toast.success('Thêm nguyên liệu thành công!');
      }
      setShowForm(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      loadItems();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi lưu nguyên liệu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Xoá "${item.name}"?`)) return;
    try {
      await api.delete(`/inventory/${item.id}`);
      toast.success('Đã xoá nguyên liệu');
      loadItems();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi xoá');
    }
  };

  const openStockModal = async (item: InventoryItem) => {
    setSelected(item);
    setShowStock(true);
    try {
      const r = await api.get(`/inventory/${item.id}/logs`);
      setLogs(r.data.data);
    } catch { setLogs([]); }
  };

  const handleStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/inventory/${selected.id}/stock`, {
        type: stockForm.type,
        quantity: parseFloat(stockForm.quantity),
        note: stockForm.note,
      });
      toast.success('Cập nhật kho thành công!');
      setStockForm({ type: 'IN', quantity: '', note: '' });
      loadItems();
      const r = await api.get(`/inventory/${selected.id}/logs`);
      setLogs(r.data.data);
      const refreshed = await api.get(`/inventory?branchId=${branchId}`);
      const updatedItem = refreshed.data.data.find((i: InventoryItem) => i.id === selected.id);
      if (updatedItem) setSelected(updatedItem);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật kho');
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = items.filter((i) => i.quantity <= i.minQuantity);

  if (!branchId) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kho</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} nguyên liệu</p>
        </div>
        <button onClick={openCreate}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Thêm nguyên liệu
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-700 mb-2">⚠️ Sắp hết hàng ({lowStock.length} mặt hàng)</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i) => (
              <span key={i.id} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                {i.name}: {fmt(i.quantity)} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editingItem ? '✏️ Sửa nguyên liệu' : 'Thêm nguyên liệu mới'}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Tên nguyên liệu', placeholder: 'Cà phê Arabica' },
              { key: 'category', label: 'Danh mục', placeholder: 'Cà phê, Sữa...' },
              { key: 'costPrice', label: 'Giá nhập (đ)', placeholder: '50000' },
              ...(!editingItem ? [{ key: 'quantity', label: 'Số lượng ban đầu', placeholder: '100' }] : []),
              { key: 'minQuantity', label: 'Cảnh báo khi còn', placeholder: '10' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input value={(form as any)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder={f.placeholder} required={f.key === 'name'} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                {['kg', 'g', 'lít', 'ml', 'hộp', 'chai', 'gói', 'cái'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang lưu...' : editingItem ? 'Cập nhật' : 'Thêm nguyên liệu'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingItem(null); }}
                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                Huỷ
              </button>
            </div>
          </form>
        </div>
      )}

      <input value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        placeholder="🔍 Tìm nguyên liệu..." />

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Nguyên liệu', 'Danh mục', 'Tồn kho', 'Đơn vị', 'Giá nhập', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${item.quantity <= item.minQuantity ? 'text-red-500' : 'text-gray-800'}`}>
                      {fmt(item.quantity)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/ min {fmt(item.minQuantity)}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fmt(item.costPrice)}đ</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.quantity <= item.minQuantity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {item.quantity <= item.minQuantity ? '⚠️ Sắp hết' : '✓ Đủ hàng'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openStockModal(item)}
                        className="text-xs text-orange-500 hover:text-orange-700 font-medium">
                        Nhập/Xuất
                      </button>
                      <button onClick={() => openEdit(item)}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(item)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium">
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

      {showStock && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStock(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg text-gray-800">{selected.name}</h2>
                <p className="text-sm text-gray-500">
                  Tồn kho: <span className="font-bold text-orange-600">{fmt(selected.quantity)} {selected.unit}</span>
                </p>
              </div>
              <button onClick={() => setShowStock(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <form onSubmit={handleStock} className="space-y-3 mb-5">
              <div className="flex gap-2">
                {['IN', 'OUT', 'ADJUST'].map((t) => (
                  <button key={t} type="button" onClick={() => setStockForm({ ...stockForm, type: t })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${stockForm.type === t ? TYPE_LABEL[t].color + ' border border-current' : 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABEL[t].label}
                  </button>
                ))}
              </div>
              <input type="number" value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={`Số lượng (${selected.unit})`} required />
              <input value={stockForm.note}
                onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Ghi chú (tuỳ chọn)" />
              <button type="submit" disabled={saving}
                className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </form>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Lịch sử nhập/xuất</p>
              <div className="space-y-2 max-h-48 overflow-auto">
                {logs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Chưa có lịch sử</p>
                ) : logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${TYPE_LABEL[log.type]?.color}`}>
                      {TYPE_LABEL[log.type]?.label}
                    </span>
                    <span className="font-bold">
                      {log.type === 'OUT' ? '-' : '+'}{fmt(log.quantity)} {selected.unit}
                    </span>
                    <span className="text-gray-400">{log.createdBy || '—'}</span>
                    <span className="text-gray-400">{new Date(log.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}