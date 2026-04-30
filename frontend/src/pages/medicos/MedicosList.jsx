import React, { useState, useEffect } from 'react';
import styles from './MedicosList.module.css';
import { getMedicos } from '../../services/medicoService';

const ITEMS_POR_PAGINA = 6;

const MedicosList = () => {
  const [medicos, setMedicos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);

  useEffect(() => {
    cargarMedicos();
  }, []);

  useEffect(() => {
    // Resetear a página 1 cuando cambian los filtros
    setPaginaActual(1);
  }, [especialidadSeleccionada, busqueda]);

  const cargarMedicos = async () => {
    try {
      setCargando(true);
      const datos = await getMedicos();
      setMedicos(datos);
      
      // Extraer especialidades únicas
      const especialidadesUnicas = [...new Set(datos.map(m => m.especialidad).filter(e => e))].sort();
      setEspecialidades(especialidadesUnicas);
      
      setFiltrados(datos);
    } catch (err) {
      setError('Error al cargar médicos: ' + err.message);
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = (especialidad = especialidadSeleccionada, termino = busqueda) => {
    let resultado = medicos;

    if (especialidad) {
      resultado = resultado.filter(m => m.especialidad === especialidad);
    }

    if (termino) {
      const t = termino.toLowerCase();
      resultado = resultado.filter(m =>
        m.nombre.toLowerCase().includes(t) ||
        (m.especialidad && m.especialidad.toLowerCase().includes(t))
      );
    }

    setFiltrados(resultado);
  };

  const handleEspecialidadChange = (especialidad) => {
    setEspecialidadSeleccionada(especialidad);
    aplicarFiltros(especialidad, busqueda);
  };

  const handleBusquedaChange = (e) => {
    const termino = e.target.value;
    setBusqueda(termino);
    aplicarFiltros(especialidadSeleccionada, termino);
  };

  const renderRating = (promedio, total) => {
    return (
      <div className={styles.rating}>
        <span className={styles.estrellas}>
          {'★'.repeat(Math.round(promedio))}
          {'☆'.repeat(5 - Math.round(promedio))}
        </span>
        <span className={styles.promedio}>
          {promedio > 0 ? `${promedio}/5` : 'Sin reseñas'} ({total})
        </span>
      </div>
    );
  };

  // Cálculo de paginación
  const totalPaginas = Math.ceil(filtrados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const indiceFin = indiceInicio + ITEMS_POR_PAGINA;
  const medicosPaginados = filtrados.slice(indiceInicio, indiceFin);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (cargando) {
    return <div className={styles.container}><p>Cargando médicos...</p></div>;
  }

  if (error) {
    return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  }

  return (
    <div className={styles.container}>
      <h1 data-tour="medicos-list-overview">Nuestros Médicos</h1>

      <div className={styles.filtros}>
        <input
          type="text"
          placeholder="Buscar por nombre o especialidad..."
          value={busqueda}
          onChange={handleBusquedaChange}
          className={styles.busqueda}
        />

        <select
          value={especialidadSeleccionada}
          onChange={(e) => handleEspecialidadChange(e.target.value)}
          className={styles.filtroEspecialidad}
        >
          <option value="">Todas las especialidades</option>
          {especialidades.map(esp => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </select>
      </div>

      <div className={styles.resultados}>
        <p className={styles.contador}>
          Mostrando {medicosPaginados.length} de {filtrados.length} médicos
        </p>

        <div className={styles.gridMedicos}>
          {medicosPaginados.map(medico => (
            <div key={medico._id} className={styles.tarjeta}>
              {medico.fotoPerfil && (
                <img 
                  src={medico.fotoPerfil} 
                  alt={medico.nombre}
                  className={styles.foto}
                />
              )}
              
              <div className={styles.contenido}>
                <h3>{medico.nombre}</h3>
                
                {medico.especialidad && (
                  <p className={styles.especialidad}>{medico.especialidad}</p>
                )}

                {medico.matriculaProfesional && (
                  <p className={styles.matricula}>Matrícula: {medico.matriculaProfesional}</p>
                )}

                {renderRating(medico.promedioRating, medico.totalRatings)}

                {medico.bio && (
                  <p className={styles.bio}>{medico.bio}</p>
                )}

                {medico.direccionConsultorio && (
                  <p className={styles.consultorio}>📍 {medico.direccionConsultorio}</p>
                )}

                {medico.horariosAtencion && medico.horariosAtencion.length > 0 && (
                  <div className={styles.horarios}>
                    <strong>Horarios:</strong>
                    <ul>
                      {medico.horariosAtencion.slice(0, 3).map((h, idx) => (
                        <li key={idx}>
                          {h.dia}: {h.horaInicio} - {h.horaFin}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {medico.telefono && (
                  <p className={styles.contacto}>📱 {medico.telefono}</p>
                )}

                <a href={`/medicos/${medico._id}`} className={styles.boton}>
                  Ver Perfil Completo
                </a>
              </div>
            </div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <p className={styles.sinResultados}>
            No se encontraron médicos que coincidan con tu búsqueda.
          </p>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className={styles.paginacion}>
          <button 
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className={styles.botonPaginacion}
          >
            ← Anterior
          </button>

          <div className={styles.numeroPaginas}>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
              <button
                key={pagina}
                onClick={() => cambiarPagina(pagina)}
                className={`${styles.botonPagina} ${paginaActual === pagina ? styles.activa : ''}`}
              >
                {pagina}
              </button>
            ))}
          </div>

          <button 
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className={styles.botonPaginacion}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicosList;

