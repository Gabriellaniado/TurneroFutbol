import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { login as loginApi } from '../api/auth';

// Componente de la página de inicio de sesión de usuarios y administradores.
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Envía las credenciales ingresadas al backend y redirige al usuario tras el login exitoso.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      login(data.user, data.token);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al iniciar sesión');
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

        <h2 className="auth-title">Iniciar Sesión</h2>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input id="login-email" type="email" className="form-input" placeholder="tu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Contraseña</label>
            <input id="login-password" type="password" className="form-input" placeholder="••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg"
            disabled={loading || !email || !password}>
            {loading ? 'Ingresando...' : '→ Ingresar'}
          </button>
        </form>

        <p className="auth-link">
          ¿No tenés cuenta? <Link to="/register">Registrarte</Link>
        </p>

        <div style={{ marginTop: '20px', padding: '12px 14px', background: 'rgba(0,212,126,.06)', borderRadius: '8px', border: '1px solid rgba(0,212,126,.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Demo admin:</strong> admin@turnero.com / admin123
        </div>
      </div>
    </div>
  );
}
