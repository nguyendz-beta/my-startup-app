import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useRole } from '../../hooks/useRole';

const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { to: '/pos', label: 'Bán hàng', icon: '🛒', roles: ['OWNER', 'MANAGER', 'CASHIER', 'WAITER'] },
  {
    to: '/orders',
    label: 'Đơn hàng',
    icon: '📋',
    roles: ['OWNER', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN'],
  },
  {
    to: '/tables',
    label: 'Sơ đồ bàn',
    icon: '🪑',
    roles: ['OWNER', 'MANAGER', 'CASHIER', 'WAITER'],
  },
  { to: '/kitchen', label: 'Màn hình bếp', icon: '🍳', roles: ['OWNER', 'MANAGER', 'KITCHEN'] },
  { to: '/menu', label: 'Thực đơn', icon: '🍽️', roles: ['OWNER', 'MANAGER'] },
  { to: '/staff', label: 'Nhân viên', icon: '👥', roles: ['OWNER', 'MANAGER'] },
  { to: '/branches', label: 'Chi nhánh', icon: '🏪', roles: ['OWNER'] },
  { to: '/inventory', label: 'Kho hàng', icon: '📦', roles: ['OWNER', 'MANAGER'] },
  { to: '/shifts', label: 'Báo cáo ca', icon: '🕐', roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  {
    to: '/reservations',
    label: 'Đặt bàn',
    icon: '📅',
    roles: ['OWNER', 'MANAGER', 'CASHIER', 'WAITER'],
  },
  { to: '/loyalty', label: 'Khách hàng', icon: '🎁', roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { to: '/qr', label: 'QR Order', icon: '📱', roles: ['OWNER', 'MANAGER'] },
  { to: '/reports', label: 'Báo cáo', icon: '📈', roles: ['OWNER', 'MANAGER'] },
  {
    to: '/profile',
    label: 'Tài khoản',
    icon: '👤',
    roles: ['OWNER', 'MANAGER', 'CASHIER', 'KITCHEN', 'WAITER'],
  },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  OWNER: { label: 'Chủ quán', color: 'text-orange-600 bg-orange-50' },
  MANAGER: { label: 'Quản lý', color: 'text-blue-600 bg-blue-50' },
  CASHIER: { label: 'Thu ngân', color: 'text-green-600 bg-green-50' },
  KITCHEN: { label: 'Bếp', color: 'text-purple-600 bg-purple-50' },
  WAITER: { label: 'Phục vụ', color: 'text-pink-600 bg-pink-50' },
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { role, canAccess } = useRole();

  const navItems = ALL_NAV_ITEMS.filter((item) => canAccess(item.roles as any[]));

  const badge = role ? ROLE_BADGE[role] : null;

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-orange-600">☕ {user?.tenant.name}</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.branch?.name || 'Tất cả chi nhánh'}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          {badge && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${badge.color}`}
            >
              {badge.label}
            </span>
          )}
        </div>
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
}

