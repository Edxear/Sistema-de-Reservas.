import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessGuardiaMedicaArea } from '../../utils/roles';
import AreaBedBoard from '../../components/AreaBedBoard';
import ShiftReport from '../../components/ShiftReport';
import { 
  FaClock, FaUsers, FaBed, FaEye, FaHeartbeat, 
  FaShieldAlt, FaHandshake, FaSyringe,
  FaBrain, FaBone
} from 'react-icons/fa';

// Datos estáticos (sin cambios)
const TRIAGE = [
  { nivel: 'Rojo', tiempo: 'Inmediato', criterio: 'Riesgo vital, shock, compromiso de via aerea', accion: 'Ingreso directo a shock room y medico de guardia en sala' },
  { nivel: 'Naranja', tiempo: '< 10 min', criterio: 'Inestabilidad hemodinamica sin colapso', accion: 'Monitoreo continuo y via venosa + laboratorio' },
  { nivel: 'Amarillo', tiempo: '< 30 min', criterio: 'Dolor moderado/severo, fiebre persistente, trauma sin inestabilidad', accion: 'Observacion activa y reevaluacion clinica' },
  { nivel: 'Verde', tiempo: '< 120 min', criterio: 'Cuadro leve sin signos de alarma', accion: 'Consulta medica programada en guardia' },
  { nivel: 'Azul', tiempo: 'No urgente', criterio: 'Consulta administrativa/renovaciones', accion: 'Derivar a consultorio externo' },
];

const CIRCUITOS = [
  { nombre: 'Dolor toracico', icon: <FaHeartbeat />, pasos: ['ECG en <10 min', 'Troponina basal y seriada', 'Escala de riesgo', 'Interconsulta cardiologia'] },
  { nombre: 'ACV agudo', icon: <FaBrain />, pasos: ['Codigo ACV', 'TAC urgente', 'NIHSS', 'Ventana terapeutica'] },
  { nombre: 'Sepsis', icon: <FaSyringe />, pasos: ['Lactato', 'Hemocultivos', 'ATB en 1h', 'Fluidos 30 ml/kg si hipotension'] },
  { nombre: 'Politrauma', icon: <FaBone />, pasos: ['ATLS primario', 'FAST', 'Control hemorragias', 'Derivacion quirurgica'] },
];

const OBSERVACION = [
  { paciente: 'OBS-201', motivo: 'Dolor abdominal agudo', tiempo: '2h 10m', riesgo: 'medio', siguiente: 'Reevaluacion en 20 min' },
  { paciente: 'OBS-203', motivo: 'Crisis hipertensiva', tiempo: '1h 30m', riesgo: 'alto', siguiente: 'Control TA cada 15 min' },
  { paciente: 'OBS-207', motivo: 'Broncoespasmo', tiempo: '45m', riesgo: 'medio', siguiente: 'Nebulizacion + satO2' },
];

export default function GuardiaMedicaArea() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('panel');

  const canAccess = canAccessGuardiaMedicaArea(user);

  const metrics = useMemo(() => ({
    esperaPromedio: '28 min',
    pacientesEnEspera: 14,
    shockRoomActivos: 2,
    observacionActiva: OBSERVACION.length,
  }), []);

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const tabs = [
    { key: 'panel', label: 'Panel Diario' },
    { key: 'triage', label: 'Triage' },
    { key: 'circuitos', label: 'Circuitos Críticos' },
    { key: 'observacion', label: 'Observación' },
    { key: 'pizarra', label: 'Pizarra Camas Área' },
    { key: 'pase', label: 'Pase de Guardia' },
  ];

  const getRiskClass = (risk) => {
    if (risk === 'alto') return 'guardia-risk-badge guardia-risk-high';
    if (risk === 'medio') return 'guardia-risk-badge guardia-risk-medium';
    return 'guardia-risk-badge guardia-risk-low';
  };

  return (
    <div className="guardia-page">
      {/* Cabecera con métricas */}
      <div className="guardia-header">
        <div className="guardia-title-section">
          <h1>Área de Guardia Médica</h1>
          <p>Gestión integral de urgencias, triage, shock room, observación y derivaciones críticas.</p>
        </div>

        <div className="guardia-metrics">
          <div className="guardia-metric-card">
            <FaClock className="guardia-metric-icon" />
            <div>
              <div className="guardia-metric-value">{metrics.esperaPromedio}</div>
              <div className="guardia-metric-label">Espera promedio</div>
            </div>
          </div>
          <div className="guardia-metric-card">
            <FaUsers className="guardia-metric-icon" />
            <div>
              <div className="guardia-metric-value">{metrics.pacientesEnEspera}</div>
              <div className="guardia-metric-label">Pacientes en espera</div>
            </div>
          </div>
          <div className="guardia-metric-card">
            <FaBed className="guardia-metric-icon" />
            <div>
              <div className="guardia-metric-value">{metrics.shockRoomActivos}</div>
              <div className="guardia-metric-label">Shock room activos</div>
            </div>
          </div>
          <div className="guardia-metric-card">
            <FaEye className="guardia-metric-icon" />
            <div>
              <div className="guardia-metric-value">{metrics.observacionActiva}</div>
              <div className="guardia-metric-label">Observación activa</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="guardia-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`guardia-tab ${activeTab === tab.key ? 'guardia-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido dinámico */}
      {activeTab === 'panel' && (
        <div className="guardia-panel-grid">
          <div className="guardia-panel-card">
            <h3>Inicio de turno</h3>
            <ul>
              <li>Pase clínico con casos activos y pendientes.</li>
              <li>Verificación de carro de paro y medicación crítica.</li>
              <li>Chequeo de disponibilidad de camas de observación.</li>
              <li>Confirmación de equipos de imagen/lab en guardia.</li>
            </ul>
          </div>
          <div className="guardia-panel-card">
            <h3><FaShieldAlt /> Seguridad del paciente</h3>
            <ul>
              <li>Doble identificación en procedimientos.</li>
              <li>Alerta temprana de sepsis y eventos neurológicos.</li>
              <li>Registro de reevaluaciones por tiempo objetivo.</li>
            </ul>
          </div>
          <div className="guardia-panel-card">
            <h3><FaHandshake /> Coordinación interservicios</h3>
            <ul>
              <li>Derivaciones con UTI, Imágenes, Laboratorio y Quirófano.</li>
              <li>Comunicación con enfermería y equipo prehospitalario.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'triage' && (
        <div className="guardia-card">
          <h2>Matriz de triage</h2>
          <div className="guardia-table-wrapper">
            <table className="guardia-triage-table">
              <thead>
                <tr><th>Nivel</th><th>Tiempo objetivo</th><th>Criterio</th><th>Acción inicial</th></tr>
              </thead>
              <tbody>
                {TRIAGE.map((row) => (
                  <tr key={row.nivel} className={`guardia-triage-row guardia-triage-${row.nivel.toLowerCase()}`}>
                    <td><strong>{row.nivel}</strong></td><td>{row.tiempo}</td><td>{row.criterio}</td><td>{row.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'circuitos' && (
        <div className="guardia-card">
          <h2>Circuitos asistenciales de alta prioridad</h2>
          <div className="guardia-circuitos-grid">
            {CIRCUITOS.map((item) => (
              <div key={item.nombre} className="guardia-circuito-card">
                <div className="guardia-circuito-header">
                  {item.icon}
                  <h3>{item.nombre}</h3>
                </div>
                <ul>
                  {item.pasos.map((paso) => <li key={paso}>✓ {paso}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'observacion' && (
        <div className="guardia-card">
          <h2>Pacientes en observación</h2>
          <div className="guardia-table-wrapper">
            <table className="guardia-table">
              <thead><tr><th>Paciente</th><th>Motivo</th><th>Tiempo</th><th>Riesgo</th><th>Próxima acción</th></tr></thead>
              <tbody>
                {OBSERVACION.map((row) => (
                  <tr key={row.paciente}>
                    <td>{row.paciente}</td><td>{row.motivo}</td><td>{row.tiempo}</td>
                    <td><span className={getRiskClass(row.riesgo)}>{row.riesgo}</span></td>
                    <td>{row.siguiente}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pizarra' && <AreaBedBoard areaKey="guardia-medica" />}
      {activeTab === 'pase' && (
        <div className="guardia-card">
          <h2>Pase de Guardia</h2>
          <ShiftReport area="guardia" areaLabel="Guardia Medica" />
        </div>
      )}
    </div>
  );
}
