import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PaginaMedico.module.css';
import { getMedicoById, getRatingsMedico, crearRatingMedico, miRatingMedico, getComentariosPrivados, crearComentarioPrivado, eliminarComentarioPrivado } from '../services/medicoService';
import { AuthContext } from '../context/AuthContext';
import { mostrarExito, mostrarError, mostrarNuevoRating, mostrarNuevoComentario } from '../utils/notificaciones';
import { exportarComentariosCSV, exportarComentariosPDF } from '../utils/exportadores';

const PaginaMedico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [medico, setMedico] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [miRating, setMiRating] = useState(null);
  const [comentariosPrivados, setComentariosPrivados] = useState([]);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoComentarioPrivado, setNuevoComentarioPrivado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataMedico, dataRatings] = await Promise.all([
        getMedicoById(id),
        getRatingsMedico(id)
      ]);

      setMedico(dataMedico);
      setRatings(dataRatings);

      // Cargar mi rating si estoy autenticado
      if (user) {
        const miData = await miRatingMedico(id);
        if (miData) {
          setMiRating(miData);
          setNuevaCalificacion(miData.calificacion);
          setNuevoComentario(miData.comentario || '');
        }
      }

      // Cargar comentarios privados si soy admin/director
      if (user && ['admin', 'director'].includes(user.rol)) {
        const comentarios = await getComentariosPrivados(id);
        setComentariosPrivados(comentarios);
      }
    } catch (err) {
      setError('Error al cargar datos: ' + err.message);
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();

    if (!user) {
      setError('Debes estar autenticado para dejar una reseña');
      return;
    }

    if (nuevaCalificacion === 0) {
      setError('Debes seleccionar una calificación');
      return;
    }

    try {
      setEnviando(true);
      setError('');
      setMensajeExito('');

      await crearRatingMedico(id, nuevaCalificacion, nuevoComentario);
      
      mostrarNuevoRating(medico.nombre, nuevaCalificacion);
      mostrarExito(miRating ? 'Reseña actualizada' : 'Reseña publicada exitosamente');

      // Recargar datos
      setTimeout(() => {
        cargarDatos();
        setNuevaCalificacion(0);
        setNuevoComentario('');
        setMensajeExito('');
      }, 2000);
    } catch (err) {
      mostrarError('Error al guardar reseña: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleAgregarComentarioPrivado = async (e) => {
    e.preventDefault();

    if (!nuevoComentarioPrivado.trim()) {
      mostrarError('El comentario no puede estar vacío');
      return;
    }

    try {
      setEnviando(true);
      await crearComentarioPrivado(id, nuevoComentarioPrivado);
      mostrarNuevoComentario(medico.nombre);
      setNuevoComentarioPrivado('');
      cargarDatos();
    } catch (err) {
      mostrarError('Error al agregar comentario: ' + err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminarComentario = async (comentarioId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      try {
        await eliminarComentarioPrivado(comentarioId);
        mostrarExito('Comentario eliminado');
        cargarDatos();
      } catch (err) {
        mostrarError('Error al eliminar comentario');
      }
    }
  };

  const renderCalificacionSeleccionable = (nivel) => {
    return (
      <button
        key={nivel}
        type="button"
        className={`${styles.estrella} ${nuevaCalificacion >= nivel ? styles.seleccionada : ''}`}
        onClick={() => setNuevaCalificacion(nivel)}
      >
        {nuevaCalificacion >= nivel ? '★' : '☆'}
      </button>
    );
  };

  if (cargando) {
    return <div className={styles.container}><p>Cargando...</p></div>;
  }

  if (error && !medico) {
    return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  }

  if (!medico) {
    return <div className={styles.container}><p>Médico no encontrado</p></div>;
  }

  const esAdminODirector = user && ['admin', 'director'].includes(user.rol);

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.botonVolver}>
        ← Volver
      </button>

      <div className={styles.header}>
        {medico.fotoPerfil && (
          <img src={medico.fotoPerfil} alt={medico.nombre} className={styles.fotoPrincipal} />
        )}
        <div className={styles.infoBasica}>
          <h1>{medico.nombre}</h1>
          <p className={styles.especialidad}>{medico.especialidad}</p>
          {medico.matriculaProfesional && (
            <p className={styles.matricula}>Matrícula: {medico.matriculaProfesional}</p>
          )}

          <div className={styles.ratingGeneral}>
            <span className={styles.estrellas}>
              {'★'.repeat(Math.round(medico.promedioRating))}
              {'☆'.repeat(5 - Math.round(medico.promedioRating))}
            </span>
            <span>{medico.promedioRating > 0 ? `${medico.promedioRating}/5` : 'Sin reseñas'} ({medico.totalRatings} reseñas)</span>
          </div>
        </div>
      </div>

      <div className={styles.contenido}>
        <div className={styles.seccion}>
          <h2>Información Profesional</h2>
          {medico.bio && <p>{medico.bio}</p>}
          
          {medico.direccionConsultorio && (
            <p><strong>📍 Consultorio:</strong> {medico.direccionConsultorio}</p>
          )}
          
          {medico.telefono && (
            <p><strong>📱 Teléfono:</strong> {medico.telefono}</p>
          )}

          {medico.horariosAtencion && medico.horariosAtencion.length > 0 && (
            <div>
              <strong>Horarios de atención:</strong>
              <ul className={styles.horarios}>
                {medico.horariosAtencion.map((h, idx) => (
                  <li key={idx}>{h.dia}: {h.horaInicio} - {h.horaFin}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {medico.redesSociales && Object.keys(medico.redesSociales).length > 0 && (
          <div className={styles.seccion}>
            <h2>Redes Sociales</h2>
            <div className={styles.redesSociales}>
              {medico.redesSociales.instagram && (
                <a href={medico.redesSociales.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}
              {medico.redesSociales.linkedin && (
                <a href={medico.redesSociales.linkedin} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.seccionRatings}>
        <h2>Reseñas de Pacientes</h2>

        {user && user.rol === 'paciente' && (
          <div className={styles.formularioRating}>
            <h3>Deja tu reseña</h3>
            {error && <p className={styles.error}>{error}</p>}
            {mensajeExito && <p className={styles.exito}>{mensajeExito}</p>}

            <form onSubmit={handleSubmitRating}>
              <div className={styles.grupoFormulario}>
                <label>Tu calificación:</label>
                <div className={styles.selectorEstrellas}>
                  {[1, 2, 3, 4, 5].map(renderCalificacionSeleccionable)}
                </div>
              </div>

              <div className={styles.grupoFormulario}>
                <label htmlFor="comentario">Comentario (opcional):</label>
                <textarea
                  id="comentario"
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Comparte tu experiencia con este médico..."
                  maxLength={500}
                  disabled={enviando}
                />
                <small>{nuevoComentario.length}/500</small>
              </div>

              <button 
                type="submit" 
                className={styles.botonEnviar}
                disabled={enviando || nuevaCalificacion === 0}
              >
                {enviando ? 'Enviando...' : miRating ? 'Actualizar reseña' : 'Publicar reseña'}
              </button>
            </form>
          </div>
        )}

        {!user && (
          <p className={styles.noAutenticado}>
            <strong>Debes estar autenticado</strong> para dejar una reseña.
          </p>
        )}

        <div className={styles.listaRatings}>
          {ratings && ratings.ratings && ratings.ratings.length > 0 ? (
            ratings.ratings.map((rating, idx) => (
              <div key={idx} className={styles.ratingItem}>
                <div className={styles.headerRating}>
                  <span className={styles.estrellas}>{'★'.repeat(rating.calificacion)}{'☆'.repeat(5 - rating.calificacion)}</span>
                  <span className={styles.paciente}>{rating.pacienteNombre?._id ? 'Paciente anónimo' : rating.pacienteNombre?.nombre || 'Anónimo'}</span>
                  <span className={styles.fecha}>{new Date(rating.fecha).toLocaleDateString()}</span>
                </div>
                {rating.comentario && (
                  <p className={styles.comentarioTexto}>{rating.comentario}</p>
                )}
              </div>
            ))
          ) : (
            <p className={styles.sinRatings}>Este médico no tiene reseñas aún. ¡Sé el primero en dejar una!</p>
          )}
        </div>
      </div>

      {esAdminODirector && (
        <div className={styles.seccionComentariosPrivados}>
          <h2>Comentarios Privados (Admin/Director)</h2>

          <div className={styles.formularioComentarioPrivado}>
            <h3>Agregar comentario privado</h3>
            <form onSubmit={handleAgregarComentarioPrivado}>
              <textarea
                value={nuevoComentarioPrivado}
                onChange={(e) => setNuevoComentarioPrivado(e.target.value)}
                placeholder="Escribe comentarios privados sobre este médico..."
                maxLength={1000}
                disabled={enviando}
              />
              <small>{nuevoComentarioPrivado.length}/1000</small>
              <button 
                type="submit"
                disabled={enviando || !nuevoComentarioPrivado.trim()}
                className={styles.botonEnviarPrivado}
              >
                {enviando ? 'Guardando...' : 'Guardar comentario'}
              </button>
            </form>
          </div>

          {comentariosPrivados.length > 0 && (
            <div className={styles.exportarComentarios}>
              <button
                onClick={() => exportarComentariosCSV(comentariosPrivados, medico.nombre)}
                className={styles.botonExportar}
              >
                📥 Exportar como CSV
              </button>
              <button
                onClick={() => exportarComentariosPDF(comentariosPrivados, medico)}
                className={styles.botonExportar}
              >
                📄 Exportar como PDF
              </button>
            </div>
          )}

          <div className={styles.listaComentariosPrivados}>
            {comentariosPrivados.length > 0 ? (
              comentariosPrivados.map((comentario) => (
                <div key={comentario._id} className={styles.comentarioPrivado}>
                  <div className={styles.headerComentarioPrivado}>
                    <span className={styles.autor}>{comentario.autor?.nombre}</span>
                    <span className={styles.tipoAutor}>{comentario.tipoAutor}</span>
                    <span className={styles.fechaComentario}>{new Date(comentario.fechaCreacion).toLocaleDateString()}</span>
                  </div>
                  <p className={styles.contenidoComentario}>{comentario.contenido}</p>
                  <button
                    onClick={() => handleEliminarComentario(comentario._id)}
                    className={styles.botonEliminar}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))
            ) : (
              <p className={styles.sinComentarios}>No hay comentarios privados aún.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaMedico;
