import client from './client';
import type { AuthResponse } from '../types';

// Realiza la petición de autenticación con email y contraseña, devolviendo usuario y token.
export const login = (email: string, password: string) =>
  client.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data);

// Envía el formulario de registro de un nuevo cliente al backend.
export const register = (name: string, email: string, password: string) =>
  client.post<AuthResponse>('/auth/register', { name, email, password }).then(r => r.data);
