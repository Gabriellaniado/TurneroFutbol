import client from './client';
import type { Court } from '../types';

// Obtiene la lista de todas las canchas de fútbol activas.
export const getCourts = () => client.get<Court[]>('/courts').then(r => r.data);

// Envía la creación de una nueva cancha deportiva al backend.
export const createCourt = (name: string, description: string) =>
  client.post<Court>('/courts', { name, description }).then(r => r.data);

// Modifica las propiedades o estado de activación de una cancha.
export const updateCourt = (id: string, payload: Partial<Court>) =>
  client.put<Court>(`/courts/${id}`, payload).then(r => r.data);

// Solicita la baja lógica de una cancha por su ID.
export const deleteCourt = (id: string) => client.delete(`/courts/${id}`);
