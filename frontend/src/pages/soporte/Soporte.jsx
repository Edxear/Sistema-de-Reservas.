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
  getStaffDirectory,
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
import { canAccessSupport, canViewPrivateColleagueComments, isAdminRole } from '../../utils/roles';
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
const RATING_CATEGORIES = ['calidad_atencion', 'trabajo_equipo', 'comunicacion', 'actitud', 'desempeno_general'];
const initialCategoryStars = {
  calidad_atencion: 5,
  trabajo_equipo: 5,
  comunicacion: 5,
  actitud: 5,
  desempeno_general: 5,
};

const SUPPORT_INFO = {
  operacion: {
    title: 'Operacion de soporte',
    summary:
      'Centraliza el control diario del soporte clinico para sostener disponibilidad y continuidad asistencial.',
    points: [
      'Coordinacion de incidentes, cambios y seguimiento de casos activos.',
      'Escalamiento claro por niveles L1-L3 con foco en impacto clinico.',
      'Monitoreo continuo de cumplimiento SLA y satisfaccion de usuarios internos.',
    ],
  },
  analitica: {
    title: 'Analitica avanzada y alertas',
    summary:
      'Resume indicadores clave para detectar desvíos operativos y actuar antes de que afecten la atencion.',
    points: [
      'Visualiza backlog, criticidad y carga operativa en tiempo real.',
      'Detecta alertas tempranas para priorizar acciones del equipo.',
      'Facilita decisiones con datos para mejorar capacidad y respuesta.',
    ],
  },
  censo: {
    title: 'Censo operativo de camas',
    summary:
      'Permite mantener actualizado el estado de camas y coordinar disponibilidad por sector clinico.',
    points: [
      'Registro rapido de camas nuevas y cambios de estado.',
      'Visibilidad de ocupacion para admision, enfermeria y guardia.',
      'Trazabilidad de la ultima actualizacion por usuario.',
    ],
  },
  conocimiento: {
    title: 'Base de conocimiento versionada',
    summary:
      'Documenta procedimientos reutilizables y conserva historial de versiones para respuestas consistentes.',
    points: [
      'Estandariza soluciones frecuentes con articulos versionados.',
      'Reduce tiempos de resolucion y dependencias personales.',
      'Conserva continuidad operativa ante cambios de equipo o turnos.',
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

const initialObraSocialForm = {
  obraSocial: '',
  tipoSolicitud: 'autorizacion',
  pacienteRef: '',
  nroAfiliado: '',
  descripcion: '',
  criticidad: 'medio',
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
  const [obraSocialForm, setObraSocialForm] = useState(initialObraSocialForm);
  const [obraSocialFilter, setObraSocialFilter] = useState({ q: '', estado: '', desde: '', hasta: '' });

  const [users, setUsers] = useState([]);
  const [staffDirectory, setStaffDirectory] = useState([]);
  const [search, setSearch] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average: 0, total: 0, ratings: [], myRating: null, myRatings: [], categoryAverages: {} });
  const [formalFeedbackRecords, setFormalFeedbackRecords] = useState([]);
  const [formalFilter, setFormalFilter] = useState({ categoria: '' });
  const [categoryStars, setCategoryStars] = useState(initialCategoryStars);
  const [ratingComment, setRatingComment] = useState('');
  const [openInfoTab, setOpenInfoTab] = useState(null);

  const CATEGORIAS_LABEL = {
    calidad_atencion: 'Calidad de atención',
    trabajo_equipo: 'Trabajo en equipo',
    comunicacion: 'Comunicación',
    actitud: 'Actitud profesional',
    desempeno_general: 'Desempeño general',
  };

  const staffUsers = useMemo(() => staffDirectory.filter((u) => u.rol !== 'paciente'), [staffDirectory]);
  const targetUser = useMemo(() => staffDirectory.find((u) => u._id === targetUserId), [staffDirectory, targetUserId]);
  const obraSocialRequests = useMemo(() => {
    const query = String(obraSocialFilter.q || '').trim().toLowerCase();
    const desdeTs = obraSocialFilter.desde ? new Date(`${obraSocialFilter.desde}T00:00:00`).getTime() : null;
    const hastaTs = obraSocialFilter.hasta ? new Date(`${obraSocialFilter.hasta}T23:59:59`).getTime() : null;

    return tickets
      .filter((t) => t.tipoGestion === 'obra_social')
      .filter((t) => (obraSocialFilter.estado ? t.estado === obraSocialFilter.estado : true))
      .filter((t) => {
        if (!query) return true;
        const haystack = [
          t.titulo,
          t.descripcion,
          t.codigo,
          Array.isArray(t.tags) ? t.tags.join(' ') : '',
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .filter((t) => {
        const createdTs = new Date(t.createdAt).getTime();
        if (desdeTs && createdTs < desdeTs) return false;
        if (hastaTs && createdTs > hastaTs) return false;
        return true;
      })
      .slice(0, 30);
  }, [tickets, obraSocialFilter]);

  const renderInfoBlock = (tabKey) => {
    const config = SUPPORT_INFO[tabKey];
    if (!config) return null;

    const isOpen = openInfoTab === tabKey;

    return (
      <div className={styles.infoWrap}>
        <button
          type="button"
          className={styles.infoBtn}
          aria-expanded={isOpen}
          onClick={() => setOpenInfoTab((prev) => (prev === tabKey ? null : tabKey))}
        >
          {isOpen ? 'Ocultar informacion' : 'Ver informacion'}
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar usuarios');
    }
  };

  const loadStaffDirectory = async () => {
    try {
      const data = await getStaffDirectory();
      const parsed = Array.isArray(data) ? data : [];
      const staff = parsed.filter((u) => u.rol !== 'paciente');
      setStaffDirectory(staff);

      if (!targetUserId && staff.length) {
        setTargetUserId(staff[0]._id);
      }
    } catch (error) {
      try {
        const fallback = await getSupportUsers();
        const fallbackParsed = Array.isArray(fallback) ? fallback : [];
        const fallbackStaff = fallbackParsed.filter((u) => u.rol !== 'paciente');
        setStaffDirectory(fallbackStaff);
        if (!targetUserId && fallbackStaff.length) {
          setTargetUserId(fallbackStaff[0]._id);
        }
      } catch {
        toast.error(error.response?.data?.message || 'No se pudo cargar el personal');
      }
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
        myRatings: Array.isArray(data?.myRatings) ? data.myRatings : [],
        categoryAverages: data?.categoryAverages || {},
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
    loadStaffDirectory();
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
    if (activeTab === TAB.VALORACIONES || activeTab === TAB.COLEGAS) {
      loadStaffDirectory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!staffUsers.length) {
      if (targetUserId) setTargetUserId('');
      return;
    }

    const exists = staffUsers.some((u) => u._id === targetUserId);
    if (!exists) {
      setTargetUserId(staffUsers[0]._id);
    }
  }, [staffUsers, targetUserId]);

  useEffect(() => {
    if (!Array.isArray(ratingSummary?.myRatings) || ratingSummary.myRatings.length === 0) {
      setCategoryStars(initialCategoryStars);
      setRatingComment('');
      return;
    }

    const nextStars = { ...initialCategoryStars };
    ratingSummary.myRatings.forEach((item) => {
      if (RATING_CATEGORIES.includes(item?.categoria)) {
        nextStars[item.categoria] = item.stars || 5;
      }
    });

    setCategoryStars(nextStars);
    setRatingComment(ratingSummary.myRatings[0]?.comentario || '');
  }, [targetUserId, ratingSummary?.myRatings]);

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

  const handleCreateObraSocialRequest = async (e) => {
    e.preventDefault();
    if (!isAdminRole(role)) {
      toast.error('Solo administradores pueden registrar solicitudes con obra social');
      return;
    }
    if (!obraSocialForm.obraSocial.trim() || !obraSocialForm.descripcion.trim()) {
      toast.error('Completa obra social y descripcion para registrar la solicitud');
      return;
    }

    try {
      await createSupportTicket({
        titulo: `Solicitud ${obraSocialForm.tipoSolicitud} - ${obraSocialForm.obraSocial.trim()}`,
        descripcion: `${obraSocialForm.descripcion.trim()}${obraSocialForm.nroAfiliado?.trim() ? `\nAfiliado: ${obraSocialForm.nroAfiliado.trim()}` : ''}`,
        criticidad: obraSocialForm.criticidad,
        tipoGestion: 'obra_social',
        soporteNivel: 'L2',
        areaClinica: 'Gestion institucional',
        modulo: 'Obra Social',
        impactoClinico: obraSocialForm.pacienteRef?.trim() ? `Paciente referencia: ${obraSocialForm.pacienteRef.trim()}` : '',
        solicitanteNombre: user?.nombre || '',
        solicitanteRol: role || '',
        solicitanteArea: 'Gestion',
        requiresChangeValidation: false,
        tags: [
          'obra_social',
          'interinstitucional',
          obraSocialForm.tipoSolicitud,
          obraSocialForm.obraSocial.trim().toLowerCase().replace(/\s+/g, '_'),
        ],
      });

      setObraSocialForm(initialObraSocialForm);
      toast.success('Solicitud con obra social registrada');
      await loadTickets();
      await loadMetrics();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo crear la solicitud con obra social');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Esta accion eliminara el usuario seleccionado. Deseas continuar?')) return;
    try {
      await deleteSupportUser(id);
      toast.success('Usuario eliminado');
      await loadUsers();
      await loadStaffDirectory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar usuario');
    }
  };

  const handleRoleChange = async (id, nextRole) => {
    try {
      await updateSupportUser(id, { rol: nextRole });
      toast.success('Rol actualizado');
      await loadUsers();
      await loadStaffDirectory();
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
      const ratingsPayload = RATING_CATEGORIES.map((categoria) => ({
        categoria,
        stars: Number(categoryStars[categoria] || 5),
      }));

      await submitColleagueRating(targetUserId, {
        ratings: ratingsPayload,
        comentario: ratingComment,
      });
      toast.success('Valoraciones guardadas');
      await loadRatingSummary();
      await loadFormalFeedbackRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar valoracion');
    }
  };

  const setCategoryStar = (categoria, value) => {
    setCategoryStars((prev) => ({
      ...prev,
      [categoria]: value,
    }));
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

  const handleDeleteRatingGroup = async (groupRatings) => {
    if (!isAdminRole(role)) {
      toast.error('Solo administradores pueden eliminar valoraciones');
      return;
    }

    const ids = (Array.isArray(groupRatings) ? groupRatings : []).map((r) => r?._id).filter(Boolean);
    if (!ids.length) return;

    if (!window.confirm('Se eliminara toda la valoracion agrupada. Deseas continuar?')) return;

    try {
      await Promise.all(ids.map((id) => deleteColleagueRating(id)));
      toast.success('Valoracion eliminada');
      await loadRatingSummary();
      await loadFormalFeedbackRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo eliminar la valoracion');
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
        <h2>Solicitudes institucionales con obra social</h2>
        <p className={styles.note}>Apartado exclusivo para administracion: gestiona requerimientos entre la institucion y financiadores.</p>

        <form onSubmit={handleCreateObraSocialRequest} className={styles.gridForm}>
          <input
            className={styles.input}
            placeholder="Obra social (ej: IAPOS, PAMI, OSDE)"
            value={obraSocialForm.obraSocial}
            onChange={(e) => setObraSocialForm((p) => ({ ...p, obraSocial: e.target.value }))}
            required
          />
          <select
            className={styles.select}
            value={obraSocialForm.tipoSolicitud}
            onChange={(e) => setObraSocialForm((p) => ({ ...p, tipoSolicitud: e.target.value }))}
          >
            <option value="autorizacion">Autorizacion</option>
            <option value="rechazo">Reconsideracion de rechazo</option>
            <option value="auditoria">Auditoria / documentacion</option>
            <option value="facturacion">Ajuste de facturacion</option>
            <option value="prestacion">Alta o modificacion de prestacion</option>
          </select>
          <input
            className={styles.input}
            placeholder="Paciente referencia (opcional)"
            value={obraSocialForm.pacienteRef}
            onChange={(e) => setObraSocialForm((p) => ({ ...p, pacienteRef: e.target.value }))}
          />
          <input
            className={styles.input}
            placeholder="Nro afiliado (opcional)"
            value={obraSocialForm.nroAfiliado}
            onChange={(e) => setObraSocialForm((p) => ({ ...p, nroAfiliado: e.target.value }))}
          />
          <select
            className={styles.select}
            value={obraSocialForm.criticidad}
            onChange={(e) => setObraSocialForm((p) => ({ ...p, criticidad: e.target.value }))}
          >
            {CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            className={styles.textarea}
            placeholder="Detalle de la solicitud interinstitucional"
            value={obraSocialForm.descripcion}
            onChange={(e) => setObraSocialForm((p) => ({ ...p, descripcion: e.target.value }))}
            required
          />
          <button type="submit" className={styles.primaryBtn} disabled={!isAdminRole(role)}>Registrar solicitud</button>
        </form>

        <div className={styles.filtersRow}>
          <input
            className={styles.input}
            placeholder="Filtrar por obra social / codigo / texto"
            value={obraSocialFilter.q}
            onChange={(e) => setObraSocialFilter((p) => ({ ...p, q: e.target.value }))}
          />
          <select
            className={styles.select}
            value={obraSocialFilter.estado}
            onChange={(e) => setObraSocialFilter((p) => ({ ...p, estado: e.target.value }))}
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="date"
            className={styles.input}
            value={obraSocialFilter.desde}
            onChange={(e) => setObraSocialFilter((p) => ({ ...p, desde: e.target.value }))}
          />
          <input
            type="date"
            className={styles.input}
            value={obraSocialFilter.hasta}
            onChange={(e) => setObraSocialFilter((p) => ({ ...p, hasta: e.target.value }))}
          />
        </div>

        <div className={styles.listWrap}>
          {obraSocialRequests.length === 0 ? <p>No hay solicitudes con obra social para los filtros aplicados.</p> : obraSocialRequests.map((req) => (
            <div key={req._id} className={styles.item}>
              <div className={styles.itemTitle}>{req.titulo}</div>
              <div className={styles.metaMini}>Codigo: {req.codigo} | Estado: {req.estado} | Criticidad: {req.criticidad}</div>
              <div>{req.descripcion}</div>
              <div className={styles.metaMini}>Creado: {new Date(req.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Analitica avanzada y alertas</h2>
        {renderInfoBlock('analitica')}
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
        {renderInfoBlock('censo')}
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
        {renderInfoBlock('conocimiento')}
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
            <label className={styles.fieldLabel}>Seleccionar colega del personal</label>
            <select className={styles.select} value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} disabled={!staffUsers.length}>
              <option value="">{staffUsers.length ? 'Seleccionar colega' : 'No hay personal cargado'}</option>
              {staffUsers.map((u) => <option key={u._id} value={u._id}>{u.nombre} — {u.rol}</option>)}
            </select>

            {!staffUsers.length ? <p className={styles.note}>No se encontraron trabajadores para valorar.</p> : null}

            <div className={styles.ratingGrid}>
              {RATING_CATEGORIES.map((categoria) => {
                const current = Number(categoryStars[categoria] || 5);
                return (
                  <div key={categoria} className={styles.ratingRow}>
                    <div className={styles.ratingLabel}>{CATEGORIAS_LABEL[categoria] || categoria}</div>
                    <div className={styles.ratingStarsWrap}>
                      <div className={styles.starGroup}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`${styles.starBtn} ${current >= n ? styles.starBtnActive : ''}`}
                            onClick={() => setCategoryStar(categoria, n)}
                            aria-label={`${CATEGORIAS_LABEL[categoria] || categoria}: ${n} estrellas`}
                          >
                            {current >= n ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                      <span className={styles.starScore}>{current}/5</span>
                    </div>
                  </div>
                );
              })}
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
          <div className={styles.categoryAvgGrid}>
            {RATING_CATEGORIES.map((categoria) => (
              <div key={categoria} className={styles.categoryAvgItem}>
                <span>{CATEGORIAS_LABEL[categoria] || categoria}</span>
                <strong>{Number(ratingSummary.categoryAverages?.[categoria] || 0).toFixed(1)} ★</strong>
              </div>
            ))}
          </div>
          
          {Array.isArray(ratingSummary.ratings) && ratingSummary.ratings.length > 0 ? (
            <div className={styles.listWrap}>
              {(() => {
                // Agrupar ratings por autor
                const grouped = {};
                ratingSummary.ratings.forEach((r) => {
                  const authorId = r.authorUser?._id || 'unknown';
                  if (!grouped[authorId]) {
                    grouped[authorId] = {
                      author: r.authorUser,
                      ratings: [],
                      createdAt: r.createdAt,
                    };
                  }
                  grouped[authorId].ratings.push(r);
                });

                return Object.values(grouped).map((group) => (
                  <div key={group.author?._id} className={styles.ratingCard}>
                    <div className={styles.ratingCardHeader}>
                      <div>
                        <strong>{group.author?.nombre || 'Colega'}</strong>
                        <p className={styles.metaMini}>{new Date(group.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className={styles.ratingCardBody}>
                      {group.ratings.map((r) => (
                        <div key={r._id} className={styles.ratingCategoryRow}>
                          <span className={styles.ratingCategoryLabel}>{CATEGORIAS_LABEL[r.categoria] || r.categoria}</span>
                          <span className={styles.ratingStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                        </div>
                      ))}
                      
                      {group.ratings.some((r) => r.comentario) && (
                        <div className={styles.ratingComment}>
                          <strong>Comentario:</strong>
                          <p>{group.ratings.find((r) => r.comentario)?.comentario}</p>
                        </div>
                      )}
                    </div>
                    
                    {isAdminRole(role) ? (
                      <div className={styles.ratingCardFooter}>
                        <button
                          className={styles.linkBtn}
                          onClick={() => handleDeleteRatingGroup(group.ratings)}
                        >
                          Eliminar valoración
                        </button>
                      </div>
                    ) : null}
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p>No hay valoraciones aún para este colega.</p>
          )}
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
        
        {formalFeedbackRecords.length > 0 ? (
          <div className={styles.listWrap}>
            {(() => {
              // Agrupar por (authorUser, targetUser, createdAt)
              const grouped = {};
              formalFeedbackRecords.forEach((record) => {
                const key = `${record.authorUser?._id}-${record.targetUser?._id}-${new Date(record.createdAt).toLocaleDateString()}`;
                if (!grouped[key]) {
                  grouped[key] = {
                    author: record.authorUser,
                    target: record.targetUser,
                    ratings: [],
                    createdAt: record.createdAt,
                  };
                }
                grouped[key].ratings.push(record);
              });

              return Object.values(grouped).map((group, idx) => (
                <div key={idx} className={styles.ratingCard}>
                  <div className={styles.ratingCardHeader}>
                    <div>
                      <strong>{group.author?.nombre || '-'}</strong>
                      <span>{' → '}</span>
                      <strong>{group.target?.nombre || '-'}</strong>
                      <p className={styles.metaMini}>{new Date(group.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className={styles.ratingCardBody}>
                    {group.ratings.map((r) => (
                      <div key={r._id} className={styles.ratingCategoryRow}>
                        <span className={styles.ratingCategoryLabel}>{CATEGORIAS_LABEL[r.categoria] || r.categoria}</span>
                        <span className={styles.ratingStars}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</span>
                      </div>
                    ))}
                    
                    {group.ratings.some((r) => r.comentario) && (
                      <div className={styles.ratingComment}>
                        <strong>Comentario:</strong>
                        <p>{group.ratings.find((r) => r.comentario)?.comentario}</p>
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <p>No hay valoraciones registradas.</p>
        )}
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

