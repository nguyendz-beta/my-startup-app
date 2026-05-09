import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/dashboard/Dashboard'
import Profile from '../pages/users/Profile'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import POSPage from '../pages/pos/POSPage'
import MenuPage from '../pages/menu/MenuPage'
import OrdersPage from '../pages/orders/OrdersPage'
import TablesPage from '../pages/tables/TablesPage'
import StaffPage from '../pages/staff/StaffPage'
import KitchenPage from '../pages/kitchen/KitchenPage'
import ReportsPage from '../pages/reports/ReportsPage'
import BranchesPage from '../pages/branches/BranchesPage'
import QROrderPage from '../pages/qr/QROrderPage'
import ShiftsPage from '../pages/shifts/ShiftsPage'
import InventoryPage from '../pages/inventory/InventoryPage'
import LoyaltyPage from '../pages/loyalty/LoyaltyPage'
import ReservationsPage from '../pages/reservations/ReservationsPage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/qr" element={<QROrderPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}