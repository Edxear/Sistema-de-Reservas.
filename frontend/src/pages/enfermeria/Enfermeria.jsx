import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  createNursingChecklist,
  createNursingIncident,
  createNursingInitiative,
  getNursingCatalog,
  getNursingConfig,
  getNursingDashboard,
  getNursingOrganigrama,
  listNursingChecklists,
  listNursingIncidents,
  listNursingInitiatives,
  updateNursingConfig,
  updateNursingIncidentStatus,
  updateNursingInitiative,
} from '../../services/enfermeriaService';
import { exportGroupedSheetsToExcel } from '../../utils/excelExport';
import styles from './Enfermeria.module.css';
import MiTurno from './MiTurno';
import PlanCuidados from './PlanCuidados';
import CalculadoraClinica from './CalculadoraClinica';
import BaseConocimiento from './BaseConocimiento';
import AlertasSeguridad from './AlertasSeguridad';
import FotosHeridas from './FotosHeridas';
import MensajeriaSegura from './MensajeriaSegura';
import CargaTrabajo from './CargaTrabajo';
import AyudaRapida from './AyudaRapida';
import AreaBedBoard from '../../components/AreaBedBoard';

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

const defaultThresholds = {
  eventosPor1000: { greenMax: 5, yellowMax: 10 },
  respuestaMin: { greenMax: 15, yellowMax: 45 },
  cumplimientoChecklistPct: { yellowMin: 85, greenMin: 95 },
  ausentismoPct: { greenMax: 5, yellowMax: 10 },
  adherenciaCapacitacionPct: { yellowMin: 80, greenMin: 92 },
};

const defaultPermissions = {
  canViewModule: false,
  canCreateChecklist: false,
  canCreateIncident: false,
  canManageIncidentStatus: false,
  canManageInitiatives: false,
  canConfigureThresholds: false,
};

const pickItems = (payload) => (Array.isArray(payload) ? payload : (payload?.items || []));

const toCsvLine = (values) => values.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',');

export default function Enfermeria() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState({ branches: [], hierarchy: [] });
  const [dashboard, setDashboard] = useState({
    windowDays: 30,
    kpis: {},
    semaforoGlobal: {},
    initiativesSummary: {},
    branchSummary: [],
    recentIncidents: [],
    recentChecklists: [],
  });
  const [organigrama, setOrganigrama] = useState({ hierarchy: [], branches: [], byBranch: [], total: 0 });
  const [initiatives, setInitiatives] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [thresholds, setThresholds] = useState(defaultThresholds);
  const [permissions, setPermissions] = useState(defaultPermissions);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('miTurno');
  const [ramaFilter, setRamaFilter] = useState('');
  const [initiativeForm, setInitiativeForm] = useState(initialInitiative);
  const [checklistForm, setChecklistForm] = useState(initialChecklist);
  const [incidentForm, setIncidentForm] = useState(initialIncident);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catalogData, configData, dashboardData, organigramaData, initiativesData, checklistData, incidentsData] = await Promise.all([
        getNursingCatalog(),
        getNursingConfig(),
        getNursingDashboard({ days: 30 }),
        getNursingOrganigrama(),
        listNursingInitiatives({}),
        listNursingChecklists({}),
        listNursingIncidents({}),
      ]);

      setCatalog(catalogData || { branches: [], hierarchy: [] });
      setThresholds(configData?.thresholds || defaultThresholds);
      setDashboard(dashboardData || {});
      setOrganigrama(organigramaData || { hierarchy: [], branches: [], byBranch: [], total: 0 });
      setInitiatives(pickItems(initiativesData));
      setChecklists(pickItems(checklistData));
      setIncidents(pickItems(incidentsData));

      setPermissions({
        ...defaultPermissions,
        ...(configData?.permissions || {}),
        ...(dashboardData?.permissions || {}),
      });

      const firstBranch = (catalogData?.branches || [])[0] || 'Guardia';
      setChecklistForm((prev) => ({ ...prev, rama: firstBranch }));
      setIncidentForm((prev) => ({ ...prev, rama: firstBranch }));
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

  const initiativesByCategory = useMemo(() => ({
    transversal: initiatives.filter((i) => i.categoria === 'transversal'),
    rama: initiatives.filter((i) => i.categoria === 'rama'),
    organigrama: initiatives.filter((i) => i.categoria === 'organigrama'),
    digitalizacion: initiatives.filter((i) => i.categoria === 'digitalizacion'),
    kpi: initiatives.filter((i) => i.categoria === 'kpi'),
  }), [initiatives]);

  const statusClass = (status) => {
    if (status === 'red') return styles.badgeRed;
    if (status === 'yellow') return styles.badgeYellow;
    return styles.badgeGreen;
  };

  const handleExportCsv = () => {
    try {
      const lines = [];
      lines.push(toCsvLine(['Seccion', 'Metrica', 'Valor', 'Semaforo']));
      lines.push(toCsvLine(['KPI', 'Eventos adversos por 1000 pacientes-dia', dashboard.kpis?.eventosAdversosPor1000PacientesDia || 0, dashboard.semaforoGlobal?.eventosAdversosPor1000PacientesDia || 'green']));
      lines.push(toCsvLine(['KPI', 'Tiempo de respuesta alertas (min)', dashboard.kpis?.tiempoRespuestaAlertasMin || 0, dashboard.semaforoGlobal?.tiempoRespuestaAlertasMin || 'green']));
      lines.push(toCsvLine(['KPI', 'Cumplimiento checklist (%)', dashboard.kpis?.cumplimientoChecklistPct || 0, dashboard.semaforoGlobal?.cumplimientoChecklistPct || 'green']));
      lines.push(toCsvLine(['KPI', 'Ausentismo (%)', dashboard.kpis?.ausentismoPct || 0, dashboard.semaforoGlobal?.ausentismoPct || 'green']));
      lines.push(toCsvLine(['KPI', 'Adherencia capacitacion (%)', dashboard.kpis?.adherenciaCapacitacionPct || 0, dashboard.semaforoGlobal?.adherenciaCapacitacionPct || 'green']));

      branchSummaryVisible.forEach((row) => {
        lines.push(toCsvLine(['Rama', row.rama, `Incidentes ${row.incidentes} | Cumplimiento ${row.cumplimientoProtocolos}% | Eventos/1000 ${row.eventosPor1000}`, row.semaforo || 'green']));
      });

      incidentsVisible.forEach((item) => {
        lines.push(toCsvLine(['Incidente', `${item.rama} - ${item.tipo}`, `${item.estado} - ${item.severidad}`, '']));
      });

      const blob = new Blob([`\ufeff${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `enfermeria-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success('Reporte CSV generado');
    } catch (error) {
      toast.error('No se pudo generar el CSV');
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      let y = 14;
      doc.setFontSize(14);
      doc.text('Reporte de Enfermeria', 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, y);
      y += 8;

      const writeLine = (text) => {
        if (y > 280) {
          doc.addPage();
          y = 14;
        }
        doc.text(text, 14, y);
        y += 6;
      };

      writeLine(`Eventos por 1000: ${dashboard.kpis?.eventosAdversosPor1000PacientesDia || 0}`);
      writeLine(`Respuesta alertas (min): ${dashboard.kpis?.tiempoRespuestaAlertasMin || 0}`);
      writeLine(`Cumplimiento checklist: ${dashboard.kpis?.cumplimientoChecklistPct || 0}%`);
      writeLine(`Ausentismo: ${dashboard.kpis?.ausentismoPct || 0}%`);
      writeLine(`Adherencia capacitacion: ${dashboard.kpis?.adherenciaCapacitacionPct || 0}%`);
      y += 2;
      writeLine('Ramas:');
      branchSummaryVisible.forEach((row) => {
        writeLine(`- ${row.rama}: incidentes ${row.incidentes}, cumplimiento ${row.cumplimientoProtocolos}%, semaforo ${row.semaforo || 'green'}`);
      });

      y += 2;
      writeLine('Incidentes recientes:');
      incidentsVisible.slice(0, 12).forEach((item) => {
        writeLine(`- ${item.rama} / ${item.tipo} / ${item.estado} / ${item.severidad}`);
      });

      doc.save(`enfermeria-reporte-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Reporte PDF generado');
    } catch (error) {
      toast.error('No se pudo generar el PDF');
    }
  };

  const handleExportExcel = () => {
    const kpisRows = [
      {
        EventosPor1000: dashboard.kpis?.eventosAdversosPor1000PacientesDia || 0,
        RespuestaAlertasMin: dashboard.kpis?.tiempoRespuestaAlertasMin || 0,
        CumplimientoChecklistPct: dashboard.kpis?.cumplimientoChecklistPct || 0,
        AusentismoPct: dashboard.kpis?.ausentismoPct || 0,
        AdherenciaCapacitacionPct: dashboard.kpis?.adherenciaCapacitacionPct || 0,
      },
    ];

    const branchRows = branchSummaryVisible.map((row) => ({
      Rama: row.rama,
      Incidentes: row.incidentes,
      CumplimientoProtocolosPct: row.cumplimientoProtocolos,
      EventosPor1000: row.eventosPor1000,
      Semaforo: row.semaforo || 'green',
    }));

    const incidentRows = incidentsVisible.map((item) => ({
      Rama: item.rama,
      Tipo: item.tipo,
      Severidad: item.severidad,
      Estado: item.estado,
      PacienteRef: item.pacienteRef || '',
      Descripcion: item.descripcion || '',
    }));

    const exported = exportGroupedSheetsToExcel({
      fileName: `enfermeria-reporte-${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheets: [
        { name: 'KPIs', rows: kpisRows },
        { name: 'Ramas', rows: branchRows },
        { name: 'Incidentes', rows: incidentRows },
      ],
    });

    if (!exported) {
      toast.info('No hay datos para exportar a Excel');
      return;
    }
    toast.success('Reporte Excel generado');
  };

  const handleCreateInitiative = async (e) => {
    e.preventDefault();
    if (!permissions.canManageInitiatives) {
      toast.error('No tienes permisos para gestionar iniciativas');
      return;
    }
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
    if (!permissions.canManageInitiatives) {
      toast.error('No tienes permisos para cambiar estado de iniciativas');
      return;
    }
    try {
      await updateNursingInitiative(id, { estado });
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la iniciativa');
    }
  };

  const handleCreateChecklist = async (e) => {
    e.preventDefault();
    if (!permissions.canCreateChecklist) {
      toast.error('No tienes permisos para crear checklists');
      return;
    }
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
    if (!permissions.canCreateIncident) {
      toast.error('No tienes permisos para registrar incidentes');
      return;
    }
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
    if (!permissions.canManageIncidentStatus) {
      toast.error('No tienes permisos para cambiar estado de incidentes');
      return;
    }
    try {
      await updateNursingIncidentStatus(id, { estado });
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar el incidente');
    }
  };

  const updateThresholdValue = (group, key, value) => {
    const numericValue = Number(value || 0);
    setThresholds((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [key]: numericValue,
      },
    }));
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (!permissions.canConfigureThresholds) {
      toast.error('Solo administracion puede modificar umbrales');
      return;
    }
    try {
      const result = await updateNursingConfig({ thresholds });
      setThresholds(result?.thresholds || thresholds);
      toast.success('Umbrales actualizados');
      await loadAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar configuracion');
    }
  };

  if (!permissions.canViewModule && !loading) {
    return (
      <div className={styles.page}>
        <section className={styles.card}>
          <h2>Modulo de Enfermeria</h2>
          <p>No tienes permisos para acceder a este modulo.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-tour="enfermeria-overview">
        <h1>Area de Enfermeria</h1>
        <p>Modulo integral: mejoras transversales, mejoras por rama, organigrama y gestion, digitalizacion y KPIs.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('miTurno')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'miTurno' ? '#3b82f6' : '#e5e7eb', color: activeTab === 'miTurno' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>📋 Mi Turno</button>
          <button onClick={() => setActiveTab('planCuidados')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'planCuidados' ? '#10b981' : '#e5e7eb', color: activeTab === 'planCuidados' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>🏥 Plan de Cuidados</button>
          <button onClick={() => setActiveTab('calculadora')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'calculadora' ? '#8b5cf6' : '#e5e7eb', color: activeTab === 'calculadora' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>🔢 Calculadora</button>
          <button onClick={() => setActiveTab('alertas')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'alertas' ? '#ef4444' : '#e5e7eb', color: activeTab === 'alertas' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>⚠️ Alertas</button>
          <button onClick={() => setActiveTab('conocimiento')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'conocimiento' ? '#f59e0b' : '#e5e7eb', color: activeTab === 'conocimiento' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>📚 Conocimiento</button>
          <button onClick={() => setActiveTab('heridas')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'heridas' ? '#0284c7' : '#e5e7eb', color: activeTab === 'heridas' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>📷 Heridas</button>
          <button onClick={() => setActiveTab('mensajeria')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'mensajeria' ? '#0f766e' : '#e5e7eb', color: activeTab === 'mensajeria' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>💬 Mensajeria</button>
          <button onClick={() => setActiveTab('pizarraArea')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'pizarraArea' ? '#2563eb' : '#e5e7eb', color: activeTab === 'pizarraArea' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>🛏️ Pizarra Camas</button>
          <button onClick={() => setActiveTab('carga')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'carga' ? '#6366f1' : '#e5e7eb', color: activeTab === 'carga' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>👥 Carga</button>
          <button onClick={() => setActiveTab('dashboard')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'dashboard' ? '#3b82f6' : '#e5e7eb', color: activeTab === 'dashboard' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('config')} style={{ padding: '0.5rem 1rem', backgroundColor: activeTab === 'config' ? '#3b82f6' : '#e5e7eb', color: activeTab === 'config' ? '#fff' : '#1f2937', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>⚙️ Config</button>
        </div>

        <div className={styles.metaRow}>
          <span>Usuario activo: {user?.nombre || 'Sin sesion'}</span>
          <span>Rol: {user?.rol || '-'}</span>
          <span>Ventana KPI: {dashboard.windowDays || 30} dias</span>
        </div>
      </section>

      {activeTab === 'miTurno' && (
        <>
          <AyudaRapida branches={branches} userRama={dashboard?.scope?.rama || ''} />
          <MiTurno branches={branches} checklists={checklists} initiatives={initiatives} user={user} />
        </>
      )}
      {activeTab === 'carga' && <CargaTrabajo />}
      {activeTab === 'planCuidados' && <PlanCuidados />}
      {activeTab === 'calculadora' && <CalculadoraClinica />}
      {activeTab === 'alertas' && <AlertasSeguridad />}
      {activeTab === 'conocimiento' && <BaseConocimiento />}
      {activeTab === 'heridas' && <FotosHeridas branches={branches} scope={dashboard?.scope || {}} permissions={permissions} />}
      {activeTab === 'mensajeria' && <MensajeriaSegura />}
      {activeTab === 'pizarraArea' && <AreaBedBoard areaKey="enfermeria" />}
        {(activeTab === 'dashboard' || activeTab === 'config') && (<>
      <section className={styles.card}>
        <div className={styles.actionsRow}>
          <h2>KPIs Prioritarios</h2>
          <div className={styles.actionsRow}>
            <button className={styles.pill} type="button" onClick={handleExportCsv}>Exportar CSV</button>
            <button className={styles.pill} type="button" onClick={handleExportPdf}>Exportar PDF</button>
            <button className={styles.pill} type="button" onClick={handleExportExcel}>Exportar Excel</button>
          </div>
        </div>
        <div className={styles.grid}>
          <article className={styles.ramaCard}>
            <h3>Eventos adversos</h3>
            <p>{dashboard.kpis?.eventosAdversosPor1000PacientesDia || 0} por 1000 pacientes-dia</p>
            <span className={`${styles.pill} ${statusClass(dashboard.semaforoGlobal?.eventosAdversosPor1000PacientesDia)}`}>{dashboard.semaforoGlobal?.eventosAdversosPor1000PacientesDia || 'green'}</span>
          </article>
          <article className={styles.ramaCard}>
            <h3>Respuesta a alertas</h3>
            <p>{dashboard.kpis?.tiempoRespuestaAlertasMin || 0} min promedio</p>
            <span className={`${styles.pill} ${statusClass(dashboard.semaforoGlobal?.tiempoRespuestaAlertasMin)}`}>{dashboard.semaforoGlobal?.tiempoRespuestaAlertasMin || 'green'}</span>
          </article>
          <article className={styles.ramaCard}>
            <h3>Cumplimiento checklist</h3>
            <p>{dashboard.kpis?.cumplimientoChecklistPct || 0}%</p>
            <span className={`${styles.pill} ${statusClass(dashboard.semaforoGlobal?.cumplimientoChecklistPct)}`}>{dashboard.semaforoGlobal?.cumplimientoChecklistPct || 'green'}</span>
          </article>
          <article className={styles.ramaCard}><h3>Infecciones asociadas</h3><p>{dashboard.kpis?.infeccionesAsistenciales || 0}</p></article>
          <article className={styles.ramaCard}>
            <h3>Ausentismo</h3>
            <p>{dashboard.kpis?.ausentismoPct || 0}%</p>
            <span className={`${styles.pill} ${statusClass(dashboard.semaforoGlobal?.ausentismoPct)}`}>{dashboard.semaforoGlobal?.ausentismoPct || 'green'}</span>
          </article>
          <article className={styles.ramaCard}>
            <h3>Adherencia capacitacion</h3>
            <p>{dashboard.kpis?.adherenciaCapacitacionPct || 0}%</p>
            <span className={`${styles.pill} ${statusClass(dashboard.semaforoGlobal?.adherenciaCapacitacionPct)}`}>{dashboard.semaforoGlobal?.adherenciaCapacitacionPct || 'green'}</span>
          </article>
        </div>
      </section>

      {permissions.canConfigureThresholds ? (
        <section className={styles.card}>
          <h2>Configuracion de Umbrales (Semaforo)</h2>
          <form className={styles.gridMini} onSubmit={handleSaveThresholds}>
            <div className={styles.miniCard}>
              <strong>Eventos por 1000 (menor es mejor)</strong>
              <input type="number" className={styles.select} value={thresholds.eventosPor1000.greenMax} onChange={(e) => updateThresholdValue('eventosPor1000', 'greenMax', e.target.value)} />
              <input type="number" className={styles.select} value={thresholds.eventosPor1000.yellowMax} onChange={(e) => updateThresholdValue('eventosPor1000', 'yellowMax', e.target.value)} />
            </div>
            <div className={styles.miniCard}>
              <strong>Respuesta alertas en min (menor es mejor)</strong>
              <input type="number" className={styles.select} value={thresholds.respuestaMin.greenMax} onChange={(e) => updateThresholdValue('respuestaMin', 'greenMax', e.target.value)} />
              <input type="number" className={styles.select} value={thresholds.respuestaMin.yellowMax} onChange={(e) => updateThresholdValue('respuestaMin', 'yellowMax', e.target.value)} />
            </div>
            <div className={styles.miniCard}>
              <strong>Cumplimiento checklist % (mayor es mejor)</strong>
              <input type="number" className={styles.select} value={thresholds.cumplimientoChecklistPct.yellowMin} onChange={(e) => updateThresholdValue('cumplimientoChecklistPct', 'yellowMin', e.target.value)} />
              <input type="number" className={styles.select} value={thresholds.cumplimientoChecklistPct.greenMin} onChange={(e) => updateThresholdValue('cumplimientoChecklistPct', 'greenMin', e.target.value)} />
            </div>
            <div className={styles.miniCard}>
              <strong>Ausentismo % (menor es mejor)</strong>
              <input type="number" className={styles.select} value={thresholds.ausentismoPct.greenMax} onChange={(e) => updateThresholdValue('ausentismoPct', 'greenMax', e.target.value)} />
              <input type="number" className={styles.select} value={thresholds.ausentismoPct.yellowMax} onChange={(e) => updateThresholdValue('ausentismoPct', 'yellowMax', e.target.value)} />
            </div>
            <div className={styles.miniCard}>
              <strong>Adherencia capacitacion % (mayor es mejor)</strong>
              <input type="number" className={styles.select} value={thresholds.adherenciaCapacitacionPct.yellowMin} onChange={(e) => updateThresholdValue('adherenciaCapacitacionPct', 'yellowMin', e.target.value)} />
              <input type="number" className={styles.select} value={thresholds.adherenciaCapacitacionPct.greenMin} onChange={(e) => updateThresholdValue('adherenciaCapacitacionPct', 'greenMin', e.target.value)} />
            </div>
            <button className={styles.pill} type="submit">Guardar umbrales</button>
          </form>
        </section>
      ) : null}

      <section className={styles.card}>
        <h2>Mejoras Transversales y por Rama</h2>
        <div className={styles.filterRow}>
          <label htmlFor="ramaFilter" className={styles.filterLabel}>Filtrar por rama:</label>
          <select id="ramaFilter" className={styles.select} value={ramaFilter} onChange={(e) => setRamaFilter(e.target.value)}>
            <option value="">Todas las ramas</option>
            {branches.map((rama) => <option key={rama} value={rama}>{rama}</option>)}
          </select>
        </div>

        {permissions.canManageInitiatives ? (
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
        ) : (
          <p>Solo jefaturas/coordinaciones o administracion pueden crear y modificar iniciativas.</p>
        )}

        <div className={styles.grid}>
          {branchSummaryVisible.map((rama) => (
            <article key={rama.rama} className={styles.ramaCard}>
              <h3>{rama.rama}</h3>
              <p>Cumplimiento protocolos: {rama.cumplimientoProtocolos}%</p>
              <p>Alertas criticas: {rama.alertasCriticas}</p>
              <p>Eventos/1000: {rama.eventosPor1000 || 0}</p>
              <span className={`${styles.pill} ${statusClass(rama.semaforo)}`}>Semaforo: {rama.semaforo || 'green'}</span>
            </article>
          ))}
        </div>

        <div className={styles.subsection}>
          <h3>Estado de iniciativas</h3>
          <div className={styles.list}>
            {[...initiativesByCategory.transversal, ...initiativesByCategory.rama].slice(0, 20).map((item) => (
              <li key={item._id}>
                <strong>{item.titulo}</strong> ({item.categoria} / {item.rama}) - {item.prioridad}
                <select
                  className={styles.select}
                  value={item.estado}
                  disabled={!permissions.canManageInitiatives}
                  onChange={(e) => handleInitiativeStatus(item._id, e.target.value)}
                >
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
            <button className={styles.pill} type="submit" disabled={!permissions.canCreateChecklist}>Guardar checklist</button>
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
            <button className={styles.pill} type="submit" disabled={!permissions.canCreateIncident}>Registrar incidente</button>
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
                <select
                  className={styles.select}
                  value={i.estado}
                  disabled={!permissions.canManageIncidentStatus}
                  onChange={(e) => handleIncidentStatus(i._id, e.target.value)}
                >
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
      </>)}
    </div>
  );
}
