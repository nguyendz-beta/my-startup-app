import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

interface Order {
  id: string;
  orderCode: string;
  source: string;
  createdAt: string;
  table: { name: string } | null;
  items: {
    quantity: number;
    product: { name: string };
    variant: { name: string } | null;
  }[];
}

const SOURCE_LABEL: Record<string, string> = {
  DINE_IN: '🍽️ Tại bàn',
  TAKEAWAY: '🥡 Mang đi',
  DELIVERY: '🛵 Giao hàng',
  QR_ORDER: '📱 QR Order',
};

export default function ReadyOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);

  const loadOrders = () => {
    api
      .get('/orders', { params: { status: 'READY' } })
      .then((r) => setOrders(r.data.data || []))
      .catch(() => setOrders([]));
  };

  useEffect(() => {
    loadOrders();

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:4000', { auth: { token } });

    socket.on('order:status_changed', () => {
      loadOrders();
      toast('🍽️ Có đơn mới sẵn sàng!', { icon: '🔔' });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleComplete = async (orderId: string) => {
    setCompleting(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'COMPLETED' });
      toast.success('Đã giao cho khách!');
      loadOrders();
    } catch {
      toast.error('Lỗi cập nhật!');
    } finally {
      setCompleting(null);
    }
  };

  const fmtTime = (s: string) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    return diff < 1 ? 'Vừa xong' : `${diff} phút trước`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🍽️ Đơn sẵn sàng</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} đơn chờ mang ra</p>
        </div>
        <button onClick={loadOrders} className="text-sm text-orange-500 hover:underline">
          ↻ Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-300 text-lg">
          ✅ Không có đơn nào chờ mang ra
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border-2 border-indigo-400 bg-indigo-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xl text-gray-800">
                    #{order.orderCode}
                  </span>
                  {order.table && (
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-600 border">
                      {order.table.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{fmtTime(order.createdAt)}</span>
              </div>

              <p className="text-xs text-indigo-600 font-medium mb-3">
                {SOURCE_LABEL[order.source] || order.source}
              </p>

              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {item.quantity}
                    </span>
                    <p className="text-sm font-medium text-gray-800">
                      {item.product.name}
                      {item.variant && (
                        <span className="text-gray-400"> · {item.variant.name}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleComplete(order.id)}
                disabled={completing === order.id}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
              >
                {completing === order.id ? '⏳ Đang xử lý...' : '✅ Đã mang ra cho khách'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
