import { useState } from 'react';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'CASH', label: 'Tiền mặt', icon: '💵', color: 'border-green-400 bg-green-50' },
  { id: 'CARD', label: 'Thẻ ngân hàng', icon: '💳', color: 'border-blue-400 bg-blue-50' },
  { id: 'MOMO', label: 'MoMo', icon: '🟣', color: 'border-pink-400 bg-pink-50' },
  { id: 'VNPAY', label: 'VNPay', icon: '🔵', color: 'border-blue-600 bg-blue-50' },
  { id: 'TRANSFER', label: 'Chuyển khoản', icon: '🏦', color: 'border-purple-400 bg-purple-50' },
];

interface Props {
  total: number;
  onClose: () => void;
  onConfirm: (method: string, received: number, change: number) => Promise<void>;
}

export default function PaymentModal({ total, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState('CASH');
  const [received, setReceived] = useState(total.toString());
  const [confirming, setConfirming] = useState(false);

  const receivedNum = parseFloat(received) || 0;
  const change = Math.max(0, receivedNum - total);

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const quickAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 4);

  const handleConfirm = async () => {
    if (confirming) return;
    if (method === 'CASH' && receivedNum < total) {
      toast.error('Số tiền nhận chưa đủ!');
      return;
    }
    setConfirming(true);
    try {
      await onConfirm(method, receivedNum, change);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl text-gray-800">Thanh toán</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="bg-orange-50 rounded-xl p-4 mb-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
          <p className="text-3xl font-bold text-orange-600">{fmt(total)}</p>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              disabled={confirming}
              className={`border-2 rounded-xl p-3 text-center transition-all ${
                method === m.id
                  ? m.color + ' border-opacity-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="text-xl mb-1">{m.icon}</div>
              <div className="text-xs font-medium text-gray-700">{m.label}</div>
            </button>
          ))}
        </div>

        {method === 'CASH' && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Tiền khách đưa</p>
            <input
              type="number"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              disabled={confirming}
              className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl text-lg font-bold text-center focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2 mt-2">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setReceived(a.toString())}
                  disabled={confirming}
                  className="flex-1 py-1.5 text-xs bg-gray-100 hover:bg-orange-100 rounded-lg text-gray-600 font-medium transition-colors"
                >
                  {fmt(a)}
                </button>
              ))}
            </div>
            {receivedNum >= total && (
              <div className="mt-3 bg-green-50 rounded-xl p-3 flex justify-between items-center">
                <span className="text-sm text-green-700 font-medium">Tiền thối</span>
                <span className="text-lg font-bold text-green-600">{fmt(change)}</span>
              </div>
            )}
          </div>
        )}

        {['MOMO', 'VNPAY'].includes(method) && (
          <div className="mb-4 text-center py-6 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-2">📱</div>
            <p className="text-sm text-gray-500">Khách quét mã QR để thanh toán</p>
            <p className="text-xs text-gray-400 mt-1">
              {method === 'MOMO' ? 'MoMo' : 'VNPay'} · {fmt(total)}
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {confirming ? '⏳ Đang xử lý...' : '✓ Xác nhận thanh toán'}
        </button>
      </div>
    </div>
  );
}
