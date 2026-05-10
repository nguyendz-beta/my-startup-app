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
  { id: 'VNPAY', label: 'Chuyển khoản', icon: '🏦', color: 'border-purple-400 bg-purple-50' },
];

// Thông tin thanh toán
const MOMO_PHONE = '0384566859';
const MOMO_NAME = 'Dang Minh Nguyen';
const BANK_BIN = '970422'; // MB Bank BIN
const BANK_ACCOUNT = '0384566859';
const BANK_NAME = 'Dang Minh Nguyen';

const getMomoQR = (amount: number) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `2|99|${MOMO_PHONE}|${MOMO_NAME}||0|0|${amount}|Thanh toan don hang`
  )}`;

const getBankQR = (amount: number) =>
  `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=Thanh%20toan%20don%20hang&accountName=${encodeURIComponent(BANK_NAME)}`;

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
  ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4);

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="bg-orange-50 rounded-xl p-4 mb-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Tổng thanh toán</p>
          <p className="text-3xl font-bold text-orange-600">{fmt(total)}</p>
        </div>

        <p className="text-sm font-medium text-gray-700 mb-2">Phương thức thanh toán</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
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

        {/* Tiền mặt */}
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

        {/* Thẻ ngân hàng */}
        {method === 'CARD' && (
          <div className="mb-4 text-center py-6 bg-blue-50 rounded-xl">
            <div className="text-4xl mb-2">💳</div>
            <p className="text-sm text-blue-700 font-medium">Quẹt thẻ tại máy POS</p>
            <p className="text-xs text-blue-400 mt-1">Xác nhận sau khi máy báo thành công</p>
          </div>
        )}

        {/* MoMo QR */}
        {method === 'MOMO' && (
          <div className="mb-4 text-center">
            <div className="bg-pink-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-pink-700 mb-3">🟣 Quét mã MoMo</p>
              <img
                src={getMomoQR(total)}
                alt="MoMo QR"
                className="w-48 h-48 mx-auto rounded-lg border-2 border-pink-200"
              />
              <p className="text-sm font-bold text-gray-800 mt-3">{MOMO_NAME}</p>
              <p className="text-xs text-gray-500">{MOMO_PHONE}</p>
              <p className="text-lg font-bold text-pink-600 mt-1">{fmt(total)}</p>
            </div>
          </div>
        )}

        {/* Chuyển khoản MB Bank QR */}
        {method === 'VNPAY' && (
          <div className="mb-4 text-center">
            <div className="bg-purple-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-700 mb-3">🏦 Quét mã chuyển khoản MB Bank</p>
              <img
                src={getBankQR(total)}
                alt="Bank QR"
                className="w-48 h-48 mx-auto rounded-lg border-2 border-purple-200"
              />
              <p className="text-sm font-bold text-gray-800 mt-3">{BANK_NAME}</p>
              <p className="text-xs text-gray-500">MB Bank · {BANK_ACCOUNT}</p>
              <p className="text-lg font-bold text-purple-600 mt-1">{fmt(total)}</p>
            </div>
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