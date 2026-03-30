import React, { useState, useEffect, useContext } from 'react';
import styles from './GestionMedicos.module.css';
import { AuthContext } from '../../context/AuthContext';
import { mostrarExito, mostrarError } from '../../utils/notificaciones';
import { validarEmail, validarNombre, validarTelefono } from '../../utils/validadores';
import {
  getMedicos,
  crearMedico,
  actualizarMedico,
  eliminarMedico
} from '../../services/medicoService';
import { canManageDoctors } from '../../utils/roles';

const GestionMedicos = () => {
  const { user } = useContext(AuthContext);
  const [medicos, setMedicos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [medicoEditandoId, setMedicoEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'medico',
    especialidad: '',
    matriculaProfesional: '',
    bio: '',
    direccionConsultorio: '',
    areaSecretaria: '',
    turnoLaboral: ''
  });

  useEffect(() => {
    cargarMedicos();
  }, []);

  const cargarMedicos = async () => {
    try {
      setCargando(true);
      const datos = await getMedicos();
      setMedicos(datos);
      setFiltrados(datos);
    } catch (err) {
      setError('Error al cargar personal: ' + err.message);
      mostrarError('Error al cargar personal');
    } finally {
      setCargando(false);
    }
  };

  const handleBusqueda = (e) => {
    const termino = e.target.value.toLowerCase();
    setBusqueda(termino);
    
    const resultado = medicos.filter(m =>
      m.nombre.toLowerCase().includes(termino) ||
      (m.especialidad && m.especialidad.toLowerCase().includes(termino)) ||
      (m.email && m.email.toLowerCase().includes(termino))
    );
    setFiltrados(resultado);
  };

  const handleFormularioChange = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    
    if (!validarNombre(formulario.nombre || '')) {
      mostrarError('Ingresa un nombre válido (mínimo 3 letras, sin números)');
      return;
    }

    if (!validarEmail(formulario.email || '')) {
      mostrarError('Ingresa un email válido');
      return;
    }

    if (!validarTelefono(formulario.telefono || '')) {
      mostrarError('Ingresa un teléfono válido (mínimo 10 dígitos)');
      return;
    }

    try {
      if (medicoEditandoId) {
        await actualizarMedico(medicoEditandoId, {
          nombre: formulario.nombre,
          telefono: formulario.telefono,
          rol: formulario.rol,
          especialidad: formulario.especialidad,
          matriculaProfesional: formulario.matriculaProfesional,
          bio: formulario.bio,
          direccionConsultorio: formulario.direccionConsultorio,
          areaSecretaria: formulario.areaSecretaria,
          turnoLaboral: formulario.turnoLaboral
        });
        mostrarExito('Personal actualizado exitosamente');
      } else {
        await crearMedico(formulario);
        mostrarExito('Personal creado exitosamente');
      }

      setMostrarFormulario(false);
      setMedicoEditandoId(null);
      setFormulario({
        nombre: '',
        email: '',
        telefono: '',
        rol: 'medico',
        especialidad: '',
        matriculaProfesional: '',
        bio: '',
        direccionConsultorio: '',
        areaSecretaria: '',
        turnoLaboral: ''
      });
      cargarMedicos();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar';
      mostrarError(msg);
    }
  };

  const handleEditar = (medico) => {
    setMedicoEditandoId(medico._id);
    setFormulario({
      nombre: medico.nombre || '',
      email: medico.email || '',
      telefono: medico.telefono || '',
      rol: medico.rol || 'medico',
      especialidad: medico.especialidad || '',
      matriculaProfesional: medico.matriculaProfesional || '',
      bio: medico.bio || '',
      direccionConsultorio: medico.direccionConsultorio || '',
      areaSecretaria: medico.areaSecretaria || '',
      turnoLaboral: medico.turnoLaboral || ''
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este médico?')) {
      try {
        await eliminarMedico(id);
        mostrarExito('Médico eliminado');
        cargarMedicos();
      } catch (err) {
        const msg = err?.response?.data?.message || 'Error al eliminar médico';
        mostrarError(msg);
      }
    }
  };

  // Verificar permiso
  if (!canManageDoctors(user?.rol)) {
    return (
      <div className={styles.container}>
        <p className={styles.noPermiso}>No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  if (cargando) {
    return <div className={styles.container}><p>Cargando personal...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Personal Médico y Administrativo</h1>
        <button 
          className={styles.botonAgregar}
          onClick={() => {
            if (mostrarFormulario) {
              setMedicoEditandoId(null);
              setFormulario({
                nombre: '',
                email: '',
                telefono: '',
                rol: 'medico',
                especialidad: '',
                matriculaProfesional: '',
                bio: '',
                direccionConsultorio: '',
                areaSecretaria: '',
                turnoLaboral: ''
              });
            }
            setMostrarFormulario(!mostrarFormulario);
          }}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Agregar Personal'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className={styles.formulario}>
          <h2>{medicoEditandoId ? 'Editar Perfil' : 'Nuevo Personal'}</h2>
          <form onSubmit={handleGuardar}>
            <div className={styles.grid}>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre completo"
                value={formulario.nombre}
                onChange={handleFormularioChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formulario.email}
                onChange={handleFormularioChange}
                required
                disabled={Boolean(medicoEditandoId)}
              />
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono"
                value={formulario.telefono}
                onChange={handleFormularioChange}
              />
              <select
                name="rol"
                value={formulario.rol}
                onChange={handleFormularioChange}
              >
                <option value="medico">Médico</option>
                <option value="enfermero">Enfermero/a</option>
                <option value="secretaria">Secretaria/o</option>
                <option value="admin">Administrador</option>
              </select>
              {['medico', 'enfermero'].includes(formulario.rol) && (
                <>
                  <input
                    type="text"
                    name="especialidad"
                    placeholder="Especialidad"
                    value={formulario.especialidad}
                    onChange={handleFormularioChange}
                  />
                  <input
                    type="text"
                    name="matriculaProfesional"
                    placeholder="Matrícula Profesional"
                    value={formulario.matriculaProfesional}
                    onChange={handleFormularioChange}
                  />
                  <input
                    type="text"
                    name="direccionConsultorio"
                    placeholder="Dirección del Consultorio"
                    value={formulario.direccionConsultorio}
                    onChange={handleFormularioChange}
                  />
                </>
              )}
              {formulario.rol === 'secretaria' && (
                <>
                  <input
                    type="text"
                    name="areaSecretaria"
                    placeholder="Área (ej.: Recepción General)"
                    value={formulario.areaSecretaria}
                    onChange={handleFormularioChange}
                  />
                  <input
                    type="text"
                    name="turnoLaboral"
                    placeholder="Turno (Mañana / Tarde)"
                    value={formulario.turnoLaboral}
                    onChange={handleFormularioChange}
                  />
                </>
              )}
            </div>
            <textarea
              name="bio"
              placeholder="Biografía"
              value={formulario.bio}
              onChange={handleFormularioChange}
              maxLength={200}
            />
            <small>{formulario.bio.length}/200</small>
            <button type="submit" className={styles.botonGuardar}>
              💾 Guardar
            </button>
          </form>
        </div>
      )}

      <div className={styles.busqueda}>
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o email..."
          value={busqueda}
          onChange={handleBusqueda}
        />
        <span className={styles.contador}>{filtrados.length} resultados</span>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.tabla}>
        {filtrados.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Email</th>
                <th>Especialidad / Área</th>
                <th>Teléfono</th>
                <th>Rating</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(medico => (
                <tr key={medico._id}>
                  <td className={styles.nombre}>{medico.nombre}</td>
                  <td><span className={styles.rolTag}>{medico.rol}</span></td>
                  <td>{medico.email}</td>
                  <td>{medico.especialidad || medico.areaSecretaria || '-'}</td>
                  <td>{medico.telefono}</td>
                  <td className={styles.rating}>
                    {'★'.repeat(Math.round(medico.promedioRating))}
                    {'☆'.repeat(5 - Math.round(medico.promedioRating))}
                    <span> ({medico.totalRatings})</span>
                  </td>
                  <td className={styles.acciones}>
                    <button
                      className={styles.botonEditar}
                      onClick={() => handleEditar(medico)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className={styles.botonEliminar}
                      onClick={() => handleEliminar(medico._id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className={styles.sinResultados}>No hay personal que coincida con la búsqueda.</p>
        )}
      </div>
    </div>
  );
};

export default GestionMedicos;

