import client from './client';
import type { Booking, TimeSlot } from '../types';

// Obtiene las reservas futuras del cliente actualmente autenticado.
export const getMyBookings = () => client.get<Booking[]>('/bookings/my').then(r => r.data);

// Obtiene el historial completo de todas las reservas para el panel de administración.
export const getAllBookings = () => client.get<Booking[]>('/bookings').then(r => r.data);

// Consulta los bloques horarios y su disponibilidad para una cancha y fecha dadas.
export const getAvailability = (courtId: string, date: string) =>
  client.get<{ slots: TimeSlot[] }>('/bookings/availability', { params: { court_id: courtId, date } })
    .then(r => r.data.slots ?? []);

// Envía la solicitud para reservar un turno con la cancha, equipo y horario elegido.
export const createBooking = (courtId: string, teamName: string, startTime: string) =>
  client.post<Booking>('/bookings', { court_id: courtId, team_name: teamName, start_time: startTime }).then(r => r.data);

// Actualiza el estado (CONFIRMADO, CANCELADO) de una reserva desde el panel admin.
export const updateBookingStatus = (id: string, status: string) =>
  client.patch<Booking>(`/bookings/${id}/status`, { status }).then(r => r.data);

// Permite al cliente autenticado cancelar su propia reserva en estado PENDIENTE.
export const cancelMyBooking = (id: string) =>
  client.patch<Booking>(`/bookings/${id}/cancel`, {}).then(r => r.data);
