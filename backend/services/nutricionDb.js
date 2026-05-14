// Servicio de acceso a PostgreSQL para módulo de nutrición
const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../config/nutricion.pg.env') });

const pool = new Pool();

function requirePacienteRow(row) {
  if (!row) {
    const error = new Error('Paciente no encontrado');
    error.status = 404;
    throw error;
  }
  return row;
}

function mapRow(row) {
  // Convierte snake_case de postgres a camelCase para el controlador
  return {
    id: row.id,
    nombre: row.nombre,
    documento: row.documento,
    edad: row.edad,
    medicoResponsable: row.medico_responsable,
    enfermeroResponsable: row.enfermero_responsable,
    historiaClinica: row.historia_clinica,
    dietas: row.dietas,
    alergias: row.alergias,
    cocina: row.cocina,
    creadoEn: row.creado_en,
    creadoPor: row.creado_por,
  };
}

async function getDatabase() {
  const pacientes = await listPacientes();
  const { rows: dietas } = await pool.query('SELECT * FROM dietas_catalogo ORDER BY nombre');
  const { rows: alergias } = await pool.query('SELECT nombre FROM alergias_catalogo ORDER BY nombre');
  const { rows: pedidosCocina } = await pool.query('SELECT * FROM cocina_pedidos ORDER BY solicitado_en DESC');
  const { rows: estadoRows } = await pool.query('SELECT * FROM estado_operativo_estandar ORDER BY id DESC LIMIT 1');
  return {
    clinico: { pacientes },
    dietas: { catalogo: dietas },
    alergias: { catalogo: alergias.map(r => r.nombre) },
    cocina: { pedidos: pedidosCocina },
    estadoOperativoEstandar: estadoRows[0] || {},
  };
}

async function listPacientes() {
  const { rows } = await pool.query('SELECT * FROM clinico_pacientes ORDER BY creado_en DESC');
  return rows.map(mapRow);
}

async function createPaciente(payload, actor) {
  const nombre = String(payload.nombre || '').trim();
  const documento = String(payload.documento || '').trim();
  const edad = Number(payload.edad || 0);
  const medicoResponsable = String(payload.medicoResponsable || '').trim();
  const enfermeroResponsable = String(payload.enfermeroResponsable || '').trim();

  if (!nombre || !documento) {
    const error = new Error('nombre y documento son obligatorios');
    error.status = 400;
    throw error;
  }

  const { rows: existing } = await pool.query(
    'SELECT id FROM clinico_pacientes WHERE documento = $1', [documento]
  );
  if (existing.length > 0) {
    const error = new Error('Ya existe un paciente con ese documento en Nutricion');
    error.status = 409;
    throw error;
  }

  const historiaClinica = {
    resumen: String(payload.resumenClinico || ''),
    antecedentes: Array.isArray(payload.antecedentes) ? payload.antecedentes : [],
    procesos: [],
    actualizadoEn: new Date().toISOString(),
  };
  const creadoPor = { id: actor?.id || null, rol: actor?.rol || 'desconocido', nombre: actor?.nombre || 'sistema' };

  const { rows } = await pool.query(
    `INSERT INTO clinico_pacientes
      (id, nombre, documento, edad, medico_responsable, enfermero_responsable, historia_clinica, dietas, alergias, cocina, creado_por)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'[]','[]',$8,$9)
      RETURNING *`,
    [randomUUID(), nombre, documento, edad, medicoResponsable, enfermeroResponsable,
      JSON.stringify(historiaClinica), JSON.stringify({ pedidos: [], observaciones: '' }), JSON.stringify(creadoPor)]
  );
  return mapRow(rows[0]);
}

async function getPacienteById(pacienteId) {
  const { rows } = await pool.query('SELECT * FROM clinico_pacientes WHERE id = $1', [pacienteId]);
  return mapRow(requirePacienteRow(rows[0]));
}

async function updateHistoriaClinica(pacienteId, historiaParcial) {
  const { rows } = await pool.query('SELECT historia_clinica FROM clinico_pacientes WHERE id = $1', [pacienteId]);
  const current = requirePacienteRow(rows[0]).historia_clinica;

  const updated = {
    ...current,
    resumen: historiaParcial.resumen ?? current.resumen,
    antecedentes: Array.isArray(historiaParcial.antecedentes) ? historiaParcial.antecedentes : current.antecedentes,
    actualizadoEn: new Date().toISOString(),
  };

  await pool.query(
    'UPDATE clinico_pacientes SET historia_clinica = $1 WHERE id = $2',
    [JSON.stringify(updated), pacienteId]
  );
  return updated;
}

async function appendProceso(pacienteId, proceso, actor) {
  const { rows } = await pool.query('SELECT historia_clinica FROM clinico_pacientes WHERE id = $1', [pacienteId]);
  const hc = requirePacienteRow(rows[0]).historia_clinica;

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

  hc.procesos = [item, ...(hc.procesos || [])];
  hc.actualizadoEn = new Date().toISOString();

  await pool.query(
    'UPDATE clinico_pacientes SET historia_clinica = $1 WHERE id = $2',
    [JSON.stringify(hc), pacienteId]
  );
  return item;
}

async function appendDieta(pacienteId, dietaPayload, actor) {
  const { rows } = await pool.query('SELECT dietas FROM clinico_pacientes WHERE id = $1', [pacienteId]);
  requirePacienteRow(rows[0]);
  const dietas = rows[0].dietas || [];

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

  dietas.unshift(item);
  await pool.query('UPDATE clinico_pacientes SET dietas = $1 WHERE id = $2', [JSON.stringify(dietas), pacienteId]);
  return item;
}

async function appendAlergia(pacienteId, alergiaPayload, actor) {
  const { rows } = await pool.query('SELECT alergias FROM clinico_pacientes WHERE id = $1', [pacienteId]);
  requirePacienteRow(rows[0]);
  const alergias = rows[0].alergias || [];

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

  alergias.unshift(item);
  await pool.query('UPDATE clinico_pacientes SET alergias = $1 WHERE id = $2', [JSON.stringify(alergias), pacienteId]);
  return item;
}

async function appendPedidoCocina(pacienteId, pedidoPayload, actor) {
  const { rows: pRows } = await pool.query('SELECT id, nombre, cocina FROM clinico_pacientes WHERE id = $1', [pacienteId]);
  const paciente = requirePacienteRow(pRows[0]);
  const cocinaData = paciente.cocina || { pedidos: [], observaciones: '' };

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

  cocinaData.pedidos = [item, ...(cocinaData.pedidos || [])];
  await pool.query('UPDATE clinico_pacientes SET cocina = $1 WHERE id = $2', [JSON.stringify(cocinaData), pacienteId]);

  await pool.query(
    `INSERT INTO cocina_pedidos (id, paciente_id, paciente_nombre, menu, turno, estado, observaciones, solicitado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [item.id, pacienteId, paciente.nombre, item.menu, item.turno, item.estado, item.observaciones, item.solicitadoPor]
  );

  return item;
}

async function updateEstadoOperativo(payload, actor) {
  const { rows } = await pool.query('SELECT * FROM estado_operativo_estandar ORDER BY id DESC LIMIT 1');
  const current = rows[0] || {};

  const modulo = String(payload.modulo || current.modulo || 'ON').toUpperCase();
  const motivo = String(payload.motivo || current.motivo || '');
  const actualizadoEn = new Date().toISOString();
  const actualizadoPor = actor?.nombre || 'sistema';

  if (current.id) {
    await pool.query(
      'UPDATE estado_operativo_estandar SET modulo=$1, motivo=$2, actualizado_en=$3, actualizado_por=$4 WHERE id=$5',
      [modulo, motivo, actualizadoEn, actualizadoPor, current.id]
    );
  } else {
    await pool.query(
      'INSERT INTO estado_operativo_estandar (modulo, motivo, actualizado_en, actualizado_por) VALUES ($1,$2,$3,$4)',
      [modulo, motivo, actualizadoEn, actualizadoPor]
    );
  }

  return { modulo, motivo, actualizadoEn, actualizadoPor };
}

async function getMetricas() {
  const pacientes = await listPacientes();
  const { rows: pedidos } = await pool.query("SELECT estado FROM cocina_pedidos WHERE estado = 'pendiente'");
  const { rows: estadoRows } = await pool.query('SELECT modulo FROM estado_operativo_estandar ORDER BY id DESC LIMIT 1');

  return {
    pacientesTotal: pacientes.length,
    dietasActivas: pacientes.reduce((acc, p) => acc + (p.dietas || []).filter(d => d.estado === 'activa').length, 0),
    alergiasCriticas: pacientes.reduce((acc, p) => acc + (p.alergias || []).filter(a => a.gravedad === 'critica').length, 0),
    pedidosCocinaPendientes: pedidos.length,
    estadoModulo: estadoRows[0]?.modulo || 'ON',
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
