import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { orderApi } from '../../api/orderApi';
import { useAuthStore } from '../../store/authStore';

interface Order {
  id: string;
  orderCode: string;
  source: string;
  status: string;
  createdAt: string;
  table: { name: string } | null;
  items: {
    quantity: number;
    note: string | null;
    product: { name: string };
    variant: { name: string } | null;
  }[];
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'border-yellow-400 bg-yellow-50',
  CONFIRMED: 'border-blue-400 bg-blue-50',
  PREPARING: 'border-purple-400 bg-purple-50',
};

export default function KitchenPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [branchId, setBranchId] = useState(user?.branch?.id || '');

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

  const loadOrders = () => {
    if (!branchId) return;
   Promise.all([
  orderApi.getOrders(branchId, { status: 'PENDING' }),
  orderApi.getOrders(branchId, { status: 'PREPARING' }),
]).then(([r1, r2]) => setOrders([...r1.data.data, ...r2.data.data]));
  };

  useEffect(() => {
    loadOrders();

    const token = localStorage.getItem('token');
    const socket = io('http://localhost:4000', { auth: { token } });

    socket.on('order:new', () => loadOrders());
    socket.on('order:status_changed', () => loadOrders());

    return () => {
      socket.disconnect();
    };
  }, [branchId]);

  const handleReady = async (orderId: string) => {
    await orderApi.updateStatus(orderId, 'READY');
    loadOrders();
  };

  const handlePreparing = async (orderId: string) => {
    await orderApi.updateStatus(orderId, 'PREPARING');
    loadOrders();
  };

  const fmtTime = (s: string) => {
    const diff = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    return diff < 1 ? 'Vừa xong' : `${diff} phút trước`;
  };

  if (!branchId) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🍳 Màn hình bếp</h1>
          <p className="text-gray-500 text-sm">{orders.length} đơn đang chờ</p>
        </div>
        <button onClick={loadOrders} className="text-sm text-orange-500 hover:underline">
          ↻ Làm mới
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-300 text-lg">✅ Không có đơn nào đang chờ</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`rounded-xl border-2 p-4 ${STATUS_COLOR[order.status] || 'border-gray-200 bg-white'}`}
            >
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

              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {item.quantity}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {item.product.name}
                        {item.variant && (
                          <span className="text-gray-400"> · {item.variant.name}</span>
                        )}
                      </p>
                      {item.note && (
                        <p className="text-xs text-orange-600 italic">📝 {item.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handlePreparing(order.id)}
                    className="flex-1 bg-purple-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-600"
                  >
                    🔥 Bắt đầu làm
                  </button>
                )}
                {order.status === 'PREPARING' && (
                  <button
                    onClick={() => handleReady(order.id)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600"
                  >
                    ✅ Xong
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
