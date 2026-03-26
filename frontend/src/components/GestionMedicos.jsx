import React, { useState, useEffect, useContext } from 'react';
import styles from './GestionMedicos.module.css';
import { AuthContext } from '../context/AuthContext';
import { mostrarExito, mostrarError } from '../utils/notificaciones';
import { getMedicos } from '../services/medicoService';

const GestionMedicos = () => {
  const { user } = useContext(AuthContext);
  const [medicos, setMedicos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    especialidad: '',
    matriculaProfesional: '',
    bio: '',
    direccionConsultorio: ''
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
      setError('Error al cargar médicos: ' + err.message);
      mostrarError('Error al cargar médicos');
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
    
    if (!formulario.nombre.trim()) {
      mostrarError('El nombre es obligatorio');
      return;
    }

    try {
      // Aquí iría la llamada al API para guardar/actualizar
      // await crearOMedico(formulario)
      
      mostrarExito('Médico guardado exitosamente');
      setMostrarFormulario(false);
      setFormulario({
        nombre: '',
        email: '',
        telefono: '',
        especialidad: '',
        matriculaProfesional: '',
        bio: '',
        direccionConsultorio: ''
      });
      cargarMedicos();
    } catch (err) {
      mostrarError('Error al guardar médico');
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este médico?')) {
      try {
        // await deleteMedico(id)
        mostrarExito('Médico eliminado');
        cargarMedicos();
      } catch (err) {
        mostrarError('Error al eliminar médico');
      }
    }
  };

  // Verificar permiso
  if (!['admin', 'director'].includes(user?.rol)) {
    return (
      <div className={styles.container}>
        <p className={styles.noPermiso}>No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  if (cargando) {
    return <div className={styles.container}><p>Cargando médicos...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Médicos</h1>
        <button 
          className={styles.botonAgregar}
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Agregar Médico'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className={styles.formulario}>
          <h2>Nuevo Médico</h2>
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
              />
              <input
                type="tel"
                name="telefono"
                placeholder="Teléfono"
                value={formulario.telefono}
                onChange={handleFormularioChange}
              />
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
                <th>Email</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Rating</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(medico => (
                <tr key={medico._id}>
                  <td className={styles.nombre}>{medico.nombre}</td>
                  <td>{medico.email}</td>
                  <td>{medico.especialidad || '-'}</td>
                  <td>{medico.telefono}</td>
                  <td className={styles.rating}>
                    {'★'.repeat(Math.round(medico.promedioRating))}
                    {'☆'.repeat(5 - Math.round(medico.promedioRating))}
                    <span> ({medico.totalRatings})</span>
                  </td>
                  <td className={styles.acciones}>
                    <button className={styles.botonEditar} title="Editar">✏️</button>
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
          <p className={styles.sinResultados}>No hay médicos que coincidan con la búsqueda.</p>
        )}
      </div>
    </div>
  );
};

export default GestionMedicos;
