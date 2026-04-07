class CoberturaValidationError extends Error {
  constructor(errors) {
    super('Payload de cobertura invalido');
    this.name = 'CoberturaValidationError';
    this.statusCode = 400;
    this.errors = errors;
  }
}

const TIPO_SOLICITUD = ['autorizacion', 'rechazo', 'auditoria', 'facturacion', 'prestacion'];
const CRITICIDAD = ['critico', 'alto', 'medio', 'bajo'];

const normalizeText = (value) => String(value || '').trim();

function validateCoberturaInput(payload = {}) {
  const errors = [];

  const obraSocial = normalizeText(payload.obraSocial || payload.cobertura);
  const descripcion = normalizeText(payload.descripcion);
  const tipoSolicitud = normalizeText(payload.tipoSolicitud || 'autorizacion').toLowerCase();
  const criticidad = normalizeText(payload.criticidad || 'medio').toLowerCase();

  if (!obraSocial) {
    errors.push({ field: 'obraSocial', message: 'obraSocial/cobertura es obligatorio' });
  }

  if (!descripcion) {
    errors.push({ field: 'descripcion', message: 'descripcion es obligatoria' });
  }

  if (!TIPO_SOLICITUD.includes(tipoSolicitud)) {
    errors.push({ field: 'tipoSolicitud', message: `tipoSolicitud invalido: ${tipoSolicitud}` });
  }

  if (!CRITICIDAD.includes(criticidad)) {
    errors.push({ field: 'criticidad', message: `criticidad invalida: ${criticidad}` });
  }

  if (errors.length > 0) {
    throw new CoberturaValidationError(errors);
  }

  return {
    obraSocial,
    descripcion,
    tipoSolicitud,
    criticidad,
    pacienteRef: normalizeText(payload.pacienteRef),
    nroAfiliado: normalizeText(payload.nroAfiliado),
    solicitanteNombre: normalizeText(payload.solicitanteNombre),
    solicitanteRol: normalizeText(payload.solicitanteRol),
    solicitanteArea: normalizeText(payload.solicitanteArea || 'Gestion'),
    modulo: normalizeText(payload.modulo || 'Cobertura'),
    areaClinica: normalizeText(payload.areaClinica || 'Gestion institucional'),
    soporteNivel: normalizeText(payload.soporteNivel || 'L2') || 'L2',
  };
}

function buildCoberturaTicketPayload(payload = {}, actor = {}) {
  const normalized = validateCoberturaInput(payload);
  const impactoClinico = normalized.pacienteRef
    ? `Paciente referencia: ${normalized.pacienteRef}`
    : '';
  const descripcionFull = `${normalized.descripcion}${normalized.nroAfiliado ? `\nAfiliado: ${normalized.nroAfiliado}` : ''}`;

  return {
    titulo: `Solicitud ${normalized.tipoSolicitud} - ${normalized.obraSocial}`,
    descripcion: descripcionFull,
    criticidad: normalized.criticidad,
    tipoGestion: 'obra_social',
    soporteNivel: normalized.soporteNivel,
    areaClinica: normalized.areaClinica,
    modulo: normalized.modulo,
    impactoClinico,
    solicitante: {
      usuario: actor.actorId || null,
      nombre: normalized.solicitanteNombre || actor.actorName || '',
      rol: normalized.solicitanteRol || actor.actorRole || '',
      area: normalized.solicitanteArea,
    },
    coordinador: actor.actorId || null,
    requiresChangeValidation: false,
    changeValidationStatus: 'no_aplica',
    tags: [
      'obra_social',
      'interinstitucional',
      normalized.tipoSolicitud,
      normalized.obraSocial.toLowerCase().replace(/\s+/g, '_'),
    ],
  };
}

module.exports = {
  CoberturaValidationError,
  validateCoberturaInput,
  buildCoberturaTicketPayload,
};
