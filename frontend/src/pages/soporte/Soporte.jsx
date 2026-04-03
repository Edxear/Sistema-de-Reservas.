import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  createBedUnit,
  createPrivateComment,
  createSupportTicket,
  deleteColleagueRating,
  deleteSupportUser,
  getColleagueRatingSummary,
  getPrivateComments,
  getSupportMetrics,
  getSupportAdvancedMetrics,
  getSupportUsers,
  listBedCensus,
  listFormalColleagueFeedback,
  listSupportKnowledgeArticles,
  listSupportTickets,
  saveSupportKnowledgeArticle,
  submitColleagueRating,
  submitSupportSurvey,
  updateBedUnit,
  updateSupportTicket,
  updateSupportUser,
} from '../../services/soporteService';
import { canAccessSupport, canViewPrivateColleagueComments } from '../../utils/roles';
import styles from './Soporte.module.css';

const TAB = {
  OPERACION: 'operacion',
  TICKETS: 'tickets',
  USUARIOS: 'usuarios',
  COLEGAS: 'colegas',
  VALORACIONES: 'valoraciones',
};

const CRITICIDAD = ['critico', 'alto', 'medio', 'bajo'];
const NIVELES = ['L1', 'L2', 'L3'];
const ESTADOS = ['abierto', 'en_progreso', 'en_espera', 'resuelto', 'cerrado'];

const SUPPORT_INFO = {
  operacion: {
    title: 'Operacion de soporte',
    summary:
      'Gestiona incidentes, monitoreo y continuidad del servicio clinico.',
    points: [
      'Escalamiento por niveles L1-L3.',
      'Priorizacion segun impacto clinico.',
    ],
  },
  tickets: {
    title: 'Ticketing y SLA',
    summary:
      'Registra casos y mide tiempos de respuesta/resolucion.',
    points: [
      'Trazabilidad completa del caso.',
      'Control de cumplimiento SLA.',
    ],
    slaReference: [
      { criticidad: 'Critico', respuesta: '15 min', resolucion: '2 h' },
      { criticidad: 'Alto', respuesta: '1 h', resolucion: '8 h' },
      { criticidad: 'Medio', respuesta: '4 h', resolucion: '24 h' },
      { criticidad: 'Bajo', respuesta: '24 h', resolucion: '5 dias habiles' },
    ],
  },
  usuarios: {
    title: 'Usuarios y permisos',
    summary:
      'Administra roles y accesos segun funcion.',
    points: [
      'Control por rol (RBAC).',
      'Trazabilidad de cambios de permisos.',
    ],
  },
  colegas: {
    title: 'Comentarios internos',
    summary:
      'Canal privado para seguimiento entre colegas.',
    points: [
      'Seguimiento profesional ordenado.',
      'Mejor coordinacion del equipo.',
    ],
  },
  valoraciones: {
    title: 'Valoraciones formales',
    summary:
      'Feedback estructurado para acciones de mejora.',
    points: [
      'Seguimiento por estado y responsables.',
      'Datos comparables para mejora continua.',
    ],
  },
};

const initialTicketForm = {
  titulo: '',
  descripcion: '',
  criticidad: 'medio',
  tipoGestion: 'incidente',
  soporteNivel: 'L1',
  areaClinica: '',
  modulo: '',
  impactoClinico: '',
  solicitanteNombre: '',
  solicitanteRol: '',
  solicitanteArea: '',
  requiresChangeValidation: false,
};

export default function Soporte() {
  const { user } = useAuth();
  const role = user?.rol;
  const [activeTab, setActiveTab] = useState(TAB.OPERACION);

  const [metrics, setMetrics] = useState(null);
  const [advancedMetrics, setAdvancedMetrics] = useState({ kpis: {}, alerts: [] });
  const [bedCensus, setBedCensus] = useState({ metrics: { total: 0, byEstado: {} }, beds: [] });
  const [bedForm, setBedForm] = useState({ codigo: '', sector: '', estado: 'libre', observaciones: '' });
  const [knowledgeArticles, setKnowledgeArticles] = useState([]);
  const [knowledgeForm, setKnowledgeForm] = useState({ codigo: '', titulo: '', contenido: '', categoria: 'general' });

  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [ticketFilter, setTicketFilter] = useState({ criticidad: '', estado: '', soporteNivel: '', q: '' });

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average: 0, total: 0, ratings: [], myRating: null });
  const [formalFeedbackRecords, setFormalFeedbackRecords] = useState([]);
  const [formalFilter, setFormalFilter] = useState({ categoria: '' });
  const [stars, setStars] = useState(5);
  const [ratingCategoria, setRatingCategoria] = useState('desempeno_general');
  const [ratingComment, setRatingComment] = useState('');
  const [openInfoTab, setOpenInfoTab] = useState(null);

  const CATEGORIAS_LABEL = {
    calidad_atencion: 'Calidad de atención',
    trabajo_equipo: 'Trabajo en equipo',
    comunicacion: 'Comunicación',
    actitud: 'Actitud profesional',
    desempeno_general: 'Desempeño general',
  };

  const staffUsers = useMemo(() => users.filter((u) => u.rol !== 'paciente'), [users]);
  const targetUser = useMemo(() => users.find((u) => u._id === targetUserId), [users, targetUserId]);

  const renderInfoBlock = (tabKey) => {
    const config = SUPPORT_INFO[tabKey];
    if (!config) return null;

    const isOpen = openInfoTab === tabKey;

    return (
      <div className={styles.infoWrap}>
        <button
          type="button"
          className={styles.infoBtn}
          onClick={() => setOpenInfoTab((prev) => (prev === tabKey ? null : tabKey))}
        >
          Informacion
        </button>

        {isOpen ? (
          <div className={styles.infoPanel}>
            <h4>{config.title}</h4>
            <p>{config.summary}</p>
            <div className={styles.infoList}>
              {config.points.map((point) => <p key={point}>- {point}</p>)}
            </div>

            {Array.isArray(config.slaReference) ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Criticidad</th>
                      <th>Respuesta</th>
                      <th>Resolucion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.slaReference.map((row) => (
                      <tr key={row.criticidad}>
                        <td>{row.criticidad}</td>
                        <td>{row.respuesta}</td>
                        <td>{row.resolucion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const loadMetrics = async () => {
    try {
      const data = await getSupportMetrics();
      setMetrics(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar metricas de soporte');
    }
  };

  const loadAdvancedMetrics = async () => {
    try {
      const data = await getSupportAdvancedMetrics();
      setAdvancedMetrics({
        kpis: data?.kpis || {},
        alerts: Array.isArray(data?.alerts) ? data.alerts : [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar analitica avanzada');
    }
  };

  const loadTickets = async () => {
    try {
      const data = await listSupportTickets(ticketFilter);
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar tickets');
    }
  };

  const loadBedCensus = async () => {
    try {
      const data = await listBedCensus();
      setBedCensus({
        metrics: data?.metrics || { total: 0, byEstado: {} },
        beds: Array.isArray(data?.beds) ? data.beds : [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar censo de camas');
    }
  };

  const loadKnowledgeArticles = async () => {
    try {
      const data = await listSupportKnowledgeArticles({ estado: 'publicado' });
      setKnowledgeArticles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar base de conocimiento');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getSupportUsers({ search });
      const parsed = Array.isArray(data) ? data : [];
      setUsers(parsed);
      if (!targetUserId) {
        const firstStaff = parsed.find((u) => u.rol !== 'paciente');
        if (firstStaff) setTargetUserId(firstStaff._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar usuarios');
    }
  };

  const loadComments = async () => {
    if (!targetUserId || !canViewPrivateColleagueComments(role)) return;
    try {
      const data = await getPrivateComments(targetUserId);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar comentarios internos');
    }
  };

  const loadRatingSummary = async () => {
    if (!targetUserId) return;
    try {
      const data = await getColleagueRatingSummary(targetUserId);
      setRatingSummary({
        average: data?.average || 0,
        total: data?.total || 0,
        ratings: Array.isArray(data?.ratings) ? data.ratings : [],
        myRating: data?.myRating || null,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar valoracion del colega');
    }
  };

  const loadFormalFeedbackRecords = async () => {
    try {
      const data = await listFormalColleagueFeedback(formalFilter);
      setFormalFeedbackRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar historial de valoraciones');
    }
  };

  useEffect(() => {
    loadMetrics();
    loadTickets();
    loadUsers();
    loadFormalFeedbackRecords();
    loadBedCensus();
    loadKnowledgeArticles();
    loadAdvancedMetrics();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadUsers();
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadTickets();
    }, 350);
    return () => clearTimeout(t);
  }, [ticketFilter]);

  useEffect(() => {
    loadComments();
    loadRatingSummary();
  }, [targetUserId]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadFormalFeedbackRecords();
    }, 350);
    return () => clearTimeout(t);
  }, [formalFilter]);

  useEffect(() => {
    if (!ratingSummary?.myRating) return;
    setStars(ratingSummary.myRating.stars || 5);
    setRatingCategoria(ratingSummary.myRating.categoria || 'desempeno_general');
    setRatingComment(ratingSummary.myRating.comentario || '');
  }, [ratingSummary?.myRating?._id]);

  if (!canAccessSupport(role)) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h2>Area de Soporte</h2>
          <p>No tienes permisos para ingresar.</p>
        </section>
      </div>
    );
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await createSupportTicket(ticketForm);
      toast.success('Ticket de soporte creado');
      setTicketForm(initialTicketForm);
      await loadTickets();
      await loadMetrics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo crear el ticket');
    }
  };

  const handleTicketQuickUpdate = async (id, patch) => {
    try {
      await updateSupportTicket(id, patch);
      await loadTickets();
      await loadMetrics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar ticket');
    }
  };

  const handleSurvey = async (ticketId, surveyScore) => {
    try {
      await submitSupportSurvey(ticketId, { surveyScore, surveyComment: '' });
      toast.success('Encuesta guardada');
      await loadMetrics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar encuesta');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Esta accion eliminara el usuario seleccionado. Deseas continuar?')) return;
    try {
      await deleteSupportUser(id);
      toast.success('Usuario eliminado');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar usuario');
    }
  };

  const handleRoleChange = async (id, nextRole) => {
    try {
      await updateSupportUser(id, { rol: nextRole });
      toast.success('Rol actualizado');
      await loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar rol');
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!targetUserId || !commentText.trim()) return;
    try {
      await createPrivateComment(targetUserId, commentText);
      setCommentText('');
      toast.success('Comentario privado enviado');
      await loadComments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar comentario');
    }
  };

  const handleRating = async (e) => {
    e.preventDefault();
    if (!targetUserId) return;
    try {
      await submitColleagueRating(targetUserId, {
        stars,
        comentario: ratingComment,
        categoria: ratingCategoria,
      });
      toast.success('Valoracion guardada');
      await loadRatingSummary();
      await loadFormalFeedbackRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar valoracion');
    }
  };

  const handleDeleteRating = async (ratingId) => {
    try {
      await deleteColleagueRating(ratingId);
      toast.success('Valoracion eliminada');
      await loadRatingSummary();
      await loadFormalFeedbackRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar valoracion');
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    if (!bedForm.codigo.trim() || !bedForm.sector.trim()) return;
    try {
      await createBedUnit({
        codigo: bedForm.codigo.trim(),
        sector: bedForm.sector.trim(),
        estado: bedForm.estado,
        observaciones: bedForm.observaciones,
      });
      setBedForm({ codigo: '', sector: '', estado: 'libre', observaciones: '' });
      toast.success('Cama registrada');
      await loadBedCensus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo crear cama');
    }
  };

  const handleBedStatus = async (id, estado) => {
    try {
      await updateBedUnit(id, { estado });
      await loadBedCensus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar estado de cama');
    }
  };

  const handleSaveKnowledge = async (e) => {
    e.preventDefault();
    if (!knowledgeForm.codigo.trim() || !knowledgeForm.titulo.trim() || !knowledgeForm.contenido.trim()) return;
    try {
      await saveSupportKnowledgeArticle({
        codigo: knowledgeForm.codigo.trim(),
        titulo: knowledgeForm.titulo.trim(),
        contenido: knowledgeForm.contenido.trim(),
        categoria: knowledgeForm.categoria,
      });
      setKnowledgeForm({ codigo: '', titulo: '', contenido: '', categoria: 'general' });
      toast.success('Articulo KB guardado/versionado');
      await loadKnowledgeArticles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar articulo KB');
    }
  };

  const renderOperacion = () => (
    <>
      <section className={styles.card}>
        <h1>Centro de Soporte Clinico</h1>
        <p>Panel operativo para monitoreo, tickets y continuidad del servicio.</p>
        {renderInfoBlock(TAB.OPERACION)}
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}><span>Tickets</span><strong>{metrics?.total ?? 0}</strong></article>
        <article className={styles.metricCard}><span>SLA respuesta</span><strong>{metrics?.responseSlaPct ?? 0}%</strong></article>
        <article className={styles.metricCard}><span>SLA resolucion</span><strong>{metrics?.resolutionSlaPct ?? 0}%</strong></article>
        <article className={styles.metricCard}><span>Satisfaccion</span><strong>{metrics?.avgSurvey ?? 0}/5</strong></article>
      </section>

      <section className={styles.card}>
        <h2>Analitica avanzada y alertas</h2>
        <div className={styles.metricsGrid}>
          <article className={styles.metricCard}><span>Backlog abierto</span><strong>{advancedMetrics.kpis?.abiertos ?? 0}</strong></article>
          <article className={styles.metricCard}><span>Criticos abiertos</span><strong>{advancedMetrics.kpis?.criticosAbiertos ?? 0}</strong></article>
          <article className={styles.metricCard}><span>Ocupacion camas</span><strong>{advancedMetrics.kpis?.ocupacionCamasPct ?? 0}%</strong></article>
          <article className={styles.metricCard}><span>Teleconsultas proximas</span><strong>{advancedMetrics.kpis?.teleconsultasProximas ?? 0}</strong></article>
        </div>

        <div className={styles.listWrap}>
          {advancedMetrics.alerts.length === 0 ? <p>Sin alertas activas.</p> : advancedMetrics.alerts.map((alert) => (
            <div key={alert.code} className={styles.item}>
              <div className={styles.itemTitle}>{alert.code} ({alert.level})</div>
              <div>{alert.message}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Censo operativo de camas</h2>
        <p className={styles.note}>
          Total: {bedCensus.metrics?.total || 0} | Libre: {bedCensus.metrics?.byEstado?.libre || 0} | Ocupada: {bedCensus.metrics?.byEstado?.ocupada || 0}
        </p>

        <form onSubmit={handleCreateBed} className={styles.filtersRow}>
          <input className={styles.input} placeholder="Codigo cama (ej: UCI-01)" value={bedForm.codigo} onChange={(e) => setBedForm((p) => ({ ...p, codigo: e.target.value }))} required />
          <input className={styles.input} placeholder="Sector" value={bedForm.sector} onChange={(e) => setBedForm((p) => ({ ...p, sector: e.target.value }))} required />
          <select className={styles.select} value={bedForm.estado} onChange={(e) => setBedForm((p) => ({ ...p, estado: e.target.value }))}>
            <option value="libre">libre</option>
            <option value="ocupada">ocupada</option>
            <option value="limpieza">limpieza</option>
            <option value="mantenimiento">mantenimiento</option>
            <option value="reservada">reservada</option>
            <option value="aislamiento">aislamiento</option>
          </select>
          <button className={styles.primaryBtn} type="submit">Agregar cama</button>
        </form>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Sector</th>
                <th>Estado</th>
                <th>Paciente</th>
                <th>Actualizacion</th>
              </tr>
            </thead>
            <tbody>
              {(bedCensus.beds || []).map((bed) => (
                <tr key={bed._id}>
                  <td>{bed.codigo}</td>
                  <td>{bed.sector}</td>
                  <td>
                    <select className={styles.selectCompact} value={bed.estado} onChange={(e) => handleBedStatus(bed._id, e.target.value)}>
                      <option value="libre">libre</option>
                      <option value="ocupada">ocupada</option>
                      <option value="limpieza">limpieza</option>
                      <option value="mantenimiento">mantenimiento</option>
                      <option value="reservada">reservada</option>
                      <option value="aislamiento">aislamiento</option>
                    </select>
                  </td>
                  <td>{bed.paciente?.nombre || '-'}</td>
                  <td>{bed.updatedBy?.nombre || '-'} | {new Date(bed.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.card}>
        <h2>Base de conocimiento versionada</h2>
        <form onSubmit={handleSaveKnowledge} className={styles.formCol}>
          <div className={styles.filtersRow}>
            <input className={styles.input} placeholder="Codigo (ej: incidente-login)" value={knowledgeForm.codigo} onChange={(e) => setKnowledgeForm((p) => ({ ...p, codigo: e.target.value }))} required />
            <input className={styles.input} placeholder="Categoria" value={knowledgeForm.categoria} onChange={(e) => setKnowledgeForm((p) => ({ ...p, categoria: e.target.value }))} />
            <input className={styles.input} placeholder="Titulo" value={knowledgeForm.titulo} onChange={(e) => setKnowledgeForm((p) => ({ ...p, titulo: e.target.value }))} required />
          </div>
          <textarea className={styles.textarea} placeholder="Contenido del articulo" value={knowledgeForm.contenido} onChange={(e) => setKnowledgeForm((p) => ({ ...p, contenido: e.target.value }))} required />
          <button className={styles.primaryBtn} type="submit">Guardar articulo</button>
        </form>

        <div className={styles.listWrap}>
          {knowledgeArticles.slice(0, 12).map((article) => (
            <div key={article._id} className={styles.item}>
              <div className={styles.itemTitle}>{article.codigo} - v{article.version}</div>
              <div>{article.titulo}</div>
              <div className={styles.metaMini}>Categoria: {article.categoria}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderTickets = () => (
    <>
      <section className={styles.card}>
        <h2>Tickets y SLA</h2>
        {renderInfoBlock(TAB.TICKETS)}
        <form onSubmit={handleCreateTicket} className={styles.gridForm}>
          <input className={styles.input} placeholder="Titulo" value={ticketForm.titulo} onChange={(e) => setTicketForm((p) => ({ ...p, titulo: e.target.value }))} required />
          <select className={styles.select} value={ticketForm.criticidad} onChange={(e) => setTicketForm((p) => ({ ...p, criticidad: e.target.value }))}>
            {CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={styles.select} value={ticketForm.soporteNivel} onChange={(e) => setTicketForm((p) => ({ ...p, soporteNivel: e.target.value }))}>
            {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <input className={styles.input} placeholder="Modulo" value={ticketForm.modulo} onChange={(e) => setTicketForm((p) => ({ ...p, modulo: e.target.value }))} />
          <input className={styles.input} placeholder="Area clinica" value={ticketForm.areaClinica} onChange={(e) => setTicketForm((p) => ({ ...p, areaClinica: e.target.value }))} />
          <input className={styles.input} placeholder="Solicitante" value={ticketForm.solicitanteNombre} onChange={(e) => setTicketForm((p) => ({ ...p, solicitanteNombre: e.target.value }))} />
          <textarea className={styles.textarea} placeholder="Descripcion" value={ticketForm.descripcion} onChange={(e) => setTicketForm((p) => ({ ...p, descripcion: e.target.value }))} required />
          <textarea className={styles.textarea} placeholder="Impacto clinico" value={ticketForm.impactoClinico} onChange={(e) => setTicketForm((p) => ({ ...p, impactoClinico: e.target.value }))} />
          <label className={styles.checkline}>
            <input type="checkbox" checked={ticketForm.requiresChangeValidation} onChange={(e) => setTicketForm((p) => ({ ...p, requiresChangeValidation: e.target.checked }))} />
            <span>Requiere validacion de cambios en entorno de pruebas</span>
          </label>
          <button type="submit" className={styles.primaryBtn}>Crear ticket</button>
        </form>
      </section>

      <section className={styles.card}>
        <h3>Filtros</h3>
        <div className={styles.filtersRow}>
          <input className={styles.input} placeholder="Buscar por codigo/titulo" value={ticketFilter.q} onChange={(e) => setTicketFilter((p) => ({ ...p, q: e.target.value }))} />
          <select className={styles.select} value={ticketFilter.criticidad} onChange={(e) => setTicketFilter((p) => ({ ...p, criticidad: e.target.value }))}>
            <option value="">criticidad</option>
            {CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className={styles.select} value={ticketFilter.estado} onChange={(e) => setTicketFilter((p) => ({ ...p, estado: e.target.value }))}>
            <option value="">estado</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select className={styles.select} value={ticketFilter.soporteNivel} onChange={(e) => setTicketFilter((p) => ({ ...p, soporteNivel: e.target.value }))}>
            <option value="">nivel</option>
            {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </section>

      <section className={styles.card}>
        <h3>Listado de tickets</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Titulo</th>
                <th>Criticidad</th>
                <th>Nivel</th>
                <th>Estado</th>
                <th>SLA</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id}>
                  <td>{t.codigo}</td>
                  <td>{t.titulo}</td>
                  <td>{t.criticidad}</td>
                  <td>
                    <select className={styles.selectCompact} value={t.soporteNivel} onChange={(e) => handleTicketQuickUpdate(t._id, { soporteNivel: e.target.value })}>
                      {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className={styles.selectCompact} value={t.estado} onChange={(e) => handleTicketQuickUpdate(t._id, { estado: e.target.value })}>
                      {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className={styles.metaMini}>Resp: {t.slaRespuestaMin}m</div>
                    <div className={styles.metaMini}>Res: {t.slaResolucionMin}m</div>
                  </td>
                  <td>
                    <div className={styles.inlineBtns}>
                      <button className={styles.linkBtn} onClick={() => handleTicketQuickUpdate(t._id, { escalarA: 'L2', motivoEscalamiento: 'Escalamiento tecnico' })}>Escalar L2</button>
                      <button className={styles.linkBtn} onClick={() => handleTicketQuickUpdate(t._id, { escalarA: 'L3', motivoEscalamiento: 'Escalamiento desarrollo' })}>Escalar L3</button>
                      <button className={styles.linkBtn} onClick={() => handleSurvey(t._id, 5)}>Satisfaccion 5</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderUsuarios = () => (
    <section className={styles.card}>
      <h2>Usuarios y accesos</h2>
      {renderInfoBlock(TAB.USUARIOS)}
      <input className={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario" />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Telefono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className={u.esSuperAdminPrincipal ? styles.rowPrincipal : ''}>
                <td>{u.nombre}{u.esSuperAdminPrincipal ? ' (Principal)' : ''}</td>
                <td>{u.email}</td>
                <td>
                  <select className={styles.selectCompact} value={u.rol} onChange={(e) => handleRoleChange(u._id, e.target.value)}>
                    <option value="paciente">paciente</option>
                    <option value="secretaria">secretaria</option>
                    <option value="enfermero">enfermero</option>
                    <option value="medico">medico</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </td>
                <td>{u.telefono || '-'}</td>
                <td><button className={styles.dangerBtn} onClick={() => handleDeleteUser(u._id)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderColegas = () => (
    <>
      <section className={styles.card}>
        <h2>Comentarios internos entre colegas</h2>
        {renderInfoBlock(TAB.COLEGAS)}
        <select className={styles.select} value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
          <option value="">Seleccionar colega</option>
          {staffUsers.map((u) => <option key={u._id} value={u._id}>{u.nombre} - {u.rol}</option>)}
        </select>
        {targetUser && <p>Trabajando sobre: <strong>{targetUser.nombre}</strong> ({targetUser.rol})</p>}
      </section>

      <section className={styles.card}>
        <h3>Comentarios privados (solo admin/superadmin)</h3>
        <form onSubmit={handleCreateComment} className={styles.formCol}>
          <textarea className={styles.textarea} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Comentario interno" />
          <button type="submit" className={styles.primaryBtn}>Guardar comentario</button>
        </form>

        <div className={styles.listWrap}>
          {comments.length === 0 ? <p>Sin comentarios.</p> : comments.map((c) => (
            <div key={c._id} className={styles.item}>
              <div className={styles.itemTitle}>{c.autor?.nombre || 'Autor'} ({c.autor?.rol || '-'})</div>
              <div>{c.contenido}</div>
              <small>{new Date(c.fechaCreacion).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderValoraciones = () => (
    <>
      <section className={styles.card}>
        <h2>Valoraciones entre colegas</h2>
        {renderInfoBlock(TAB.VALORACIONES)}
        <p>Dejá una valoración simple y constructiva sobre un compañero de trabajo.</p>
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3>Registrar valoración</h3>
          <form onSubmit={handleRating} className={styles.formCol}>
            <select className={styles.select} value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              <option value="">Seleccionar colega</option>
              {staffUsers.map((u) => <option key={u._id} value={u._id}>{u.nombre} — {u.rol}</option>)}
            </select>

            <select className={styles.select} value={ratingCategoria} onChange={(e) => setRatingCategoria(e.target.value)}>
              <option value="calidad_atencion">Calidad de atención</option>
              <option value="trabajo_equipo">Trabajo en equipo</option>
              <option value="comunicacion">Comunicación</option>
              <option value="actitud">Actitud profesional</option>
              <option value="desempeno_general">Desempeño general</option>
            </select>

            <div className={styles.filtersRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.starBtn}
                  onClick={() => setStars(n)}
                  style={{ color: stars >= n ? '#f59e0b' : '#d1d5db', fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {stars >= n ? '★' : '☆'}
                </button>
              ))}
              <span style={{ marginLeft: '0.5rem' }}>{stars}/5</span>
            </div>

            <textarea
              className={styles.textarea}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Comentario (opcional)"
              maxLength={500}
            />
            <button className={styles.primaryBtn} type="submit" disabled={!targetUserId}>
              Guardar valoración
            </button>
          </form>
        </article>

        <article className={styles.card}>
          <h3>Valoraciones recibidas</h3>
          {targetUser && <p>Colega seleccionado: <strong>{targetUser.nombre}</strong></p>}
          <p>Promedio: <strong>{ratingSummary.average} ★</strong> ({ratingSummary.total} valoración/es)</p>
          <div className={styles.listWrap}>
            {Array.isArray(ratingSummary.ratings) && ratingSummary.ratings.length > 0 ? ratingSummary.ratings.map((r) => (
              <div key={r._id} className={styles.item}>
                <div className={styles.itemTitle}>
                  {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)} — {CATEGORIAS_LABEL[r.categoria] || r.categoria}
                </div>
                <div>{r.authorUser?.nombre || 'Colega'}</div>
                {r.comentario && <div className={styles.metaMini}>{r.comentario}</div>}
                <div className={styles.rowEnd}>
                  <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                  <button className={styles.linkBtn} onClick={() => handleDeleteRating(r._id)}>Eliminar</button>
                </div>
              </div>
            )) : <p>No hay valoraciones aún para este colega.</p>}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h3>Historial general de valoraciones</h3>
        <div className={styles.filtersRow}>
          <select className={styles.select} value={formalFilter.categoria} onChange={(e) => setFormalFilter((p) => ({ ...p, categoria: e.target.value }))}>
            <option value="">Todas las categorías</option>
            <option value="calidad_atencion">Calidad de atención</option>
            <option value="trabajo_equipo">Trabajo en equipo</option>
            <option value="comunicacion">Comunicación</option>
            <option value="actitud">Actitud profesional</option>
            <option value="desempeno_general">Desempeño general</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>De</th>
                <th>Para</th>
                <th>Categoría</th>
                <th>Estrellas</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>
              {formalFeedbackRecords.map((record) => (
                <tr key={record._id}>
                  <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td>{record.authorUser?.nombre || '-'}</td>
                  <td>{record.targetUser?.nombre || '-'}</td>
                  <td>{CATEGORIAS_LABEL[record.categoria] || record.categoria || '-'}</td>
                  <td>{'★'.repeat(record.stars)}{'☆'.repeat(5 - record.stars)}</td>
                  <td>{record.comentario || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  return (
    <div className={styles.page}>
      <section className={styles.tabBar}>
        <button className={activeTab === TAB.OPERACION ? styles.tabActive : styles.tab} onClick={() => setActiveTab(TAB.OPERACION)}>Operacion</button>
        <button className={activeTab === TAB.TICKETS ? styles.tabActive : styles.tab} onClick={() => setActiveTab(TAB.TICKETS)}>Tickets/SLA</button>
        <button className={activeTab === TAB.USUARIOS ? styles.tabActive : styles.tab} onClick={() => setActiveTab(TAB.USUARIOS)}>Usuarios</button>
        <button className={activeTab === TAB.COLEGAS ? styles.tabActive : styles.tab} onClick={() => setActiveTab(TAB.COLEGAS)}>Colegas</button>
        <button className={activeTab === TAB.VALORACIONES ? styles.tabActive : styles.tab} onClick={() => setActiveTab(TAB.VALORACIONES)}>Valoraciones</button>
      </section>

      {activeTab === TAB.OPERACION && renderOperacion()}
      {activeTab === TAB.TICKETS && renderTickets()}
      {activeTab === TAB.USUARIOS && renderUsuarios()}
      {activeTab === TAB.COLEGAS && renderColegas()}
      {activeTab === TAB.VALORACIONES && renderValoraciones()}
    </div>
  );
}

