import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getMyBookings, cancelMyBooking } from '../../api/bookings';
import type { Booking } from '../../types';

const STATUS_MAP = {
  PENDIENTE:  { label: 'Pendiente',  cls: 'badge-pending' },
  CONFIRMADO: { label: 'Confirmado', cls: 'badge-confirmed' },
  CANCELADO:  { label: 'Cancelado',  cls: 'badge-cancelled' },
} as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

// Componente que lista las reservas activas del cliente y permite cancelar turnos pendientes.
export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Consulta al backend las próximas reservas activas del usuario autenticado.
  const load = () => {
    setLoading(true);
    getMyBookings().then(setBookings).catch(() => setError('Error al cargar reservas')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Solicita confirmación y envía la cancelación de una reserva en estado PENDIENTE.
  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setCancelling(id);
    try {
      await cancelMyBooking(id);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al cancelar');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Mis Turnos 📅</h1>
          <p className="page-subtitle">Tus próximas reservas activas</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading ? <LoadingSpinner /> : bookings.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">Sin turnos próximos</div>
              <div className="empty-sub">No tenés reservas futuras activas. ¡Reservá tu cancha!</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bookings.map(b => {
              const st = STATUS_MAP[b.status] ?? STATUS_MAP.PENDIENTE;
              return (
                <div key={b.id} className="glass-card booking-card">
                  <div>
                    <div className="booking-team">⚽ {b.team_name}</div>
                    <div className="booking-meta">
                      <span>🏟️ {b.court?.name ?? '—'}</span>
                      <span>📅 {fmtDate(b.start_time)}</span>
                      <span>⏰ {fmtTime(b.start_time)} – {fmtTime(b.end_time)}</span>
                    </div>
                    <span className={`badge ${st.cls}`} style={{ marginTop: '8px' }}>{st.label}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="booking-price">${b.price_at_booking.toLocaleString('es-AR')}</div>
                    {b.status === 'PENDIENTE' && (
                      <button className="btn btn-danger btn-sm" style={{ marginTop: '8px' }}
                        disabled={cancelling === b.id} onClick={() => handleCancel(b.id)}>
                        {cancelling === b.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
