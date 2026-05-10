import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { tableApi } from '../../api/tableApi';
import { useAuthStore } from '../../store/authStore';

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
}

export default function QROrderPage() {
  const user = useAuthStore((s) => s.user);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Table | null>(null);

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

  const baseUrl = window.location.origin;

  useEffect(() => {
    if (!branchId) return;
    tableApi
      .getTables(branchId)
      .then((r) => setTables(r.data.data))
      .finally(() => setLoading(false));
  }, [branchId]);

  const getQRUrl = (tableId: string) => `${baseUrl}/order?branchId=${branchId}&tableId=${tableId}`;

  const handlePrint = (table: Table) => {
    const qrUrl = getQRUrl(table.id);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${table.name}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #666; margin-bottom: 24px; }
            img { width: 250px; height: 250px; }
            .footer { margin-top: 16px; font-size: 14px; color: #999; }
          </style>
        </head>
        <body>
          <h1>${user?.tenant?.name}</h1>
          <p>${table.name} · Quét mã để gọi món</p>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}" />
          <div class="footer">${qrUrl}</div>
          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  if (!branchId) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">QR Order</h1>
        <p className="text-gray-500 text-sm mt-1">Khách quét mã QR để tự gọi món</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Đang tải...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center cursor-pointer hover:border-orange-300 transition-all"
              onClick={() => setSelected(table)}
            >
              <div className="flex justify-center mb-3">
                <QRCodeSVG value={getQRUrl(table.id)} size={120} fgColor="#ea580c" level="M" />
              </div>
              <p className="font-bold text-gray-800">{table.name}</p>
              <p className="text-xs text-gray-400 mt-1">{table.capacity} người</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrint(table);
                }}
                className="mt-3 w-full text-xs bg-gray-100 hover:bg-orange-100 text-gray-600 hover:text-orange-600 py-1.5 rounded-lg transition-colors font-medium"
              >
                🖨️ In QR
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal xem to */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-xl text-gray-800 mb-1">{selected.name}</h2>
            <p className="text-gray-400 text-sm mb-6">Quét mã để gọi món</p>
            <div className="flex justify-center mb-6">
              <QRCodeSVG
                value={getQRUrl(selected.id)}
                size={220}
                fgColor="#ea580c"
                level="M"
                includeMargin
              />
            </div>
            <p className="text-xs text-gray-400 mb-4 break-all">{getQRUrl(selected.id)}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handlePrint(selected)}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600"
              >
                🖨️ In QR
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
