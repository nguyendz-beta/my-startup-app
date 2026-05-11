import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: '14', label: '14 ngày' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Theo năm' },
];

const PAYMENT_LABEL: Record<string, string> = {
  CASH: '💵 Tiền mặt',
  CARD: '💳 Thẻ',
  MOMO: '🟣 MoMo',
  TRANSFER: '🏦 Chuyển khoản',
};
const SOURCE_LABEL: Record<string, string> = {
  DINE_IN: '🍽️ Tại bàn',
  TAKEAWAY: '🥡 Mang đi',
  DELIVERY: '🛵 Giao hàng',
  QR_ORDER: '📱 QR Order',
};

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const [branchId, setBranchId] = useState(user?.branch?.id || '');
  const [range, setRange] = useState('week');

  const [summary, setSummary] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [byPayment, setByPayment] = useState<any[]>([]);
  const [bySource, setBySource] = useState<any[]>([]);
  const [peakHours, setPeakHours] = useState<any[]>([]);
  const [byStaff, setByStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    const q = `branchId=${branchId}&range=${range}`;
    Promise.all([
      api.get(`/dashboard/summary?${q}`),
      api.get(`/dashboard/revenue?${q}`),
      api.get(`/dashboard/top-products?${q}`),
      api.get(`/dashboard/by-payment?${q}`),
      api.get(`/dashboard/by-source?${q}`),
      api.get(`/dashboard/peak-hours?${q}`),
      api.get(`/dashboard/by-staff?${q}`),
    ])
      .then(([s, r, tp, bp, bs, ph, st]) => {
        setSummary(s.data.data);
        setRevenue(r.data.data);
        setTopProducts(tp.data.data);
        setByPayment(bp.data.data);
        setBySource(bs.data.data);
        setPeakHours(ph.data.data);
        setByStaff(st.data.data);
      })
      .finally(() => setLoading(false));
  }, [branchId, range]);

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const pct = (n: number) => (n > 0 ? `+${n}%` : `${n}%`);
  const pctColor = (n: number) => (n >= 0 ? 'text-green-600' : 'text-red-500');

  const maxRevenue = Math.max(...revenue.map((d) => d.revenue), 1);
  const maxHour = Math.max(...peakHours.map((d) => d.orders), 1);
  const totalPayment = byPayment.reduce((s, d) => s + d.revenue, 0);
  const totalSource = bySource.reduce((s, d) => s + d.orders, 0);
  const totalProducts = topProducts.reduce((s, d) => s + d.quantity, 0);

  if (!branchId) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">📈 Báo cáo doanh thu</h1>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
          {RANGE_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setRange(o.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === o.value ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <>
          {/* Tổng quan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Hôm nay',
                value: fmt(summary?.today?.revenue || 0),
                sub: `${summary?.today?.orders || 0} đơn`,
                pct: summary?.todayVsYesterday,
                hint: 'so hôm qua',
              },
              {
                label: 'Tuần này',
                value: fmt(summary?.thisWeek?.revenue || 0),
                sub: `${summary?.thisWeek?.orders || 0} đơn`,
                pct: summary?.weekVsLastWeek,
                hint: 'so tuần trước',
              },
              {
                label: 'Tháng này',
                value: fmt(summary?.thisMonth?.revenue || 0),
                sub: `${summary?.thisMonth?.orders || 0} đơn`,
                pct: summary?.monthVsLastMonth,
                hint: 'so tháng trước',
              },
              {
                label: 'Năm nay',
                value: fmt(summary?.thisYear?.revenue || 0),
                sub: `${summary?.thisYear?.orders || 0} đơn`,
                pct: null,
                hint: '',
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <p className="text-xs text-gray-400">{card.label}</p>
                <p className="text-xl font-bold text-orange-600 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                {card.pct !== null && (
                  <p className={`text-xs font-medium mt-1 ${pctColor(card.pct)}`}>
                    {pct(card.pct)} {card.hint}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Biểu đồ doanh thu theo ngày */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">Doanh thu theo ngày</h2>
            {revenue.length === 0 ? (
              <p className="text-center text-gray-300 py-8">Không có dữ liệu</p>
            ) : (
              <div className="space-y-2">
                {revenue.map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16 flex-shrink-0">
                      {new Date(d.date).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full flex items-center px-3 transition-all"
                        style={{
                          width: `${(d.revenue / maxRevenue) * 100}%`,
                          minWidth: d.revenue > 0 ? '2%' : '0',
                        }}
                      >
                        {d.revenue > 0 && (
                          <span className="text-xs text-white font-medium truncate">
                            {fmt(d.revenue)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">{d.orders} đơn</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Giờ cao điểm */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">⏰ Giờ cao điểm</h2>
            <div className="flex items-end gap-1 h-32">
              {peakHours.map((h) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-blue-100 rounded-sm relative"
                    style={{ height: `${Math.max((h.orders / maxHour) * 100, 2)}%` }}
                  >
                    <div
                      className="w-full bg-blue-400 rounded-sm absolute bottom-0"
                      style={{ height: `${Math.max((h.orders / maxHour) * 100, 2)}%` }}
                    />
                  </div>
                  {h.hour % 3 === 0 && <span className="text-xs text-gray-300">{h.hour}h</span>}
                </div>
              ))}
            </div>
            {peakHours.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Cao điểm: {peakHours.reduce((a, b) => (a.orders > b.orders ? a : b)).hour}h (
                {peakHours.reduce((a, b) => (a.orders > b.orders ? a : b)).orders} đơn)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top sản phẩm */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-700 mb-4">🍽️ Top món bán chạy</h2>
              {topProducts.length === 0 ? (
                <p className="text-center text-gray-300 py-4">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-gray-50 text-gray-400'}`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-orange-400 h-1.5 rounded-full"
                            style={{ width: `${(p.quantity / totalProducts) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-700">{p.quantity} ly</p>
                        <p className="text-xs text-gray-400">{fmt(p.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theo nhân viên */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-700 mb-4">👤 Theo nhân viên</h2>
              {byStaff.length === 0 ? (
                <p className="text-center text-gray-300 py-4">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {byStaff.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {s.name.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.orders} đơn</p>
                      </div>
                      <p className="text-sm font-semibold text-orange-600 flex-shrink-0">
                        {fmt(s.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theo phương thức thanh toán */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-700 mb-4">💳 Phương thức thanh toán</h2>
              {byPayment.length === 0 ? (
                <p className="text-center text-gray-300 py-4">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {byPayment.map((p) => (
                    <div key={p.method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{PAYMENT_LABEL[p.method] || p.method}</span>
                        <span className="font-medium text-gray-700">{fmt(p.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-400 h-2 rounded-full"
                          style={{ width: `${(p.revenue / totalPayment) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Math.round((p.revenue / totalPayment) * 100)}% • {p.orders} đơn
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theo nguồn đơn */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-700 mb-4">🪑 Nguồn đơn hàng</h2>
              {bySource.length === 0 ? (
                <p className="text-center text-gray-300 py-4">Không có dữ liệu</p>
              ) : (
                <div className="space-y-3">
                  {bySource.map((s) => (
                    <div key={s.source}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{SOURCE_LABEL[s.source] || s.source}</span>
                        <span className="font-medium text-gray-700">{s.orders} đơn</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-400 h-2 rounded-full"
                          style={{ width: `${(s.orders / totalSource) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Math.round((s.orders / totalSource) * 100)}% • {fmt(s.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
