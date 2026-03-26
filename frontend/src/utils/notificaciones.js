import { toast } from 'react-toastify';

/**
 * Utilidades para mostrar notificaciones con react-toastify
 */

export const mostrarExito = (mensaje, opciones = {}) => {
  toast.success(mensaje, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...opciones
  });
};

export const mostrarError = (mensaje, opciones = {}) => {
  toast.error(mensaje, {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...opciones
  });
};

export const mostrarInfo = (mensaje, opciones = {}) => {
  toast.info(mensaje, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...opciones
  });
};

export const mostrarAdvertencia = (mensaje, opciones = {}) => {
  toast.warning(mensaje, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...opciones
  });
};

/**
 * Notificación especial para nuevo rating
 */
export const mostrarNuevoRating = (nombreMedico, calificacion) => {
  const estrellas = '★'.repeat(calificacion) + '☆'.repeat(5 - calificacion);
  toast.info(
    `Nuevo rating para ${nombreMedico}: ${estrellas}`,
    {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      icon: '⭐'
    }
  );
};

/**
 * Notificación especial para nuevo comentario
 */
export const mostrarNuevoComentario = (nombreMedico) => {
  toast.info(
    `Nuevo comentario privado agregado a ${nombreMedico}`,
    {
      position: 'bottom-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      icon: '💬'
    }
  );
};
