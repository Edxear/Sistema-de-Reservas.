import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';

export default function HistoriaClinica() {
  const { pacienteId } = useParams();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await API.get(`/historia-clinica/paciente/${pacienteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntries(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error cargando historial');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pacienteId]);

  if (loading) return <div style={{ padding: 20 }}>Cargando historial...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: 'auto' }}>
      <h1>Historia Clínica</h1>
      {entries.length === 0 ? (
        <p>Este paciente no tiene historial clínico registrado todavía.</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e._id} style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd' }}>
              <strong>Fecha de atención: {new Date(e.fecha).toLocaleString()}</strong> - <em>{e.tipo}</em>
              <p><strong>Tratamiento / evolución:</strong> {e.descripcion}</p>
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
