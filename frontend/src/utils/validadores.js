/**
 * Validaciones de negocio para frontend
 */

/**
 * Valida un email según formato estándar
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida una contraseña (mínimo 6 caracteres)
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - true si es válida
 */
export const validarPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Valida un número de teléfono (al menos 10 dígitos)
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} - true si es válido
 */
export const validarTelefono = (telefono) => {
  const regex = /^[0-9]{10,}$/;
  const soloNumeros = telefono.replace(/\D/g, '');
  return regex.test(soloNumeros);
};

/**
 * Valida un DNI (solo números, 7-10 dígitos)
 * @param {string} dni - DNI a validar
 * @returns {boolean} - true si es válido
 */
export const validarDNI = (dni) => {
  const regex = /^[0-9]{7,10}$/;
  return regex.test(dni);
};

/**
 * Valida un nombre (al menos 3 caracteres, sin números)
 * @param {string} nombre - Nombre a validar
 * @returns {boolean} - true si es válido
 */
export const validarNombre = (nombre) => {
  const regex = /^[a-záéíóúñ\s]{3,}$/i;
  return regex.test(nombre);
};

/**
 * Obtiene un mensaje de error amigable para un campo
 * @param {string} campo - Nombre del campo
 * @param {string} tipoError - Tipo de error (required, invalid, minlength)
 * @returns {string} - Mensaje de error
 */
export const getMensajeError = (campo, tipoError) => {
  const mensajes = {
    nombre: {
      required: 'El nombre es obligatorio',
      invalid: 'El nombre debe tener al menos 3 caracteres y sin números'
    },
    email: {
      required: 'El email es obligatorio',
      invalid: 'Formato de email inválido'
    },
    password: {
      required: 'La contraseña es obligatoria',
      minlength: 'La contraseña debe tener al menos 6 caracteres'
    },
    telefono: {
      required: 'El teléfono es obligatorio',
      invalid: 'El teléfono debe tener al menos 10 dígitos'
    },
    documento: {
      required: 'El documento es obligatorio',
      invalid: 'El documento debe tener 7-10 números'
    }
  };

  return (mensajes[campo] && mensajes[campo][tipoError]) || 'Campo inválido';
};
