import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  getNursingCatalog,
  listNursingContacts,
  listNursingInitiatives,
  getNursingOrganigrama,
} from '../../services/enfermeriaService';
import { canAccessMentalHealthArea } from '../../utils/roles';
import MensajeriaSegura from '../enfermeria/MensajeriaSegura';
import AreaBedBoard from '../../components/AreaBedBoard';
import styles from '../enfermeria/Enfermeria.module.css';

const normalize = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isMentalHealthProfile = (item = {}) => {
  const rama = normalize(item.ramaEnfermeria);
  const cargo = normalize(item.cargoOrganigrama);
  const area = normalize(item.areaOrganigrama);
  return rama.includes('salud mental') || cargo.includes('salud mental') || area.includes('salud mental');
};

const sortByHierarchy = (team = []) => {
  const rank = (cargo = '') => {
    const c = normalize(cargo);
    if (c.includes('jef')) return 1;
    if (c.includes('subjef')) return 2;
    if (c.includes('coordin')) return 3;
    if (c.includes('referente') || c.includes('senior')) return 4;
    return 5;
  };

  return [...team].sort((a, b) => {
    const r = rank(a.cargoOrganigrama) - rank(b.cargoOrganigrama);
    if (r !== 0) return r;
    return String(a.nombre || '').localeCompare(String(b.nombre || ''));
  });
};

const PATOLOGIAS_PRIORITARIAS = [
  {
    nombre: 'Psicosis aguda / descompensacion',
    proceso: [
      'Evaluacion de riesgo para si y terceros en ingreso',
      'Contencion verbal inicial en ambiente de baja estimulacion',
      'Farmacoterapia de rescate segun orden medica',
      'Reevaluacion cada 30 min durante fase aguda',
    ],
  },
  {
    nombre: 'Depresion mayor con riesgo suicida',
    proceso: [
      'Escala de riesgo suicida al ingreso y por turno',
      'Vigilancia intensiva y retiro de objetos de riesgo',
      'Plan de seguridad individual con psiquiatria y psicologia',
      'Seguimiento de adherencia farmacologica y de sueno',
    ],
  },
  {
    nombre: 'Trastorno bipolar fase maniaca',
    proceso: [
      'Control de impulsividad y desinhibicion conductual',
      'Estructura de ambiente y limites terapeuticos consistentes',
      'Monitoreo de hidratacion, descanso y efectos adversos',
      'Registro de evolucion por escalas clinicas del servicio',
    ],
  },
  {
    nombre: 'Abstinencia de sustancias',
    proceso: [
      'Protocolo CIWA/COWS segun sustancia predominante',
      'Control de signos vitales seriados',
      'Tratamiento sindromico y prevencion de complicaciones',
      'Interconsulta adicciones y plan post-alta',
    ],
  },
];

const RUTINA_DIARIA = [
  'Pase de guardia especifico de Salud Mental con semaforo de riesgo.',
  'Ronda interdisciplinaria con psiquiatria, psicologia y trabajo social.',
  'Bloque terapeutico: intervenciones individuales y grupales.',
  'Revision de psicofarmacos de alto riesgo (litio, clozapina, benzodiacepinas).',
  'Planificacion de altas protegidas y continuidad ambulatoria.',
];

const PROTOCOLOS_CLAVE = [
  { nombre: 'Crisis suicida', kpi: 'Tiempo de activacion del protocolo < 5 min' },
  { nombre: 'Agitacion psicomotriz', kpi: 'Contencion verbal efectiva sin coercion > 60%' },
  { nombre: 'Retiro de sustancias', kpi: 'Sin complicaciones graves por abstinencia' },
  { nombre: 'Ingreso involuntario', kpi: 'Checklist legal y clinica al 100%' },
];

export default function SaludMentalArea() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('panel');
  const [catalog, setCatalog] = useState({ branches: [] });
  const [contacts, setContacts] = useState([]);
  const [initiatives, setInitiatives] = useState([]);
  const [organigrama, setOrganigrama] = useState({ byBranch: [] });

  const canAccess = canAccessMentalHealthArea(user);

  useEffect(() => {
    const loadModuleData = async () => {
      setLoading(true);
      try {
        const [catalogData, contactsData, initiativesData, organigramaData] = await Promise.all([
          getNursingCatalog(),
          listNursingContacts({ search: 'Salud Mental' }),
          listNursingInitiatives({ rama: 'Salud Mental' }),
          getNursingOrganigrama(),
        ]);

        const contactItems = Array.isArray(contactsData)
          ? contactsData
          : (Array.isArray(contactsData?.items) ? contactsData.items : []);

        const initiativeItems = Array.isArray(initiativesData)
          ? initiativesData
          : (Array.isArray(initiativesData?.items) ? initiativesData.items : []);

        setCatalog(catalogData || { branches: [] });
        setContacts(contactItems);
        setInitiatives(initiativeItems);
        setOrganigrama(organigramaData || { byBranch: [] });
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo cargar el area de Salud Mental');
      } finally {
        setLoading(false);
      }
    };

    if (canAccess) {
      loadModuleData();
    }
  }, [canAccess]);

  const mentalHealthTeam = useMemo(() => {
    const filtered = contacts.filter((item) => isMentalHealthProfile(item));
    return sortByHierarchy(filtered);
  }, [contacts]);

  const branchInfo = useMemo(() => {
    const entries = Array.isArray(organigrama?.byBranch) ? organigrama.byBranch : [];
    return entries.find((item) => normalize(item?.rama) === 'salud mental') || null;
  }, [organigrama]);

  const activeInitiatives = useMemo(
    () => initiatives.filter((i) => String(i.estado || '').toLowerCase() !== 'completada').slice(0, 8),
    [initiatives],
  );

  if (!canAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={styles.page}>
      <section className={styles.card} data-tour="salud-mental-overview">
        <h1>Area de Salud Mental</h1>
        <p>
          Area asistencial diferenciada de Enfermeria general, con procesos clinicos especificos por
          patologia psiquiatrica, equipo propio y linea de organigrama dedicada.
        </p>
        <div className={styles.metaRow}>
          <span>Jefatura: Salud Mental</span>
          <span>Personal asignado: {mentalHealthTeam.length}</span>
          <span>Iniciativas activas: {activeInitiatives.length}</span>
          <span>Ramas disponibles: {catalog?.branches?.length || 0}</span>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('panel')} className={styles.pill} type="button">Panel</button>
          <button onClick={() => setActiveTab('procesos')} className={styles.pill} type="button">Procesos Clinicos</button>
          <button onClick={() => setActiveTab('equipo')} className={styles.pill} type="button">Equipo y Organigrama</button>
          <button onClick={() => setActiveTab('pizarra')} className={styles.pill} type="button">Pizarra Camas Area</button>
          <button onClick={() => setActiveTab('mensajeria')} className={styles.pill} type="button">Mensajeria</button>
        </div>
      </section>

      {loading ? (
        <section className={styles.card}><p>Cargando datos de Salud Mental...</p></section>
      ) : activeTab === 'panel' ? (
        <>
          <section className={styles.grid}>
            <article className={styles.ramaCard}>
              <h3>Flujo de trabajo del turno</h3>
              {RUTINA_DIARIA.map((item) => <p key={item}>- {item}</p>)}
            </article>

            <article className={styles.ramaCard}>
              <h3>Protocolos clave</h3>
              {PROTOCOLOS_CLAVE.map((row) => (
                <p key={row.nombre}>- {row.nombre}: {row.kpi}</p>
              ))}
            </article>

            <article className={styles.ramaCard}>
              <h3>Linea de gestion</h3>
              <p>Coordinacion: {branchInfo?.coordinacion || branchInfo?.subjefatura || 'Por definir'}</p>
              <p>Total de colaboradores: {branchInfo?.total || mentalHealthTeam.length}</p>
              <p>Escalamiento: Equipo de guardia psiquiatrica + direccion medica.</p>
            </article>
          </section>

          <section className={styles.card}>
            <h2>Equipo asignado</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Rama</th>
                    <th>Cargo</th>
                  </tr>
                </thead>
                <tbody>
                  {mentalHealthTeam.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No hay personal explicitamente marcado en Salud Mental.</td>
                    </tr>
                  ) : mentalHealthTeam.map((person) => (
                    <tr key={person._id}>
                      <td>{person.nombre}</td>
                      <td>{person.rol}</td>
                      <td>{person.ramaEnfermeria || '-'}</td>
                      <td>{person.cargoOrganigrama || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Iniciativas de rama</h2>
            {activeInitiatives.length === 0 ? (
              <p>No hay iniciativas activas de Salud Mental cargadas.</p>
            ) : (
              <div className={styles.listWrap}>
                {activeInitiatives.map((initiative) => (
                  <div key={initiative._id} className={styles.item}>
                    <div className={styles.itemTitle}>{initiative.titulo}</div>
                    <div className={styles.metaMini}>
                      Estado: {initiative.estado || 'pendiente'} | Prioridad: {initiative.prioridad || 'media'}
                    </div>
                    <div>{initiative.descripcion || 'Sin descripcion.'}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : activeTab === 'procesos' ? (
        <section className={styles.card}>
          <h2>Procesos clinicos por patologia prioritaria</h2>
          <div className={styles.grid2}>
            {PATOLOGIAS_PRIORITARIAS.map((path) => (
              <article key={path.nombre} className={styles.miniCard}>
                <h3 style={{ marginTop: 0, color: '#154870' }}>{path.nombre}</h3>
                {path.proceso.map((step) => <p key={step}>- {step}</p>)}
              </article>
            ))}
          </div>
        </section>
      ) : activeTab === 'equipo' ? (
        <section className={styles.card}>
          <h2>Equipo asignado y organigrama</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Rama</th>
                  <th>Cargo</th>
                </tr>
              </thead>
              <tbody>
                {mentalHealthTeam.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No hay personal explicitamente marcado en Salud Mental.</td>
                  </tr>
                ) : mentalHealthTeam.map((person) => (
                  <tr key={person._id}>
                    <td>{person.nombre}</td>
                    <td>{person.rol}</td>
                    <td>{person.ramaEnfermeria || '-'}</td>
                    <td>{person.cargoOrganigrama || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'pizarra' && <AreaBedBoard areaKey="salud-mental" />}
      {activeTab === 'mensajeria' && <MensajeriaSegura />}
    </div>
  );
}
