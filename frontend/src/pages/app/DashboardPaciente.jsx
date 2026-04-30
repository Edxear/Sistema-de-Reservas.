import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarCheck, FaFilePrescription, FaStethoscope, FaVideo } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { getBookings } from '../../services/bookingService';
import { getMyTeleconsultas } from '../../services/teleconsultaService';
import styles from './DashboardPaciente.module.css';

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const isFutureDate = (value) => new Date(value).getTime() >= Date.now();

export default function DashboardPaciente() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [teleconsultas, setTeleconsultas] = useState([]);

  useEffect(() => {
    const loadPatientDashboard = async () => {
      setLoading(true);
      try {
        const [bookingsRes, recetasRes, teleconsultasRes] = await Promise.all([
          getBookings({ page: 1, limit: 50 }),
          API.get('/recetas/mis'),
          getMyTeleconsultas(),
        ]);

        setBookings(bookingsRes.data?.bookings || []);
        setRecetas(Array.isArray(recetasRes.data) ? recetasRes.data : []);
        setTeleconsultas(Array.isArray(teleconsultasRes) ? teleconsultasRes : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo cargar el dashboard del paciente');
      } finally {
        setLoading(false);
      }
    };

    loadPatientDashboard();
  }, []);

  const upcomingBooking = useMemo(() => {
    return bookings
      .filter((item) => isFutureDate(item.fecha))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0] || null;
  }, [bookings]);

  const activeRecetas = useMemo(() => {
    return recetas.filter((item) => item.estado !== 'vencida');
  }, [recetas]);

  const pendingTeleconsulta = useMemo(() => {
    return teleconsultas
      .filter((item) => isFutureDate(item.fechaProgramada))
      .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada))[0] || null;
  }, [teleconsultas]);

  const recentActivity = useMemo(() => {
    const items = [
      ...bookings.map((item) => ({
        id: `booking-${item._id}`,
        title: `${item.servicio?.nombre || 'Turno médico'} · ${item.estado || 'pendiente'}`,
        subtitle: item.medico?.nombre || 'Profesional asignado',
        date: item.fecha,
      })),
      ...teleconsultas.map((item) => ({
        id: `tele-${item._id}`,
        title: `Teleconsulta · ${item.estado || 'programada'}`,
        subtitle: item.medico?.nombre || item.motivo || 'Seguimiento virtual',
        date: item.fechaProgramada,
      })),
    ];

    return items
      .filter((item) => item.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [bookings, teleconsultas]);

  const metrics = [
    {
      icon: <FaCalendarCheck />,
      label: 'Próximo turno',
      value: upcomingBooking ? formatDateTime(upcomingBooking.fecha) : 'Sin turnos próximos',
      hint: upcomingBooking?.medico?.nombre || 'Reservá un nuevo turno cuando lo necesites.',
      actionLabel: 'Ver turnos',
      action: () => navigate('/turnos'),
    },
    {
      icon: <FaFilePrescription />,
      label: 'Recetas activas',
      value: String(activeRecetas.length),
      hint: activeRecetas[0]?.diagnostico || 'No hay recetas activas por ahora.',
      actionLabel: 'Abrir perfil',
      action: () => navigate('/perfil?seccion=recetas'),
    },
    {
      icon: <FaVideo />,
      label: 'Teleconsulta pendiente',
      value: pendingTeleconsulta ? formatDateTime(pendingTeleconsulta.fechaProgramada) : 'Sin pendientes',
      hint: pendingTeleconsulta?.motivo || 'No hay teleconsultas próximas agendadas.',
      actionLabel: 'Ir a teleconsultas',
      action: () => navigate('/teleconsultas'),
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.hero} data-tour="dashboard-overview">
        <div>
          <p className={styles.kicker}>Panel del paciente</p>
          <h1>Hola, {user?.nombre || 'paciente'}</h1>
          <p className={styles.subtitle}>
            Revisá tus próximos cuidados, prescripciones activas y accesos rápidos desde un solo lugar.
          </p>
        </div>
        <div className={styles.heroBadge}>
          <FaStethoscope />
          <span>{user?.obraSocial || 'Cobertura no informada'}</span>
        </div>
      </section>

      <section className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <article key={metric.label} className={styles.metricCard}>
            <div className={styles.metricIcon}>{metric.icon}</div>
            <p className={styles.metricLabel}>{metric.label}</p>
            <h2 className={styles.metricValue}>{loading ? 'Cargando...' : metric.value}</h2>
            <p className={styles.metricHint}>{loading ? 'Actualizando datos del panel.' : metric.hint}</p>
            <button type="button" className={styles.metricAction} onClick={metric.action}>
              {metric.actionLabel}
            </button>
          </article>
        ))}
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Actividad próxima</h3>
            <button type="button" onClick={() => navigate('/turnos')}>Gestionar agenda</button>
          </div>
          {recentActivity.length === 0 ? (
            <p className={styles.emptyState}>No hay actividad próxima cargada.</p>
          ) : (
            <div className={styles.timeline}>
              {recentActivity.map((item) => (
                <div key={item.id} className={styles.timelineItem}>
                  <p className={styles.timelineDate}>{formatDateTime(item.date)}</p>
                  <strong>{item.title}</strong>
                  <span>{item.subtitle}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Accesos rápidos</h3>
          </div>
          <div className={styles.quickActions}>
            <button type="button" onClick={() => navigate('/turnos')}>Solicitar o revisar turnos</button>
            <button type="button" onClick={() => navigate('/teleconsultas')}>Entrar a teleconsultas</button>
            <button type="button" onClick={() => navigate('/medicos')}>Explorar profesionales</button>
            <button type="button" onClick={() => navigate('/perfil')}>Actualizar perfil</button>
          </div>
        </article>
      </section>
    </div>
  );
}