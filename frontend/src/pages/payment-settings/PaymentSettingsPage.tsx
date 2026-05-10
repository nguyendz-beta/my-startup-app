import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export interface PaymentConfig {
  cash: { enabled: boolean };
  momo: { enabled: boolean; phone: string; name: string };
  bank: { enabled: boolean; bankName: string; accountNumber: string; accountName: string };
}

const DEFAULT_CONFIG: PaymentConfig = {
  cash: { enabled: true },
  momo: { enabled: false, phone: '', name: '' },
  bank: { enabled: false, bankName: '', accountNumber: '', accountName: '' },
};

const BANK_LIST = [
  { bin: '970422', name: 'MB Bank' },
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'Vietinbank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'Techcombank' },
  { bin: '970407', name: 'Techcombank (TCB)' },
  { bin: '970416', name: 'ACB' },
  { bin: '970433', name: 'HDBank' },
  { bin: '970448', name: 'OCB' },
  { bin: '970454', name: 'Tiên Phong Bank' },
  { bin: '970426', name: 'MSB' },
  { bin: '970441', name: 'VIB' },
  { bin: '970400', name: 'SaigonBank' },
];

export const STORAGE_KEY = 'payment_config';

export function loadPaymentConfig(): PaymentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

export default function PaymentSettingsPage() {
  const [config, setConfig] = useState<PaymentConfig>(loadPaymentConfig);
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setTimeout(() => {
      setSaving(false);
      toast.success('Đã lưu cài đặt thanh toán!');
    }, 300);
  };

  const getBankBin = (bankName: string) => BANK_LIST.find((b) => b.name === bankName)?.bin || '';

  const getBankQRPreview = () => {
    const bin = getBankBin(config.bank.bankName);
    if (!bin || !config.bank.accountNumber) return null;
    return `https://img.vietqr.io/image/${bin}-${config.bank.accountNumber}-compact2.png?amount=50000&addInfo=Demo&accountName=${encodeURIComponent(config.bank.accountName)}`;
  };

  const getMomoQRPreview = () => {
    if (!config.momo.phone) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      `2|99|${config.momo.phone}|${config.momo.name}||0|0|50000|Demo`,
    )}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">💳 Cài đặt thanh toán</h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý các phương thức thanh toán hiển thị khi bán hàng
        </p>
      </div>

      {/* Tiền mặt */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💵</span>
            <div>
              <p className="font-semibold text-gray-800">Tiền mặt</p>
              <p className="text-xs text-gray-400">Luôn bật, không thể tắt</p>
            </div>
          </div>
          <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full font-medium">
            Đang bật
          </span>
        </div>
      </div>

      {/* MoMo */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟣</span>
            <p className="font-semibold text-gray-800">MoMo</p>
          </div>
          <button
            onClick={() =>
              setConfig((c) => ({ ...c, momo: { ...c.momo, enabled: !c.momo.enabled } }))
            }
            className={`relative w-12 h-6 rounded-full transition-colors ${config.momo.enabled ? 'bg-pink-500' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.momo.enabled ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>

        {config.momo.enabled && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Số điện thoại MoMo
                </label>
                <input
                  value={config.momo.phone}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, momo: { ...c.momo, phone: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="0384566859"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên hiển thị</label>
                <input
                  value={config.momo.name}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, momo: { ...c.momo, name: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Nguyen Van A"
                />
              </div>
            </div>
            {getMomoQRPreview() && (
              <div className="flex items-center gap-4 bg-pink-50 rounded-xl p-3">
                <img
                  src={getMomoQRPreview()!}
                  alt="MoMo QR preview"
                  className="w-20 h-20 rounded-lg"
                />
                <div>
                  <p className="text-xs text-gray-500">Xem trước QR (50.000đ demo)</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{config.momo.name}</p>
                  <p className="text-xs text-gray-500">{config.momo.phone}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chuyển khoản ngân hàng */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏦</span>
            <p className="font-semibold text-gray-800">Chuyển khoản ngân hàng</p>
          </div>
          <button
            onClick={() =>
              setConfig((c) => ({ ...c, bank: { ...c.bank, enabled: !c.bank.enabled } }))
            }
            className={`relative w-12 h-6 rounded-full transition-colors ${config.bank.enabled ? 'bg-purple-500' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.bank.enabled ? 'left-7' : 'left-1'}`}
            />
          </button>
        </div>

        {config.bank.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngân hàng</label>
              <select
                value={config.bank.bankName}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, bank: { ...c.bank, bankName: e.target.value } }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {BANK_LIST.map((b) => (
                  <option key={b.bin} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Số tài khoản</label>
                <input
                  value={config.bank.accountNumber}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, bank: { ...c.bank, accountNumber: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="0384566859"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tên chủ tài khoản
                </label>
                <input
                  value={config.bank.accountName}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, bank: { ...c.bank, accountName: e.target.value } }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  placeholder="NGUYEN VAN A"
                />
              </div>
            </div>
            {getBankQRPreview() && (
              <div className="flex items-center gap-4 bg-purple-50 rounded-xl p-3">
                <img
                  src={getBankQRPreview()!}
                  alt="Bank QR preview"
                  className="w-20 h-20 rounded-lg"
                />
                <div>
                  <p className="text-xs text-gray-500">Xem trước QR (50.000đ demo)</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">{config.bank.accountName}</p>
                  <p className="text-xs text-gray-500">
                    {config.bank.bankName} · {config.bank.accountNumber}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
      >
        {saving ? '⏳ Đang lưu...' : '💾 Lưu cài đặt'}
      </button>
    </div>
  );
}
