import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import { getBookings } from '../../services/bookingService';
import { getMyTeleconsultas } from '../../services/teleconsultaService';
import styles from './Perfil.module.css';

export default function Perfil() {
  const location = useLocation();
  const { user, refreshProfile, updateProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [turnosPaciente, setTurnosPaciente] = useState([]);
  const [recetasPaciente, setRecetasPaciente] = useState([]);
  const [teleconsultas, setTeleconsultas] = useState([]);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const turnosRef = useRef(null);
  const recetasRef = useRef(null);

  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const seccionQuery = queryParams.get('seccion') || '';
  const recetaIdQuery = queryParams.get('recetaId') || '';
  const bookingIdQuery = queryParams.get('bookingId') || '';

  useEffect(() => {
    if (user) {
      setForm({
        nombre: user.nombre || '',
        telefono: user.telefono || '',
        documento: user.documento || '',
        direccion: user.direccion || '',
        fechaNacimiento: user.fechaNacimiento ? String(user.fechaNacimiento).slice(0, 10) : '',
        genero: user.genero || '',
        bio: user.bio || '',
        fotoPerfil: user.fotoPerfil || '',
        contactoEmergencia: user.contactoEmergencia || '',
        especialidad: user.especialidad || '',
        matriculaProfesional: user.matriculaProfesional || '',
        direccionConsultorio: user.direccionConsultorio || '',
        obraSocial: user.obraSocial || '',
        numeroAfiliado: user.numeroAfiliado || '',
        alergias: user.alergias || '',
        areaSecretaria: user.areaSecretaria || '',
        turnoLaboral: user.turnoLaboral || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadFichaPaciente = async () => {
      if (!user || user.rol !== 'paciente') return;

      setCargandoFicha(true);
      try {
        const [bookingsRes, recetasRes, teleconsultasRes] = await Promise.all([
          getBookings({ page: 1, limit: 200 }),
          API.get('/recetas/mis'),
          getMyTeleconsultas(),
        ]);

        setTurnosPaciente(bookingsRes.data?.bookings || []);
        setRecetasPaciente(recetasRes.data || []);
        setTeleconsultas(Array.isArray(teleconsultasRes) ? teleconsultasRes : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'No se pudo cargar el resumen clínico del perfil');
      } finally {
        setCargandoFicha(false);
      }
    };

    loadFichaPaciente();
  }, [user]);

  const roleFields = useMemo(() => {
    if (!user) return [];
    if (user.rol === 'paciente') return ['obraSocial', 'numeroAfiliado', 'alergias'];
    if (user.rol === 'secretaria') return ['areaSecretaria', 'turnoLaboral'];
    if (['medico', 'admin', 'superadmin', 'enfermero'].includes(user.rol)) {
      return ['especialidad', 'matriculaProfesional', 'direccionConsultorio'];
    }
    return [];
  }, [user]);

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile(form);
    if (result.success) {
      toast.success('Perfil actualizado correctamente');
      await refreshProfile();
    } else {
      toast.error(result.error || 'No se pudo actualizar el perfil');
    }
    setSaving(false);
  };

  const turnosRecientes = turnosPaciente.slice(0, 8);
  const recetasRecientes = recetasPaciente.slice(0, 8);
  const teleconsultasRecientes = teleconsultas.slice(0, 8);

  useEffect(() => {
    if (user?.rol !== 'paciente' || cargandoFicha) return;

    if (seccionQuery === 'recetas' && recetasRef.current) {
      recetasRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (seccionQuery === 'turnos' && turnosRef.current) {
      turnosRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [cargandoFicha, seccionQuery, user]);

  useEffect(() => {
    if (!recetaIdQuery || cargandoFicha || recetasPaciente.length === 0) return;
    const target = document.getElementById(`receta-${recetaIdQuery}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add(styles.itemFocus);
      const t = setTimeout(() => target.classList.remove(styles.itemFocus), 2200);
      return () => clearTimeout(t);
    }
  }, [cargandoFicha, recetaIdQuery, recetasPaciente]);

  useEffect(() => {
    if (!bookingIdQuery || cargandoFicha || turnosPaciente.length === 0) return;
    const target = document.getElementById(`turno-${bookingIdQuery}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add(styles.itemFocus);
      const t = setTimeout(() => target.classList.remove(styles.itemFocus), 2200);
      return () => clearTimeout(t);
    }
  }, [bookingIdQuery, cargandoFicha, turnosPaciente]);

  if (!form || !user) return <div className={styles.page}>Cargando perfil...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Mi Perfil</h1>
        <p className={styles.subtitle}>Rol actual: <strong>{user.rol}</strong> | Email: {user.email}</p>

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.grid2}>
            <div className={styles.field}><label>Nombre</label><input value={form.nombre} onChange={(e) => onChange('nombre', e.target.value)} /></div>
            <div className={styles.field}><label>Telefono</label><input value={form.telefono} onChange={(e) => onChange('telefono', e.target.value)} /></div>
            <div className={styles.field}><label>Documento</label><input value={form.documento} onChange={(e) => onChange('documento', e.target.value)} /></div>
            <div className={styles.field}><label>Direccion</label><input value={form.direccion} onChange={(e) => onChange('direccion', e.target.value)} /></div>
            <div className={styles.field}><label>Fecha de nacimiento</label><input type="date" value={form.fechaNacimiento} onChange={(e) => onChange('fechaNacimiento', e.target.value)} /></div>
            <div className={styles.field}>
              <label>Sexo</label>
              <select value={form.genero} onChange={(e) => onChange('genero', e.target.value)}>
                <option value="">No definido</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className={styles.field}><label>Contacto emergencia</label><input value={form.contactoEmergencia} onChange={(e) => onChange('contactoEmergencia', e.target.value)} /></div>
            <div className={styles.field}><label>Foto de perfil (URL)</label><input value={form.fotoPerfil} onChange={(e) => onChange('fotoPerfil', e.target.value)} /></div>
          </div>

          <div className={styles.field}><label>Biografia</label><textarea value={form.bio} onChange={(e) => onChange('bio', e.target.value)} /></div>

          {roleFields.includes('obraSocial') && (
            <div className={styles.grid2}>
              <div className={styles.field}><label>Obra social</label><input value={form.obraSocial} onChange={(e) => onChange('obraSocial', e.target.value)} /></div>
              <div className={styles.field}><label>Numero de afiliado</label><input value={form.numeroAfiliado} onChange={(e) => onChange('numeroAfiliado', e.target.value)} /></div>
              <div className={styles.field}><label>Alergias</label><input value={form.alergias} onChange={(e) => onChange('alergias', e.target.value)} /></div>
            </div>
          )}

          {roleFields.includes('areaSecretaria') && (
            <div className={styles.grid2}>
              <div className={styles.field}><label>Area de secretaria</label><input value={form.areaSecretaria} onChange={(e) => onChange('areaSecretaria', e.target.value)} /></div>
              <div className={styles.field}><label>Turno laboral</label><input value={form.turnoLaboral} onChange={(e) => onChange('turnoLaboral', e.target.value)} /></div>
            </div>
          )}

          {roleFields.includes('especialidad') && (
            <div className={styles.grid2}>
              <div className={styles.field}><label>Especialidad</label><input value={form.especialidad} onChange={(e) => onChange('especialidad', e.target.value)} /></div>
              <div className={styles.field}><label>Matricula profesional</label><input value={form.matriculaProfesional} onChange={(e) => onChange('matriculaProfesional', e.target.value)} /></div>
              <div className={styles.field}><label>Direccion consultorio</label><input value={form.direccionConsultorio} onChange={(e) => onChange('direccionConsultorio', e.target.value)} /></div>
            </div>
          )}

          <button className={styles.submit} type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar Perfil'}</button>
        </form>
      </div>

      {user.rol === 'paciente' && (
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Mis Turnos y Recetas</h2>
          {cargandoFicha ? (
            <p className={styles.subtitle}>Cargando turnos y recetas...</p>
          ) : (
            <div className={styles.grid2}>
              <div>
                <div ref={turnosRef} />
                <h3 className={styles.subheading}>Turnos creados</h3>
                <p className={styles.subtitle}>Total: {turnosPaciente.length}</p>
                <div className={styles.timeline}>
                  {turnosRecientes.length === 0 && <p className={styles.meta}>No tienes turnos todavía.</p>}
                  {turnosRecientes.map((turno) => (
                    <div key={turno._id} id={`turno-${turno._id}`} className={styles.item}>
                      <div className={styles.itemTitle}>{turno.servicio?.nombre || 'Servicio'} - {turno.hora}</div>
                      <div className={styles.itemMeta}>{new Date(turno.fecha).toLocaleDateString()} | Estado: {turno.estado}</div>
                      <div className={styles.itemMeta}>Profesional: {turno.medico?.nombre || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div ref={recetasRef} />
                <h3 className={styles.subheading}>Recetas creadas por tu médico</h3>
                <p className={styles.subtitle}>Total: {recetasPaciente.length}</p>
                <div className={styles.timeline}>
                  {recetasRecientes.length === 0 && <p className={styles.meta}>No tienes recetas todavía.</p>}
                  {recetasRecientes.map((receta) => (
                    <div key={receta._id} id={`receta-${receta._id}`} className={styles.item}>
                      <div className={styles.itemTitle}>{new Date(receta.fechaEmision).toLocaleDateString()}</div>
                      <div className={styles.itemMeta}>Médico: {receta.medico?.nombre || '-'}</div>
                      <div className={styles.itemMeta}>{(receta.medicamentos || []).length} medicamento(s)</div>
                      <div className={styles.itemMeta}>
                        {(receta.medicamentos || []).slice(0, 2).map((m) => m.nombre).join(' | ') || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className={styles.subheading}>Teleconsultas</h3>
                <p className={styles.subtitle}>Total: {teleconsultas.length}</p>
                <div className={styles.timeline}>
                  {teleconsultasRecientes.length === 0 && <p className={styles.meta}>No tienes teleconsultas programadas.</p>}
                  {teleconsultasRecientes.map((tc) => (
                    <div key={tc._id} className={styles.item}>
                      <div className={styles.itemTitle}>{new Date(tc.fechaProgramada).toLocaleString()}</div>
                      <div className={styles.itemMeta}>Estado: {tc.estado}</div>
                      <div className={styles.itemMeta}>Profesional: {tc.medico?.nombre || '-'}</div>
                      <a className={styles.joinLink} href={tc.enlaceSala} target="_blank" rel="noreferrer">Ingresar a sala virtual</a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

