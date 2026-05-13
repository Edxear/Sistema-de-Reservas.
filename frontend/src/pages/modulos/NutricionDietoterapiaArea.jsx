import React, { useEffect, useMemo, useState } from 'react';
import styles from '../operaciones/OperationalArea.module.css';
import {
  addAlergiaNutricion,
  addDietaNutricion,
  addPedidoCocina,
  addProcesoNutricion,
  createNutricionPaciente,
  getNutricionDb,
  getNutricionMetricas,
  getNutricionPaciente,
  listNutricionPacientes,
  updateEstadoOperativoNutricion,
  updateHistoriaClinica,
} from '../../services/nutricionService';

const TAB_KEYS = ['clinico', 'dietas', 'alergias', 'cocina', 'estado-operativo'];

const INITIAL_PATIENT_FORM = {
  nombre: '',
  documento: '',
  edad: '',
  medicoResponsable: '',
  enfermeroResponsable: '',
  resumenClinico: '',
};

export default function NutricionDietoterapiaArea() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clinico');
  const [dbSnapshot, setDbSnapshot] = useState(null);
  const [metricas, setMetricas] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [patientForm, setPatientForm] = useState(INITIAL_PATIENT_FORM);
  const [historiaForm, setHistoriaForm] = useState({ resumen: '', antecedentesCsv: '' });
  const [procesoForm, setProcesoForm] = useState({ titulo: '', detalle: '', estado: 'pendiente' });
  const [dietaForm, setDietaForm] = useState({ nombre: '', tipo: 'terapeutica', objetivo: '', estado: 'activa' });
  const [alergiaForm, setAlergiaForm] = useState({ sustancia: '', gravedad: 'moderada', notas: '' });
  const [cocinaForm, setCocinaForm] = useState({ menu: '', turno: 'almuerzo', estado: 'pendiente', observaciones: '' });
  const [estadoForm, setEstadoForm] = useState({ modulo: 'ON', motivo: '' });
  const [feedback, setFeedback] = useState('');

  const canOperateOnPatient = Boolean(selectedPacienteId);

  const metricCards = useMemo(() => {
    if (!metricas) return [];
    return [
      { label: 'Pacientes en Nutricion', value: metricas.pacientesTotal },
      { label: 'Dietas activas', value: metricas.dietasActivas },
      { label: 'Alergias criticas', value: metricas.alergiasCriticas },
      { label: 'Pedidos cocina pendientes', value: metricas.pedidosCocinaPendientes },
      { label: 'Estado modulo', value: metricas.estadoModulo },
    ];
  }, [metricas]);

  const refreshBase = async (focusPacienteId = selectedPacienteId) => {
    const [db, metrics, pacienteList] = await Promise.all([
      getNutricionDb(),
      getNutricionMetricas(),
      listNutricionPacientes(),
    ]);

    setDbSnapshot(db);
    setMetricas(metrics);
    setPacientes(pacienteList);
    setEstadoForm({
      modulo: db.estadoOperativoEstandar.modulo || 'ON',
      motivo: db.estadoOperativoEstandar.motivo || '',
    });

    const resolvedPacienteId = focusPacienteId || pacienteList[0]?.id || '';
    setSelectedPacienteId(resolvedPacienteId);

    if (resolvedPacienteId) {
      const paciente = await getNutricionPaciente(resolvedPacienteId);
      setSelectedPaciente(paciente);
      setHistoriaForm({
        resumen: paciente.historiaClinica?.resumen || '',
        antecedentesCsv: (paciente.historiaClinica?.antecedentes || []).join(', '),
      });
    } else {
      setSelectedPaciente(null);
      setHistoriaForm({ resumen: '', antecedentesCsv: '' });
    }
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        await refreshBase('');
      } catch (error) {
        if (!mounted) return;
        setFeedback(error?.response?.data?.error || error.message || 'No se pudo cargar Nutricion');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  const onCreatePaciente = async (event) => {
    event.preventDefault();
    setFeedback('');
    try {
      const nuevo = await createNutricionPaciente({
        ...patientForm,
        edad: Number(patientForm.edad || 0),
      });
      setPatientForm(INITIAL_PATIENT_FORM);
      await refreshBase(nuevo.id);
      setFeedback('Paciente agregado a Nutricion correctamente.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onSelectPaciente = async (pacienteId) => {
    setSelectedPacienteId(pacienteId);
    if (!pacienteId) {
      setSelectedPaciente(null);
      return;
    }
    try {
      const paciente = await getNutricionPaciente(pacienteId);
      setSelectedPaciente(paciente);
      setHistoriaForm({
        resumen: paciente.historiaClinica?.resumen || '',
        antecedentesCsv: (paciente.historiaClinica?.antecedentes || []).join(', '),
      });
      setFeedback('');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onSaveHistoriaClinica = async (event) => {
    event.preventDefault();
    if (!canOperateOnPatient) return;
    try {
      await updateHistoriaClinica(selectedPacienteId, {
        resumen: historiaForm.resumen,
        antecedentes: historiaForm.antecedentesCsv
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      });
      await refreshBase(selectedPacienteId);
      setFeedback('Historia clinica de Nutricion actualizada.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onAddProceso = async (event) => {
    event.preventDefault();
    if (!canOperateOnPatient) return;
    try {
      await addProcesoNutricion(selectedPacienteId, procesoForm);
      setProcesoForm({ titulo: '', detalle: '', estado: 'pendiente' });
      await refreshBase(selectedPacienteId);
      setFeedback('Proceso clinico agregado.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onAddDieta = async (event) => {
    event.preventDefault();
    if (!canOperateOnPatient) return;
    try {
      await addDietaNutricion(selectedPacienteId, dietaForm);
      setDietaForm({ nombre: '', tipo: 'terapeutica', objetivo: '', estado: 'activa' });
      await refreshBase(selectedPacienteId);
      setFeedback('Dieta registrada en el paciente.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onAddAlergia = async (event) => {
    event.preventDefault();
    if (!canOperateOnPatient) return;
    try {
      await addAlergiaNutricion(selectedPacienteId, alergiaForm);
      setAlergiaForm({ sustancia: '', gravedad: 'moderada', notas: '' });
      await refreshBase(selectedPacienteId);
      setFeedback('Alergia registrada en el paciente.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onAddPedidoCocina = async (event) => {
    event.preventDefault();
    if (!canOperateOnPatient) return;
    try {
      await addPedidoCocina(selectedPacienteId, cocinaForm);
      setCocinaForm({ menu: '', turno: 'almuerzo', estado: 'pendiente', observaciones: '' });
      await refreshBase(selectedPacienteId);
      setFeedback('Pedido enviado a cocina.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  const onUpdateEstadoOperativo = async (event) => {
    event.preventDefault();
    try {
      await updateEstadoOperativoNutricion(estadoForm);
      await refreshBase(selectedPacienteId);
      setFeedback('Estado operativo actualizado.');
    } catch (error) {
      setFeedback(error?.response?.data?.error || error.message);
    }
  };

  if (loading) {
    return <section className={styles.card}>Cargando modulo de Nutricion...</section>;
  }

  return (
    <>
      <section className={styles.card}>
        <h2>Base Nutricion local (JSON)</h2>
        <p className={styles.note}>
          Secciones activas: Clinico, Dietas, Alergias, Cocina y Estado operativo estandar.
        </p>
        <div className={styles.grid3}>
          {metricCards.map((item) => (
            <article key={item.label} className={styles.panelCard}>
              <h3>{item.value}</h3>
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2>Alta de paciente en Nutricion</h2>
        <form className={styles.grid3} onSubmit={onCreatePaciente}>
          <input className={styles.select} placeholder="Nombre" value={patientForm.nombre} onChange={(e) => setPatientForm((prev) => ({ ...prev, nombre: e.target.value }))} required />
          <input className={styles.select} placeholder="Documento" value={patientForm.documento} onChange={(e) => setPatientForm((prev) => ({ ...prev, documento: e.target.value }))} required />
          <input className={styles.select} placeholder="Edad" type="number" min="0" value={patientForm.edad} onChange={(e) => setPatientForm((prev) => ({ ...prev, edad: e.target.value }))} required />
          <input className={styles.select} placeholder="Medico responsable" value={patientForm.medicoResponsable} onChange={(e) => setPatientForm((prev) => ({ ...prev, medicoResponsable: e.target.value }))} />
          <input className={styles.select} placeholder="Enfermero responsable" value={patientForm.enfermeroResponsable} onChange={(e) => setPatientForm((prev) => ({ ...prev, enfermeroResponsable: e.target.value }))} />
          <input className={styles.select} placeholder="Resumen clinico inicial" value={patientForm.resumenClinico} onChange={(e) => setPatientForm((prev) => ({ ...prev, resumenClinico: e.target.value }))} />
          <button type="submit" className={styles.btnPrimary}>Agregar paciente</button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Apartado individual del paciente</h2>
        <div className={styles.filterRow}>
          <label className={styles.filterLabel} htmlFor="nutricion-paciente-select">Paciente</label>
          <select
            id="nutricion-paciente-select"
            className={styles.select}
            value={selectedPacienteId}
            onChange={(event) => onSelectPaciente(event.target.value)}
          >
            <option value="">Seleccionar paciente...</option>
            {pacientes.map((paciente) => (
              <option key={paciente.id} value={paciente.id}>{paciente.nombre} - {paciente.documento}</option>
            ))}
          </select>
        </div>

        {selectedPaciente && (
          <div className={styles.grid2} style={{ marginTop: '1rem' }}>
            <article className={styles.panelCard}>
              <h3>{selectedPaciente.nombre}</h3>
              <p>Documento: {selectedPaciente.documento}</p>
              <p>Edad: {selectedPaciente.edad}</p>
              <p>Medico responsable: {selectedPaciente.medicoResponsable || 'Sin asignar'}</p>
              <p>Enfermero responsable: {selectedPaciente.enfermeroResponsable || 'Sin asignar'}</p>
            </article>
            <article className={styles.panelCard}>
              <h3>Estado operativo estandar</h3>
              <p>Modulo: {dbSnapshot?.estadoOperativoEstandar?.modulo || 'ON'}</p>
              <p>Motivo: {dbSnapshot?.estadoOperativoEstandar?.motivo || 'Operacion normal'}</p>
              <p>Ultima actualizacion: {dbSnapshot?.estadoOperativoEstandar?.actualizadoEn || 'Sin cambios'}</p>
            </article>
          </div>
        )}

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {TAB_KEYS.map((tabKey) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={activeTab === tabKey ? styles.btnPrimary : styles.btnSecondary}
            >
              {tabKey}
            </button>
          ))}
        </div>

        {!selectedPaciente && <p className={styles.note}>Selecciona un paciente para gestionar Clinico, Dietas, Alergias y Cocina.</p>}

        {selectedPaciente && activeTab === 'clinico' && (
          <div className={styles.grid2} style={{ marginTop: '1rem' }}>
            <article className={styles.card}>
              <h2>Datos clinicos / historial</h2>
              <form className={styles.listWrap} onSubmit={onSaveHistoriaClinica}>
                <textarea
                  className={styles.select}
                  style={{ minHeight: '100px' }}
                  value={historiaForm.resumen}
                  onChange={(e) => setHistoriaForm((prev) => ({ ...prev, resumen: e.target.value }))}
                  placeholder="Resumen clinico"
                />
                <input
                  className={styles.select}
                  value={historiaForm.antecedentesCsv}
                  onChange={(e) => setHistoriaForm((prev) => ({ ...prev, antecedentesCsv: e.target.value }))}
                  placeholder="Antecedentes separados por coma"
                />
                <button type="submit" className={styles.btnPrimary}>Guardar historial</button>
              </form>
              <p className={styles.note}>Procesos clinicos cargados</p>
              <div className={styles.listWrap}>
                {(selectedPaciente.historiaClinica?.procesos || []).map((proceso) => (
                  <div key={proceso.id} className={styles.item}>
                    <div className={styles.itemTitle}>{proceso.titulo}</div>
                    <div className={styles.itemMeta}>{proceso.estado} - {proceso.rol}</div>
                    <div className={styles.note}>{proceso.detalle}</div>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.card}>
              <h2>Agregar proceso a realizar</h2>
              <form className={styles.listWrap} onSubmit={onAddProceso}>
                <input className={styles.select} value={procesoForm.titulo} onChange={(e) => setProcesoForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Titulo del proceso" required />
                <input className={styles.select} value={procesoForm.detalle} onChange={(e) => setProcesoForm((prev) => ({ ...prev, detalle: e.target.value }))} placeholder="Detalle" />
                <select className={styles.select} value={procesoForm.estado} onChange={(e) => setProcesoForm((prev) => ({ ...prev, estado: e.target.value }))}>
                  <option value="pendiente">pendiente</option>
                  <option value="en_proceso">en_proceso</option>
                  <option value="completado">completado</option>
                </select>
                <button type="submit" className={styles.btnPrimary}>Agregar proceso</button>
              </form>
            </article>
          </div>
        )}

        {selectedPaciente && activeTab === 'dietas' && (
          <div className={styles.grid2} style={{ marginTop: '1rem' }}>
            <article className={styles.card}>
              <h2>Dietas del paciente</h2>
              <div className={styles.listWrap}>
                {(selectedPaciente.dietas || []).map((dieta) => (
                  <div key={dieta.id} className={styles.item}>
                    <div className={styles.itemTitle}>{dieta.nombre}</div>
                    <div className={styles.itemMeta}>{dieta.tipo} - {dieta.estado}</div>
                    <div className={styles.note}>{dieta.objetivo || 'Sin objetivo cargado'}</div>
                  </div>
                ))}
              </div>
            </article>
            <article className={styles.card}>
              <h2>Agregar dieta</h2>
              <form className={styles.listWrap} onSubmit={onAddDieta}>
                <input className={styles.select} value={dietaForm.nombre} onChange={(e) => setDietaForm((prev) => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre dieta" required />
                <input className={styles.select} value={dietaForm.tipo} onChange={(e) => setDietaForm((prev) => ({ ...prev, tipo: e.target.value }))} placeholder="Tipo" />
                <input className={styles.select} value={dietaForm.objetivo} onChange={(e) => setDietaForm((prev) => ({ ...prev, objetivo: e.target.value }))} placeholder="Objetivo terapeutico" />
                <select className={styles.select} value={dietaForm.estado} onChange={(e) => setDietaForm((prev) => ({ ...prev, estado: e.target.value }))}>
                  <option value="activa">activa</option>
                  <option value="suspendida">suspendida</option>
                  <option value="finalizada">finalizada</option>
                </select>
                <button type="submit" className={styles.btnPrimary}>Guardar dieta</button>
              </form>
            </article>
          </div>
        )}

        {selectedPaciente && activeTab === 'alergias' && (
          <div className={styles.grid2} style={{ marginTop: '1rem' }}>
            <article className={styles.card}>
              <h2>Alergias del paciente</h2>
              <div className={styles.listWrap}>
                {(selectedPaciente.alergias || []).map((alergia) => (
                  <div key={alergia.id} className={styles.item}>
                    <div className={styles.itemTitle}>{alergia.sustancia}</div>
                    <div className={styles.itemMeta}>Gravedad: {alergia.gravedad}</div>
                    <div className={styles.note}>{alergia.notas || 'Sin notas'}</div>
                  </div>
                ))}
              </div>
            </article>
            <article className={styles.card}>
              <h2>Agregar alergia</h2>
              <form className={styles.listWrap} onSubmit={onAddAlergia}>
                <input className={styles.select} value={alergiaForm.sustancia} onChange={(e) => setAlergiaForm((prev) => ({ ...prev, sustancia: e.target.value }))} placeholder="Sustancia" required />
                <select className={styles.select} value={alergiaForm.gravedad} onChange={(e) => setAlergiaForm((prev) => ({ ...prev, gravedad: e.target.value }))}>
                  <option value="leve">leve</option>
                  <option value="moderada">moderada</option>
                  <option value="critica">critica</option>
                </select>
                <input className={styles.select} value={alergiaForm.notas} onChange={(e) => setAlergiaForm((prev) => ({ ...prev, notas: e.target.value }))} placeholder="Notas" />
                <button type="submit" className={styles.btnPrimary}>Guardar alergia</button>
              </form>
            </article>
          </div>
        )}

        {selectedPaciente && activeTab === 'cocina' && (
          <div className={styles.grid2} style={{ marginTop: '1rem' }}>
            <article className={styles.card}>
              <h2>Pedidos de cocina</h2>
              <div className={styles.listWrap}>
                {selectedPaciente.cocina?.pedidos?.map((pedido) => (
                  <div key={pedido.id} className={styles.item}>
                    <div className={styles.itemTitle}>{pedido.menu}</div>
                    <div className={styles.itemMeta}>{pedido.turno} - {pedido.estado}</div>
                    <div className={styles.note}>{pedido.observaciones || 'Sin observaciones'}</div>
                  </div>
                ))}
              </div>
            </article>
            <article className={styles.card}>
              <h2>Emitir orden a cocina</h2>
              <form className={styles.listWrap} onSubmit={onAddPedidoCocina}>
                <input className={styles.select} value={cocinaForm.menu} onChange={(e) => setCocinaForm((prev) => ({ ...prev, menu: e.target.value }))} placeholder="Menu/Preparacion" required />
                <select className={styles.select} value={cocinaForm.turno} onChange={(e) => setCocinaForm((prev) => ({ ...prev, turno: e.target.value }))}>
                  <option value="desayuno">desayuno</option>
                  <option value="almuerzo">almuerzo</option>
                  <option value="merienda">merienda</option>
                  <option value="cena">cena</option>
                </select>
                <select className={styles.select} value={cocinaForm.estado} onChange={(e) => setCocinaForm((prev) => ({ ...prev, estado: e.target.value }))}>
                  <option value="pendiente">pendiente</option>
                  <option value="preparando">preparando</option>
                  <option value="entregado">entregado</option>
                </select>
                <input className={styles.select} value={cocinaForm.observaciones} onChange={(e) => setCocinaForm((prev) => ({ ...prev, observaciones: e.target.value }))} placeholder="Observaciones" />
                <button type="submit" className={styles.btnPrimary}>Enviar a cocina</button>
              </form>
            </article>
          </div>
        )}

        {activeTab === 'estado-operativo' && (
          <article className={styles.card} style={{ marginTop: '1rem' }}>
            <h2>Estado operativo estandar</h2>
            <form className={styles.listWrap} onSubmit={onUpdateEstadoOperativo}>
              <select className={styles.select} value={estadoForm.modulo} onChange={(e) => setEstadoForm((prev) => ({ ...prev, modulo: e.target.value }))}>
                <option value="ON">ON</option>
                <option value="OFF">OFF</option>
              </select>
              <input className={styles.select} value={estadoForm.motivo} onChange={(e) => setEstadoForm((prev) => ({ ...prev, motivo: e.target.value }))} placeholder="Motivo operativo" />
              <button type="submit" className={styles.btnPrimary}>Actualizar estado</button>
            </form>
          </article>
        )}
      </section>

      {feedback && (
        <section className={styles.card}>
          <p>{feedback}</p>
        </section>
      )}
    </>
  );
}
