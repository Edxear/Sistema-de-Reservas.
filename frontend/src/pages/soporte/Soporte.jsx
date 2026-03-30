import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  createPrivateComment,
  createSupportTicket,
  deleteColleagueRating,
  getColleagueFeedbackFramework,
  deleteSupportUser,
  getColleagueRatingSummary,
  getColleagueRatingSummaryByType,
  getPrivateComments,
  getSupportBlueprint,
  getSupportMetrics,
  getSupportUsers,
  listFormalColleagueFeedback,
  listSupportTickets,
  submitColleagueRating,
  submitSupportSurvey,
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
const FORMAL_STATUS = ['registrado', 'en_revision', 'derivado', 'cerrado'];

const defaultBlueprint = {
  teamStructure: [
    { nivel: 'Soporte L1', objetivo: 'Mesa de ayuda: incidencias basicas, accesos y derivaciones.' },
    { nivel: 'Soporte L2', objetivo: 'Soporte tecnico especializado: configuracion, integraciones y BD.' },
    { nivel: 'Soporte L3', objetivo: 'Desarrollo/proveedor: bugs, parches y cambios estructurales.' },
    { nivel: 'Coordinador', objetivo: 'Gobierno SLA, comunicacion y priorizacion clinica.' },
  ],
  processMatrix: [
    { proceso: 'Gestion de incidentes', foco: 'Clasificacion por impacto clinico y prioridad.' },
    { proceso: 'Gestion de cambios', foco: 'Pruebas en entorno aislado antes de produccion.' },
    { proceso: 'Gestion de problemas', foco: 'Analisis causa raiz y prevencion de recurrencia.' },
    { proceso: 'Backup y DR', foco: 'Recuperacion validada periodicamente.' },
    { proceso: 'Seguridad y accesos', foco: 'RBAC, auditoria y cumplimiento normativo.' },
  ],
  tooling: [
    'Ticketing con seguimiento, SLA y reportes',
    'Monitorizacion proactiva de servicios e integraciones',
    'Base de conocimiento reutilizable',
    'Acceso remoto seguro con MFA',
    'Entornos de pruebas aislados',
  ],
  criticalClinicalAspects: [
    'Integracion con equipos medicos (HL7, DICOM)',
    'Cobertura 24/7 para modulos criticos',
    'Trazabilidad y cumplimiento normativo',
    'Capacitacion continua por perfil',
    'Gestion de identidades con AD/SSO',
  ],
  mandatoryDocs: [
    'Manual de procedimientos de soporte',
    'Matriz de escalamiento',
    'Inventario de hardware/software',
    'Plan de continuidad operativa',
  ],
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

  const [blueprint, setBlueprint] = useState(defaultBlueprint);
  const [metrics, setMetrics] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [ticketForm, setTicketForm] = useState(initialTicketForm);
  const [ticketFilter, setTicketFilter] = useState({ criticidad: '', estado: '', soporteNivel: '', q: '' });

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({ average: 0, total: 0, ratings: [], myRating: null });
  const [feedbackFramework, setFeedbackFramework] = useState({ items: [], conclusion: '' });
  const [selectedFeedbackType, setSelectedFeedbackType] = useState('soporte_calidad_atencion');
  const [formalFeedbackRecords, setFormalFeedbackRecords] = useState([]);
  const [formalFilter, setFormalFilter] = useState({ feedbackType: '', channel: '', status: '' });
  const [stars, setStars] = useState(5);
  const [ratingStatus, setRatingStatus] = useState('registrado');
  const [ratingComment, setRatingComment] = useState('');
  const [ratingActionItem, setRatingActionItem] = useState('');

  const staffUsers = useMemo(() => users.filter((u) => u.rol !== 'paciente'), [users]);
  const targetUser = useMemo(() => users.find((u) => u._id === targetUserId), [users, targetUserId]);
  const feedbackItem = useMemo(
    () => feedbackFramework.items.find((item) => item.key === selectedFeedbackType),
    [feedbackFramework.items, selectedFeedbackType]
  );

  const loadBlueprint = async () => {
    try {
      const data = await getSupportBlueprint();
      setBlueprint(data || defaultBlueprint);
    } catch {
      setBlueprint(defaultBlueprint);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await getSupportMetrics();
      setMetrics(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudieron cargar metricas de soporte');
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
      const data = selectedFeedbackType
        ? await getColleagueRatingSummaryByType(targetUserId, selectedFeedbackType)
        : await getColleagueRatingSummary(targetUserId);
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

  const loadFeedbackFramework = async () => {
    try {
      const data = await getColleagueFeedbackFramework();
      setFeedbackFramework({
        items: Array.isArray(data?.items) ? data.items : [],
        conclusion: data?.conclusion || '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar marco de valoraciones');
    }
  };

  const loadFormalFeedbackRecords = async () => {
    try {
      const data = await listFormalColleagueFeedback(formalFilter);
      setFormalFeedbackRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar tablero de valoraciones');
    }
  };

  useEffect(() => {
    loadBlueprint();
    loadMetrics();
    loadTickets();
    loadUsers();
    loadFeedbackFramework();
    loadFormalFeedbackRecords();
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
  }, [targetUserId, selectedFeedbackType]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadFormalFeedbackRecords();
    }, 350);
    return () => clearTimeout(t);
  }, [formalFilter]);

  useEffect(() => {
    if (!ratingSummary?.myRating) return;
    setStars(ratingSummary.myRating.stars || 5);
    setRatingStatus(ratingSummary.myRating.status || 'registrado');
    setRatingComment(ratingSummary.myRating.comentario || '');
    setRatingActionItem(ratingSummary.myRating.actionItem || '');
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
        feedbackType: selectedFeedbackType,
        actionItem: ratingActionItem,
        status: ratingStatus,
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

  const renderOperacion = () => (
    <>
      <section className={styles.card}>
        <h1>Centro de Soporte Clinico</h1>
        <p>Cobertura operativa para incidentes, cambios, continuidad, seguridad y soporte a usuarios internos.</p>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}><span>Tickets</span><strong>{metrics?.total ?? 0}</strong></article>
        <article className={styles.metricCard}><span>SLA respuesta</span><strong>{metrics?.responseSlaPct ?? 0}%</strong></article>
        <article className={styles.metricCard}><span>SLA resolucion</span><strong>{metrics?.resolutionSlaPct ?? 0}%</strong></article>
        <article className={styles.metricCard}><span>Satisfaccion</span><strong>{metrics?.avgSurvey ?? 0}/5</strong></article>
      </section>

      <section className={styles.card}>
        <h2>Estructura del equipo</h2>
        <div className={styles.listWrap}>
          {blueprint.teamStructure.map((row) => (
            <div key={row.nivel} className={styles.item}>
              <div className={styles.itemTitle}>{row.nivel}</div>
              <div>{row.objetivo}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3>Procesos y procedimientos</h3>
          <div className={styles.listWrap}>
            {blueprint.processMatrix.map((row) => (
              <div key={row.proceso} className={styles.item}>
                <div className={styles.itemTitle}>{row.proceso}</div>
                <div>{row.foco}</div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.card}>
          <h3>Herramientas tecnologicas</h3>
          <div className={styles.listWrap}>
            {blueprint.tooling.map((tool) => (
              <div key={tool} className={styles.item}>{tool}</div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3>Aspectos criticos clinicos</h3>
          <div className={styles.listWrap}>
            {blueprint.criticalClinicalAspects.map((aspect) => (
              <div key={aspect} className={styles.item}>{aspect}</div>
            ))}
          </div>
          <p className={styles.note}>Cobertura 24/7 sugerida para UCI, urgencias y prescripcion electronica.</p>
        </article>

        <article className={styles.card}>
          <h3>Documentacion obligatoria</h3>
          <div className={styles.listWrap}>
            {blueprint.mandatoryDocs.map((doc) => (
              <label key={doc} className={styles.checkline}>
                <input type="checkbox" />
                <span>{doc}</span>
              </label>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h3>Matriz de escalamiento</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Cuando escala</th>
                <th>Notificar a</th>
                <th>Tiempo objetivo</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>L1 a L2</td><td>Sin solucion base o requiere analisis tecnico</td><td>Especialista tecnico</td><td>30 min</td></tr>
              <tr><td>L2 a L3</td><td>Bug, parche o cambio estructural</td><td>Desarrollo/Proveedor</td><td>60 min</td></tr>
              <tr><td>Critico</td><td>Impacto clinico alto (prescripcion, UCI, urgencias)</td><td>Coordinador + Direccion</td><td>15 min</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3>Base de conocimiento</h3>
          <div className={styles.listWrap}>
            <div className={styles.item}>Guia rapida de restablecimiento de credenciales y MFA.</div>
            <div className={styles.item}>Procedimiento de recuperacion de modulo de prescripcion.</div>
            <div className={styles.item}>Checklist de validacion post cambio en entorno de pruebas.</div>
            <div className={styles.item}>Runbook de integraciones HL7/FHIR/DICOM y validaciones de conectividad.</div>
            <div className={styles.item}>Procedimiento de respaldo y restauracion por modulo critico.</div>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Continuidad operativa e inventario</h3>
          <div className={styles.listWrap}>
            <div className={styles.item}><strong>Modo contingencia:</strong> plan manual ante caida total del sistema clinico.</div>
            <div className={styles.item}><strong>Inventario:</strong> servidores, licencias, integraciones, dispositivos y responsables.</div>
            <div className={styles.item}><strong>Guardias 24/7:</strong> calendario de cobertura activa/pasiva por nivel L1-L3.</div>
            <div className={styles.item}><strong>Cumplimiento:</strong> auditoria de trazabilidad de accesos a historia clinica y consentimientos.</div>
            <div className={styles.item}><strong>Reportes gerenciales:</strong> tendencia de incidentes, impacto por area y costo operativo.</div>
          </div>
        </article>
      </section>
    </>
  );

  const renderTickets = () => (
    <>
      <section className={styles.card}>
        <h2>Ticketing y SLA</h2>
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
      <h2>Gestion de identidades y accesos (RBAC)</h2>
      <input className={styles.input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, email o telefono" />
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
      <p className={styles.note}>Recomendado: integrar AD/SSO y MFA para acceso remoto seguro.</p>
    </section>
  );

  const renderColegas = () => (
    <>
      <section className={styles.card}>
        <h2>Comentarios internos entre colegas</h2>
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
        <h2>Canales formales de valoraciones internas</h2>
        <p>
          Este apartado exclusivo formaliza cada valoracion por canal, area destino y estado de seguimiento
          para convertir feedback en mejoras operativas.
        </p>
        {feedbackFramework.conclusion ? <p className={styles.note}>{feedbackFramework.conclusion}</p> : null}
      </section>

      <section className={styles.card}>
        <h3>Matriz de valoraciones</h3>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Canal</th>
                <th>Area destino</th>
                <th>Estrellas</th>
              </tr>
            </thead>
            <tbody>
              {feedbackFramework.items.map((item) => (
                <tr key={item.key}>
                  <td>{item.title}</td>
                  <td><span className={styles.pill}>{item.channel}</span></td>
                  <td>{item.destinationArea}</td>
                  <td>{item.requiresStars ? 'Requeridas (1-5)' : 'No requeridas'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.grid2}>
        <article className={styles.card}>
          <h3>Registrar valoracion</h3>
          <form onSubmit={handleRating} className={styles.formCol}>
            <select className={styles.select} value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              <option value="">Seleccionar colega</option>
              {staffUsers.map((u) => <option key={u._id} value={u._id}>{u.nombre} - {u.rol}</option>)}
            </select>

            <select className={styles.select} value={selectedFeedbackType} onChange={(e) => setSelectedFeedbackType(e.target.value)}>
              {feedbackFramework.items.map((item) => (
                <option key={item.key} value={item.key}>{item.title}</option>
              ))}
            </select>

            {feedbackItem?.requiresStars ? (
              <select className={styles.select} value={stars} onChange={(e) => setStars(Number(e.target.value))}>
                <option value={5}>5 estrellas</option>
                <option value={4}>4 estrellas</option>
                <option value={3}>3 estrellas</option>
                <option value={2}>2 estrellas</option>
                <option value={1}>1 estrella</option>
              </select>
            ) : (
              <p className={styles.note}>Este tipo se registra sin ponderacion por estrellas.</p>
            )}

            <select className={styles.select} value={ratingStatus} onChange={(e) => setRatingStatus(e.target.value)}>
              {FORMAL_STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>

            <textarea
              className={styles.textarea}
              value={ratingActionItem}
              onChange={(e) => setRatingActionItem(e.target.value)}
              placeholder="Accion recomendada (ej. plan de capacitacion, revision funcional, derivacion RRHH)"
            />
            <textarea className={styles.textarea} value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Comentario formal" />
            <button className={styles.primaryBtn} type="submit">Guardar valoracion formal</button>
          </form>

          {feedbackItem ? (
            <div className={styles.listWrap}>
              <div className={styles.item}>
                <div className={styles.itemTitle}>Canal activo: {feedbackItem.channel}</div>
                <div>Area destino: {feedbackItem.destinationArea}</div>
              </div>
            </div>
          ) : null}
        </article>

        <article className={styles.card}>
          <h3>Resumen por tipo</h3>
          <p>Promedio: <strong>{ratingSummary.average}</strong> ({ratingSummary.total} registro(s))</p>
          <div className={styles.listWrap}>
            {Array.isArray(ratingSummary.ratings) && ratingSummary.ratings.length > 0 ? ratingSummary.ratings.map((r) => (
              <div key={r._id} className={styles.item}>
                <div className={styles.itemTitle}>{r.authorUser?.nombre || 'Autor'}</div>
                <div>{r.feedbackType}</div>
                <div>{r.comentario || 'Sin comentario'}</div>
                <div className={styles.metaMini}>Canal: {r.channel} | Estado: {r.status}</div>
                <div className={styles.metaMini}>Accion: {r.actionItem || 'Sin accion definida'}</div>
                <div className={styles.rowEnd}>
                  <small>{new Date(r.createdAt).toLocaleString()}</small>
                  <button className={styles.linkBtn} onClick={() => handleDeleteRating(r._id)}>Eliminar</button>
                </div>
              </div>
            )) : <p>No hay valoraciones para este tipo.</p>}
          </div>
        </article>
      </section>

      <section className={styles.card}>
        <h3>Tablero formal (administracion)</h3>
        <div className={styles.filtersRow}>
          <select className={styles.select} value={formalFilter.feedbackType} onChange={(e) => setFormalFilter((p) => ({ ...p, feedbackType: e.target.value }))}>
            <option value="">tipo</option>
            {feedbackFramework.items.map((item) => <option key={item.key} value={item.key}>{item.title}</option>)}
          </select>
          <input className={styles.input} placeholder="canal" value={formalFilter.channel} onChange={(e) => setFormalFilter((p) => ({ ...p, channel: e.target.value }))} />
          <select className={styles.select} value={formalFilter.status} onChange={(e) => setFormalFilter((p) => ({ ...p, status: e.target.value }))}>
            <option value="">estado</option>
            {FORMAL_STATUS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Autor</th>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Canal</th>
                <th>Estado</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {formalFeedbackRecords.map((record) => (
                <tr key={record._id}>
                  <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td>{record.authorUser?.nombre || '-'}</td>
                  <td>{record.targetUser?.nombre || '-'}</td>
                  <td>{record.feedbackType}</td>
                  <td>{record.channel}</td>
                  <td>{record.status}</td>
                  <td>{record.actionItem || '-'}</td>
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

