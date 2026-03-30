import React, { useState, useEffect, useContext } from 'react';
import styles from './GestionPacientes.module.css';
import { AuthContext } from '../../context/AuthContext';
import { mostrarExito, mostrarError } from '../../utils/notificaciones';
import { validarDNI, validarEmail, validarNombre, validarTelefono } from '../../utils/validadores';
import {
  getPacientes,
  crearPaciente,
  actualizarPaciente,
  eliminarPaciente
} from '../../services/patientService';
import { canManagePatients } from '../../utils/roles';

const GestionPacientes = () => {
  const { user } = useContext(AuthContext);
  const [pacientes, setPacientes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pacienteEditandoId, setPacienteEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documento: '',
    obraSocial: '',
    numeroAfiliado: '',
    alergias: '',
    direccion: ''
  });

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      setCargando(true);
      const datos = await getPacientes();
      setPacientes(datos);
      setFiltrados(datos);
    } catch (err) {
      setError('Error al cargar pacientes: ' + err.message);
      mostrarError('Error al cargar pacientes');
    } finally {
      setCargando(false);
    }
  };

  const handleBusqueda = (e) => {
    const termino = e.target.value.toLowerCase();
    setBusqueda(termino);
    
    const resultado = pacientes.filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      (p.documento && p.documento.includes(termino)) ||
      (p.email && p.email.toLowerCase().includes(termino))
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

    if (formulario.documento && !validarDNI(formulario.documento)) {
      mostrarError('El DNI debe tener entre 7 y 10 dígitos');
      return;
    }

    try {
      if (pacienteEditandoId) {
        await actualizarPaciente(pacienteEditandoId, {
          nombre: formulario.nombre,
          telefono: formulario.telefono,
          documento: formulario.documento,
          obraSocial: formulario.obraSocial,
          numeroAfiliado: formulario.numeroAfiliado,
          alergias: formulario.alergias,
          direccion: formulario.direccion
        });
        mostrarExito('Paciente actualizado exitosamente');
      } else {
        await crearPaciente(formulario);
        mostrarExito('Paciente creado exitosamente');
      }

      setMostrarFormulario(false);
      setPacienteEditandoId(null);
      setFormulario({
        nombre: '',
        email: '',
        telefono: '',
        documento: '',
        obraSocial: '',
        numeroAfiliado: '',
        alergias: '',
        direccion: ''
      });
      cargarPacientes();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al guardar paciente';
      mostrarError(msg);
    }
  };

  const handleEditar = (paciente) => {
    setPacienteEditandoId(paciente._id);
    setFormulario({
      nombre: paciente.nombre || '',
      email: paciente.email || '',
      telefono: paciente.telefono || '',
      documento: paciente.documento || '',
      obraSocial: paciente.obraSocial || '',
      numeroAfiliado: paciente.numeroAfiliado || '',
      alergias: paciente.alergias || '',
      direccion: paciente.direccion || ''
    });
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este paciente?')) {
      try {
        await eliminarPaciente(id);
        mostrarExito('Paciente eliminado');
        cargarPacientes();
      } catch (err) {
        const msg = err?.response?.data?.message || 'Error al eliminar paciente';
        mostrarError(msg);
      }
    }
  };

  // Verificar permiso
  if (!canManagePatients(user?.rol)) {
    return (
      <div className={styles.container}>
        <p className={styles.noPermiso}>No tienes permiso para acceder a esta sección.</p>
      </div>
    );
  }

  if (cargando) {
    return <div className={styles.container}><p>Cargando pacientes...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pacientes</h1>
        <button 
          className={styles.botonAgregar}
          onClick={() => {
            if (mostrarFormulario) {
              setPacienteEditandoId(null);
              setFormulario({
                nombre: '',
                email: '',
                telefono: '',
                documento: '',
                obraSocial: '',
                numeroAfiliado: '',
                alergias: '',
                direccion: ''
              });
            }
            setMostrarFormulario(!mostrarFormulario);
          }}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Agregar Paciente'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className={styles.formulario}>
          <h2>{pacienteEditandoId ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
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
                disabled={Boolean(pacienteEditandoId)}
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
                name="documento"
                placeholder="Documento (DNI)"
                value={formulario.documento}
                onChange={handleFormularioChange}
              />
              <input
                type="text"
                name="obraSocial"
                placeholder="Obra Social"
                value={formulario.obraSocial}
                onChange={handleFormularioChange}
              />
              <input
                type="text"
                name="numeroAfiliado"
                placeholder="Número de Afiliado"
                value={formulario.numeroAfiliado}
                onChange={handleFormularioChange}
              />
              <input
                type="text"
                name="direccion"
                placeholder="Dirección"
                value={formulario.direccion}
                onChange={handleFormularioChange}
              />
              <input
                type="text"
                name="alergias"
                placeholder="Alergias"
                value={formulario.alergias}
                onChange={handleFormularioChange}
              />
            </div>
            <button type="submit" className={styles.botonGuardar}>
              💾 Guardar
            </button>
          </form>
        </div>
      )}

      <div className={styles.busqueda}>
        <input
          type="text"
          placeholder="Buscar por nombre, DNI o email..."
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
                <th>DNI</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Obra Social</th>
                <th>Alergias</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(paciente => (
                <tr key={paciente._id}>
                  <td className={styles.nombre}>{paciente.nombre}</td>
                  <td>{paciente.documento || '-'}</td>
                  <td>{paciente.email}</td>
                  <td>{paciente.telefono}</td>
                  <td>{paciente.obraSocial || '-'}</td>
                  <td>{paciente.alergias || 'Ninguna'}</td>
                  <td className={styles.acciones}>
                    <button
                      className={styles.botonEditar}
                      onClick={() => handleEditar(paciente)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className={styles.botonEliminar}
                      onClick={() => handleEliminar(paciente._id)}
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
          <p className={styles.sinResultados}>No hay pacientes que coincidan con la búsqueda.</p>
        )}
      </div>
    </div>
  );
};

export default GestionPacientes;

