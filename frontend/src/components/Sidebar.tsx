import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const clientNav = [
  { path: '/dashboard', label: 'Inicio', icon: '🏠' },
  { path: '/reservar', label: 'Reservar Turno', icon: '⚽' },
  { path: '/mis-turnos', label: 'Mis Turnos', icon: '📅' },
];

const adminNav = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/bookings', label: 'Turnero', icon: '📋' },
  { path: '/admin/courts', label: 'Canchas', icon: '🏟️' },
  { path: '/admin/settings', label: 'Configuración', icon: '⚙️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'ADMIN' ? adminNav : clientNav;
  const initials = user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⚽</div>
        <div>
          <div className="sidebar-logo-text">Turnero</div>
          <div className="sidebar-logo-sub">Cancha de Fútbol</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section">Menú</span>
        {nav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
