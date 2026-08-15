import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import Sidebar from '../../components/Sidebar';

// Componente de bienvenida para clientes con accesos rápidos a reservas y guía de uso.
export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const h = new Date().getHours();
  const greeting = h < 12 ? '¡Buenos días' : h < 18 ? '¡Buenas tardes' : '¡Buenas noches';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">{greeting}, {user?.name.split(' ')[0]}! ⚽</h1>
          <p className="page-subtitle">¿Qué querés hacer hoy?</p>
        </div>

        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/reservar')}>
            <div className="stat-icon">📅</div>
            <div className="stat-value" style={{ fontSize: '22px' }}>Reservar Turno</div>
            <div className="stat-label">Elegí cancha, fecha y horario</div>
            <div style={{ marginTop: '16px' }}>
              <span className="btn btn-primary btn-sm">Reservar ahora →</span>
            </div>
          </div>

          <div className="glass-card stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/mis-turnos')}>
            <div className="stat-icon">🏟️</div>
            <div className="stat-value" style={{ fontSize: '22px' }}>Mis Turnos</div>
            <div className="stat-label">Ver tus reservas futuras</div>
            <div style={{ marginTop: '16px' }}>
              <span className="btn btn-secondary btn-sm">Ver turnos →</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 className="section-title">📖 ¿Cómo funciona?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '16px', marginTop: '8px' }}>
            {[
              { n: '1', icon: '🏟️', label: 'Elegí la cancha' },
              { n: '2', icon: '📆', label: 'Seleccioná fecha y horario' },
              { n: '3', icon: '✍️', label: 'Ingresá tu equipo' },
              { n: '4', icon: '✅', label: 'El admin confirma' },
            ].map(({ n, icon, label }) => (
              <div key={n} style={{ textAlign: 'center', padding: '14px' }}>
                <div style={{ fontSize: '30px', marginBottom: '8px' }}>{icon}</div>
                <div style={{ width: '22px', height: '22px', background: 'var(--accent)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{n}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
