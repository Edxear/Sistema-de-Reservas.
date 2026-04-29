import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';
import { exportArrayToExcel } from '../../utils/excelExport';

export default function HistoriaClinica() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({ tipo: '', q: '' });
  const [form, setForm] = useState({
    descripcion: '',
    diagnostico: '',
    plan: '',
    esCritico: false,
    requiereSeguimiento: false,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/historia-clinica/paciente/${pacienteId}/longitudinal`, {
        params: {
          tipo: filters.tipo || undefined,
          q: filters.q || undefined,
        }
      });
      setEntries(res.data?.records || []);
      setSummary(res.data?.summary || null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [pacienteId, filters.tipo]);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (!form.descripcion.trim()) {
      toast.error('Debes ingresar la evolucion clinica');
      return;
    }

    try {
      setSaving(true);
      await API.post('/historia-clinica', {
        paciente: pacienteId,
        tipo: 'evolucion',
        eventCategory: 'evolucion',
        descripcion: form.descripcion.trim(),
        clinicalSnapshot: {
          diagnostico: form.diagnostico.trim(),
          plan: form.plan.trim(),
        },
        flags: {
          esCritico: form.esCritico,
          requiereSeguimiento: form.requiereSeguimiento,
        },
        metadata: {
          sourceModule: 'historia_clinica_front',
        },
      });

      setForm({
        descripcion: '',
        diagnostico: '',
        plan: '',
        esCritico: false,
        requiereSeguimiento: false,
      });
      toast.success('Evolucion clinica registrada');
      await loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo guardar la evolucion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Cargando historial...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  const handleExportExcel = () => {
    const rows = entries.map((e) => ({
      Fecha: e.fecha || e.createdAt ? new Date(e.fecha || e.createdAt).toLocaleDateString('es-AR') : '',
      Tipo: e.tipo || e.eventCategory || '',
      Descripcion: e.descripcion || '',
      Diagnostico: e.clinicalSnapshot?.diagnostico || '',
      Plan: e.clinicalSnapshot?.plan || '',
      Critico: e.flags?.esCritico ? 'Sí' : 'No',
      Seguimiento: e.flags?.requiereSeguimiento ? 'Sí' : 'No',
    }));
    exportArrayToExcel({ rows, sheetName: 'HistoriaClinica', fileName: `historia_clinica_${pacienteId}.xlsx` });
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 10, border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#fff' }}
      >
        Volver
      </button>
      <button
        type="button"
        onClick={handleExportExcel}
        style={{ marginBottom: 10, marginLeft: 8, border: 0, borderRadius: 8, padding: '8px 14px', background: '#16a34a', color: '#fff', fontWeight: '600' }}
      >
        Exportar Excel
      </button>
      <h1>Historia Clínica Longitudinal</h1>

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={filters.tipo}
            onChange={(e) => setFilters((p) => ({ ...p, tipo: e.target.value }))}
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px' }}
          >
            <option value="">Todos los tipos</option>
            <option value="evolucion">Evolucion</option>
            <option value="receta">Receta</option>
            <option value="estudio">Estudio</option>
            <option value="certificado">Certificado</option>
          </select>
          <input
            value={filters.q}
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            placeholder="Buscar por descripcion o diagnostico"
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', minWidth: 260 }}
          />
          <button
            type="button"
            onClick={loadHistory}
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', background: '#f8fafc' }}
          >
            Aplicar
          </button>
        </div>

        <div style={{ border: '1px solid #dbe7f5', borderRadius: 10, padding: 12, background: '#f8fbff' }}>
          <strong>Resumen clínico:</strong>{' '}
          Total {summary?.total || 0} registros | Criticos {summary?.criticos || 0} | Seguimiento {summary?.requiereSeguimiento || 0}
        </div>

        <form onSubmit={handleCreateEntry} style={{ border: '1px solid #dbe7f5', borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
          <strong>Nueva evolucion</strong>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
            placeholder="Evolucion clinica"
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', minHeight: 70 }}
          />
          <input
            value={form.diagnostico}
            onChange={(e) => setForm((p) => ({ ...p, diagnostico: e.target.value }))}
            placeholder="Diagnostico"
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px' }}
          />
          <input
            value={form.plan}
            onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
            placeholder="Plan terapeutico"
            style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px' }}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <label>
              <input
                type="checkbox"
                checked={form.esCritico}
                onChange={(e) => setForm((p) => ({ ...p, esCritico: e.target.checked }))}
              />{' '}
              Caso critico
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.requiereSeguimiento}
                onChange={(e) => setForm((p) => ({ ...p, requiereSeguimiento: e.target.checked }))}
              />{' '}
              Requiere seguimiento
            </label>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ border: 0, borderRadius: 8, padding: '9px 12px', background: '#0f5c99', color: '#fff', width: 180 }}
          >
            {saving ? 'Guardando...' : 'Guardar evolucion'}
          </button>
        </form>
      </div>

      {entries.length === 0 ? (
        <p>Este paciente no tiene historial clínico registrado todavía.</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e._id} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd' }}>
              <strong>Fecha de atención: {new Date(e.fecha).toLocaleString()}</strong> - <em>{e.tipo}</em>
              <p><strong>Tratamiento / evolución:</strong> {e.descripcion}</p>
              {e.clinicalSnapshot?.diagnostico ? <p><strong>Diagnostico:</strong> {e.clinicalSnapshot.diagnostico}</p> : null}
              {e.clinicalSnapshot?.plan ? <p><strong>Plan:</strong> {e.clinicalSnapshot.plan}</p> : null}
              <p>
                <strong>Alertas:</strong> {e.flags?.esCritico ? 'Caso critico' : 'No critico'} | {e.flags?.requiereSeguimiento ? 'Con seguimiento' : 'Sin seguimiento'}
              </p>
              {e.archivosAdjuntos?.length > 0 && (
                <div>
                  <strong>Archivos adjuntos:</strong>
                  <ul>
                    {e.archivosAdjuntos.map((a) => (
                      <li key={a.url}>
                        <a href={a.url} target="_blank" rel="noreferrer">
                          {a.nombre}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

