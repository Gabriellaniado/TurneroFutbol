import { useState, useEffect } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek,
  addDays, isSameMonth, isBefore, isToday, isSameDay, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getCourts } from '../../api/courts';
import { getAvailability, createBooking } from '../../api/bookings';
import type { Court, TimeSlot } from '../../types';

// Genera la cuadrícula de días para el mes seleccionado incluyendo días de padding del calendario.
function buildCalendar(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfMonth(month);
  const days: Date[] = [];
  let d = start;
  while (d <= end || days.length % 7 !== 0) {
    days.push(d);
    d = addDays(d, 1);
    if (days.length > 42) break;
  }
  return days;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

// Componente interactivo para seleccionar cancha, fecha y horario para reservar un turno.
export default function BookingCalendar() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtId, setCourtId] = useState('');
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [teamName, setTeamName] = useState('');
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getCourts().then(data => {
      setCourts(data);
      if (data.length > 0) setCourtId(data[0].id);
    }).finally(() => setLoadingCourts(false));
  }, []);

  useEffect(() => {
    if (!selectedDate || !courtId) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getAvailability(courtId, format(selectedDate, 'yyyy-MM-dd'))
      .then(setSlots).catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, courtId]);

  // Envía la solicitud de reserva al backend y resetea el formulario al completar.
  const handleSubmit = async () => {
    if (!selectedSlot || !teamName.trim() || !courtId) return;
    setSubmitting(true); setError('');
    try {
      await createBooking(courtId, teamName.trim(), selectedSlot.start_time);
      setSuccess('¡Reserva creada! El administrador la confirmará a la brevedad.');
      setSelectedDate(null); setSelectedSlot(null); setTeamName(''); setSlots([]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const days = buildCalendar(month);
  const today = startOfDay(new Date());
  const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  if (loadingCourts) return (
    <div className="app-layout"><Sidebar /><main className="main-content"><LoadingSpinner /></main></div>
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Reservar Turno ⚽</h1>
          <p className="page-subtitle">Elegí cancha, fecha y horario disponible</p>
        </div>

        {success && <div className="alert alert-success">✅ {success}</div>}
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <div className="booking-flow">
          {/* LEFT: Court selector + Calendar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <h3 className="section-title">🏟️ Cancha</h3>
              {courts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No hay canchas disponibles</p>
              ) : (
                <select id="court-select" className="form-input" value={courtId}
                  onChange={e => { setCourtId(e.target.value); setSelectedSlot(null); setSlots([]); }}>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.description ? ` — ${c.description}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="calendar-wrapper">
              <div className="calendar-header">
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setMonth(m => addDays(startOfMonth(m), -1))}>‹</button>
                <span className="calendar-month">{format(month, 'MMMM yyyy', { locale: es })}</span>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setMonth(m => addDays(endOfMonth(m), 1))}>›</button>
              </div>

              <div className="calendar-grid">
                {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                {days.map((d, i) => {
                  const outMonth = !isSameMonth(d, month);
                  // RN #5: past days are disabled
                  const past = isBefore(d, today) && !isToday(d);
                  const sel = selectedDate ? isSameDay(d, selectedDate) : false;
                  const todayDay = isToday(d);

                  let cls = 'cal-day';
                  if (outMonth) cls += ' cal-empty';
                  else if (past) cls += ' cal-disabled';
                  else if (sel) cls += ' cal-selected';
                  else if (todayDay) cls += ' cal-today';

                  return (
                    <div key={i} className={cls}
                      aria-disabled={past || outMonth}
                      onClick={() => !past && !outMonth && (setSelectedDate(d), setError(''), setSuccess(''))}>
                      {outMonth ? '' : d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Slots + Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!selectedDate ? (
              <div className="glass-card">
                <div className="empty-state">
                  <div className="empty-icon">📆</div>
                  <div className="empty-title">Seleccioná una fecha</div>
                  <div className="empty-sub">Hacé click en un día del calendario para ver los horarios</div>
                </div>
              </div>
            ) : loadingSlots ? (
              <div className="glass-card"><LoadingSpinner text="Cargando horarios..." /></div>
            ) : (
              <div className="glass-card" style={{ padding: '20px' }}>
                <h3 className="section-title">
                  ⏰ {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                {slots.length === 0 ? (
                  <div className="empty-state" style={{ padding: '28px' }}>
                    <div className="empty-icon">🚫</div>
                    <div className="empty-title">Sin horarios disponibles</div>
                  </div>
                ) : (
                  <div className="slots-grid">
                    {slots.map((s, i) => {
                      const isSel = selectedSlot?.start_time === s.start_time;
                      return (
                        <button key={i} disabled={!s.available}
                          className={`slot ${!s.available ? 'taken' : isSel ? 'avail sel' : 'avail'}`}
                          onClick={() => s.available && setSelectedSlot(s)}>
                          <div>{fmtTime(s.start_time)}</div>
                          <div style={{ fontSize: '10px', marginTop: '2px', opacity: .7 }}>
                            {s.available ? 'Libre' : 'Ocupado'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Booking form — shown only after slot selection (RN #6) */}
            {selectedSlot && (
              <div className="glass-card" style={{ padding: '22px' }}>
                <h3 className="section-title">✍️ Confirmar Reserva</h3>
                <div style={{ background: 'rgba(0,212,126,.07)', border: '1px solid rgba(0,212,126,.2)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    📅 {format(selectedDate!, "EEEE d 'de' MMMM", { locale: es })}
                  </div>
                  <div style={{ color: 'var(--accent)', fontWeight: '700', marginTop: '4px' }}>
                    ⏰ {fmtTime(selectedSlot.start_time)} — {fmtTime(selectedSlot.end_time)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="team-name">Nombre del equipo / grupo</label>
                  <input id="team-name" type="text" className="form-input"
                    placeholder="Los Campeones FC"
                    value={teamName} onChange={e => setTeamName(e.target.value)} autoFocus />
                </div>

                {/* RN #6: button disabled until team name is filled */}
                <button id="confirm-booking-btn" className="btn btn-primary btn-full"
                  disabled={!teamName.trim() || submitting}
                  onClick={handleSubmit}>
                  {submitting ? 'Creando reserva...' : '✓ Confirmar Reserva'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
