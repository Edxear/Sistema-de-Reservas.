import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import styles from './Perfil.module.css';

export default function Perfil() {
  const { user, refreshProfile, updateProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const roleFields = useMemo(() => {
    if (!user) return [];
    if (user.rol === 'paciente') return ['obraSocial', 'numeroAfiliado', 'alergias'];
    if (user.rol === 'secretaria') return ['areaSecretaria', 'turnoLaboral'];
    if (user.rol === 'medico' || user.rol === 'admin') {
      return ['especialidad', 'matriculaProfesional', 'direccionConsultorio'];
    }
    return [];
  }, [user]);

  if (!form || !user) return <div className={styles.page}>Cargando perfil...</div>;

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
            <div className={styles.field}><label>Genero</label><input value={form.genero} onChange={(e) => onChange('genero', e.target.value)} /></div>
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
    </div>
  );
}
