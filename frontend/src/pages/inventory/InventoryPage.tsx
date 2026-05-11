import { useEffect, useState, useMemo } from 'react';
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
const PAGE_SIZE = 20;

type SortKey = 'name' | 'quantity' | 'costPrice' | 'category';

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
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
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

  // Danh mục duy nhất
  const categories = useMemo(() =>
    Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );

  // Filter + sort + paginate
  const filtered = useMemo(() => {
    let result = items.filter((i) => {
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCategory || i.category === filterCategory;
      const matchStatus = !filterStatus ||
        (filterStatus === 'low' && i.quantity <= i.minQuantity) ||
        (filterStatus === 'ok' && i.quantity > i.minQuantity);
      return matchSearch && matchCat && matchStatus;
    });
    result = [...result].sort((a, b) => {
      let av: any = a[sortKey] ?? '';
      let bv: any = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return result;
  }, [items, search, filterCategory, filterStatus, sortKey, sortAsc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span className="ml-1">{sortAsc ? '↑' : '↓'}</span> : <span className="ml-1 text-gray-300">↕</span>;

  const openCreate = () => { setEditingItem(null); setForm(EMPTY_FORM); setShowForm(true); };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ name: item.name, unit: item.unit, quantity: item.quantity.toString(),
      minQuantity: item.minQuantity.toString(), costPrice: item.costPrice.toString(), category: item.category || '' });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, {
          name: form.name, unit: form.unit,
          minQuantity: parseFloat(form.minQuantity),
          costPrice: parseFloat(form.costPrice),
          category: form.category,
        });
        toast.success('Cập nhật thành công!');
      } else {
        await api.post('/inventory', { ...form, branchId,
          quantity: parseFloat(form.quantity),
          minQuantity: parseFloat(form.minQuantity),
          costPrice: parseFloat(form.costPrice),
        });
        toast.success('Thêm nguyên liệu thành công!');
      }
      setShowForm(false); setEditingItem(null); setForm(EMPTY_FORM); loadItems();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi lưu nguyên liệu');
    } finally { setSaving(false); }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Xoá "${item.name}"?`)) return;
    try {
      await api.delete(`/inventory/${item.id}`);
      toast.success('Đã xoá'); loadItems();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Lỗi xoá'); }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file); formData.append('branchId', branchId);
      const token = localStorage.getItem('token');
      const { default: axios } = await import('axios');
      const res = await axios.post('/api/upload/inventory-excel', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message); loadItems();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi import Excel');
    } finally { setImporting(false); e.target.value = ''; }
  };

  const handleExportExcel = () => {
    const headers = ['Tên nguyên liệu', 'Danh mục', 'Đơn vị', 'Tồn kho', 'Tối thiểu', 'Giá nhập', 'Trạng thái'];
    const rows = filtered.map((i) => [
      i.name, i.category || '', i.unit, i.quantity, i.minQuantity, i.costPrice,
      i.quantity <= i.minQuantity ? 'Sắp hết' : 'Đủ hàng',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `kho_hang_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Xuất Excel thành công!');
  };

  const downloadTemplate = () => {
    const csv = 'Tên nguyên liệu,Danh mục,Đơn vị,Số lượng,Tối thiểu,Giá nhập\nCà phê Arabica,Cà phê,kg,50,10,200000\n';
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mau_nhap_kho.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const openStockModal = async (item: InventoryItem) => {
    setSelected(item); setShowStock(true);
    try { const r = await api.get(`/inventory/${item.id}/logs`); setLogs(r.data.data); }
    catch { setLogs([]); }
  };

  const handleStock = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true);
    try {
      await api.post(`/inventory/${selected.id}/stock`, {
        type: stockForm.type, quantity: parseFloat(stockForm.quantity), note: stockForm.note,
      });
      toast.success('Cập nhật kho thành công!');
      setStockForm({ type: 'IN', quantity: '', note: '' });
      loadItems();
      const r = await api.get(`/inventory/${selected.id}/logs`); setLogs(r.data.data);
      const refreshed = await api.get(`/inventory?branchId=${branchId}`);
      const updatedItem = refreshed.data.data.find((i: InventoryItem) => i.id === selected.id);
      if (updatedItem) setSelected(updatedItem);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi cập nhật kho');
    } finally { setSaving(false); }
  };

  const lowStock = items.filter((i) => i.quantity <= i.minQuantity);

  if (!branchId) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý kho</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} nguyên liệu · hiển thị {filtered.length}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={downloadTemplate}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium">
            📥 Tải mẫu
          </button>
          <label className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium ${importing ? 'bg-green-100 text-green-600' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
            {importing ? '⏳ Đang import...' : '📊 Import Excel'}
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={importing} onChange={handleImportExcel} />
          </label>
          <button onClick={handleExportExcel}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium">
            📤 Xuất Excel
          </button>
          <button onClick={openCreate}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Thêm
          </button>
        </div>
      </div>

      {/* Cảnh báo hết hàng */}
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

      {/* Form thêm/sửa */}
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

      {/* Filter + Search */}
      <div className="flex gap-2 flex-wrap">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          placeholder="🔍 Tìm nguyên liệu..." />
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">Tất cả trạng thái</option>
          <option value="low">⚠️ Sắp hết</option>
          <option value="ok">✓ Đủ hàng</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {([
                  { label: 'Nguyên liệu', key: 'name' },
                  { label: 'Danh mục', key: 'category' },
                  { label: 'Tồn kho', key: 'quantity' },
                  { label: 'Đơn vị', key: null },
                  { label: 'Giá nhập', key: 'costPrice' },
                  { label: 'Trạng thái', key: null },
                  { label: 'Thao tác', key: null },
                ] as { label: string; key: SortKey | null }[]).map((h) => (
                  <th key={h.label}
                    onClick={() => h.key && handleSort(h.key)}
                    className={`text-left text-xs font-medium text-gray-500 px-4 py-3 ${h.key ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}>
                    {h.label}{h.key && <SortIcon k={h.key} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">Không có kết quả</td></tr>
              ) : paginated.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.category || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${item.quantity <= item.minQuantity ? 'text-red-500' : 'text-gray-800'}`}>
                      {fmt(item.quantity)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">/ {fmt(item.minQuantity)}</span>
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
                      <button onClick={() => openStockModal(item)} className="text-xs text-orange-500 hover:text-orange-700 font-medium">Nhập/Xuất</button>
                      <button onClick={() => openEdit(item)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Sửa</button>
                      <button onClick={() => handleDelete(item)} className="text-xs text-red-400 hover:text-red-600 font-medium">Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Trang {page}/{totalPages} · {filtered.length} kết quả
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-white">«</button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1}
                  className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-white">‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-2.5 py-1 text-xs rounded border ${p === page ? 'bg-orange-500 text-white border-orange-500' : 'hover:bg-white'}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
                  className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-white">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="px-2 py-1 text-xs rounded border disabled:opacity-30 hover:bg-white">»</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Modal */}
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