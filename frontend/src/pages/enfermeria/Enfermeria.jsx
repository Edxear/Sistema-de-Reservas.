import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  createNursingChecklist,
  createNursingIncident,
  createNursingInitiative,
  getNursingCatalog,
  getNursingDashboard,
  getNursingOrganigrama,
  listNursingChecklists,
  listNursingIncidents,
  listNursingInitiatives,
  updateNursingIncidentStatus,
  updateNursingInitiative,
} from '../../services/enfermeriaService';
import styles from './Enfermeria.module.css';

const TRANSVERSAL_ITEMS = [
  'Pase de guardia seguro',
  'Medicacion segura (doble chequeo)',
  'Identificacion positiva del paciente',
  'Prevencion de caidas',
  'Prevencion de lesiones por presion',
  'Deteccion temprana de sepsis',
];

const initialInitiative = {
  titulo: '',
  descripcion: '',
  categoria: 'transversal',
  rama: 'general',
  prioridad: 'media',
  estado: 'pendiente',
  responsable: '',
  fechaObjetivo: '',
};

const initialChecklist = {
  rama: 'Guardia',
  turno: 'manana',
  pacientesAtendidos: 0,
  dotacionPlanificada: 0,
  dotacionPresente: 0,
  alertasCriticas: 0,
  cumplimientoProtocolos: 0,
  adherenciaCapacitacion: 0,
  observaciones: '',
};

const initialIncident = {
  rama: 'Guardia',
  tipo: 'medicacion',
  severidad: 'media',
  descripcion: '',
  pacienteRef: '',
  acciones: '',
};

export default function Enfermeria() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState({ branches: [], hierarchy: [] });
  const [dashboard, setDashboard] = useState({
    windowDays: 30,
    kpis: {},
    initiativesSummary: {},
    branchSummary: [],
    recentIncidents: [],
    recentChecklists: [],
  });
  const [organigrama, setOrganigrama] = useState({ hierarchy: [], branches: [], byBranch: [], total: 0 });
  const [initiatives, setInitiatives] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [ramaFilter, setRamaFilter] = useState('');
  const [initiativeForm, setInitiativeForm] = useState(initialInitiative);
  const [checklistForm, setChecklistForm] = useState(initialChecklist);
  const [incidentForm, setIncidentForm] = useState(initialIncident);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catalogData, dashboardData, organigramaData, initiativesData, checklistData, incidentsData] = await Promise.all([
        getNursingCatalog(),
        getNursingDashboard({ days: 30 }),
        getNursingOrganigrama(),
        listNursingInitiatives({}),
        listNursingChecklists({}),
        listNursingIncidents({}),
      ]);

      setCatalog(catalogData || { branches: [], hierarchy: [] });
      setDashboard(dashboardData || {});
      setOrganigrama(organigramaData || { hierarchy: [], branches: [], byBranch: [], total: 0 });
      setInitiatives(Array.isArray(initiativesData) ? initiativesData : []);
      setChecklists(Array.isArray(checklistData) ? checklistData : []);
      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);

      const firstBranch = (catalogData?.branches || [])[0] || 'Guardia';
      setChecklistForm((prev) => ({ ...prev, rama: firstBranch }));
      setIncidentForm((prev) => ({ ...prev, rama: firstBranch }));
      if (initiativeForm.rama === 'general' && firstBranch) {
        setInitiativeForm((prev) => ({ ...prev }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar el modulo de enfermeria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const branches = catalog?.branches || [];

  const branchSummaryVisible = useMemo(
    () => (dashboard.branchSummary || []).filter((b) => (ramaFilter ? b.rama === ramaFilter : true)),
    [dashboard.branchSummary, ramaFilter],
  );

  const incidentsVisible = useMemo(
    () => incidents.filter((i) => (ramaFilter ? i.rama === ramaFilter : true)).slice(0, 20),
    [incidents, ramaFilter],
  );

  const initiativesByCategory = useMemo(() => {
    return {
      transversal: initiatives.filter((i) => i.categoria === 'transversal'),
      rama: initiatives.filter((i) => i.categoria === 'rama'),
      organigrama: initiatives.filter((i) => i.categoria === 'organigrama'),
      digitalizacion: initiatives.filter((i) => i.categoria === 'digitalizacion'),
      kpi: initiatives.filter((i) => i.categoria === 'kpi'),
    };
  }, [initiatives]);

  const handleCreateInitiative = async (e) => {
    e.preventDefault();
    if (!initiativeForm.titulo.trim()) {
      toast.error('El titulo de la iniciativa es obligatorio');
      return;
    }
    try {
      await createNursingInitiative({
        ...initiativeForm,
        titulo: initiativeForm.titulo.trim(),
        descripcion: initiativeForm.descripcion.trim(),
      });
      setInitiativeForm(initialInitiative);
      toast.success('Iniciativa registrada');
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo crear la iniciativa');
    }
  };

  const handleInitiativeStatus = async (id, estado) => {
    try {
      await updateNursingInitiative(id, { estado });
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la iniciativa');
    }
  };

  const handleCreateChecklist = async (e) => {
    e.preventDefault();
    try {
      const items = TRANSVERSAL_ITEMS.map((label, idx) => ({
        key: `t-${idx + 1}`,
        label,
        done: Number(checklistForm.cumplimientoProtocolos) >= 80,
      }));

      await createNursingChecklist({
        ...checklistForm,
        fecha: new Date().toISOString(),
        items,
      });
      setChecklistForm((prev) => ({ ...initialChecklist, rama: prev.rama }));
      toast.success('Checklist guardado');
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar checklist');
    }
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    if (!incidentForm.descripcion.trim()) {
      toast.error('La descripcion del incidente es obligatoria');
      return;
    }
    try {
      await createNursingIncident({
        ...incidentForm,
        descripcion: incidentForm.descripcion.trim(),
        pacienteRef: incidentForm.pacienteRef.trim(),
        acciones: incidentForm.acciones.trim(),
      });
      setIncidentForm((prev) => ({ ...initialIncident, rama: prev.rama }));
      toast.success('Incidente registrado');
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar incidente');
    }
  };

  const handleIncidentStatus = async (id, estado) => {
    try {
      await updateNursingIncidentStatus(id, { estado });
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el incidente');
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1>Area de Enfermeria</h1>
        <p>Modulo integral: mejoras transversales, mejoras por rama, organigrama y gestion, digitalizacion y KPIs.</p>
        <div className={styles.metaRow}>
          <span>Usuario activo: {user?.nombre || 'Sin sesion'}</span>
          <span>Rol: {user?.rol || '-'}</span>
          <span>Ventana KPI: {dashboard.windowDays || 30} dias</span>
        </div>
      </section>

      <section className={styles.card}>
        <h2>KPIs Prioritarios</h2>
        <div className={styles.grid}>
          <article className={styles.ramaCard}><h3>Eventos adversos</h3><p>{dashboard.kpis?.eventosAdversosPor1000PacientesDia || 0} por 1000 pacientes-dia</p></article>
          <article className={styles.ramaCard}><h3>Respuesta a alertas</h3><p>{dashboard.kpis?.tiempoRespuestaAlertasMin || 0} min promedio</p></article>
          <article className={styles.ramaCard}><h3>Cumplimiento checklist</h3><p>{dashboard.kpis?.cumplimientoChecklistPct || 0}%</p></article>
          <article className={styles.ramaCard}><h3>Infecciones asociadas</h3><p>{dashboard.kpis?.infeccionesAsistenciales || 0}</p></article>
          <article className={styles.ramaCard}><h3>Ausentismo</h3><p>{dashboard.kpis?.ausentismoPct || 0}%</p></article>
          <article className={styles.ramaCard}><h3>Adherencia capacitacion</h3><p>{dashboard.kpis?.adherenciaCapacitacionPct || 0}%</p></article>
        </div>
      </section>

      <section className={styles.card}>
        <h2>Mejoras Transversales y por Rama</h2>
        <div className={styles.filterRow}>
          <label htmlFor="ramaFilter" className={styles.filterLabel}>Filtrar por rama:</label>
          <select
            id="ramaFilter"
            className={styles.select}
            value={ramaFilter}
            onChange={(e) => setRamaFilter(e.target.value)}
          >
            <option value="">Todas las ramas</option>
            {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
          </select>
        </div>

        <form onSubmit={handleCreateInitiative} className={styles.gridMini}>
          <input className={styles.select} placeholder="Titulo de mejora" value={initiativeForm.titulo} onChange={(e) => setInitiativeForm((p) => ({ ...p, titulo: e.target.value }))} />
          <select className={styles.select} value={initiativeForm.categoria} onChange={(e) => setInitiativeForm((p) => ({ ...p, categoria: e.target.value }))}>
            <option value="transversal">Transversal</option>
            <option value="rama">Por rama</option>
            <option value="organigrama">Organigrama y gestion</option>
            <option value="digitalizacion">Digitalizacion</option>
            <option value="kpi">KPI</option>
          </select>
          <select className={styles.select} value={initiativeForm.rama} onChange={(e) => setInitiativeForm((p) => ({ ...p, rama: e.target.value }))}>
            <option value="general">General</option>
            {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
          </select>
          <select className={styles.select} value={initiativeForm.prioridad} onChange={(e) => setInitiativeForm((p) => ({ ...p, prioridad: e.target.value }))}>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Critica</option>
          </select>
          <input className={styles.select} placeholder="Responsable" value={initiativeForm.responsable} onChange={(e) => setInitiativeForm((p) => ({ ...p, responsable: e.target.value }))} />
          <input type="date" className={styles.select} value={initiativeForm.fechaObjetivo} onChange={(e) => setInitiativeForm((p) => ({ ...p, fechaObjetivo: e.target.value }))} />
          <textarea className={styles.select} placeholder="Descripcion" value={initiativeForm.descripcion} onChange={(e) => setInitiativeForm((p) => ({ ...p, descripcion: e.target.value }))} />
          <button className={styles.pill} type="submit">Guardar iniciativa</button>
        </form>

        <div className={styles.grid}>
          {branchSummaryVisible.map((rama) => (
            <article key={rama.nombre} className={styles.ramaCard}>
              <h3>{rama.rama}</h3>
              <p>Cumplimiento protocolos: {rama.cumplimientoProtocolos}%</p>
              <p>Alertas criticas: {rama.alertasCriticas}</p>
              <span className={styles.pill}>Incidentes: {rama.incidentes}</span>
            </article>
          ))}
        </div>

        <div className={styles.subsection}>
          <h3>Estado de iniciativas</h3>
          <div className={styles.list}>
            {[...initiativesByCategory.transversal, ...initiativesByCategory.rama].slice(0, 20).map((item) => (
              <li key={item._id}>
                <strong>{item.titulo}</strong> ({item.categoria} / {item.rama}) - {item.prioridad}
                <select className={styles.select} value={item.estado} onChange={(e) => handleInitiativeStatus(item._id, e.target.value)}>
                  <option value="pendiente">pendiente</option>
                  <option value="en_progreso">en_progreso</option>
                  <option value="implementado">implementado</option>
                </select>
              </li>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h2>Organigrama y Gestion</h2>
        <div className={styles.timeline}>
          {(organigrama.hierarchy || []).map((item) => (
            <div key={item.nivel} className={styles.timelineItem}>
              <div className={styles.timelineLevel}>Nivel {item.nivel}</div>
              <div className={styles.timelineBody}>
                <strong>{item.cargo}</strong>
                <p>{item.responsabilidad}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.subsection}>
          <h3>Personal por rama</h3>
          <div className={styles.metaRow}><span>Total personal registrado: {organigrama.total || 0}</span></div>
        </div>
        <div className={styles.gridMini}>
          {(organigrama.byBranch || []).filter((b) => (ramaFilter ? b.rama === ramaFilter : true)).map((bucket) => (
            <div key={bucket.rama} className={styles.miniCard}>
              <strong>{bucket.rama}</strong>
              <p>{bucket.personal.length} integrante/s</p>
              <p>{bucket.personal.map((p) => `${p.nombre} (${p.cargoOrganigrama || 'Sin cargo'})`).join(', ') || 'Sin personal'}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Digitalizacion de Alto Impacto</h2>
        <div className={styles.grid2}>
          <form onSubmit={handleCreateChecklist} className={styles.miniCard}>
            <h3>Checklist de turno</h3>
            <select className={styles.select} value={checklistForm.rama} onChange={(e) => setChecklistForm((p) => ({ ...p, rama: e.target.value }))}>
              {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
            </select>
            <select className={styles.select} value={checklistForm.turno} onChange={(e) => setChecklistForm((p) => ({ ...p, turno: e.target.value }))}>
              <option value="manana">manana</option>
              <option value="tarde">tarde</option>
              <option value="noche">noche</option>
            </select>
            <input type="number" className={styles.select} placeholder="Pacientes atendidos" value={checklistForm.pacientesAtendidos} onChange={(e) => setChecklistForm((p) => ({ ...p, pacientesAtendidos: Number(e.target.value || 0) }))} />
            <input type="number" className={styles.select} placeholder="Dotacion planificada" value={checklistForm.dotacionPlanificada} onChange={(e) => setChecklistForm((p) => ({ ...p, dotacionPlanificada: Number(e.target.value || 0) }))} />
            <input type="number" className={styles.select} placeholder="Dotacion presente" value={checklistForm.dotacionPresente} onChange={(e) => setChecklistForm((p) => ({ ...p, dotacionPresente: Number(e.target.value || 0) }))} />
            <input type="number" className={styles.select} placeholder="Cumplimiento protocolos %" value={checklistForm.cumplimientoProtocolos} onChange={(e) => setChecklistForm((p) => ({ ...p, cumplimientoProtocolos: Number(e.target.value || 0) }))} />
            <input type="number" className={styles.select} placeholder="Adherencia capacitacion %" value={checklistForm.adherenciaCapacitacion} onChange={(e) => setChecklistForm((p) => ({ ...p, adherenciaCapacitacion: Number(e.target.value || 0) }))} />
            <textarea className={styles.select} placeholder="Observaciones" value={checklistForm.observaciones} onChange={(e) => setChecklistForm((p) => ({ ...p, observaciones: e.target.value }))} />
            <button className={styles.pill} type="submit">Guardar checklist</button>
          </form>

          <form onSubmit={handleCreateIncident} className={styles.miniCard}>
            <h3>Registro de incidente</h3>
            <select className={styles.select} value={incidentForm.rama} onChange={(e) => setIncidentForm((p) => ({ ...p, rama: e.target.value }))}>
              {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
            </select>
            <select className={styles.select} value={incidentForm.tipo} onChange={(e) => setIncidentForm((p) => ({ ...p, tipo: e.target.value }))}>
              <option value="medicacion">medicacion</option>
              <option value="caidas">caidas</option>
              <option value="infecciones">infecciones</option>
              <option value="comunicacion">comunicacion</option>
              <option value="otros">otros</option>
            </select>
            <select className={styles.select} value={incidentForm.severidad} onChange={(e) => setIncidentForm((p) => ({ ...p, severidad: e.target.value }))}>
              <option value="baja">baja</option>
              <option value="media">media</option>
              <option value="alta">alta</option>
              <option value="critica">critica</option>
            </select>
            <input className={styles.select} placeholder="Paciente referencia" value={incidentForm.pacienteRef} onChange={(e) => setIncidentForm((p) => ({ ...p, pacienteRef: e.target.value }))} />
            <textarea className={styles.select} placeholder="Descripcion del incidente" value={incidentForm.descripcion} onChange={(e) => setIncidentForm((p) => ({ ...p, descripcion: e.target.value }))} />
            <textarea className={styles.select} placeholder="Acciones iniciales" value={incidentForm.acciones} onChange={(e) => setIncidentForm((p) => ({ ...p, acciones: e.target.value }))} />
            <button className={styles.pill} type="submit">Registrar incidente</button>
          </form>
        </div>

        <div className={styles.subsection}>
          <h3>Incidentes recientes</h3>
          <div className={styles.gridMini}>
            {incidentsVisible.map((i) => (
              <div key={i._id} className={styles.miniCard}>
                <strong>{i.rama} - {i.tipo}</strong>
                <p>Severidad: {i.severidad}</p>
                <p>Estado: {i.estado}</p>
                <p>{i.descripcion}</p>
                <select className={styles.select} value={i.estado} onChange={(e) => handleIncidentStatus(i._id, e.target.value)}>
                  <option value="abierto">abierto</option>
                  <option value="en_investigacion">en_investigacion</option>
                  <option value="cerrado">cerrado</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.subsection}>
          <h3>Digitalizacion / Organigrama / KPI (planes activos)</h3>
          <ul className={styles.list}>
            {[...initiativesByCategory.digitalizacion, ...initiativesByCategory.organigrama, ...initiativesByCategory.kpi].slice(0, 25).map((item) => (
              <li key={item._id}>{item.titulo} - {item.estado} ({item.categoria})</li>
            ))}
          </ul>
        </div>

        <div className={styles.subsection}>
          <h3>Ultimos checklists</h3>
          <div className={styles.gridMini}>
            {checklists.slice(0, 8).map((c) => (
              <div key={c._id} className={styles.miniCard}>
                <strong>{c.rama} ({c.turno})</strong>
                <p>Cumplimiento: {c.cumplimientoProtocolos}%</p>
                <p>Capacitacion: {c.adherenciaCapacitacion}%</p>
                <p>Dotacion: {c.dotacionPresente}/{c.dotacionPlanificada}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading ? <section className={styles.card}><p>Cargando datos de enfermeria...</p></section> : null}
    </div>
  );
}
