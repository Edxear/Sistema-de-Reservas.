import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  getMyTeleconsultas,
  createTeleconsulta,
  updateTeleconsultaStatus,
  buscarUsuarios,
} from '../../services/teleconsultaService';
import styles from './Teleconsultas.module.css';

const ESTADOS = ['programada', 'en_curso', 'finalizada', 'cancelada'];
const ESTADO_ICONO = {
  programada: '📅',
  en_curso: '📞',
  finalizada: '✅',
  cancelada: '❌',
};

const ESTADO_CFG = {
  programada: { bg: '#eff6ff', borde: '#93c5fd', texto: '#1e3a8a', label: 'Programada' },
  en_curso:   { bg: '#fef9c3', borde: '#f59e0b', texto: '#92400e', label: 'En curso'   },
  finalizada: { bg: '#d1fae5', borde: '#10b981', texto: '#065f46', label: 'Finalizada' },
  cancelada:  { bg: '#f3f4f6', borde: '#9ca3af', texto: '#4b5563', label: 'Cancelada'  },
};

const canCreate = (role) => ['medico', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());
const isPacient = (role) => String(role || '').toLowerCase() === 'paciente';

const initialForm = {
  pacienteId: '',
  pacienteNombre: '',
  medicoId: '',
  medicoNombre: '',
  fechaProgramada: '',
  enlaceSala: '',
  notas: '',
};

export default function Teleconsultas() {
  const { user } = useAuth();
  const role = user?.rol;
  const userId = user?.id;

  const [teleconsultas, setTeleconsultas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPaciente, setSearchingPaciente] = useState(false);
  const patientSearchTimeout = useRef(null);

  // Medico search
  const [medicoSearch, setMedicoSearch] = useState('');
  const [medicoResults, setMedicoResults] = useState([]);
  const [searchingMedico, setSearchingMedico] = useState(false);
  const medicoSearchTimeout = useRef(null);

  // Status edit
  const [editingId, setEditingId] = useState(null);
  const [editEstado, setEditEstado] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Tab view
  const [viewTab, setViewTab] = useState('proximas');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyTeleconsultas();
      setTeleconsultas(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cargar las teleconsultas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const buscarPaciente = (term) => {
    setPatientSearch(term);
    clearTimeout(patientSearchTimeout.current);
    if (term.length < 2) { setPatientResults([]); return; }
    patientSearchTimeout.current = setTimeout(async () => {
      setSearchingPaciente(true);
      try {
        const res = await buscarUsuarios({ rol: 'paciente', search: term });
        setPatientResults(Array.isArray(res) ? res : []);
      } catch {
        setPatientResults([]);
      } finally {
        setSearchingPaciente(false);
      }
    }, 350);
  };

  const selectPaciente = (p) => {
    setForm((f) => ({ ...f, pacienteId: p._id, pacienteNombre: p.nombre }));
    setPatientSearch(p.nombre);
    setPatientResults([]);
  };

  const buscarMedico = (term) => {
    setMedicoSearch(term);
    clearTimeout(medicoSearchTimeout.current);
    if (term.length < 2) { setMedicoResults([]); return; }
    medicoSearchTimeout.current = setTimeout(async () => {
      setSearchingMedico(true);
      try {
        const res = await buscarUsuarios({ rol: 'medico', search: term });
        setMedicoResults(Array.isArray(res) ? res : []);
      } catch {
        setMedicoResults([]);
      } finally {
        setSearchingMedico(false);
      }
    }, 350);
  };

  const selectMedico = (m) => {
    setForm((f) => ({
      ...f,
      medicoId: m._id,
      medicoNombre: m.nombre + (m.especialidad ? ` (${m.especialidad})` : ''),
    }));
    setMedicoSearch(m.nombre);
    setMedicoResults([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.pacienteId) { toast.error('Seleccioná un paciente'); return; }
    if (!form.medicoId) { toast.error('Seleccioná un médico'); return; }
    if (!form.fechaProgramada) { toast.error('Incluí una fecha programada'); return; }
    if (!form.enlaceSala) { toast.error('Incluí el enlace de la sala de videoconferencia'); return; }
    setSaving(true);
    try {
      await createTeleconsulta({
        paciente: form.pacienteId,
        medico: form.medicoId,
        fechaProgramada: form.fechaProgramada,
        enlaceSala: form.enlaceSala,
        notas: form.notas.trim(),
      });
      toast.success('Teleconsulta creada');
      setForm(initialForm);
      setPatientSearch('');
      setMedicoSearch('');
      setShowForm(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la teleconsulta');
    } finally {
      setSaving(false);
    }
  };

  const openEditStatus = (tc) => {
    setEditingId(tc._id);
    setEditEstado(tc.estado);
  };

  const handleSaveStatus = async (id) => {
    setSavingStatus(true);
    try {
      await updateTeleconsultaStatus(id, { estado: editEstado });
      toast.success('Estado actualizado');
      setEditingId(null);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado');
    } finally {
      setSavingStatus(false);
    }
  };

  const openJoinRoom = (enlaceSala) => {
    if (enlaceSala) {
      window.open(enlaceSala, '_blank', 'noopener,noreferrer');
    }
  };

  const ahora = new Date();
  const pasadas = teleconsultas.filter((tc) => new Date(tc.fechaProgramada) < ahora);
  const proximas = teleconsultas.filter((tc) => new Date(tc.fechaProgramada) >= ahora);

  const listToShow = viewTab === 'proximas' ? proximas : pasadas;

  const stats = {
    total: teleconsultas.length,
    proximas: proximas.length,
    en_curso: teleconsultas.filter((tc) => tc.estado === 'en_curso').length,
    finalizada: teleconsultas.filter((tc) => tc.estado === 'finalizada').length,
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* HERO */}
      <section style={{
        marginBottom: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: '2rem', fontWeight: '800' }}>📞 Teleconsultas</h1>
            <p style={{ margin: '0', color: '#e0e7ff', fontSize: '0.95rem' }}>
              {isPacient(role)
                ? 'Visualizá tus citas de videollamada con los médicos.'
                : 'Gestioná las teleconsultas programadas con pacientes.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={cargar}
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}
            >
              {loading ? '...' : '🔄 Actualizar'}
            </button>
            {canCreate(role) && (
              <button
                type="button"
                onClick={() => setShowForm((p) => !p)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#fff',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                }}
              >
                {showForm ? '— Cancelar' : '+ Nueva cita'}
              </button>
            )}
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '16px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            padding: '12px 14px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <span style={{ fontSize: '0.85rem', color: '#e0e7ff' }}>Total</span>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', margin: '4px 0 0' }}>{stats.total}</p>
          </div>
          <div style={{
            background: 'rgba(59, 130, 246, 0.3)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #3b82f6',
          }}>
            <span style={{ fontSize: '0.85rem', color: '#dbeafe' }}>Próximas</span>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#dbeafe', margin: '4px 0 0' }}>{stats.proximas}</p>
          </div>
          <div style={{
            background: 'rgba(34, 197, 94, 0.3)',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid #22c55e',
          }}>
            <span style={{ fontSize: '0.85rem', color: '#dcfce7' }}>Finalizadas</span>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#dcfce7', margin: '4px 0 0' }}>{stats.finalizada}</p>
          </div>
        </div>
      </section>

      {/* FORM */}
      {showForm && canCreate(role) && (
        <section style={{
          marginBottom: '20px',
          padding: '20px',
          background: '#f0f9ff',
          borderRadius: '12px',
          border: '2px solid #0ea5e9',
        }}>
          <h2 style={{ color: '#0369a1', marginTop: 0 }}>➕ Nueva Teleconsulta</h2>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '14px' }}>
            {/* PACIENTE */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                Paciente *
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={patientSearch}
                onChange={(e) => buscarPaciente(e.target.value)}
                autoComplete="off"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  border: '1px solid #93c5fd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              />
              {searchingPaciente && (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '4px 0' }}>Buscando...</p>
              )}
              {patientResults.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {patientResults.map((p) => (
                    <li
                      key={p._id}
                      onClick={() => selectPaciente(p)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong>{p.nombre}</strong>
                      {p.documento && <span style={{ color: '#6b7280', marginLeft: '8px' }}>DNI: {p.documento}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {form.pacienteId && (
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#0369a1', fontWeight: '600' }}>
                  ✅ {form.pacienteNombre}
                </p>
              )}
            </div>

            {/* MEDICO */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                Médico *
              </label>
              <input
                type="text"
                placeholder="Buscar médico..."
                value={medicoSearch}
                onChange={(e) => buscarMedico(e.target.value)}
                autoComplete="off"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  border: '1px solid #93c5fd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                }}
              />
              {searchingMedico && (
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '4px 0' }}>Buscando...</p>
              )}
              {medicoResults.length > 0 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  {medicoResults.map((m) => (
                    <li
                      key={m._id}
                      onClick={() => selectMedico(m)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <strong>{m.nombre}</strong>
                      {m.especialidad && <span style={{ color: '#6b7280', marginLeft: '8px' }}>({m.especialidad})</span>}
                    </li>
                  ))}
                </ul>
              )}
              {form.medicoId && (
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#0369a1', fontWeight: '600' }}>
                  ✅ {form.medicoNombre}
                </p>
              )}
            </div>

            {/* FECHA + ENLACE */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                  Fecha y hora *
                </label>
                <input
                  type="datetime-local"
                  value={form.fechaProgramada}
                  onChange={(e) => setForm((f) => ({ ...f, fechaProgramada: e.target.value }))}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '1px solid #93c5fd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div>
                <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                  Enlace de sala (URL) *
                </label>
                <input
                  type="url"
                  value={form.enlaceSala}
                  onChange={(e) => setForm((f) => ({ ...f, enlaceSala: e.target.value }))}
                  placeholder="https://zoom.us/j/123456... o Google Meet, Teams, etc."
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    border: '1px solid #93c5fd',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* NOTAS */}
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                Notas adicionales
              </label>
              <textarea
                rows={3}
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Ej: Llevar documento de identidad, presentarse 5 minutos antes..."
                maxLength={500}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  border: '1px solid #93c5fd',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 16px',
                backgroundColor: saving ? '#9ca3af' : '#0ea5e9',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                justifySelf: 'start',
              }}
            >
              {saving ? 'Guardando...' : '💾 Crear Teleconsulta'}
            </button>
          </form>
        </section>
      )}

      {/* TABS */}
      <section style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setViewTab('proximas')}
            style={{
              padding: '12px 16px',
              backgroundColor: viewTab === 'proximas' ? '#667eea' : 'transparent',
              color: viewTab === 'proximas' ? '#fff' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderBottom: viewTab === 'proximas' ? '3px solid #667eea' : 'none',
            }}
          >
            📅 Próximas ({proximas.length})
          </button>
          <button
            onClick={() => setViewTab('pasadas')}
            style={{
              padding: '12px 16px',
              backgroundColor: viewTab === 'pasadas' ? '#667eea' : 'transparent',
              color: viewTab === 'pasadas' ? '#fff' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              borderBottom: viewTab === 'pasadas' ? '3px solid #667eea' : 'none',
            }}
          >
            📋 Pasadas ({pasadas.length})
          </button>
        </div>
      </section>

      {/* LIST */}
      <section style={{
        padding: '20px',
        background: '#fafcff',
        borderRadius: '12px',
        border: '1px solid #e0e7ff',
      }}>
        <h2 style={{ marginTop: 0, color: '#1f2937' }}>
          {viewTab === 'proximas' ? '📅 Próximas' : '📋 Pasadas'}
        </h2>

        {loading && <p style={{ color: '#9ca3af' }}>Cargando teleconsultas...</p>}

        {!loading && listToShow.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📞</p>
            <p>No hay {viewTab === 'proximas' ? 'teleconsultas próximas' : 'teleconsultas pasadas'}</p>
          </div>
        )}

        {!loading && listToShow.length > 0 && (
          <div style={{ display: 'grid', gap: '14px' }}>
            {listToShow.map((tc) => {
              const estadoCfg = ESTADO_CFG[tc.estado] || ESTADO_CFG.programada;
              const isEditing = editingId === tc._id;
              const fechaObj = new Date(tc.fechaProgramada);
              const esProxima = fechaObj >= ahora;

              return (
                <article
                  key={tc._id}
                  style={{
                    border: `1.5px solid ${estadoCfg.borde}`,
                    borderRadius: '10px',
                    padding: '16px',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.3rem' }}>{ESTADO_ICONO[tc.estado]}</span>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          backgroundColor: estadoCfg.bg,
                          color: estadoCfg.texto,
                          border: `1px solid ${estadoCfg.borde}`,
                        }}
                      >
                        {estadoCfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                      {fechaObj.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })} a las{' '}
                      {fechaObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Paciente</span>
                      <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#374151' }}>
                        {tc.paciente?.nombre || '—'}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Médico</span>
                      <p style={{ margin: '4px 0 0', color: '#374151' }}>
                        {tc.medico?.nombre || '—'}
                        {tc.medico?.especialidad && (
                          <span style={{ color: '#9ca3af', marginLeft: '4px', fontSize: '0.8rem' }}>
                            ({tc.medico.especialidad})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {tc.notas && (
                    <p style={{ margin: '0 0 12px', color: '#5b5f7c', fontSize: '0.85rem', padding: '8px 12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <strong>Notas:</strong> {tc.notas}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {esProxima && tc.estado === 'programada' && (
                      <button
                        type="button"
                        onClick={() => openJoinRoom(tc.enlaceSala)}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#667eea',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        📞 Unirse
                      </button>
                    )}
                    {esProxima && tc.estado === 'en_curso' && (
                      <button
                        type="button"
                        onClick={() => openJoinRoom(tc.enlaceSala)}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                        }}
                      >
                        📞 Continuar
                      </button>
                    )}
                    {(canCreate(role) || (!isPacient(role) && String(user?.id) === String(tc.medico?._id))) &&
                      !isEditing &&
                      tc.estado !== 'finalizada' &&
                      tc.estado !== 'cancelada' && (
                        <button
                          type="button"
                          onClick={() => openEditStatus(tc)}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                          }}
                        >
                          ✏️ Actualizar estado
                        </button>
                      )}
                  </div>

                  {isEditing && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f8faff', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Nuevo estado
                      </label>
                      <select
                        value={editEstado}
                        onChange={(e) => setEditEstado(e.target.value)}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: '1px solid #93c5fd',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          marginBottom: '8px',
                        }}
                      >
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>{ESTADO_CFG[s]?.label}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleSaveStatus(tc._id)}
                          disabled={savingStatus}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                          }}
                        >
                          {savingStatus ? '...' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
