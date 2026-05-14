// Si NUTRICION_USE_PG=true (solo entornos locales con PostgreSQL configurado),
// se usa el servicio PG. En producción/Vercel se usa el servicio JSON por defecto.
const nutricionDb =
  process.env.NUTRICION_USE_PG === 'true'
    ? require('../services/nutricionDb')
    : require('../services/nutricionJsonDbService');

function buildActor(req) {
  return {
    id: req.user?._id || null,
    rol: req.user?.rol || 'desconocido',
    nombre: req.user?.nombre || req.user?.email || 'usuario',
  };
}

function handleError(res, error) {
  const status = error.status || 500;
  return res.status(status).json({ error: error.message || 'Error interno' });
}

exports.obtenerBaseNutricion = async (_req, res) => {
  try {
    const db = await nutricionDb.getDatabase();
    return res.json(db);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.listarPacientes = async (_req, res) => {
  try {
    const pacientes = await nutricionDb.listPacientes();
    return res.json(pacientes);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.crearPaciente = async (req, res) => {
  try {
    const paciente = await nutricionDb.createPaciente(req.body, buildActor(req));
    return res.status(201).json(paciente);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtenerPaciente = async (req, res) => {
  try {
    const paciente = await nutricionDb.getPacienteById(req.params.pacienteId);
    return res.json(paciente);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.actualizarHistoriaClinica = async (req, res) => {
  try {
    const historia = await nutricionDb.updateHistoriaClinica(req.params.pacienteId, req.body);
    return res.json(historia);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.agregarProceso = async (req, res) => {
  try {
    const proceso = await nutricionDb.appendProceso(req.params.pacienteId, req.body, buildActor(req));
    return res.status(201).json(proceso);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.agregarDieta = async (req, res) => {
  try {
    const dieta = await nutricionDb.appendDieta(req.params.pacienteId, req.body, buildActor(req));
    return res.status(201).json(dieta);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.agregarAlergia = async (req, res) => {
  try {
    const alergia = await nutricionDb.appendAlergia(req.params.pacienteId, req.body, buildActor(req));
    return res.status(201).json(alergia);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.agregarPedidoCocina = async (req, res) => {
  try {
    const pedido = await nutricionDb.appendPedidoCocina(req.params.pacienteId, req.body, buildActor(req));
    return res.status(201).json(pedido);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.obtenerMetricas = async (_req, res) => {
  try {
    const metricas = await nutricionDb.getMetricas();
    return res.json(metricas);
  } catch (error) {
    return handleError(res, error);
  }
};

exports.cambiarEstadoOperativo = async (req, res) => {
  try {
    const estado = await nutricionDb.updateEstadoOperativo(req.body, buildActor(req));
    return res.json(estado);
  } catch (error) {
    return handleError(res, error);
  }
};
