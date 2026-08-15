import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Login from '../pages/Login';

// Mock del AuthContext: provee un login() sin-op y user=null
vi.mock('../store/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), user: null, isAuthenticated: false }),
}));

// Mock de la API de auth para evitar llamadas HTTP reales
vi.mock('../api/auth', () => ({
  login: vi.fn(),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

// Test 1: botón deshabilitado cuando los campos están vacíos
describe('Login — botón Ingresar', () => {
  it('está deshabilitado si email y contraseña están vacíos', () => {
    renderLogin();
    const btn = screen.getByRole('button', { name: /ingresar/i });
    expect(btn).toBeDisabled();
  });

  // Test 2: botón se habilita al completar ambos campos
  it('se habilita cuando email y contraseña tienen contenido', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@ejemplo.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123');

    const btn = screen.getByRole('button', { name: /ingresar/i });
    expect(btn).not.toBeDisabled();
  });
});
