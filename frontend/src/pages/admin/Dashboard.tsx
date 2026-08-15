import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getDashboardStats } from '../../api/dashboard';
import type { DashboardStats } from '../../types';

// Componente del panel de control del administrador con métricas mensuales y recaudación.
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => setError('Error al cargar estadísticas')).finally(() => setLoading(false));
  }, []);

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es });
  const total = stats ? stats.confirmed_count + stats.pending_count + stats.cancelled_count : 0;
  const rate = total > 0 && stats ? Math.round((stats.confirmed_count / total) * 100) : 0;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Dashboard 📊</h1>
          <p className="page-subtitle" style={{ textTransform: 'capitalize' }}>Estadísticas de {currentMonth}</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {loading ? <LoadingSpinner /> : stats && (
          <>
            <div className="stats-grid">
              <div className="glass-card stat-card accent">
                <div className="stat-icon">💰</div>
                <div className="stat-value">${stats.month_revenue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                <div className="stat-label">Ingresos del mes (solo confirmados)</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.confirmed_count}</div>
                <div className="stat-label">Turnos confirmados</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.pending_count}</div>
                <div className="stat-label">Turnos pendientes</div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon">❌</div>
                <div className="stat-value">{stats.cancelled_count}</div>
                <div className="stat-label">Turnos cancelados</div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '22px' }}>
              <h3 className="section-title">📈 Resumen mensual</h3>
              {[
                { label: 'Total de reservas del mes', value: total },
                { label: 'Tasa de confirmación', value: `${rate}%` },
                { label: 'Ingreso promedio por turno', value: stats.confirmed_count > 0 ? `$${(stats.month_revenue / stats.confirmed_count).toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{label}</span>
                  <span style={{ fontWeight: '700' }}>{value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
