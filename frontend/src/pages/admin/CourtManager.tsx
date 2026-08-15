import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getCourts, createCourt, updateCourt, deleteCourt } from '../../api/courts';
import type { Court } from '../../types';

// Componente de administración para crear, editar, listar y desactivar canchas deportivas.
export default function CourtManager() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Court | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Consulta al backend la lista de canchas disponibles.
  const load = () => { setLoading(true); getCourts().then(setCourts).finally(() => setLoading(false)); };
  useEffect(load, []);

  // Abre el modal para dar de alta una nueva cancha.
  const openCreate = () => { setEditing(null); setName(''); setDesc(''); setError(''); setShowModal(true); };
  // Abre el modal precargando los datos de la cancha seleccionada para su edición.
  const openEdit = (c: Court) => { setEditing(c); setName(c.name); setDesc(c.description); setError(''); setShowModal(true); };

  // Guarda los cambios o crea una nueva cancha validando los campos ingresados.
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true); setError('');
    try {
      if (editing) await updateCourt(editing.id, { name, description: desc, is_active: editing.is_active });
      else await createCourt(name, desc);
      setShowModal(false); load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'Error al guardar');
    } finally { setSaving(false); }
  };

  // Solicita confirmación y ejecuta la desactivación lógica de la cancha.
  const handleDelete = async (id: string, courtName: string) => {
    if (!confirm(`¿Desactivar la cancha "${courtName}"?`)) return;
    try { await deleteCourt(id); load(); }
    catch { setError('Error al desactivar'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 className="page-title">Canchas 🏟️</h1>
            <p className="page-subtitle">Gestión de canchas disponibles</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Nueva Cancha</button>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading ? <LoadingSpinner /> : courts.length === 0 ? (
          <div className="glass-card">
            <div className="empty-state">
              <div className="empty-icon">🏟️</div>
              <div className="empty-title">No hay canchas registradas</div>
              <div className="empty-sub">Agregá la primera cancha para empezar</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
            {courts.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '30px' }}>🏟️</div>
                  <span style={{ fontSize: '11px', padding: '3px 9px', borderRadius: '100px', background: c.is_active ? 'rgba(0,212,126,.15)' : 'rgba(255,77,109,.15)', color: c.is_active ? 'var(--accent)' : 'var(--danger)' }}>
                    {c.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px' }}>{c.name}</div>
                {c.description && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{c.description}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>✏️ Editar</button>
                  {c.is_active && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.name)}>🗑️ Desactivar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <div className="modal">
              <div className="modal-header">
                <h3 className="modal-title">{editing ? 'Editar Cancha' : 'Nueva Cancha'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <div className="form-group">
                <label className="form-label" htmlFor="court-name">Nombre</label>
                <input id="court-name" type="text" className="form-input" placeholder="Cancha 1 — Césped Natural"
                  value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="court-desc">Descripción (opcional)</label>
                <input id="court-desc" type="text" className="form-input" placeholder="Medidas, vestuarios..."
                  value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-full" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary btn-full" disabled={!name.trim() || saving} onClick={handleSave}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
