import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaComments, FaHospital, FaPaperPlane, FaTimes } from 'react-icons/fa';
import styles from './Chatbot.module.css';
import { useAuth } from '../context/AuthContext';
import { ROLE, normalizeRole } from '../utils/roles';
import { getDoctors } from '../services/appointmentService';
import { getServices } from '../services/serviceService';
import { getBookings, createBooking, deleteBooking } from '../services/bookingService';

const CONTEXTO_STORAGE_KEY = 'integrabot-context-v1';

// ============================================================
// DATOS REALES DEL SISTEMA INTEGRASALUD
// ============================================================

const MEDICOS = [
  { nombre: 'Enf. Ayelen Parada',  especialidad: 'Enfermería',            dias: 'Lun-Vie 08:00-12:00 | Sáb 09:00-12:00' },
  { nombre: 'Dra. Sofia Martinez', especialidad: 'Clínica Médica',         dias: 'Lun/Mié 09:00-13:00 | Vie 14:00-18:00' },
  { nombre: 'Dr. Mateo Ruiz',      especialidad: 'Traumatología',          dias: 'Mar/Jue 09:00-13:00 | Vie 15:00-18:00' },
  { nombre: 'Dr. Nicolas Peralta', especialidad: 'Neurología',             dias: 'Lun/Mié 14:00-18:00 | Vie 09:00-13:00' },
  { nombre: 'Dra. Valentina Gomez',especialidad: 'Pediatría',              dias: 'Mar/Jue 14:00-18:00 | Sáb 09:00-12:00' },
  { nombre: 'Dr. Bruno Herrera',   especialidad: 'Dermatología',           dias: 'Mar 10:00-14:00 | Jue 15:00-19:00' },
  { nombre: 'Dra. Julia Ferrero',  especialidad: 'Endocrinología',         dias: 'Mar/Jue 09:00-13:00 | Vie 14:00-17:00' },
  { nombre: 'Dra. Camila Suárez',  especialidad: 'Ginecología',            dias: 'Lun/Mié 14:00-18:00 | Sáb 09:00-12:00' },
  { nombre: 'Dr. Esteban Loyola',  especialidad: 'Urología',              dias: 'Mar/Jue 14:00-18:00 | Vie 09:00-12:00' },
  { nombre: 'Dr. Alan Murua',      especialidad: 'Otorrinolaringología',   dias: 'Lun/Mié 08:00-12:00 | Vie 13:00-17:00' },
];

const SERVICIOS = [
  { nombre: 'Consulta Clínica General',  duracion: '30 min', precio: '$15.000' },
  { nombre: 'Seguimiento Preventivo',    duracion: '30 min', precio: '$14.000' },
  { nombre: 'Consulta Pediátrica',       duracion: '30 min', precio: '$16.000' },
  { nombre: 'Consulta Neurológica',      duracion: '45 min', precio: '$26.000' },
  { nombre: 'Consulta Traumatológica',   duracion: '35 min', precio: '$21.000' },
];

const SERVICIO_POR_ESPECIALIDAD = {
  'Clínica Médica': 'Consulta Clínica General',
  Traumatología: 'Consulta Traumatológica',
  Neurología: 'Consulta Neurológica',
  Pediatría: 'Consulta Pediátrica',
  Dermatología: 'Seguimiento Preventivo',
  Endocrinología: 'Seguimiento Preventivo',
  Ginecología: 'Seguimiento Preventivo',
  Urología: 'Seguimiento Preventivo',
  Otorrinolaringología: 'Seguimiento Preventivo',
  Enfermería: 'Seguimiento Preventivo',
};

const MEDICO_KEYWORDS = {
  'sofia martinez': ['sofia', 'martinez', 'sofia martinez', 'dra sofia', 'dra. sofia'],
  'mateo ruiz': ['mateo', 'ruiz', 'mateo ruiz', 'dr mateo', 'dr. mateo'],
  'nicolas peralta': ['nicolas', 'peralta', 'nicolas peralta', 'dr nicolas', 'dr. nicolas'],
  'valentina gomez': ['valentina', 'gomez', 'valentina gomez', 'dra valentina', 'dra. valentina'],
  'bruno herrera': ['bruno', 'herrera', 'bruno herrera', 'dr bruno', 'dr. bruno'],
  'julia ferrero': ['julia', 'ferrero', 'julia ferrero', 'dra julia', 'dra. julia'],
  'camila suarez': ['camila', 'suarez', 'camila suarez', 'dra camila', 'dra. camila'],
  'esteban loyola': ['esteban', 'loyola', 'esteban loyola', 'dr esteban', 'dr. esteban'],
  'alan murua': ['alan', 'murua', 'alan murua', 'dr alan', 'dr. alan'],
  'ayelen parada': ['ayelen', 'parada', 'ayelen parada', 'enf ayelen', 'enf. ayelen'],
};

// ============================================================
// LÓGICA DE RESPUESTAS
// ============================================================

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getDoctorKey(nombre = '') {
  return normalizar(nombre)
    .replace(/^dr\.?\s+|^dra\.?\s+|^enf\.?\s+/, '')
    .trim();
}

function encontrarMedicoPorConsulta(msgNormalizado = '') {
  for (const medico of MEDICOS) {
    const key = getDoctorKey(medico.nombre);
    const aliases = MEDICO_KEYWORDS[key] || [key];
    if (aliases.some((alias) => msgNormalizado.includes(alias))) {
      return medico;
    }
  }

  const especialidadMatch = MEDICOS.find((medico) => {
    const esp = normalizar(medico.especialidad);
    return msgNormalizado.includes(esp);
  });

  return especialidadMatch || null;
}

function buscarServicioPorEspecialidad(especialidad = '') {
  const nombreServicio = SERVICIO_POR_ESPECIALIDAD[especialidad] || 'Seguimiento Preventivo';
  return SERVICIOS.find((servicio) => servicio.nombre === nombreServicio) || SERVICIOS[1];
}

function esAfirmacion(msgNormalizado = '') {
  const limpio = msgNormalizado.trim().replace(/[!?.,;:]+$/g, '');
  return /^(si|sí|sipi|dale|ok|okay|de acuerdo|perfecto|genial|bueno|claro)$/.test(limpio);
}

function esNegacion(msgNormalizado = '') {
  const limpio = msgNormalizado.trim().replace(/[!?.,;:]+$/g, '');
  return /^(no|nop|ahora no|despues|después|negativo)$/.test(limpio);
}

function detectarRecomendacionPorSintomas(msgNormalizado = '') {
  if (/\b(dolor en el pecho|pecho|falta de aire|dificultad para respirar|desmayo|convulsion|convulsiones|acv|sangrado abundante|hemorragia)\b/.test(msgNormalizado)) {
    return {
      nivel: 'rojo',
      medico: null,
      motivo: 'porque hay signos de alarma que pueden indicar una urgencia tiempo-dependiente.',
      accion: 'Llamá al 107 o 911 y acudí a guardia de inmediato.',
    };
  }

  const reglas = [
    {
      keywords: ['dolor de cabeza', 'migra', 'mareo', 'vertigo', 'hormigueo', 'memoria'],
      medico: 'Dr. Nicolas Peralta',
      motivo: 'porque esos síntomas suelen requerir una evaluación del sistema nervioso central y periférico.',
      nivel: 'amarillo',
    },
    {
      keywords: ['mancha en piel', 'picazon', 'acne', 'erupcion', 'dermatitis', 'lunar'],
      medico: 'Dr. Bruno Herrera',
      motivo: 'porque la valoración de piel, lesiones y cambios cutáneos corresponde a Dermatología.',
      nivel: 'verde',
    },
    {
      keywords: ['dolor de rodilla', 'esguince', 'fractura', 'golpe', 'hueso', 'articulacion'],
      medico: 'Dr. Mateo Ruiz',
      motivo: 'porque lesiones osteomusculares y articulares se atienden mejor en Traumatología.',
      nivel: 'amarillo',
    },
    {
      keywords: ['dolor abdominal en nino', 'niño', 'nina', 'pediatrico', 'pediatrica', 'fiebre en nino'],
      medico: 'Dra. Valentina Gomez',
      motivo: 'porque cuando se trata de menores, la evaluación pediátrica es la vía correcta.',
      nivel: 'amarillo',
    },
    {
      keywords: ['control general', 'chequeo', 'control clinico', 'presion alta', 'hipertension'],
      medico: 'Dra. Sofia Martinez',
      motivo: 'porque Clínica Médica es el punto de entrada ideal para control integral de salud.',
      nivel: 'verde',
    },
  ];

  const encontrada = reglas.find((regla) => regla.keywords.some((k) => msgNormalizado.includes(k)));
  if (!encontrada) return null;

  const medico = MEDICOS.find((m) => m.nombre === encontrada.medico);
  if (!medico) return null;

  return {
    nivel: encontrada.nivel || 'amarillo',
    medico,
    motivo: encontrada.motivo,
    accion: encontrada.nivel === 'verde'
      ? 'Podés solicitar turno programado según disponibilidad.'
      : 'Se recomienda solicitar turno prioritario en las próximas 24-72 h según evolución.',
  };
}

function evaluarCriticidadSoporte(msgNormalizado = '') {
  if (/\b(caido|caida total|no funciona nada|urgente|critico|crítico|sin acceso|no puedo atender|guardia)\b/.test(msgNormalizado)) {
    return { nivel: 'Critica', color: '🔴', eta: 'Atencion inmediata', impacto: 'Operacion clinica comprometida' };
  }

  if (/\b(bloquea|error al guardar|no puedo crear|no puedo emitir|no aparece|fallando)\b/.test(msgNormalizado)) {
    return { nivel: 'Alta', color: '🟠', eta: 'Dentro del dia', impacto: 'Bloqueo parcial de operacion' };
  }

  if (/\b(lento|demora|inconsistencia|desfase|intermitente|consulta)\b/.test(msgNormalizado)) {
    return { nivel: 'Media', color: '🟡', eta: '24-48 h', impacto: 'Operacion con workaround' };
  }

  return { nivel: 'Baja', color: '🟢', eta: 'Proxima ventana', impacto: 'Mejora o duda funcional' };
}

function construirPlantillaTicket(msgOriginal = '', contextoActual = {}, criticidad = null) {
  const c = criticidad || { nivel: 'Media', color: '🟡', eta: '24-48 h', impacto: 'Operacion con workaround' };
  const rol = contextoActual.usuarioTipo === 'paciente'
    ? 'Paciente'
    : (contextoActual.perfilTecnico ? `Staff (${contextoActual.perfilTecnico})` : 'General');

  return `🧾 <strong>Plantilla de ticket lista para enviar</strong><br><br>
<strong>Prioridad sugerida:</strong> ${c.color} ${c.nivel}<br>
<strong>ETA estimada:</strong> ${c.eta}<br>
<strong>Impacto:</strong> ${c.impacto}<br><br>
<strong>Copiá y completá este formato:</strong><br>
• Rol: ${rol}<br>
• Módulo afectado: [Turnos | HC | Recetas | Chat | Pagos | Acceso]<br>
• Problema: ${escapeHtml(msgOriginal) || '[describir problema]'}<br>
• Desde cuándo ocurre: [hora/fecha]<br>
• Pasos para reproducir: [1..n]<br>
• Evidencia: [captura/video]<br>
• Usuario/correo afectado: [dato]<br><br>
Enviarlo a <strong>soporte@integrasalud.com</strong>.`;
}

function detectarIntencionAproximada(msgNormalizado = '') {
  const reglas = [
    { key: 'turnos', test: /\b(turn|cita|agenda)\b/ },
    { key: 'horarios', test: /\b(horar|atiend|disponib|dia)\b/ },
    { key: 'especialidades', test: /\b(especial|area|servic)\b/ },
    { key: 'medicos', test: /\b(medic|doctor|profesional)\b/ },
    { key: 'soporte', test: /\b(soport|ticket|inciden|error)\b/ },
    { key: 'contacto', test: /\b(contact|telefono|correo|mail)\b/ },
    { key: 'precios', test: /\b(preci|costo|arancel|valor)\b/ },
    { key: 'emergencia', test: /\b(urgen|emergen|911|107)\b/ },
  ];

  const regla = reglas.find((r) => r.test.test(msgNormalizado));
  return regla ? regla.key : null;
}

function inferirServicioPorEspecialidad(doctor, services = []) {
  const especialidad = normalizar(doctor?.especialidad || '');
  const reglas = [
    { key: 'neurolog', servicio: 'neurolog' },
    { key: 'traumatolog', servicio: 'traumatolog' },
    { key: 'pediatr', servicio: 'pediatr' },
    { key: 'clinica medica', servicio: 'clinica general' },
  ];

  const regla = reglas.find((r) => especialidad.includes(r.key));
  if (regla) {
    const match = services.find((s) => normalizar(s.nombre || '').includes(regla.servicio));
    if (match) return match;
  }

  return services.find((s) => normalizar(s.nombre || '').includes('seguimiento')) || services[0] || null;
}

function extraerDatosReserva(mensajeOriginal = '', runtimeData = {}) {
  const normalized = normalizar(mensajeOriginal);
  const isIntent = /\b(crear|agendar|reservar|sacar|nuevo)\b/.test(normalized) && /\b(turno|cita|reserva)\b/.test(normalized);
  if (!isIntent) return null;

  const doctors = runtimeData.doctors || [];
  const services = runtimeData.services || [];

  const fechaMatch = mensajeOriginal.match(/\b\d{4}-\d{2}-\d{2}\b/);
  const horaMatch = mensajeOriginal.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);

  const doctor = doctors.find((d) => {
    const n = normalizar(`${d.nombre || d.name || ''} ${d.especialidad || d.specialty || ''}`);
    return n.split(' ').some((token) => token.length > 3 && normalized.includes(token));
  }) || null;

  let service = services.find((s) => {
    const n = normalizar(s.nombre || '');
    return n.split(' ').some((token) => token.length > 4 && normalized.includes(token));
  }) || null;

  if (!service && doctor) {
    service = inferirServicioPorEspecialidad(doctor, services);
  }

  const missing = [];
  if (!service) missing.push('servicio');
  if (!doctor) missing.push('medico');
  if (!fechaMatch) missing.push('fecha(YYYY-MM-DD)');
  if (!horaMatch) missing.push('hora(HH:mm)');

  return {
    isIntent,
    service,
    doctor,
    fecha: fechaMatch ? fechaMatch[0] : null,
    hora: horaMatch ? `${horaMatch[1].padStart(2, '0')}:${horaMatch[2]}` : null,
    missing,
  };
}

function obtenerTurnoCancelable(bookings = []) {
  const activos = ['pendiente', 'confirmada', 'reprogramada'];
  const list = (bookings || []).filter((b) => activos.includes((b.estado || '').toLowerCase()));
  if (list.length === 0) return null;

  return list
    .map((b) => ({ ...b, fechaHora: new Date(`${new Date(b.fecha).toISOString().slice(0, 10)}T${b.hora || '00:00'}:00`) }))
    .sort((a, b) => a.fechaHora - b.fechaHora)[0];
}

function seleccionarPorNumeroOTexto(input = '', options = [], labelFn = (o) => String(o || '')) {
  const clean = input.trim();
  const byNumber = clean.match(/^\d+$/);
  if (byNumber) {
    const index = Number(byNumber[0]) - 1;
    if (index >= 0 && index < options.length) return options[index];
  }

  const nInput = normalizar(clean);
  return options.find((opt) => normalizar(labelFn(opt)).includes(nInput)) || null;
}

function filtrarDoctoresPorServicio(service, doctors = []) {
  const serviceName = normalizar(service?.nombre || '');
  const rules = [
    { key: 'neurolog', esp: 'neurolog' },
    { key: 'traumatolog', esp: 'traumatolog' },
    { key: 'pediatr', esp: 'pediatr' },
    { key: 'clinica', esp: 'clinica medica' },
  ];

  const rule = rules.find((r) => serviceName.includes(r.key));
  if (!rule) return doctors;

  const filtered = doctors.filter((d) => normalizar(d.especialidad || d.specialty || '').includes(rule.esp));
  return filtered.length > 0 ? filtered : doctors;
}

function formatearHorarios(horarios = []) {
  if (!Array.isArray(horarios) || horarios.length === 0) return 'Horarios a confirmar';
  return horarios
    .slice(0, 3)
    .map((h) => `${h.dia || 'Dia'} ${h.horaInicio || '--:--'}-${h.horaFin || '--:--'}`)
    .join(' | ');
}

function respuestaMedicosDinamica(doctors = []) {
  const items = doctors
    .slice(0, 10)
    .map((d) => `• <strong>${d.nombre || d.name || 'Profesional'}</strong> — ${d.especialidad || d.specialty || 'Especialidad a confirmar'}<br>&nbsp;&nbsp;📅 ${formatearHorarios(d.horariosAtencion)}`)
    .join('<br>');

  return `👨‍⚕️ <strong>Equipo profesional (datos en tiempo real):</strong><br><br>${items}<br><br>Si querés, te doy el detalle de un profesional específico.`;
}

function respuestaServiciosDinamica(services = []) {
  const items = services
    .slice(0, 10)
    .map((s) => `• <strong>${s.nombre || 'Servicio'}</strong> — ${s.duracion || 30} min${s.precio ? ` | $${Number(s.precio).toLocaleString('es-AR')}` : ''}`)
    .join('<br>');

  return `🏥 <strong>Servicios activos (datos en tiempo real):</strong><br><br>${items}`;
}

function respuestaHorariosDinamica(doctors = []) {
  const items = doctors
    .filter((d) => (d.horariosAtencion || []).length > 0)
    .slice(0, 10)
    .map((d) => `• <strong>${d.especialidad || d.specialty || 'Especialidad'}:</strong> ${formatearHorarios(d.horariosAtencion)}`)
    .join('<br>');

  return `⏰ <strong>Horarios de atención (datos en tiempo real):</strong><br><br>${items || 'No hay horarios cargados en este momento.'}`;
}

function respuestaTurnosPacienteDinamica(bookings = []) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return '📋 No encontré turnos recientes en tu cuenta. Si querés, te ayudo a sacar uno nuevo.';
  }

  const items = bookings
    .slice(0, 5)
    .map((b) => `• <strong>${b.servicio?.nombre || 'Servicio'}</strong> con ${b.medico?.nombre || 'Profesional'}<br>&nbsp;&nbsp;📅 ${new Date(b.fecha).toLocaleDateString('es-AR')} ${b.hora || ''} | Estado: ${b.estado || 'pendiente'}`)
    .join('<br>');

  return `📅 <strong>Tus turnos recientes (datos en tiempo real):</strong><br><br>${items}`;
}

function detectarPerfilTecnico(msgNormalizado = '') {
  if (/\b(soy medico|soy médica|soy medica|como medico|como médica|como medica|profesional de salud|equipo medico|equipo clínico|equipo clinico)\b/.test(msgNormalizado)) {
    return 'medico';
  }

  if (/\b(soy enfermero|soy enfermera|equipo de enfermeria|enfermeria)\b/.test(msgNormalizado)) {
    return 'enfermeria';
  }

  if (/\b(soy secretaria|secretaria del centro|recepcion)\b/.test(msgNormalizado)) {
    return 'secretaria';
  }

  if (/\b(soy admin|soy administrador|superadmin|administracion)\b/.test(msgNormalizado)) {
    return 'admin';
  }

  return null;
}

function detectarComandoModo(msgNormalizado = '') {
  const limpio = msgNormalizado.trim();

  if (/^(modo medico|modo médica|modo medica)$/.test(limpio)) return 'medico';
  if (/^(modo enfermeria|modo enfermería)$/.test(limpio)) return 'enfermeria';
  if (/^(modo secretaria|modo secretaría)$/.test(limpio)) return 'secretaria';
  if (/^(modo admin|modo administrador|modo superadmin)$/.test(limpio)) return 'admin';
  if (/^(salir modo tecnico|salir modo técnico|desactivar modo tecnico|desactivar modo técnico|modo normal)$/.test(limpio)) return 'off';

  return null;
}

function detectarPerfilPaciente(msgNormalizado = '') {
  return /\b(soy paciente|como paciente|paciente|mi turno|mis turnos|mi receta|mi historia clinica|mi historia clínica)\b/.test(msgNormalizado);
}

function esConsultaTecnica(msgNormalizado = '') {
  return /\b(protocolo|algoritmo|triage|criterio clinico|diferencial|interaccion|contraindicacion|farmacovigilancia|evolucion|soap|cie10|cie-10|parametro|parametros|escalamiento|priorizacion|incidencia critica|auditoria)\b/.test(msgNormalizado);
}

function detectarModulo(msgNormalizado = '') {
  if (/\b(historia clinica|historial|evolucion|soap|cie10|cie-10|diagnostico)\b/.test(msgNormalizado)) return 'hc';
  if (/\b(receta|recetas|medicacion|prescripcion|farmaco|dosis)\b/.test(msgNormalizado)) return 'recetas';
  if (/\b(turno|turnos|agenda|agendar|reservar|cita)\b/.test(msgNormalizado)) return 'turnos';
  if (/\b(chat|mensaje|mensajeria|mensajería|comunicacion interna|comunicación interna)\b/.test(msgNormalizado)) return 'chat';
  if (/\b(pago|pagos|facturacion|facturación|arancel|cobro)\b/.test(msgNormalizado)) return 'pagos';
  if (/\b(soporte|ticket|incidencia|error)\b/.test(msgNormalizado)) return 'soporte';
  return null;
}

function respuestaTecnicaPorRolYModulo(perfil = 'medico', modulo = null) {
  const respuestas = {
    medico: {
  hc: `🧾 <strong>Guía técnica HC (Médico)</strong><br><br>
• Registrar motivo de consulta, hallazgos objetivos y plan terapéutico.<br>
• Estructura recomendada: <strong>SOAP</strong> (Subjetivo, Objetivo, Análisis, Plan).<br>
• Incluir signos de alarma y criterios de reconsulta.<br>
• Mantener coherencia entre evolución, diagnóstico y receta emitida.`,
  recetas: `💊 <strong>Guía técnica Recetas (Médico)</strong><br><br>
• Validar dosis, frecuencia, vía y duración antes de confirmar.<br>
• Documentar indicación clínica asociada en HC.<br>
• Revisar posibles interacciones y contraindicaciones.<br>
• Indicar controles de seguimiento cuando aplique.`,
  turnos: `📅 <strong>Gestión técnica de turnos (Médico)</strong><br><br>
• Priorizar por riesgo clínico y ventana terapéutica.<br>
• Reservar mayor duración para casos complejos.<br>
• Reducir reprogramaciones documentando motivo asistencial.<br>
• Coordinar seguimiento preventivo en patologías crónicas.`,
  chat: `💬 <strong>Uso clínico del chat (Médico)</strong><br><br>
• Utilizar para seguimiento no urgente y educación al paciente.<br>
• Evitar órdenes ambiguas; dejar indicaciones concretas y medibles.<br>
• Si hay riesgo agudo, derivar a guardia (107/911) y dejar constancia.<br>
• Registrar decisiones clínicas relevantes también en HC.`,
  pagos: `💳 <strong>Contexto de pagos para médico</strong><br><br>
• Verificar que el servicio registrado coincida con la práctica realizada.<br>
• Si hay discrepancia, escalar a secretaría/admin con trazabilidad del caso.<br>
• Evitar cerrar circuito asistencial sin consistencia administrativa.`,
  soporte: `🛠️ <strong>Escalamiento técnico (Médico)</strong><br><br>
Al reportar incidente, incluir:<br>
1) módulo afectado, 2) paciente/caso (sin datos sensibles en texto libre),<br>
3) pasos de reproducción, 4) criticidad clínica, 5) evidencia.`
    },
    enfermeria: {
  hc: `🩺 <strong>Guía HC (Enfermería)</strong><br><br>
• Registrar controles, procedimientos y respuesta del paciente.<br>
• Reportar desviaciones de parámetros y alertas clínicas.<br>
• Mantener continuidad entre turnos y equipo tratante.`,
  recetas: `💊 <strong>Soporte de medicación (Enfermería)</strong><br><br>
• Validar 5 correctos: paciente, fármaco, dosis, vía, horario.<br>
• Notificar eventos adversos y registrar en evolución.<br>
• Escalar dudas farmacológicas al médico tratante.`,
  turnos: `📅 <strong>Agenda asistencial (Enfermería)</strong><br><br>
• Priorizar controles según riesgo y adherencia.<br>
• Coordinar educación sanitaria y seguimiento.`,
  chat: `💬 <strong>Chat asistencial (Enfermería)</strong><br><br>
• Mensajes claros, operativos y con foco en continuidad de cuidados.<br>
• Derivar urgencias por canal de emergencia y registrar evento.`,
  pagos: `💳 <strong>Pagos (Enfermería)</strong><br><br>
• Informar inconsistencias al equipo administrativo con datos del turno.`,
  soporte: `🛠️ <strong>Escalamiento (Enfermería)</strong><br><br>
• Reportar módulo, impacto en cuidado y urgencia asistencial.`
    },
    secretaria: {
  turnos: `📅 <strong>Operación de agenda (Secretaría)</strong><br><br>
• Confirmar profesional, servicio y duración antes de cerrar turno.<br>
• Minimizar solapamientos y registrar motivo de reprogramación.<br>
• Escalar bloqueos de agenda a administración con evidencia.`,
  pagos: `💳 <strong>Facturación operativa (Secretaría)</strong><br><br>
• Validar servicio/arancel y estado de cobro por turno.<br>
• Registrar ajustes con trazabilidad administrativa.`,
  soporte: `🛠️ <strong>Soporte administrativo (Secretaría)</strong><br><br>
• Abrir ticket con usuario, módulo, error, hora y captura.<br>
• Marcar prioridad según impacto operativo.`,
  hc: `📋 <strong>HC (Secretaría)</strong><br><br>
• Acceso de consulta según permisos; no modificar contenido clínico.`,
  recetas: `📋 <strong>Recetas (Secretaría)</strong><br><br>
• Verificar disponibilidad y derivar correcciones al profesional.`,
  chat: `💬 <strong>Chat (Secretaría)</strong><br><br>
• Facilitar comunicación operativa y derivación de casos.`
    },
    admin: {
  soporte: `⚙️ <strong>Gestión de incidencias (Admin)</strong><br><br>
• Clasificar por criticidad (clínica/operativa).<br>
• Asignar responsable y ETA de resolución.<br>
• Cerrar con análisis causa raíz y prevención.`,
  turnos: `📅 <strong>Gobierno de agenda (Admin)</strong><br><br>
• Auditar disponibilidad, tasas de no-show y tiempos de espera.<br>
• Optimizar distribución por especialidad y demanda.`,
  pagos: `💳 <strong>Control de pagos (Admin)</strong><br><br>
• Auditar consistencia entre servicio, arancel y cobro.<br>
• Trazar desvíos y definir acciones correctivas.`,
  hc: `🧾 <strong>Auditoría HC (Admin)</strong><br><br>
• Verificar completitud documental y cumplimiento de políticas.<br>
• Garantizar trazabilidad y cumplimiento normativo.`,
  recetas: `💊 <strong>Auditoría de recetas (Admin)</strong><br><br>
• Revisar consistencia documental y flujos de validación.`,
  chat: `💬 <strong>Gobernanza de chat (Admin)</strong><br><br>
• Asegurar uso adecuado y escalamiento de incidentes.`
    }
  };

  const perfilData = respuestas[perfil] || respuestas.medico;
  return perfilData[modulo] || `🧠 <strong>Soporte técnico avanzado (${perfil})</strong><br><br>
Indicame módulo (HC, Recetas, Turnos, Chat, Pagos o Soporte) y te doy un protocolo operativo específico.`;
}

function cargarContextoInicial() {
  try {
    const raw = localStorage.getItem(CONTEXTO_STORAGE_KEY);
    if (!raw) return { medicoActual: null, pendingAction: null, perfilTecnico: null, usuarioTipo: null };
    const data = JSON.parse(raw);
    return {
  medicoActual: null,
  pendingAction: null,
  perfilTecnico: data?.perfilTecnico || null,
      usuarioTipo: data?.usuarioTipo || null,
    };
  } catch (_) {
    return { medicoActual: null, pendingAction: null, perfilTecnico: null, usuarioTipo: null };
  }
}

function persistirContexto(contexto = {}) {
  try {
    localStorage.setItem(CONTEXTO_STORAGE_KEY, JSON.stringify({
  perfilTecnico: contexto.perfilTecnico || null,
      usuarioTipo: contexto.usuarioTipo || null,
    }));
  } catch (_) {
    // ignore persistence failures
  }
}

function respuestaMedicoUnitaria(medico) {
  return `👨‍⚕️ <strong>${medico.nombre}</strong><br><br>
<strong>Especialidad:</strong> ${medico.especialidad}<br>
<strong>Horarios:</strong> ${medico.dias}<br><br>
Si querés, también te puedo indicar el servicio asociado o cómo sacar turno con este profesional.`;
}

function respuestaMedicoContextual(medico, msgNormalizado) {
  const servicio = buscarServicioPorEspecialidad(medico.especialidad);

  if (/\b(horario|horarios|atiende|dias|cuando)\b/.test(msgNormalizado)) {
    return `⏰ <strong>Horario de ${medico.nombre}:</strong><br><br>${medico.dias}`;
  }

  if (/\b(especialidad|especialista|area)\b/.test(msgNormalizado)) {
    return `🩺 <strong>Especialidad de ${medico.nombre}:</strong><br><br>${medico.especialidad}`;
  }

  if (/\b(servicio|consulta|precio|costo|arancel)\b/.test(msgNormalizado)) {
    return `🧾 <strong>Servicio recomendado para ${medico.nombre}:</strong><br><br>
<strong>${servicio.nombre}</strong><br>
Duración: ${servicio.duracion}<br>
Arancel: ${servicio.precio}`;
  }

  if (/\b(turno|agendar|reservar|sacar turno|cita)\b/.test(msgNormalizado)) {
    return `📅 Para sacar turno con <strong>${medico.nombre}</strong>:<br><br>
1. Iniciá sesión en IntegraSalud<br>
2. Entrá a <strong>"Mis Turnos"</strong><br>
3. Elegí <strong>${servicio.nombre}</strong><br>
4. Seleccioná al profesional y un horario disponible<br>
5. Confirmá la reserva`;
  }

  return respuestaMedicoUnitaria(medico);
}

function procesarMensaje(msg, contextoActual = {}, runtimeData = null) {
  const m = normalizar(msg);
  const intencionAproximada = detectarIntencionAproximada(m);
  const doctorsRt = runtimeData?.doctors || [];
  const servicesRt = runtimeData?.services || [];
  const bookingsRt = runtimeData?.bookings || [];

  if (detectarPerfilPaciente(m)) {
    return {
      text: 'Perfecto. Como paciente, mantengo el <strong>modo general</strong> para darte respuestas claras de turnos, recetas, historia clínica y soporte.',
      nextContext: { ...contextoActual, usuarioTipo: 'paciente', perfilTecnico: null },
    };
  }

  const comandoModo = detectarComandoModo(m);
  if (comandoModo === 'off') {
    return {
      text: 'Listo, desactivé el modo técnico. Ahora respondo en modo general para pacientes y público general.',
      nextContext: { ...contextoActual, perfilTecnico: null },
    };
  }

  if (comandoModo) {
    if (contextoActual.usuarioTipo === 'paciente') {
      return {
        text: 'Para cuentas de paciente el chatbot opera siempre en <strong>modo general</strong>. Si necesitás ayuda, te asisto en turnos, recetas, historia clínica, pagos y soporte.',
        nextContext: { ...contextoActual, perfilTecnico: null },
      };
    }

    return {
      text: `Listo, activé <strong>${comandoModo}</strong>. ${mostrarAyudaTecnica(comandoModo)}`,
      nextContext: { ...contextoActual, perfilTecnico: comandoModo, usuarioTipo: 'staff' },
    };
  }

  const perfilDetectado = detectarPerfilTecnico(m);
  if (perfilDetectado) {
    if (contextoActual.usuarioTipo === 'paciente') {
      return {
        text: 'Detecté una consulta técnica, pero en perfil de paciente mantengo el <strong>modo general</strong>. Si necesitás, puedo escalar tu caso por soporte.',
        nextContext: { ...contextoActual, perfilTecnico: null },
      };
    }

    return {
      text: `Perfecto, activo modo de asistencia técnica para <strong>${perfilDetectado}</strong>.<br><br>${mostrarAyudaTecnica(perfilDetectado)}`,
      nextContext: { ...contextoActual, perfilTecnico: perfilDetectado, usuarioTipo: 'staff' },
    };
  }

  if (esAfirmacion(m) && contextoActual.pendingAction?.type === 'doctor_offer' && contextoActual.medicoActual) {
    const medico = contextoActual.medicoActual;
    const servicio = buscarServicioPorEspecialidad(medico.especialidad);
    return {
      text: `Perfecto. Te amplío sobre <strong>${medico.nombre}</strong>:<br><br>
<strong>Servicio asociado:</strong> ${servicio.nombre}<br>
<strong>Duración:</strong> ${servicio.duracion}<br>
<strong>Arancel:</strong> ${servicio.precio}<br><br>
<strong>Cómo sacar turno:</strong><br>
1. Iniciá sesión<br>
2. Ir a "Mis Turnos"<br>
3. Elegí ${servicio.nombre}<br>
4. Seleccioná ${medico.nombre} y horario<br>
5. Confirmá`,
      nextContext: { ...contextoActual, pendingAction: null },
    };
  }

  if (esAfirmacion(m) && contextoActual.pendingAction?.type === 'support_ticket') {
    return {
      text: `Perfecto. Para acelerar la resolución, enviá el ticket con estos campos completos:<br><br>
1. Rol y correo del usuario afectado<br>
2. Módulo impactado<br>
3. Pasos exactos para reproducir<br>
4. Hora/fecha del incidente<br>
5. Evidencia (captura/video)<br><br>
Destino: <strong>soporte@integrasalud.com</strong>.<br>
Si querés, te ayudo a redactarlo en 1 mensaje final listo para copiar.`,
      nextContext: { ...contextoActual, pendingAction: null },
    };
  }

  if (esNegacion(m) && contextoActual.pendingAction) {
    return {
      text: 'Perfecto, no hay problema. Si querés luego te puedo ayudar con otra especialidad, médico o turno.',
      nextContext: { ...contextoActual, pendingAction: null },
    };
  }

  if (contextoActual.usuarioTipo === 'paciente' && /\b(mis turnos|mi turno|mis reservas|proximo turno|próximo turno)\b/.test(m)) {
    return {
      text: bookingsRt.length > 0 ? respuestaTurnosPacienteDinamica(bookingsRt) : mostrarTurnos(),
      nextContext: contextoActual,
    };
  }

  if (esAfirmacion(m) && !contextoActual.pendingAction) {
    return {
      text: 'Perfecto. Decime puntualmente qué necesitás: <strong>turnos</strong>, <strong>horarios</strong>, <strong>médicos</strong>, <strong>recetas</strong>, <strong>soporte</strong> o <strong>emergencia</strong>.',
      nextContext: contextoActual,
    };
  }

  if (/\b(soporte|mesa de ayuda|ticket|incidencia|error del sistema|no puedo ingresar|no puedo entrar)\b/.test(m)) {
    const criticidad = evaluarCriticidadSoporte(m);
    return {
      text: `${mostrarSoporteOperativo()}<br><br>${construirPlantillaTicket(msg, contextoActual, criticidad)}`,
      nextContext: { ...contextoActual, pendingAction: { type: 'support_ticket' } },
    };
  }

  const modulo = detectarModulo(m);
  if (contextoActual.perfilTecnico && contextoActual.usuarioTipo !== 'paciente' && modulo) {
    return {
      text: respuestaTecnicaPorRolYModulo(contextoActual.perfilTecnico, modulo),
      nextContext: contextoActual,
    };
  }

  if (/\b(medico|medicos|doctor|doctores|profesional|equipo medico|quien atiende)\b/.test(m) && doctorsRt.length > 0) {
    return { text: respuestaMedicosDinamica(doctorsRt), nextContext: contextoActual };
  }

  if (/\b(especialidad|especialidades|servicio|servicios|area|areas)\b/.test(m) && servicesRt.length > 0) {
    return { text: respuestaServiciosDinamica(servicesRt), nextContext: contextoActual };
  }

  if (/\b(horario|horarios|atencion|cuando atiende|disponible|dias de)\b/.test(m) && doctorsRt.length > 0) {
    return { text: respuestaHorariosDinamica(doctorsRt), nextContext: contextoActual };
  }

  if (/\b(precio|precios|costo|cuanto cuesta|valor|tarifa|arancel)\b/.test(m) && servicesRt.length > 0) {
    return { text: respuestaServiciosDinamica(servicesRt), nextContext: contextoActual };
  }

  const triage = detectarRecomendacionPorSintomas(m);
  if (triage && /\b(recom|que medico|que especialidad|dolor|sintoma|tengo|siento)\b/.test(m)) {
    if (triage.nivel === 'rojo') {
      return {
        text: `🚨 <strong>Triage: ROJO (urgente)</strong><br><br>
${triage.motivo}<br>
<strong>Acción inmediata:</strong> ${triage.accion}<br><br>
Si estás con un paciente en este estado, no esperes turno programado.`,
        nextContext: { ...contextoActual, pendingAction: null },
      };
    }

    const semaforo = triage.nivel === 'verde' ? '🟢' : '🟡';
    const servicio = buscarServicioPorEspecialidad(triage.medico.especialidad);
    return {
      text: `${semaforo} <strong>Triage: ${triage.nivel.toUpperCase()}</strong><br><br>
🩺 Por lo que comentás, te recomiendo a <strong>${triage.medico.nombre}</strong> (${triage.medico.especialidad}), ${triage.motivo}<br><br>
<strong>Horario:</strong> ${triage.medico.dias}<br>
<strong>Servicio sugerido:</strong> ${servicio.nombre}<br><br>
<strong>Sugerencia de acción:</strong> ${triage.accion}<br><br>
Si querés, te indico paso a paso cómo sacar ese turno ahora mismo.`,
      nextContext: {
        ...contextoActual,
        medicoActual: triage.medico,
        pendingAction: { type: 'doctor_offer' },
      },
    };
  }

  const medicoDetectado = encontrarMedicoPorConsulta(m);

  if (medicoDetectado) {
    const texto = respuestaMedicoContextual(medicoDetectado, m);
    const requiereOferta = !/\b(horario|horarios|atiende|dias|cuando|especialidad|especialista|area|servicio|consulta|precio|costo|arancel|turno|agendar|reservar|cita)\b/.test(m);
    return {
      text: texto,
      nextContext: {
        ...contextoActual,
        medicoActual: medicoDetectado,
        pendingAction: requiereOferta ? { type: 'doctor_offer' } : null,
      },
    };
  }

  if (
    contextoActual.medicoActual
    && /\b(ese|esa|el|ella|su|suyo|suya|doctor|doctora|medico|medica)\b/.test(m)
  ) {
    return {
      text: `Entiendo que te referís a <strong>${contextoActual.medicoActual.nombre}</strong>.<br><br>${respuestaMedicoContextual(contextoActual.medicoActual, m)}`,
      nextContext: contextoActual,
    };
  }

  if (
    contextoActual.medicoActual
    && (/\b(horario|horarios|especialidad|turno|atiende|dias)\b/.test(m) || /\?$/.test(msg.trim()))
  ) {
    return {
      text: `Tomando como referencia tu consulta anterior sobre <strong>${contextoActual.medicoActual.nombre}</strong>, esta es la información:<br><br>${respuestaMedicoContextual(contextoActual.medicoActual, m)}`,
      nextContext: contextoActual,
    };
  }

  if (/\b(hola|buenas|buen dia|buenos dias|saludos|hey|ola)\b/.test(m))
    return { text: saludar(), nextContext: contextoActual };

  if (/\b(turno|turnos|agendar|reservar|cita|sacar turno|pedir turno)\b/.test(m))
    return { text: mostrarTurnos(), nextContext: contextoActual };

  if (/\b(horario|horarios|atencion|cuando atiende|disponible|dias de)\b/.test(m))
    return { text: mostrarHorarios(), nextContext: contextoActual };

  if (/\b(especialidad|especialidades|servicio|servicios|area|areas)\b/.test(m))
    return { text: mostrarEspecialidades(), nextContext: contextoActual };

  if (/\b(medico|medicos|doctor|doctores|profesional|equipo medico|quien atiende)\b/.test(m))
    return { text: mostrarMedicos(), nextContext: contextoActual };

  if (/\b(emergencia|urgencia|urgente|accidente|911|107|llamar)\b/.test(m))
    return { text: mostrarEmergencias(), nextContext: contextoActual };

  if (/\b(precio|precios|costo|cuanto cuesta|valor|tarifa|arancel)\b/.test(m))
    return { text: mostrarPrecios(), nextContext: contextoActual };

  if (/\b(obra social|obrasocial|cobertura|prepaga|seguro medico|afiliado|osde|pami|swiss|ioma)\b/.test(m))
    return { text: mostrarObraSocial(), nextContext: contextoActual };

  if (/\b(historia clinica|historial|antecedente|evolucion)\b/.test(m))
    return { text: mostrarHistoriaClinica(), nextContext: contextoActual };

  if (/\b(receta|recetas|medicacion|medicamento|prescripcion)\b/.test(m))
    return { text: mostrarRecetas(), nextContext: contextoActual };

  if (/\b(login|ingresar|acceder|entrar|contrasena|password|registrar|registro|cuenta|usuario)\b/.test(m))
    return { text: mostrarAcceso(), nextContext: contextoActual };

  if (/\b(rol|roles|permiso|permisos|secretaria|admin|medico rol|paciente rol)\b/.test(m))
    return { text: mostrarRoles(), nextContext: contextoActual };

  if (/\b(pago|pagos|factura|facturacion|abonar|pagar)\b/.test(m))
    return { text: mostrarPagos(), nextContext: contextoActual };

  if (/\b(chat|mensaje|mensajes|comunicar con medico|hablar con)\b/.test(m))
    return { text: mostrarChat(), nextContext: contextoActual };

  if (/\b(contacto|telefono|email|correo|comunicarse|como llamo|soporte)\b/.test(m))
    return { text: mostrarContacto(), nextContext: contextoActual };

  if (/\b(recomendacion|que especialidad|que medico|que servicio elijo)\b/.test(m))
    return { text: mostrarRecomendacion(), nextContext: contextoActual };

  if (/\b(ayuda|funciones|opciones|que puedes|que haces|menu|comandos)\b/.test(m))
    return {
      text: contextoActual.perfilTecnico ? mostrarAyudaTecnica(contextoActual.perfilTecnico) : mostrarAyuda(),
      nextContext: contextoActual,
    };

  if (/\b(gracias|muchas gracias|genial|perfecto|ok|listo|entendi|excelente)\b/.test(m))
    return { text: '¡De nada! 😊 ¿Hay algo más en lo que pueda ayudarte?', nextContext: contextoActual };

  if (/\b(chau|adios|hasta luego|me voy|cerrar|hasta pronto)\b/.test(m))
    return {
      text: '¡Hasta luego! 👋 Que tengas un excelente día. Recordá que siempre podés volver si necesitás ayuda.',
      nextContext: contextoActual,
    };

  if ((contextoActual.perfilTecnico || esConsultaTecnica(m)) && contextoActual.usuarioTipo !== 'paciente') {
    return {
      text: `Entiendo tu consulta en contexto técnico. Para darte una respuesta eficaz en entorno clínico/operativo, indicame:<br><br>
1. Módulo implicado (HC, Recetas, Turnos, Chat, Pagos)<br>
2. Objetivo clínico u operativo puntual<br>
3. Restricción o problema observado<br><br>
Mientras tanto, te dejo una guía avanzada:<br><br>${mostrarAyudaTecnica(contextoActual.perfilTecnico || 'medico')}`,
      nextContext: { ...contextoActual, perfilTecnico: contextoActual.perfilTecnico || 'medico', usuarioTipo: 'staff' },
    };
  }

  if (intencionAproximada) {
    const mapa = {
      turnos: () => (contextoActual.usuarioTipo === 'paciente' && bookingsRt.length > 0 ? respuestaTurnosPacienteDinamica(bookingsRt) : mostrarTurnos()),
      horarios: () => (doctorsRt.length > 0 ? respuestaHorariosDinamica(doctorsRt) : mostrarHorarios()),
      especialidades: () => (servicesRt.length > 0 ? respuestaServiciosDinamica(servicesRt) : mostrarEspecialidades()),
      medicos: () => (doctorsRt.length > 0 ? respuestaMedicosDinamica(doctorsRt) : mostrarMedicos()),
      soporte: mostrarSoporteOperativo,
      contacto: mostrarContacto,
      precios: () => (servicesRt.length > 0 ? respuestaServiciosDinamica(servicesRt) : mostrarPrecios()),
      emergencia: mostrarEmergencias,
    };

    const fn = mapa[intencionAproximada];
    if (fn) {
      return {
        text: `Entendí tu consulta como <strong>${intencionAproximada}</strong>. Si no era eso, decímelo y lo corrijo.<br><br>${fn()}`,
        nextContext: contextoActual,
      };
    }
  }

  return { text: respuestaDefault(), nextContext: contextoActual };
}

function saludar() {
  const opciones = [
    '¡Hola! 👋 Soy <strong>IntegriBot</strong>, el asistente virtual de <strong>IntegraSalud</strong>. ¿En qué puedo ayudarte hoy?',
    '¡Buen día! 😊 Soy el asistente de <strong>IntegraSalud</strong>. ¿Cómo puedo asistirte?',
    '¡Hola! 🌟 Estoy aquí para orientarte en el sistema IntegraSalud. ¿Qué necesitás?',
  ];
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function mostrarTurnos() {
  return `📅 <strong>Gestión de turnos — IntegraSalud</strong><br><br>
Para sacar, modificar o cancelar un turno:<br>
1. Iniciá sesión con tu cuenta<br>
2. Ingresá a <strong>"Mis Turnos"</strong> desde el menú principal<br>
3. Seleccioná la especialidad y el profesional<br>
4. Elegí la fecha y hora disponible<br>
5. Confirmá el turno<br><br>
⏱️ <strong>Servicios disponibles:</strong><br>
• Consulta Clínica General — 30 min<br>
• Seguimiento Preventivo — 30 min<br>
• Consulta Pediátrica — 30 min<br>
• Consulta Neurológica — 45 min<br>
• Consulta Traumatológica — 35 min<br><br>
💡 Si no tenés cuenta, podés registrarte desde la página de inicio.<br>
¿Necesitás info sobre alguna especialidad en particular?`;
}

function mostrarHorarios() {
  return `⏰ <strong>Horarios de atención — IntegraSalud</strong><br><br>
<strong>Por especialidad:</strong><br>
• <strong>Clínica Médica:</strong> Lun/Mié 09:00-13:00 | Vie 14:00-18:00<br>
• <strong>Traumatología:</strong> Mar/Jue 09:00-13:00 | Vie 15:00-18:00<br>
• <strong>Neurología:</strong> Lun/Mié 14:00-18:00 | Vie 09:00-13:00<br>
• <strong>Pediatría:</strong> Mar/Jue 14:00-18:00 | Sáb 09:00-12:00<br>
• <strong>Dermatología:</strong> Mar 10:00-14:00 | Jue 15:00-19:00<br>
• <strong>Endocrinología:</strong> Mar/Jue 09:00-13:00 | Vie 14:00-17:00<br>
• <strong>Ginecología:</strong> Lun/Mié 14:00-18:00 | Sáb 09:00-12:00<br>
• <strong>Urología:</strong> Mar/Jue 14:00-18:00 | Vie 09:00-12:00<br>
• <strong>Otorrinolaringología:</strong> Lun/Mié 08:00-12:00 | Vie 13:00-17:00<br>
• <strong>Enfermería:</strong> Lun-Vie 08:00-12:00 | Sáb 09:00-12:00<br><br>
🚨 <strong>Guardia / Emergencias:</strong> 24 h — los 365 días del año`;
}

function mostrarEspecialidades() {
  return `🏥 <strong>Especialidades disponibles en IntegraSalud:</strong><br><br>
• 🩺 Clínica Médica — Dra. Sofia Martinez<br>
• 🦴 Traumatología — Dr. Mateo Ruiz<br>
• 🧠 Neurología — Dr. Nicolas Peralta<br>
• 👶 Pediatría — Dra. Valentina Gomez<br>
• 🔬 Dermatología — Dr. Bruno Herrera<br>
• 🧬 Endocrinología — Dra. Julia Ferrero<br>
• 👩 Ginecología — Dra. Camila Suárez<br>
• 💊 Urología — Dr. Esteban Loyola<br>
• 👂 Otorrinolaringología — Dr. Alan Murua<br>
• 💉 Enfermería — Enf. Ayelen Parada<br><br>
¿Querés saber los horarios o agendar un turno con alguna especialidad?`;
}

function mostrarMedicos() {
  const lista = MEDICOS.map(
    (m) => `• <strong>${m.nombre}</strong> — ${m.especialidad}<br>&nbsp;&nbsp;📅 ${m.dias}`
  ).join('<br>');
  return `👨‍⚕️ <strong>Equipo profesional de IntegraSalud:</strong><br><br>
${lista}<br><br>
💡 Todos los profesionales cuentan con matrícula habilitada.<br>
¿Querés agendar un turno con alguno de ellos?`;
}

function mostrarEmergencias() {
  return `🚨 <strong>EMERGENCIAS MÉDICAS</strong> 🚨<br><br>
<strong>⚠️ En una emergencia grave llamá al:</strong><br>
📞 <strong>107</strong> — SIES (Sistema de Emergencias)<br>
📞 <strong>911</strong> — Policía / Emergencias generales<br>
📞 <strong>0800-222-1234</strong> — Centro de Toxicología<br><br>
<strong>🔴 Situaciones de emergencia:</strong><br>
• Dolor en el pecho o dificultad para respirar<br>
• Pérdida de consciencia o convulsiones<br>
• Hemorragias graves o traumatismos severos<br>
• Reacciones alérgicas severas (anafilaxia)<br>
• Signos de ACV: asimetría facial, dificultad al hablar<br>
• Intoxicaciones o envenenamientos<br><br>
<strong>📍 Guardia del centro:</strong> Disponible 24 h / 365 días<br>
¿Necesitás información adicional o te puedo ayudar con algo más?`;
}

function mostrarPrecios() {
  const lista = SERVICIOS.map(
    (s) => `• <strong>${s.nombre}</strong><br>&nbsp;&nbsp;⏱️ ${s.duracion} &nbsp;|&nbsp; 💲 ${s.precio}`
  ).join('<br>');
  return `💰 <strong>Aranceles de servicios — IntegraSalud:</strong><br><br>
${lista}<br><br>
💡 Los precios pueden variar según cobertura de obra social o convenios vigentes.<br>
¿Querés información sobre obras sociales aceptadas?`;
}

function mostrarObraSocial() {
  return `🏥 <strong>Obras sociales y cobertura — IntegraSalud:</strong><br><br>
El sistema registra la cobertura de cada paciente incluída:<br>
• Nombre de obra social / prepaga<br>
• Número de afiliado<br><br>
<strong>Entre las coberturas registradas en el sistema:</strong><br>
• OSDE &nbsp;• Swiss Medical &nbsp;• IOMA &nbsp;• PAMI<br>
• Galeno &nbsp;• Medifé &nbsp;• OSECAC<br><br>
💡 Para actualizar tu cobertura, iniciá sesión y accedé a <strong>"Mi Perfil"</strong>. Allí podés modificar los datos de obra social y número de afiliado.<br>
¿Necesitás ayuda con algo más?`;
}

function mostrarHistoriaClinica() {
  return `📋 <strong>Historia Clínica — IntegraSalud:</strong><br><br>
El historial médico digital de cada paciente incluye:<br>
• Diagnósticos y evoluciones previas<br>
• Tratamientos y medicaciones indicadas<br>
• Antecedentes clínicos relevantes<br><br>
<strong>¿Cómo acceder?</strong><br>
1. Iniciá sesión con tu cuenta<br>
2. Ingresá a <strong>"Pacientes"</strong> desde el menú<br>
3. Seleccioná el paciente<br>
4. Hacé clic en <strong>"Historia Clínica"</strong><br><br>
🔐 <strong>Acceso por rol:</strong><br>
• Médicos y Enfermeros: lectura y escritura<br>
• Secretarias y Admins: solo lectura<br>
• Pacientes: acceso a su propio historial<br><br>
¿Necesitás información sobre recetas digitales?`;
}

function mostrarRecetas() {
  return `💊 <strong>Recetas Digitales — IntegraSalud:</strong><br><br>
Los médicos pueden generar recetas digitales desde el sistema:<br><br>
<strong>¿Qué incluye una receta?</strong><br>
• Nombre del medicamento y dosis<br>
• Indicaciones del profesional<br>
• Fecha de emisión<br>
• Firma digital del médico<br><br>
<strong>¿Cómo acceder a mis recetas?</strong><br>
1. Iniciá sesión en el sistema<br>
2. Ingresá a <strong>"Recetas"</strong> desde el menú de navegación<br>
3. Podés ver todas tus recetas emitidas con detalle<br><br>
💡 Si necesitás una receta nueva, debés solicitarla a tu médico en la próxima consulta.<br>
¿Querés saber algo más sobre la gestión médica?`;
}

function mostrarAcceso() {
  return `🔐 <strong>Acceso al sistema — IntegraSalud:</strong><br><br>
<strong>Para ingresar:</strong><br>
1. Accedé a la página principal<br>
2. Completá tu <strong>correo electrónico</strong> registrado<br>
3. Ingresá tu <strong>contraseña</strong><br>
4. Presioná <strong>"Iniciar sesión"</strong><br><br>
<strong>¿Olvidaste tu contraseña?</strong><br>
Contactá al área de soporte o a la secretaría del centro<br>
📧 soporte@integrasalud.com<br><br>
¿Sos nuevo? Podés registrarte desde la <strong>página de inicio</strong> como paciente.<br>
¿Te puedo ayudar con algo más?`;
}

function mostrarRoles() {
  return `👥 <strong>Roles del sistema — IntegraSalud:</strong><br><br>
• 🏥 <strong>Paciente</strong> — Gestiona sus turnos, perfil, historial y recetas<br>
• 👩‍⚕️ <strong>Médico</strong> — Agenda, historias clínicas, recetas y chat con pacientes<br>
• 💉 <strong>Enfermero</strong> — Acceso a historias clínicas y seguimiento<br>
• 📋 <strong>Secretaria</strong> — Gestión de turnos, pacientes y reportes<br>
• ⚙️ <strong>Admin / SuperAdmin</strong> — Control completo del sistema, organigrama y usuarios<br><br>
Cada rol tiene acceso exclusivo a las secciones que le corresponden.<br>
¿Necesitás más información sobre algún rol?`;
}

function mostrarPagos() {
  return `💳 <strong>Pagos y facturación — IntegraSalud:</strong><br><br>
El sistema integra gestión de pagos por las consultas realizadas.<br><br>
<strong>Funcionalidades:</strong><br>
• Registro del estado de pago de cada turno<br>
• Seguimiento de pagos por consulta<br>
• Historial de transacciones accesible para admins y secretarias<br><br>
💡 Los aranceles vigentes son:<br>
• Consulta Clínica General: <strong>$15.000</strong><br>
• Seguimiento Preventivo: <strong>$14.000</strong><br>
• Consulta Pediátrica: <strong>$16.000</strong><br>
• Consulta Neurológica: <strong>$26.000</strong><br>
• Consulta Traumatológica: <strong>$21.000</strong><br><br>
Para consultas sobre facturación, contactá a la secretaría.<br>
¿Necesitás algo más?`;
}

function mostrarChat() {
  return `💬 <strong>Chat con médicos — IntegraSalud:</strong><br><br>
IntegraSalud cuenta con un <strong>sistema de mensajería interna</strong> que permite la comunicación directa entre pacientes y profesionales.<br><br>
<strong>¿Cómo usarlo?</strong><br>
1. Iniciá sesión con tu cuenta<br>
2. Accedé a la sección <strong>"Chat"</strong> desde el menú<br>
3. Seleccioná el médico con quien querés comunicarte<br>
4. Escribí tu mensaje<br><br>
💡 El chat está disponible para consultas no urgentes.<br>
Para <strong>emergencias</strong> siempre llamá al <strong>107</strong> o <strong>911</strong>.<br>
¿Necesitás información sobre algo más?`;
}

function mostrarContacto() {
  return `📞 <strong>Contacto — IntegraSalud:</strong><br><br>
📧 <strong>Email general:</strong> contacto@integrasalud.com<br>
📧 <strong>Soporte técnico:</strong> soporte@integrasalud.com<br><br>
🏢 <strong>Secretarías del centro:</strong><br>
• <strong>Recepción General</strong> — Carla Mendez<br>
• <strong>Gestión de Estudios</strong> — Julieta Acosta<br><br>
⏰ <strong>Horario de atención al público:</strong><br>
• Lunes a Viernes: 08:00 - 19:00 h<br>
• Sábados: 09:00 - 13:00 h<br><br>
¿Hay algo más en lo que te pueda ayudar?`;
}

function mostrarSoporteOperativo() {
  return `🛠️ <strong>Soporte IntegraSalud — Mesa de ayuda</strong><br><br>
<strong>Canales de soporte:</strong><br>
• 📧 Soporte técnico: <strong>soporte@integrasalud.com</strong><br>
• 📧 Consulta general: <strong>contacto@integrasalud.com</strong><br>
• 🏢 Soporte interno presencial: Secretaría (Recepción General)<br><br>

<strong>¿Qué problemas podemos resolver?</strong><br>
• Acceso/login, bloqueo de cuenta, recuperación de contraseña<br>
• Errores en turnos, recetas, historia clínica o chat interno<br>
• Carga o corrección de datos de pacientes y cobertura<br>
• Dudas de permisos por rol (paciente, médico, enfermería, secretaría, admin)<br><br>

<strong>Para escalar más rápido tu ticket, enviá:</strong><br>
1. Rol de usuario y correo de la cuenta<br>
2. Módulo afectado (Turnos, HC, Recetas, etc.)<br>
3. Hora aproximada y pasos para reproducir<br>
4. Captura de pantalla del error<br><br>

<strong>Prioridad sugerida:</strong><br>
• 🔴 Crítica: caída total o sin acceso clínico<br>
• 🟠 Alta: bloquea operación diaria parcial<br>
• 🟡 Media: existe workaround
<br>• 🟢 Baja: mejora o consulta funcional<br><br>

Si querés, te ayudo a redactar el mensaje de soporte con formato completo.`;
}

function mostrarRecomendacion() {
  return `🩺 <strong>¿No sabés qué especialidad elegir?</strong><br><br>
Aquí una guía rápida:<br>
• <strong>Dolor general / control de salud</strong> → Clínica Médica (Dra. Sofia Martinez)<br>
• <strong>Niños / pediatría</strong> → Pediatría (Dra. Valentina Gomez)<br>
• <strong>Huesos, articulaciones o lesiones</strong> → Traumatología (Dr. Mateo Ruiz)<br>
• <strong>Cabeza, memoria o sistema nervioso</strong> → Neurología (Dr. Nicolas Peralta)<br>
• <strong>Piel, cabello o uñas</strong> → Dermatología (Dr. Bruno Herrera)<br>
• <strong>Diabetes, tiroides u hormonas</strong> → Endocrinología (Dra. Julia Ferrero)<br>
• <strong>Salud femenina / ginecología</strong> → Ginecología (Dra. Camila Suárez)<br>
• <strong>Sistema urinario masculino</strong> → Urología (Dr. Esteban Loyola)<br>
• <strong>Oído, nariz o garganta</strong> → Otorrinolaringología (Dr. Alan Murua)<br>
• <strong>Curaciones, inyecciones, controles</strong> → Enfermería (Enf. Ayelen Parada)<br><br>
¿Querés que te diga los horarios de alguna de estas especialidades?`;
}

function mostrarAyudaTecnica(perfil = 'medico') {
  const perfilLabel = {
    medico: 'Médico',
    enfermeria: 'Enfermería',
    secretaria: 'Secretaría',
    admin: 'Administración',
  }[perfil] || 'Equipo clínico';

  return `🧠 <strong>Ayuda avanzada (${perfilLabel}) — IntegraSalud</strong><br><br>
<strong>Flujos clínicos recomendados:</strong><br>
• Historia Clínica: registrar evolución con criterio clínico y continuidad asistencial<br>
• Recetas: validar dosis, frecuencia y duración antes de emitir<br>
• Turnos: priorizar por complejidad y riesgo (triage operativo)<br>
• Chat interno: usar para seguimiento no urgente con trazabilidad<br><br>

<strong>Buenas prácticas técnicas:</strong><br>
• Documentar hallazgos con estructura clara (motivo, evaluación, plan)<br>
• Registrar red flags y signos de alarma para seguimiento oportuno<br>
• Mantener coherencia entre HC, receta y plan terapéutico<br>
• Evitar ambigüedad: usar lenguaje clínico preciso y accionable<br><br>

<strong>Permisos por rol (resumen operativo):</strong><br>
• Médico/Enfermería: alta capacidad clínica en HC y seguimiento<br>
• Secretaría: gestión operativa de agenda, pacientes y coordinación<br>
• Admin/SuperAdmin: control global, auditoría y configuración<br><br>

<strong>Soporte para equipo:</strong><br>
Si detectás inconsistencias clínicas/técnicas, escalá por <strong>soporte@integrasalud.com</strong> indicando módulo, caso y criticidad.<br><br>

<strong>Comandos de modo:</strong><br>
• "modo medico" &nbsp;• "modo enfermeria" &nbsp;• "modo secretaria" &nbsp;• "modo admin"<br>
• "salir modo tecnico" para volver al modo general<br><br>

Podés pedirme ayuda técnica específica, por ejemplo:<br>
• "criterio de priorización para este caso"<br>
• "qué datos mínimos debo dejar en HC"<br>
• "cómo estructurar una evolución clínica clara"`;
}

function mostrarAyuda() {
  return `🤖 <strong>¿Qué puedo hacer por vos?</strong><br><br>
<strong>📅 TURNOS:</strong><br>
• "Turnos" — Cómo sacar, modificar o cancelar<br>
• "Horarios" — Horarios de atención por especialidad<br>
• "Precios" — Aranceles de cada consulta<br><br>
<strong>🏥 INFORMACIÓN MÉDICA:</strong><br>
• "Especialidades" — Áreas disponibles<br>
• "Médicos" — Equipo profesional completo<br>
• "Recomendación" — Ayuda para elegir especialidad<br><br>
<strong>👤 MI CUENTA:</strong><br>
• "Login" — Cómo acceder al sistema<br>
• "Roles" — Qué puede hacer cada usuario<br>
• "Obra social" — Gestión de cobertura<br><br>
<strong>📋 GESTIÓN CLÍNICA:</strong><br>
• "Historia clínica" — Acceso al historial<br>
• "Recetas" — Recetas digitales<br>
• "Pagos" — Facturación y aranceles<br>
• "Chat" — Mensajería con médicos<br><br>
<strong>🚨 EMERGENCIAS:</strong><br>
• "Emergencia" — Guía y contactos urgentes<br><br>
<strong>📞 OTROS:</strong><br>
• "Contacto" — Teléfonos y correos del centro<br>
• "Soporte" — Mesa de ayuda, tickets y escalamiento<br><br>
<strong>🛠️ SOPORTE (rápido):</strong><br>
Si tenés un error, escribí:<br>
• "Soporte: no puedo ingresar"<br>
• "Soporte: error al crear receta"<br>
• "Soporte: no aparecen turnos"<br><br>
Te voy a pedir los datos clave para resolverlo más rápido.<br><br>
<strong>👨‍⚕️ MODO TÉCNICO:</strong><br>
• "modo medico"<br>
• "modo enfermeria"<br>
• "modo secretaria"<br>
• "modo admin"<br>
• "salir modo tecnico"<br><br>
¿Con qué querés empezar?`;
}

function respuestaDefault() {
  return `🤔 No estoy seguro de entender tu consulta.<br><br>
Puedo ayudarte con:<br>
• 📅 <strong>Turnos</strong> y horarios de atención<br>
• 🏥 <strong>Especialidades</strong> y equipo médico<br>
• 💰 <strong>Precios</strong> y obras sociales<br>
• 📋 <strong>Historia clínica</strong> y recetas<br>
• 💬 <strong>Chat</strong> y mensajería interna<br>
• 🔐 <strong>Acceso</strong> y roles del sistema<br>
• 🚨 <strong>Emergencias</strong><br><br>
Escribí <strong>"ayuda"</strong> para ver todas las opciones disponibles.`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// MENSAJE DE BIENVENIDA
// ============================================================

const MENSAJE_BIENVENIDA = {
  id: 'welcome',
  text: `¡Hola! Soy <strong>IntegriBot</strong>, el asistente virtual de <strong>IntegraSalud</strong>. 👋<br><br>
Puedo ayudarte con:<br>
📅 <strong>Turnos médicos</strong> — Información y gestión<br>
🏥 <strong>Especialidades y médicos</strong> — Quiénes te atienden<br>
💰 <strong>Precios y obra social</strong> — Aranceles y cobertura<br>
📋 <strong>Historia clínica y recetas</strong> — Acceso al historial<br>
💬 <strong>Chat</strong> — Mensajería con profesionales<br>
🔐 <strong>Acceso al sistema</strong> — Login y roles<br>
🚨 <strong>Emergencias</strong> — Guía de urgencias<br><br>
¿En qué puedo ayudarte hoy?`,
  isBot: true,
};

// ============================================================
// COMPONENTE REACT
// ============================================================

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen]         = useState(false);
  const [messages, setMessages]     = useState([MENSAJE_BIENVENIDA]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [hasUnread, setHasUnread]   = useState(true);
  const [runtimeData, setRuntimeData] = useState({ doctors: [], services: [], bookings: [] });

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const contextoRef    = useRef(cargarContextoInicial());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    const role = normalizeRole(user?.rol);
    if (!role) return;

    let nextContext = { ...contextoRef.current };

    if (role === ROLE.PACIENTE) {
      nextContext = {
        ...nextContext,
        usuarioTipo: 'paciente',
        perfilTecnico: null,
      };
    } else if (role === ROLE.MEDICO) {
      nextContext = {
        ...nextContext,
        usuarioTipo: 'staff',
        perfilTecnico: 'medico',
      };
    } else if (role === ROLE.ENFERMERO) {
      nextContext = {
        ...nextContext,
        usuarioTipo: 'staff',
        perfilTecnico: 'enfermeria',
      };
    } else if (role === ROLE.SECRETARIA) {
      nextContext = {
        ...nextContext,
        usuarioTipo: 'staff',
        perfilTecnico: 'secretaria',
      };
    } else if (role === ROLE.ADMIN || role === ROLE.SUPERADMIN) {
      nextContext = {
        ...nextContext,
        usuarioTipo: 'staff',
        perfilTecnico: 'admin',
      };
    }

    contextoRef.current = nextContext;
    persistirContexto(nextContext);
  }, [user?.rol]);

  useEffect(() => {
    let cancelled = false;

    const loadRuntimeData = async () => {
      try {
        const [doctorsData, servicesData] = await Promise.all([
          getDoctors(),
          getServices(),
        ]);

        let bookingsData = [];
        if (normalizeRole(user?.rol) === ROLE.PACIENTE) {
          const bookingsRes = await getBookings({ page: 1, limit: 5 });
          bookingsData = bookingsRes?.data?.bookings || [];
        }

        if (!cancelled) {
          setRuntimeData({
            doctors: Array.isArray(doctorsData) ? doctorsData : [],
            services: Array.isArray(servicesData) ? servicesData : [],
            bookings: Array.isArray(bookingsData) ? bookingsData : [],
          });
        }
      } catch (_error) {
        if (!cancelled) {
          setRuntimeData((prev) => ({ ...prev }));
        }
      }
    };

    loadRuntimeData();
    return () => {
      cancelled = true;
    };
  }, [user?.rol, isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (!prev) {
        setHasUnread(false);
        setTimeout(() => inputRef.current?.focus(), 150);
      }
      return !prev;
    });
  };

  const manejarAccionesDeTurno = useCallback(async (text) => {
    const m = normalizar(text);
    const currentContext = contextoRef.current;

    if (currentContext.pendingAction?.type === 'booking_wizard') {
      const wizard = currentContext.pendingAction;

      if (wizard.step === 'service') {
        const service = seleccionarPorNumeroOTexto(text, wizard.options || [], (s) => s.nombre || '');
        if (!service) {
          return {
            handled: true,
            text: 'No pude identificar el servicio. Respondé con el número o nombre del servicio de la lista.',
          };
        }

        const doctorOptions = filtrarDoctoresPorServicio(service, runtimeData.doctors || []).slice(0, 10);
        contextoRef.current = {
          ...currentContext,
          pendingAction: {
            type: 'booking_wizard',
            step: 'doctor',
            data: { service },
            options: doctorOptions,
          },
        };
        persistirContexto(contextoRef.current);

        const doctorList = doctorOptions
          .map((d, i) => `${i + 1}. ${d.nombre || d.name} (${d.especialidad || d.specialty || 'Especialidad'})`)
          .join('<br>');

        return {
          handled: true,
          text: `Perfecto. Elegiste <strong>${service.nombre}</strong>.<br><br>Ahora elegí el profesional:<br>${doctorList}<br><br>Respondé con número o nombre.`,
        };
      }

      if (wizard.step === 'doctor') {
        const doctor = seleccionarPorNumeroOTexto(text, wizard.options || [], (d) => `${d.nombre || d.name} ${d.especialidad || d.specialty || ''}`);
        if (!doctor) {
          return {
            handled: true,
            text: 'No pude identificar el profesional. Respondé con el número o nombre de la lista.',
          };
        }

        contextoRef.current = {
          ...currentContext,
          pendingAction: {
            type: 'booking_wizard',
            step: 'fecha',
            data: { ...wizard.data, doctor },
          },
        };
        persistirContexto(contextoRef.current);

        return {
          handled: true,
          text: `Excelente. Seleccionaste a <strong>${doctor.nombre || doctor.name}</strong>.<br><br>Indicame la fecha con formato <strong>YYYY-MM-DD</strong> (ejemplo: 2026-04-10).`,
        };
      }

      if (wizard.step === 'fecha') {
        const fechaMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
        if (!fechaMatch) {
          return {
            handled: true,
            text: 'Formato de fecha inválido. Usá <strong>YYYY-MM-DD</strong> (ejemplo: 2026-04-10).',
          };
        }

        contextoRef.current = {
          ...currentContext,
          pendingAction: {
            type: 'booking_wizard',
            step: 'hora',
            data: { ...wizard.data, fecha: fechaMatch[0] },
          },
        };
        persistirContexto(contextoRef.current);

        return {
          handled: true,
          text: 'Perfecto. Ahora indicame la hora en formato <strong>HH:mm</strong> (ejemplo: 14:30).',
        };
      }

      if (wizard.step === 'hora') {
        const horaMatch = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
        if (!horaMatch) {
          return {
            handled: true,
            text: 'Formato de hora inválido. Usá <strong>HH:mm</strong> (ejemplo: 14:30).',
          };
        }

        const hora = `${horaMatch[1].padStart(2, '0')}:${horaMatch[2]}`;
        const data = { ...wizard.data, hora };

        contextoRef.current = {
          ...currentContext,
          pendingAction: {
            type: 'booking_wizard',
            step: 'confirm',
            data,
          },
        };
        persistirContexto(contextoRef.current);

        return {
          handled: true,
          text: `Confirmame este turno:<br><br><strong>Servicio:</strong> ${data.service.nombre}<br><strong>Profesional:</strong> ${data.doctor.nombre || data.doctor.name}<br><strong>Fecha:</strong> ${data.fecha}<br><strong>Hora:</strong> ${data.hora}<br><br>Respondé <strong>si</strong> para crear o <strong>no</strong> para cancelar.`,
        };
      }

      if (wizard.step === 'confirm') {
        if (esNegacion(m)) {
          contextoRef.current = { ...currentContext, pendingAction: null };
          persistirContexto(contextoRef.current);
          return { handled: true, text: 'Reserva guiada cancelada. Si querés, iniciamos otra.' };
        }

        if (!esAfirmacion(m)) {
          return { handled: true, text: 'Respondé <strong>si</strong> para confirmar o <strong>no</strong> para cancelar.' };
        }

        try {
          const data = wizard.data;
          const payload = {
            servicio: data.service._id,
            medico: data.doctor._id,
            fecha: data.fecha,
            hora: data.hora,
            fechaHoraReserva: `${data.fecha}T${data.hora}:00`,
          };
          await createBooking(payload);

          const refreshed = await getBookings({ page: 1, limit: 5 });
          const bookings = refreshed?.data?.bookings || [];
          setRuntimeData((prev) => ({ ...prev, bookings }));

          contextoRef.current = { ...currentContext, pendingAction: null };
          persistirContexto(contextoRef.current);

          return {
            handled: true,
            text: `✅ Turno creado correctamente.<br><br><strong>${data.service.nombre}</strong> con ${data.doctor.nombre || data.doctor.name}<br>📅 ${data.fecha} ${data.hora}`,
          };
        } catch (error) {
          return {
            handled: true,
            text: `No pude crear el turno. ${escapeHtml(error?.response?.data?.message || 'Revisá disponibilidad e intentá nuevamente.')}`,
          };
        }
      }
    }

    if (currentContext.pendingAction?.type === 'confirm_cancel_latest') {
      if (esAfirmacion(m)) {
        const booking = currentContext.pendingAction.booking;
        try {
          await deleteBooking(booking._id);
          const refreshed = await getBookings({ page: 1, limit: 5 });
          const bookings = refreshed?.data?.bookings || [];
          setRuntimeData((prev) => ({ ...prev, bookings }));

          contextoRef.current = { ...currentContext, pendingAction: null };
          persistirContexto(contextoRef.current);

          return {
            handled: true,
            text: `✅ Turno cancelado correctamente.<br><br>Servicio: <strong>${booking.servicio?.nombre || 'Servicio'}</strong><br>Profesional: <strong>${booking.medico?.nombre || 'Profesional'}</strong><br>Fecha: ${new Date(booking.fecha).toLocaleDateString('es-AR')} ${booking.hora || ''}`,
          };
        } catch (error) {
          return {
            handled: true,
            text: `No pude cancelar el turno en este momento. ${escapeHtml(error?.response?.data?.message || 'Intentá nuevamente en unos minutos.')}`,
          };
        }
      }

      if (esNegacion(m)) {
        contextoRef.current = { ...currentContext, pendingAction: null };
        persistirContexto(contextoRef.current);
        return { handled: true, text: 'Perfecto, mantengo tu turno sin cambios.' };
      }
    }

    if (/\b(cancelar|eliminar|dar de baja)\b/.test(m) && /\b(turno|reserva|cita)\b/.test(m)) {
      const target = obtenerTurnoCancelable(runtimeData.bookings || []);
      if (!target) {
        return {
          handled: true,
          text: 'No encontré turnos activos para cancelar. Si querés, puedo ayudarte a crear uno nuevo.',
        };
      }

      contextoRef.current = {
        ...currentContext,
        pendingAction: {
          type: 'confirm_cancel_latest',
          booking: target,
        },
      };
      persistirContexto(contextoRef.current);

      return {
        handled: true,
        text: `¿Confirmás cancelar este turno?<br><br><strong>${target.servicio?.nombre || 'Servicio'}</strong> con ${target.medico?.nombre || 'Profesional'}<br>📅 ${new Date(target.fecha).toLocaleDateString('es-AR')} ${target.hora || ''}<br><br>Respondé <strong>si</strong> o <strong>no</strong>.`,
      };
    }

    if (/\b(sacar|crear|agendar|reservar)\b/.test(m) && /\b(turno|cita|reserva)\b/.test(m) && contextoRef.current.usuarioTipo === 'paciente') {
      const serviceOptions = (runtimeData.services || []).slice(0, 10);
      if (serviceOptions.length === 0) {
        return {
          handled: true,
          text: 'No pude cargar servicios en este momento. Intentá nuevamente en unos segundos.',
        };
      }

      contextoRef.current = {
        ...currentContext,
        pendingAction: {
          type: 'booking_wizard',
          step: 'service',
          options: serviceOptions,
          data: {},
        },
      };
      persistirContexto(contextoRef.current);

      const servicesList = serviceOptions
        .map((s, i) => `${i + 1}. ${s.nombre} (${s.duracion || 30} min)`)
        .join('<br>');

      return {
        handled: true,
        text: `Vamos a crear tu turno paso a paso.<br><br>Elegí el servicio:<br>${servicesList}<br><br>Respondé con número o nombre.`,
      };
    }

    const parsed = extraerDatosReserva(text, runtimeData);
    if (!parsed?.isIntent) return { handled: false };

    if (parsed.missing.length > 0) {
      return {
        handled: true,
        text: `Para crear el turno me faltan: <strong>${parsed.missing.join(', ')}</strong>.<br><br>Podés seguir en formato libre, o escribir <strong>"quiero sacar turno"</strong> y te guío paso a paso.`,
      };
    }

    try {
      const payload = {
        servicio: parsed.service._id,
        medico: parsed.doctor._id,
        fecha: parsed.fecha,
        hora: parsed.hora,
        fechaHoraReserva: `${parsed.fecha}T${parsed.hora}:00`,
      };

      const created = await createBooking(payload);
      const refreshed = await getBookings({ page: 1, limit: 5 });
      const bookings = refreshed?.data?.bookings || [];
      setRuntimeData((prev) => ({ ...prev, bookings }));

      return {
        handled: true,
        text: `✅ Turno creado correctamente.<br><br><strong>Servicio:</strong> ${parsed.service.nombre}<br><strong>Profesional:</strong> ${parsed.doctor.nombre || parsed.doctor.name}<br><strong>Fecha:</strong> ${parsed.fecha}<br><strong>Hora:</strong> ${parsed.hora}<br><br>ID de reserva: ${escapeHtml(created?.data?._id || created?._id || 'generado')}`,
      };
    } catch (error) {
      return {
        handled: true,
        text: `No pude crear el turno. ${escapeHtml(error?.response?.data?.message || 'Revisá la disponibilidad de fecha/hora y volvé a intentar.')}`,
      };
    }
  }, [runtimeData]);

  const enviarMensaje = useCallback((texto) => {
    const text = texto.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), text: escapeHtml(text), isBot: false };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      const transaccional = await manejarAccionesDeTurno(text);
      if (transaccional?.handled) {
        setIsTyping(false);
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: transaccional.text, isBot: true }]);
        return;
      }

      const result = procesarMensaje(text, contextoRef.current, runtimeData);
      const botText = result.text;
      contextoRef.current = result.nextContext;
      persistirContexto(contextoRef.current);
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: botText, isBot: true }]);
    }, 650);
  }, [runtimeData, manejarAccionesDeTurno]);

  const handleSend = useCallback(() => {
    enviarMensaje(inputValue);
  }, [inputValue, enviarMensaje]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleQuickAction = (msg) => {
    if (!isOpen) {
      setIsOpen(true);
      setHasUnread(false);
    }
    enviarMensaje(msg);
  };

  const ACCIONES_RAPIDAS = [
    { label: 'Turnos',         msg: 'Turnos médicos' },
    { label: 'Horarios',       msg: 'Horarios de atención' },
    { label: 'Especialidades', msg: 'Especialidades disponibles' },
    { label: 'Precios',        msg: 'Precios de consultas' },
    { label: 'Médicos',        msg: 'Equipo médico' },
    { label: 'Emergencia',     msg: 'Emergencia médica' },
  ];

  return (
    <>
      {/* ── Botón flotante ── */}
      {!isOpen && (
        <button
          className={styles.toggle}
          onClick={handleToggle}
          aria-label="Abrir asistente IntegriBot"
        >
          <span className={styles.toggleIcon}><FaComments /></span>
          {hasUnread && <span className={styles.notifDot} aria-hidden="true" />}
        </button>
      )}

      {/* ── Panel del chatbot ── */}
      <div
        className={`${styles.container} ${isOpen ? styles.open : ''}`}
        role="dialog"
        aria-label="Asistente virtual IntegriBot"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar} aria-hidden="true"><FaHospital /></div>
            <div>
              <strong className={styles.headerTitle}>IntegriBot</strong>
              <p className={styles.headerStatus}>🟢 En línea · IntegraSalud</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleToggle} aria-label="Cerrar chat">
            <FaTimes />
          </button>
        </div>

        {/* Mensajes */}
        <div className={styles.messages} aria-live="polite" aria-atomic="false">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.isBot ? styles.bot : styles.user}`}
            >
              <div
                className={styles.bubble}
                // Bot messages are static trusted strings; user messages are HTML-escaped.
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
            </div>
          ))}

          {/* Indicador de escritura */}
          {isTyping && (
            <div className={`${styles.message} ${styles.bot}`}>
              <div className={`${styles.bubble} ${styles.typing}`} aria-label="IntegriBot está escribiendo">
                <span className={styles.d1} />
                <span className={styles.d2} />
                <span className={styles.d3} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Área de input */}
        <div className={styles.inputArea}>
          <div className={styles.quickActions}>
            {ACCIONES_RAPIDAS.map((a) => (
              <button
                key={a.msg}
                className={styles.quickBtn}
                onClick={() => handleQuickAction(a.msg)}
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta..."
              className={styles.input}
              autoComplete="off"
              aria-label="Escribí tu consulta"
            />
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              aria-label="Enviar mensaje"
              disabled={!inputValue.trim()}
            >
              <FaPaperPlane />
            </button>
          </div>

          <p className={styles.infoText}>IntegriBot · Asistente virtual de IntegraSalud</p>
        </div>
      </div>
    </>
  );
}
