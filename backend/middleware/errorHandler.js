/**
 * Middleware global de manejo de errores.
 * Captura cualquier error pasado via next(err) en los controladores.
 * Estandariza el formato de respuesta de error hacia el frontend.
 */
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Errores de validación de mongoose (CastError, ValidationError)
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(400).json({ message: 'Datos inválidos', errors });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `ID inválido: ${err.value}` });
  }

  // Duplicate key (código 11000 MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({ message: `Ya existe un registro con ese ${field}` });
  }

  // Errores de PostgreSQL
  if (err.code === '23505') {
    // unique_violation
    return res.status(409).json({ message: 'Ya existe un registro con ese valor único' });
  }
  if (err.code === '23503') {
    // foreign_key_violation
    return res.status(400).json({ message: 'Referencia a un recurso que no existe' });
  }
  if (err.code === '23502') {
    // not_null_violation
    return res.status(400).json({ message: `Campo obligatorio faltante: ${err.column || ''}` });
  }
  if (err.code === '22P02') {
    // invalid_text_representation (UUID inválido, etc.)
    return res.status(400).json({ message: 'Formato de dato inválido' });
  }

  // Errores JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Sesión expirada, vuelva a iniciar sesión' });
  }

  // Errores de dominio con statusCode propio (ej. CoberturaValidationError)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // Error genérico — no exponer stack en producción
  console.error(`[errorHandler] ${req.method} ${req.path}:`, err.message, isDev ? err.stack : '');
  return res.status(500).json({
    message: 'Error interno del servidor',
    ...(isDev ? { detail: err.message } : {}),
  });
};
