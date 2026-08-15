import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getSettings, updateSettings } from '../../api/settings';

// Componente para configurar parámetros globales del negocio (tarifas, horarios y duración de turnos).
export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [slotDuration, setSlotDuration] = useState('');

  useEffect(() => {
    getSettings().then(s => {
      setBasePrice(String(s.base_price));
      setOpenTime(s.open_time);
      setCloseTime(s.close_time);
      setSlotDuration(String(s.slot_duration_minutes));
    }).finally(() => setLoading(false));
  }, []);

  // Envía los nuevos parámetros de configuración global al backend para guardarlos.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateSettings({
        base_price: parseFloat(basePrice),
        open_time: openTime,
        close_time: closeTime,
        slot_duration_minutes: parseInt(slotDuration),
      });
      setSuccess('Configuración guardada correctamente');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Configuración ⚙️</h1>
          <p className="page-subtitle">Ajustá los parámetros operativos del negocio</p>
        </div>

        {loading ? <LoadingSpinner /> : (
          <div style={{ maxWidth: '540px' }}>
            {success && <div className="alert alert-success">✅ {success}</div>}
            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <form onSubmit={handleSave}>
              <div className="glass-card" style={{ padding: '22px', marginBottom: '16px' }}>
                <h3 className="section-title">💰 Precio por Turno</h3>
                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-price">Precio base ($)</label>
                  <input id="cfg-price" type="number" min="0" step="100" className="form-input"
                    value={basePrice} onChange={e => setBasePrice(e.target.value)} required />
                </div>
              </div>

              <div className="glass-card" style={{ padding: '22px', marginBottom: '16px' }}>
                <h3 className="section-title">🕐 Horario Operativo</h3>
                <div className="two-col">
                  <div className="form-group">
                    <label className="form-label" htmlFor="cfg-open">Hora de apertura</label>
                    <input id="cfg-open" type="time" className="form-input"
                      value={openTime} onChange={e => setOpenTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cfg-close">Hora de cierre</label>
                    <input id="cfg-close" type="time" className="form-input"
                      value={closeTime} onChange={e => setCloseTime(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '22px', marginBottom: '20px' }}>
                <h3 className="section-title">⏱️ Duración del Turno</h3>
                <div className="form-group">
                  <label className="form-label" htmlFor="cfg-dur">Duración (minutos)</label>
                  <select id="cfg-dur" className="form-input" value={slotDuration}
                    onChange={e => setSlotDuration(e.target.value)}>
                    <option value="30">30 minutos</option>
                    <option value="60">60 minutos (1 hora)</option>
                    <option value="90">90 minutos</option>
                    <option value="120">120 minutos (2 horas)</option>
                  </select>
                </div>
              </div>

              <button id="save-settings-btn" type="submit" className="btn btn-primary btn-lg btn-full" disabled={saving}>
                {saving ? 'Guardando...' : '💾 Guardar Configuración'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
