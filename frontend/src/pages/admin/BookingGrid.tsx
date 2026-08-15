import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getAllBookings, updateBookingStatus } from '../../api/bookings';
import type { Booking } from '../../types';

const STATUS_MAP = {
  PENDIENTE:  { label: 'Pendiente',  cls: 'badge-pending' },
  CONFIRMADO: { label: 'Confirmado', cls: 'badge-confirmed' },
  CANCELADO:  { label: 'Cancelado',  cls: 'badge-cancelled' },
} as const;

const FILTERS = [
  { value: 'all',       label: 'Todas' },
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'CONFIRMADO',label: 'Confirmadas' },
  { value: 'CANCELADO', label: 'Canceladas' },
];

const fmtDT = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Componente de tabla para visualizar, filtrar y actualizar el estado de todas las reservas.
export default function BookingGrid() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  // Carga el listado completo de reservas desde el backend.
  const load = () => {
    setLoading(true);
    getAllBookings().then(setBookings).catch(() => setError('Error al cargar')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Modifica el estado de una reserva (confirmar o cancelar) y recarga los datos.
  const handleStatus = async (id: string, status: string) => {
    setUpdating(id); setError('');
    try { await updateBookingStatus(id, status); load(); }
    catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al actualizar');
    } finally { setUpdating(null); }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Turnero Global 📋</h1>
          <p className="page-subtitle">Gestión de todas las reservas</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTERS.map(f => (
            <button key={f.value} className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f.value)}>{f.label}</button>
          ))}
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: '13px' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No hay reservas</div>
            </div>
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Cliente</th>
                  <th>Cancha</th>
                  <th>Inicio</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => {
                  const st = STATUS_MAP[b.status] ?? STATUS_MAP.PENDIENTE;
                  const busy = updating === b.id;
                  return (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{b.team_name}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{b.user?.name ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.user?.email}</div>
                      </td>
                      <td>{b.court?.name ?? '—'}</td>
                      <td style={{ fontSize: '12px' }}>{fmtDT(b.start_time)}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                        ${b.price_at_booking.toLocaleString('es-AR')}
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {b.status === 'PENDIENTE' && (
                            <button className="btn btn-success btn-sm" disabled={busy}
                              onClick={() => handleStatus(b.id, 'CONFIRMADO')}>✓ Confirmar</button>
                          )}
                          {b.status !== 'CANCELADO' && (
                            <button className="btn btn-danger btn-sm" disabled={busy}
                              onClick={() => handleStatus(b.id, 'CANCELADO')}>✕ Cancelar</button>
                          )}
                          {b.status === 'CANCELADO' && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
