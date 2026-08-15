import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/client/Dashboard';
import BookingCalendar from './pages/client/BookingCalendar';
import MyBookings from './pages/client/MyBookings';
import AdminDashboard from './pages/admin/Dashboard';
import BookingGrid from './pages/admin/BookingGrid';
import CourtManager from './pages/admin/CourtManager';
import AdminSettings from './pages/admin/Settings';

function AppRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user?.role === 'ADMIN') {
    return (
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<BookingGrid />} />
        <Route path="/admin/courts" element={<CourtManager />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<ClientDashboard />} />
      <Route path="/reservar" element={<BookingCalendar />} />
      <Route path="/mis-turnos" element={<MyBookings />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
