import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Chat from '../../components/Chat';
import { listNursingContacts } from '../../services/enfermeriaService';
import styles from './Enfermeria.module.css';

const DEFAULT_TEMPLATES = [
  'Paciente [ID] con cambio clinico. Solicito valoracion medica en sala [X].',
  'Se registro alerta de seguridad en paciente [ID]. Requiere revision de indicaciones.',
  'Confirmo administracion de medicacion indicada. Evolucion estable al momento.',
  'Paciente [ID] con dolor EVA [X]. Solicito ajuste analgesico.',
];

export default function MensajeriaSegura() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [selected, setSelected] = useState(null);

  const templates = DEFAULT_TEMPLATES;

  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await listNursingContacts({ search: search || undefined, role: role || undefined });
      setContacts(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar los contactos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div>
      <section className={styles.card} style={{ borderLeft: '4px solid #0f766e' }}>
        <div className={styles.actionsRow}>
          <div>
            <h2>Mensajeria Segura</h2>
            <p style={{ color: '#6b7280' }}>
              Comunicacion clinica en tiempo real entre enfermeria y medicos, con trazabilidad.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.card} style={{ marginTop: '1rem' }}>
        <div className={styles.actionsRow}>
          <h3>Contactos</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input className={styles.select} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o especialidad" />
            <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Todos</option>
              <option value="medico">Medicos</option>
              <option value="enfermero">Enfermeria</option>
              <option value="admin">Admins</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <button className={styles.pill} type="button" onClick={loadContacts}>Buscar</button>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f9fafb' }}>
          <strong>Plantillas rapidas:</strong>
          <ul className={styles.list}>
            {templates.map((t, idx) => <li key={idx}>{t}</li>)}
          </ul>
        </div>

        {loading ? <p>Cargando contactos...</p> : null}

        <div className={styles.gridMini}>
          {contacts.map((c) => (
            <article key={c._id} className={styles.miniCard}>
              <strong>{c.nombre}</strong>
              <p>{c.rol} {c.especialidad ? `- ${c.especialidad}` : ''}</p>
              <p>{c.ramaEnfermeria || c.cargoOrganigrama || '-'}</p>
              <p>{c.email}</p>
              {c.unread > 0 ? <span className={`${styles.pill} ${styles.badgeRed}`}>{c.unread} sin leer</span> : null}
              <button type="button" className={styles.pill} onClick={() => setSelected(c)}>Abrir chat</button>
            </article>
          ))}
        </div>
      </section>

      {selected ? <Chat otroUsuario={selected} onCerrar={() => setSelected(null)} /> : null}
    </div>
  );
}
