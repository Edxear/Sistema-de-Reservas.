const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'data', 'nutricionDB.json');

async function readDb() {
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await fs.writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
}

function buildPacientePayload(payload, actor) {
  return {
    id: randomUUID(),
    nombre: String(payload.nombre || '').trim(),
    documento: String(payload.documento || '').trim(),
    edad: Number(payload.edad || 0),
    medicoResponsable: String(payload.medicoResponsable || '').trim(),
    enfermeroResponsable: String(payload.enfermeroResponsable || '').trim(),
    historiaClinica: {
      resumen: String(payload.resumenClinico || ''),
      antecedentes: Array.isArray(payload.antecedentes) ? payload.antecedentes : [],
      procesos: [],
      actualizadoEn: new Date().toISOString(),
    },
    dietas: [],
    alergias: [],
    cocina: {
      pedidos: [],
      observaciones: '',
    },
    creadoEn: new Date().toISOString(),
    creadoPor: {
      id: actor?.id || null,
      rol: actor?.rol || 'desconocido',
      nombre: actor?.nombre || 'sistema',
    },
  };
}

function requirePaciente(db, pacienteId) {
  const paciente = db.clinico.pacientes.find((item) => item.id === pacienteId);
  if (!paciente) {
    const error = new Error('Paciente no encontrado');
    error.status = 404;
    throw error;
  }

  return paciente;
}

async function getDatabase() {
  return readDb();
}

async function listPacientes() {
  const db = await readDb();
  return db.clinico.pacientes;
}

async function createPaciente(payload, actor) {
  const db = await readDb();
  const paciente = buildPacientePayload(payload, actor);

  if (!paciente.nombre || !paciente.documento) {
    const error = new Error('nombre y documento son obligatorios');
    error.status = 400;
    throw error;
  }

  if (db.clinico.pacientes.some((item) => item.documento === paciente.documento)) {
    const error = new Error('Ya existe un paciente con ese documento en Nutricion');
    error.status = 409;
    throw error;
  }

  db.clinico.pacientes.push(paciente);
  await writeDb(db);
  return paciente;
}

async function getPacienteById(pacienteId) {
  const db = await readDb();
  return requirePaciente(db, pacienteId);
}

async function appendProceso(pacienteId, proceso, actor) {
  const db = await readDb();
  const paciente = requirePaciente(db, pacienteId);

  const item = {
    id: randomUUID(),
    titulo: String(proceso.titulo || '').trim(),
    detalle: String(proceso.detalle || '').trim(),
    estado: String(proceso.estado || 'pendiente').trim(),
    creadoEn: new Date().toISOString(),
    creadoPor: actor?.nombre || 'sistema',
    rol: actor?.rol || 'desconocido',
  };

  if (!item.titulo) {
    const error = new Error('titulo es obligatorio');
    error.status = 400;
    throw error;
  }

  paciente.historiaClinica.procesos.unshift(item);
  paciente.historiaClinica.actualizadoEn = new Date().toISOString();
  await writeDb(db);
  return item;
}

async function updateHistoriaClinica(pacienteId, historiaParcial) {
  const db = await readDb();
  const paciente = requirePaciente(db, pacienteId);

  paciente.historiaClinica = {
    ...paciente.historiaClinica,
    resumen: historiaParcial.resumen ?? paciente.historiaClinica.resumen,
    antecedentes: Array.isArray(historiaParcial.antecedentes)
      ? historiaParcial.antecedentes
      : paciente.historiaClinica.antecedentes,
    actualizadoEn: new Date().toISOString(),
  };

  await writeDb(db);
  return paciente.historiaClinica;
}

async function appendDieta(pacienteId, dietaPayload, actor) {
  const db = await readDb();
  const paciente = requirePaciente(db, pacienteId);

  const item = {
    id: randomUUID(),
    nombre: String(dietaPayload.nombre || '').trim(),
    tipo: String(dietaPayload.tipo || 'personalizada').trim(),
    objetivo: String(dietaPayload.objetivo || '').trim(),
    estado: String(dietaPayload.estado || 'activa').trim(),
    indicadaPor: String(dietaPayload.indicadaPor || actor?.nombre || 'sin dato').trim(),
    rolIndicador: String(actor?.rol || 'desconocido').trim(),
    creadaEn: new Date().toISOString(),
  };

  if (!item.nombre) {
    const error = new Error('nombre de dieta es obligatorio');
    error.status = 400;
    throw error;
  }

  paciente.dietas.unshift(item);
  await writeDb(db);
  return item;
}

async function appendAlergia(pacienteId, alergiaPayload, actor) {
  const db = await readDb();
  const paciente = requirePaciente(db, pacienteId);

  const item = {
    id: randomUUID(),
    sustancia: String(alergiaPayload.sustancia || '').trim(),
    gravedad: String(alergiaPayload.gravedad || 'moderada').trim(),
    notas: String(alergiaPayload.notas || '').trim(),
    registradaEn: new Date().toISOString(),
    registradaPor: actor?.nombre || 'sistema',
  };

  if (!item.sustancia) {
    const error = new Error('sustancia es obligatoria');
    error.status = 400;
    throw error;
  }

  paciente.alergias.unshift(item);
  await writeDb(db);
  return item;
}

async function appendPedidoCocina(pacienteId, pedidoPayload, actor) {
  const db = await readDb();
  const paciente = requirePaciente(db, pacienteId);

  const item = {
    id: randomUUID(),
    menu: String(pedidoPayload.menu || '').trim(),
    turno: String(pedidoPayload.turno || 'almuerzo').trim(),
    estado: String(pedidoPayload.estado || 'pendiente').trim(),
    observaciones: String(pedidoPayload.observaciones || '').trim(),
    solicitadoEn: new Date().toISOString(),
    solicitadoPor: actor?.nombre || 'sistema',
  };

  if (!item.menu) {
    const error = new Error('menu es obligatorio');
    error.status = 400;
    throw error;
  }

  paciente.cocina.pedidos.unshift(item);
  db.cocina.pedidos.unshift({
    ...item,
    pacienteId,
    pacienteNombre: paciente.nombre,
  });

  await writeDb(db);
  return item;
}

async function updateEstadoOperativo(payload, actor) {
  const db = await readDb();

  db.estadoOperativoEstandar = {
    ...db.estadoOperativoEstandar,
    modulo: String(payload.modulo || db.estadoOperativoEstandar.modulo).toUpperCase(),
    motivo: String(payload.motivo || db.estadoOperativoEstandar.motivo),
    actualizadoEn: new Date().toISOString(),
    actualizadoPor: actor?.nombre || 'sistema',
  };

  await writeDb(db);
  return db.estadoOperativoEstandar;
}

async function getMetricas() {
  const db = await readDb();
  const pacientes = db.clinico.pacientes;

  return {
    pacientesTotal: pacientes.length,
    dietasActivas: pacientes.reduce((acc, paciente) => acc + paciente.dietas.filter((d) => d.estado === 'activa').length, 0),
    alergiasCriticas: pacientes.reduce((acc, paciente) => acc + paciente.alergias.filter((a) => a.gravedad === 'critica').length, 0),
    pedidosCocinaPendientes: db.cocina.pedidos.filter((p) => p.estado === 'pendiente').length,
    estadoModulo: db.estadoOperativoEstandar.modulo,
  };
}

module.exports = {
  getDatabase,
  listPacientes,
  createPaciente,
  getPacienteById,
  appendProceso,
  updateHistoriaClinica,
  appendDieta,
  appendAlergia,
  appendPedidoCocina,
  updateEstadoOperativo,
  getMetricas,
};
