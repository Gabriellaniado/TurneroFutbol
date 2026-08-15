import client from './client';
import type { Settings } from '../types';

// Consulta la configuración global del establecimiento (precios, horarios de apertura y cierre).
export const getSettings = () => client.get<Settings>('/settings').then(r => r.data);

// Actualiza los parámetros de configuración del complejo desde el panel de admin.
export const updateSettings = (payload: Partial<Settings>) =>
  client.put<Settings>('/settings', payload).then(r => r.data);
