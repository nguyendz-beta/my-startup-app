import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/pos', label: 'Bán hàng', icon: '🛒' },
  { to: '/orders', label: 'Đơn hàng', icon: '📋' },
  { to: '/tables', label: 'Sơ đồ bàn', icon: '🪑' },
  { to: '/menu', label: 'Thực đơn', icon: '🍽️' },
  { to: '/profile', label: 'Tài khoản', icon: '👤' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-orange-600">☕ {user?.tenant.name}</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.branch?.name || 'Tất cả chi nhánh'}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
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
          <p className="text-xs text-gray-400">{user?.role}</p>
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
