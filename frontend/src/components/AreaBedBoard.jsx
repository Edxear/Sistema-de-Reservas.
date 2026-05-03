import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { getBeds, updateBed } from '../services/bedUnitService';
import { useAuth } from '../context/AuthContext';
import { FaBed, FaEdit, FaSave, FaTimes, FaUser, FaClipboardList } from 'react-icons/fa';
// Los estilos base los tomamos del módulo existente
import styles from '../pages/operaciones/OperationalArea.module.css';

const ESTADOS = ['libre', 'ocupada', 'reservada', 'limpieza', 'mantenimiento', 'aislamiento'];

const ESTADO_LABEL = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  limpieza: 'Limpieza',
  mantenimiento: 'Mantenimiento',
  aislamiento: 'Aislamiento',
};

const ESTADO_COLOR = {
  libre: '#16a34a',
  ocupada: '#dc2626',
  reservada: '#d97706',
  limpieza: '#6b7280',
  mantenimiento: '#6b7280',
  aislamiento: '#9333ea',
};

const normalize = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isMentalSector = (sector = '') => {
  const s = normalize(sector);
  return s.includes('salud mental') || s.includes('psiquiatr') || s.includes('neuropsiq') || s.includes('psico');
};

const isGuardSector = (sector = '') => {
  const s = normalize(sector);
  return s.includes('guardia') || s.includes('shock') || s.includes('triage') || s.includes('emerg') || s.includes('observacion');
};

const canEdit = (role) => ['enfermero', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());

const getAreaConfig = (areaKey) => {
  if (areaKey === 'salud-mental') {
    return {
      label: 'Salud Mental',
      description: 'Camas sectoriales de internacion psiquiatrica / salud mental.',
      matches: (sector) => isMentalSector(sector),
    };
  }
  if (areaKey === 'guardia-medica') {
    return {
      label: 'Guardia Medica',
      description: 'Camas de observacion, triage y sectores criticos de urgencias.',
      matches: (sector) => isGuardSector(sector),
    };
  }
  return {
    label: 'Enfermeria',
    description: 'Camas sectoriales operativas de Enfermeria (excluye Salud Mental y Guardia).',
    matches: (sector) => !isMentalSector(sector) && !isGuardSector(sector),
  };
};

export default function AreaBedBoard({ areaKey = 'enfermeria' }) {
  const { user } = useAuth();
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectorFilter, setSectorFilter] = useState('');
  const [savingId, setSavingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBed, setCurrentBed] = useState(null);
  const [editPatientMode, setEditPatientMode] = useState(false);
  const [patientForm, setPatientForm] = useState({
    nombre: '',
    documento: '',
    observaciones: '',
  });

  const config = getAreaConfig(areaKey);

  const loadBeds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBeds();
      const items = Array.isArray(data?.beds) ? data.beds : [];
      const filtered = items.filter((bed) => config.matches(bed.sector || ''));
      setBeds(filtered);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar pizarra de camas del area');
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    loadBeds();
  }, [loadBeds]);

  const sectors = useMemo(() => [...new Set(beds.map((b) => b.sector).filter(Boolean))].sort(), [beds]);

  const visibleBeds = useMemo(
    () => (sectorFilter ? beds.filter((b) => b.sector === sectorFilter) : beds),
    [beds, sectorFilter],
  );

  const metrics = useMemo(() => {
    return visibleBeds.reduce((acc, bed) => {
      acc.total += 1;
      acc.byEstado[bed.estado] = (acc.byEstado[bed.estado] || 0) + 1;
      return acc;
    }, { total: 0, byEstado: {} });
  }, [visibleBeds]);

  const groupedBySector = useMemo(() => {
    return visibleBeds.reduce((acc, bed) => {
      const key = bed.sector || 'Sin sector';
      acc[key] = acc[key] || [];
      acc[key].push(bed);
      return acc;
    }, {});
  }, [visibleBeds]);

  const handleEstadoChange = async (bed, estado) => {
    if (!canEdit(user?.rol)) return;
    setSavingId(String(bed._id));
    try {
      await updateBed(bed._id, { estado });
      await loadBeds();
      toast.success(`Cama ${bed.codigo} actualizada a ${ESTADO_LABEL[estado] || estado}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo actualizar estado de cama');
    } finally {
      setSavingId('');
    }
  };

  const openPatientModal = (bed, isEdit = false) => {
    if (!canEdit(user?.rol)) return;
    setCurrentBed(bed);
    setEditPatientMode(isEdit);
    if (isEdit && bed.paciente) {
      setPatientForm({
        nombre: bed.paciente.nombre || '',
        documento: bed.paciente.documento || '',
        observaciones: bed.observaciones || '',
      });
    } else {
      setPatientForm({ nombre: '', documento: '', observaciones: '' });
    }
    setModalOpen(true);
  };

  const handleSavePatient = async () => {
    if (!currentBed) return;
    if (!patientForm.nombre.trim()) {
      toast.error('El nombre del paciente es obligatorio');
      return;
    }

    setSavingId(String(currentBed._id));
    try {
      const updateData = {
        paciente: {
          nombre: patientForm.nombre.trim(),
          documento: patientForm.documento.trim() || undefined,
        },
        observaciones: patientForm.observaciones.trim() || '',
        // Si se asigna un paciente, el estado pasa a 'ocupada' automáticamente
        estado: currentBed.estado === 'libre' ? 'ocupada' : currentBed.estado,
      };
      await updateBed(currentBed._id, updateData);
      await loadBeds();
      toast.success(`Datos del paciente actualizados en cama ${currentBed.codigo}`);
      setModalOpen(false);
      setCurrentBed(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo guardar la información del paciente');
    } finally {
      setSavingId('');
    }
  };

  // Helper para renderizar cada cama como tarjeta
  const renderBedCard = (bed) => {
    const isSaving = savingId === String(bed._id);
    const isEditable = canEdit(user?.rol);
    const estadoColor = ESTADO_COLOR[bed.estado] || '#6b7280';

    return (
      <div key={bed._id} className="bedboard-card" style={{ borderLeftColor: estadoColor }}>
        <div className="bedboard-card-header">
          <h4><FaBed /> {bed.codigo}</h4>
          <select
            className="bedboard-select"
            disabled={!isEditable || isSaving}
            value={bed.estado}
            onChange={(e) => handleEstadoChange(bed, e.target.value)}
            style={{ borderColor: estadoColor }}
          >
            {ESTADOS.map((est) => (
              <option key={est} value={est}>{ESTADO_LABEL[est]}</option>
            ))}
          </select>
        </div>

        {bed.paciente?.nombre ? (
          <div className="bedboard-patient">
            <p><strong><FaUser /> Paciente:</strong> {bed.paciente.nombre}</p>
            {bed.paciente.documento && <p><strong>Documento:</strong> {bed.paciente.documento}</p>}
            {bed.observaciones && <p><strong><FaClipboardList /> Obs.:</strong> {bed.observaciones}</p>}
          </div>
        ) : (
          <div className="bedboard-patient-empty">
            <p>Sin paciente asignado</p>
          </div>
        )}

        <div className="bedboard-card-actions">
          {bed.paciente?.nombre ? (
            <button onClick={() => openPatientModal(bed, true)} disabled={!isEditable || isSaving} className="bedboard-btn edit">
              <FaEdit /> Editar paciente
            </button>
          ) : (
            <button onClick={() => openPatientModal(bed, false)} disabled={!isEditable || isSaving} className="bedboard-btn assign">
              + Asignar paciente
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className={styles.card} style={{ overflow: 'visible' }}>
      <div className={styles.actionsRow}>
        <div>
          <h2>Pizarra de Camas - {config.label}</h2>
          <p className={styles.note}>{config.description}</p>
        </div>
        <button className={loading ? styles.tabActive : styles.tab} type="button" onClick={loadBeds} disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <div className={styles.filterRow}>
        <label className={styles.filterLabel} htmlFor={`sector-${areaKey}`}>Filtrar por sector</label>
        <select
          id={`sector-${areaKey}`}
          className={styles.select}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="">Todos los sectores</option>
          {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
        </select>
      </div>

      <div className={styles.gridMini}>
        <article className={styles.miniCard}><strong>Total</strong><p>{metrics.total}</p></article>
        {ESTADOS.map((estado) => (
          <article key={estado} className={styles.miniCard}>
            <strong>{ESTADO_LABEL[estado]}</strong>
            <p>{metrics.byEstado[estado] || 0}</p>
          </article>
        ))}
      </div>

      {Object.keys(groupedBySector).length === 0 ? (
        <p className={styles.note}>No hay camas registradas para esta área.</p>
      ) : (
        Object.entries(groupedBySector).map(([sector, sectorBeds]) => (
          <div key={sector} className="bedboard-sector">
            <h3 className="bedboard-sector-title">{sector}</h3>
            <div className="bedboard-grid">
              {sectorBeds.map(renderBedCard)}
            </div>
          </div>
        ))
      )}

      {/* Modal para asignar/editar paciente */}
      {modalOpen && currentBed && (
        <div className="bedboard-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="bedboard-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editPatientMode ? 'Editar paciente' : 'Asignar paciente'} - Cama {currentBed.codigo}</h3>
            <div className="bedboard-form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                value={patientForm.nombre}
                onChange={(e) => setPatientForm({ ...patientForm, nombre: e.target.value })}
                placeholder="Ej: María González"
              />
            </div>
            <div className="bedboard-form-group">
              <label>Documento / ID</label>
              <input
                type="text"
                value={patientForm.documento}
                onChange={(e) => setPatientForm({ ...patientForm, documento: e.target.value })}
                placeholder="Ej: 12345678"
              />
            </div>
            <div className="bedboard-form-group">
              <label>Observaciones clínicas</label>
              <textarea
                rows="3"
                value={patientForm.observaciones}
                onChange={(e) => setPatientForm({ ...patientForm, observaciones: e.target.value })}
                placeholder="Motivo de internación, alergias, cuidados..."
              />
            </div>
            <div className="bedboard-modal-actions">
              <button onClick={handleSavePatient} className="bedboard-btn save" disabled={savingId === String(currentBed._id)}>
                <FaSave /> Guardar
              </button>
              <button onClick={() => setModalOpen(false)} className="bedboard-btn cancel">
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { toast } from 'react-toastify';
// import { getBeds, updateBed } from '../services/bedUnitService';
// import { useAuth } from '../context/AuthContext';
// import styles from '../pages/operaciones/OperationalArea.module.css';

// const ESTADOS = ['libre', 'ocupada', 'reservada', 'limpieza', 'mantenimiento', 'aislamiento'];

// const ESTADO_LABEL = {
//   libre: 'Libre',
//   ocupada: 'Ocupada',
//   reservada: 'Reservada',
//   limpieza: 'Limpieza',
//   mantenimiento: 'Mantenimiento',
//   aislamiento: 'Aislamiento',
// };

// const normalize = (value = '') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// const isMentalSector = (sector = '') => {
//   const s = normalize(sector);
//   return s.includes('salud mental') || s.includes('psiquiatr') || s.includes('neuropsiq') || s.includes('psico');
// };

// const isGuardSector = (sector = '') => {
//   const s = normalize(sector);
//   return s.includes('guardia') || s.includes('shock') || s.includes('triage') || s.includes('emerg') || s.includes('observacion');
// };

// const canEdit = (role) => ['enfermero', 'admin', 'superadmin'].includes(String(role || '').toLowerCase());

// const getAreaConfig = (areaKey) => {
//   if (areaKey === 'salud-mental') {
//     return {
//       label: 'Salud Mental',
//       description: 'Camas sectoriales de internacion psiquiatrica / salud mental.',
//       matches: (sector) => isMentalSector(sector),
//     };
//   }

//   if (areaKey === 'guardia-medica') {
//     return {
//       label: 'Guardia Medica',
//       description: 'Camas de observacion, triage y sectores criticos de urgencias.',
//       matches: (sector) => isGuardSector(sector),
//     };
//   }

//   return {
//     label: 'Enfermeria',
//     description: 'Camas sectoriales operativas de Enfermeria (excluye Salud Mental y Guardia).',
//     matches: (sector) => !isMentalSector(sector) && !isGuardSector(sector),
//   };
// };

// export default function AreaBedBoard({ areaKey = 'enfermeria' }) {
//   const { user } = useAuth();
//   const [beds, setBeds] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [sectorFilter, setSectorFilter] = useState('');
//   const [savingId, setSavingId] = useState('');

//   const config = getAreaConfig(areaKey);

//   const loadBeds = useCallback(async () => {
//     setLoading(true);
//     try {
//       const data = await getBeds();
//       const items = Array.isArray(data?.beds) ? data.beds : [];
//       const filtered = items.filter((bed) => config.matches(bed.sector || ''));
//       setBeds(filtered);
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'No se pudo cargar pizarra de camas del area');
//     } finally {
//       setLoading(false);
//     }
//   }, [config]);

//   useEffect(() => {
//     loadBeds();
//   }, [loadBeds]);

//   const sectors = useMemo(() => [...new Set(beds.map((b) => b.sector).filter(Boolean))].sort(), [beds]);

//   const visibleBeds = useMemo(
//     () => (sectorFilter ? beds.filter((b) => b.sector === sectorFilter) : beds),
//     [beds, sectorFilter],
//   );

//   const metrics = useMemo(() => {
//     return visibleBeds.reduce((acc, bed) => {
//       acc.total += 1;
//       acc.byEstado[bed.estado] = (acc.byEstado[bed.estado] || 0) + 1;
//       return acc;
//     }, { total: 0, byEstado: {} });
//   }, [visibleBeds]);

//   const groupedBySector = useMemo(() => {
//     return visibleBeds.reduce((acc, bed) => {
//       const key = bed.sector || 'Sin sector';
//       acc[key] = acc[key] || [];
//       acc[key].push(bed);
//       return acc;
//     }, {});
//   }, [visibleBeds]);

//   const handleEstadoChange = async (bed, estado) => {
//     if (!canEdit(user?.rol)) return;
//     setSavingId(String(bed._id));
//     try {
//       await updateBed(bed._id, { estado });
//       await loadBeds();
//       toast.success(`Cama ${bed.codigo} actualizada a ${ESTADO_LABEL[estado] || estado}`);
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'No se pudo actualizar estado de cama');
//     } finally {
//       setSavingId('');
//     }
//   };

//   return (
//     <section className={styles.card}>
//       <div className={styles.actionsRow}>
//         <div>
//           <h2>Pizarra de Camas - {config.label}</h2>
//           <p className={styles.note}>{config.description}</p>
//         </div>
//         <button className={loading ? styles.tabActive : styles.tab} type="button" onClick={loadBeds} disabled={loading}>
//           {loading ? 'Actualizando...' : 'Actualizar'}
//         </button>
//       </div>

//       <div className={styles.filterRow}>
//         <label className={styles.filterLabel} htmlFor={`sector-${areaKey}`}>Filtrar por sector</label>
//         <select
//           id={`sector-${areaKey}`}
//           className={styles.select}
//           value={sectorFilter}
//           onChange={(e) => setSectorFilter(e.target.value)}
//         >
//           <option value="">Todos</option>
//           {sectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
//         </select>
//       </div>

//       <div className={styles.gridMini}>
//         <article className={styles.miniCard}><strong>Total</strong><p>{metrics.total}</p></article>
//         {ESTADOS.map((estado) => (
//           <article key={estado} className={styles.miniCard}>
//             <strong>{ESTADO_LABEL[estado]}</strong>
//             <p>{metrics.byEstado[estado] || 0}</p>
//           </article>
//         ))}
//       </div>

//       {Object.keys(groupedBySector).length === 0 ? (
//         <p className={styles.note}>No hay camas registradas para esta area.</p>
//       ) : Object.entries(groupedBySector).map(([sector, sectorBeds]) => (
//         <div key={sector} className={styles.card}>
//           <h2>{sector}</h2>
//           <div className={styles.tableWrap}>
//             <table className={styles.table}>
//               <thead>
//                 <tr>
//                   <th>Cama</th>
//                   <th>Estado</th>
//                   <th>Paciente</th>
//                   <th>Documento</th>
//                   <th>Observaciones</th>
//                   <th>Actualizado por</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {sectorBeds.map((bed) => (
//                   <tr key={bed._id}>
//                     <td>{bed.codigo}</td>
//                     <td>
//                       <select
//                         className={styles.select}
//                         disabled={!canEdit(user?.rol) || savingId === String(bed._id)}
//                         value={bed.estado}
//                         onChange={(e) => handleEstadoChange(bed, e.target.value)}
//                       >
//                         {ESTADOS.map((estado) => (
//                           <option key={estado} value={estado}>{ESTADO_LABEL[estado]}</option>
//                         ))}
//                       </select>
//                     </td>
//                     <td>{bed.paciente?.nombre || '-'}</td>
//                     <td>{bed.paciente?.documento || '-'}</td>
//                     <td>{bed.observaciones || '-'}</td>
//                     <td>{bed.updatedBy?.nombre || '-'}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       ))}
//     </section>
//   );
// }
