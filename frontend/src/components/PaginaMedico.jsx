import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import styles from './PaginaMedico.module.css';
import { getMedicoById, getRatingsMedico, crearRatingMedico, miRatingMedico } from '../services/medicoService';
import { AuthContext } from '../context/AuthContext';

const PaginaMedico = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [medico, setMedico] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [miRating, setMiRating] = useState(null);
  const [nuevaCalificacion, setNuevaCalificacion] = useState(0);
  const [nuevoComentario, setNuevoComentario] = useState('');
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
      setMensajeExito('Reseña guardada exitosamente');

      // Recargar datos
      setTimeout(() => {
        cargarDatos();
        setNuevaCalificacion(0);
        setNuevoComentario('');
        setMensajeExito('');
      }, 2000);
    } catch (err) {
      setError('Error al guardar reseña: ' + err.message);
    } finally {
      setEnviando(false);
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

  return (
    <div className={styles.container}>
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
    </div>
  );
};

export default PaginaMedico;
