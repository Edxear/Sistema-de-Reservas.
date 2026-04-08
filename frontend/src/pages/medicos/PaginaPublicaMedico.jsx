import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';

const GOOGLE_MAPS_EMBED_PREFIX = 'https://www.google.com/maps/embed';

function getSafeMapEmbedUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let candidate = raw;
  const iframeMatch = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (iframeMatch?.[1]) {
    candidate = iframeMatch[1].trim();
  }

  return candidate.startsWith(GOOGLE_MAPS_EMBED_PREFIX) ? candidate : '';
}

export default function PaginaPublicaMedico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medico, setMedico] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get(`/medicos/${id}/perfil-publico`);
        setMedico(res.data);
      } catch (err) {
        setError('No se encontró el médico');
      }
    };
    load();
  }, [id]);

  if (error) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
        <h2>{error}</h2>
      </div>
    );
  }

  if (!medico) {
    return (
      <div style={{ padding: 20, maxWidth: 600, margin: 'auto' }}>
        <h2>Cargando perfil...</h2>
      </div>
    );
  }

  const safeMapEmbedUrl = getSafeMapEmbedUrl(medico.mapaEmbed);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <img
          src={medico.fotoPerfil || 'https://via.placeholder.com/120'}
          alt={medico.nombre}
          style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <h1>{medico.nombre}</h1>
          <p>{medico.bio}</p>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 16px' }}>
            Solicitar Turno Online
          </button>
        </div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>Horario de atención</h2>
        <ul>
          {medico.horariosAtencion?.length > 0 ? (
            medico.horariosAtencion.map((h, idx) => (
              <li key={idx}>{`${h.dia}: ${h.horaInicio} - ${h.horaFin}`}</li>
            ))
          ) : (
            <li>No hay horarios cargados.</li>
          )}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Consultorio</h2>
        <p>{medico.direccionConsultorio || 'Sin dirección disponible'}</p>
        {safeMapEmbedUrl ? (
          <iframe
            src={safeMapEmbedUrl}
            width="100%"
            height="320"
            style={{ border: 0, borderRadius: 8 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa de ${medico.nombre}`}
            allowFullScreen
          />
        ) : (
          <p>No hay mapa disponible.</p>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Redes Sociales</h2>
        <ul>
          {medico.redesSociales?.instagram && (
            <li>
              <a href={medico.redesSociales.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
          )}
          {medico.redesSociales?.linkedin && (
            <li>
              <a href={medico.redesSociales.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
          )}
          {medico.redesSociales?.facebook && (
            <li>
              <a href={medico.redesSociales.facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
            </li>
          )}
          {medico.redesSociales?.twitter && (
            <li>
              <a href={medico.redesSociales.twitter} target="_blank" rel="noreferrer">
                Twitter
              </a>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

