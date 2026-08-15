import client from './client';
import type { DashboardStats } from '../types';

// Obtiene del backend las métricas e ingresos mensuales para el panel del administrador.
export const getDashboardStats = () =>
  client.get<DashboardStats>('/dashboard/stats').then(r => r.data);
