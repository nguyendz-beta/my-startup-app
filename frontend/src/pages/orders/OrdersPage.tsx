import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { ReceiptDownloadButton } from '../../components/receipt/ReceiptPDF';

interface Order {
  id: string;
  orderCode: string;
  source: string;
  status: string;
  total: number;
  createdAt: string;
  table: { name: string } | null;
  cashier: { name: string } | null;
  items: {
    quantity: number;
    unitPrice: number;
    product: { name: string };
    variant: { name: string } | null;
  }[];
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  PREPARING: { label: 'Đang làm', color: 'bg-purple-100 text-purple-700' },
  READY: { label: 'Sẵn sàng', color: 'bg-indigo-100 text-indigo-700' },
  COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Đã huỷ', color: 'bg-red-100 text-red-500' },
};

const SOURCE_LABEL: Record<string, string> = {
  DINE_IN: '🍽️ Tại bàn',
  TAKEAWAY: '🥡 Mang đi',
  DELIVERY: '🛵 Giao hàng',
  QR_ORDER: '📱 QR Order',
};

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const isOwner = user?.role === 'OWNER' || user?.role === 'MANAGER';

  const loadOrders = () => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    api
      .get('/orders', { params })
      .then((r) => {
        const STATUS_PRIORITY: Record<string, number> = {
          PENDING: 0,
          CONFIRMED: 1,
          PREPARING: 2,
          READY: 3,
          COMPLETED: 4,
          CANCELLED: 5,
        };
        const sorted = (r.data.data || []).sort((a: Order, b: Order) => {
          const pa = STATUS_PRIORITY[a.status] ?? 9;
          const pb = STATUS_PRIORITY[b.status] ?? 9;
          if (pa !== pb) return pa - pb;
          // Cùng trạng thái → mới nhất lên đầu
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(sorted);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const handleStatus = async (orderId: string, status: string) => {
    await api.patch(`/orders/${orderId}/status`, { status });
    loadOrders();
    setSelected(null);
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('Huỷ đơn hàng này?')) return;
    await api.patch(`/orders/${orderId}/cancel`);
    loadOrders();
    setSelected(null);
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const statuses = ['', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn hàng</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} đơn</p>
        </div>
        <button onClick={loadOrders} className="text-sm text-orange-500 hover:underline">
          ↻ Làm mới
        </button>
      </div>

      {isOwner && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
          Đang hiển thị tất cả đơn hàng của chi nhánh.
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s ? STATUS_LABEL[s]?.label : 'Tất cả'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">Không có đơn hàng</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Mã đơn', 'Giờ', 'Nguồn', 'Bàn', 'Món', 'Tổng tiền', 'Trạng thái', ''].map(
                  (h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelected(order)}
                >
                  <td className="px-4 py-3 font-mono font-bold text-gray-800">
                    #{order.orderCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{fmtTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    {SOURCE_LABEL[order.source] || order.source}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{order.table?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.items.map((i) => `${i.product.name} x${i.quantity}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-600">{fmt(order.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_LABEL[order.status]?.color}`}
                    >
                      {STATUS_LABEL[order.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-gray-400 hover:text-gray-600">
                      Chi tiết →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-800">Đơn #{selected.orderCode}</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[selected.status]?.color}`}
                >
                  {STATUS_LABEL[selected.status]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nguồn</span>
                <span>{SOURCE_LABEL[selected.source] || selected.source}</span>
              </div>
              {selected.table && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bàn</span>
                  <span>{selected.table.name}</span>
                </div>
              )}
              {selected.cashier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Thu ngân</span>
                  <span>{selected.cashier.name}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 mb-4 space-y-2">
              {selected.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.product.name}
                    {item.variant ? ` (${item.variant.name})` : ''} x{item.quantity}
                  </span>
                  <span className="text-gray-600">
                    {fmt((item.unitPrice || 0) * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-orange-600 pt-2 border-t border-gray-100">
                <span>Tổng</span>
                <span>{fmt(selected.total)}</span>
              </div>
            </div>

            <div className="mb-3">
              <ReceiptDownloadButton
                order={{ ...selected, subtotal: selected.total, discount: 0 }}
                tenantName={user?.tenant?.name || 'Quán'}
                branchName={user?.branch?.name || ''}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {selected.status === 'PENDING' && (
                <button
                  onClick={() => handleStatus(selected.id, 'CONFIRMED')}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  Xác nhận
                </button>
              )}
              {selected.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleStatus(selected.id, 'PREPARING')}
                  className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-600"
                >
                  Bắt đầu làm
                </button>
              )}
              {selected.status === 'PREPARING' && (
                <button
                  onClick={() => handleStatus(selected.id, 'READY')}
                  className="flex-1 bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-600"
                >
                  Sẵn sàng
                </button>
              )}
              {selected.status === 'READY' && (
                <button
                  onClick={() => handleStatus(selected.id, 'COMPLETED')}
                  className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600"
                >
                  Hoàn thành
                </button>
              )}
              {!['COMPLETED', 'CANCELLED'].includes(selected.status) && (
                <button
                  onClick={() => handleCancel(selected.id)}
                  className="px-4 bg-red-50 text-red-500 py-2 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  Huỷ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
