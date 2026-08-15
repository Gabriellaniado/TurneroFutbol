import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { register as registerApi } from '../api/auth';

// Componente de la página de registro para nuevos clientes en el sistema.
export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Envía los datos del formulario de registro y autentica automáticamente la sesión.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerApi(name, email, password);
      login(data.user, data.token);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">⚽</span>
          <h1 className="auth-logo-title">Turnero</h1>
          <p className="auth-logo-sub">Sistema de Reservas · Cancha de Fútbol</p>
        </div>

        <h2 className="auth-title">Crear Cuenta</h2>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Nombre completo</label>
            <input id="reg-name" type="text" className="form-input" placeholder="Juan Pérez"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className="form-input" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Contraseña (mín. 6 caracteres)</label>
            <input id="reg-password" type="password" className="form-input" placeholder="••••••"
              value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          <button id="register-submit" type="submit" className="btn btn-primary btn-full btn-lg"
            disabled={loading || !name || !email || password.length < 6}>
            {loading ? 'Creando cuenta...' : '→ Crear Cuenta'}
          </button>
        </form>

        <p className="auth-link">
          ¿Ya tenés cuenta? <Link to="/login">Iniciar Sesión</Link>
        </p>
      </div>
    </div>
  );
}
