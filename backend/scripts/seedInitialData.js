const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Receta = require('../models/Receta');
const HistoriaClinica = require('../models/HistoriaClinica');

const seedUsers = require('../seeds/usuarios-iniciales.json');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Falta MONGODB_URI en .env');
  process.exit(1);
}

const enfermedades = [
  'Hipertension arterial',
  'Diabetes tipo 2',
  'Asma persistente',
  'Hipotiroidismo',
  'Migrana cronica',
  'Artritis reumatoide',
  'EPOC',
  'Gastritis cronica',
  'Lumbalgia',
  'Dislipidemia'
];

const medicamentosPorEnfermedad = {
  'Hipertension arterial': ['Losartan 50mg', 'Amlodipina 5mg'],
  'Diabetes tipo 2': ['Metformina 850mg', 'Glibenclamida 5mg'],
  'Asma persistente': ['Salbutamol inhalador', 'Budesonida inhalador'],
  'Hipotiroidismo': ['Levotiroxina 100mcg'],
  'Migrana cronica': ['Topiramato 25mg', 'Sumatriptan 50mg'],
  'Artritis reumatoide': ['Metotrexato 10mg', 'Ibuprofeno 600mg'],
  EPOC: ['Tiotropio inhalador', 'Formoterol inhalador'],
  'Gastritis cronica': ['Omeprazol 20mg', 'Sucralfato'],
  Lumbalgia: ['Diclofenac 75mg', 'Ciclobenzaprina 10mg'],
  Dislipidemia: ['Atorvastatina 20mg']
};

const serviciosBase = [
  { nombre: 'Consulta Clinica General', descripcion: 'Control clinico integral', duracion: 30, precio: 15000, activo: true },
  { nombre: 'Control Cardiologico', descripcion: 'Seguimiento cardiovascular', duracion: 40, precio: 22000, activo: true },
  { nombre: 'Consulta Pediatrica', descripcion: 'Atencion pediatrica de rutina', duracion: 30, precio: 16000, activo: true },
  { nombre: 'Consulta Neurologica', descripcion: 'Evaluacion neurologica especializada', duracion: 45, precio: 26000, activo: true },
  { nombre: 'Consulta Traumatologica', descripcion: 'Evaluacion osteomuscular', duracion: 35, precio: 21000, activo: true }
];

const horariosPorEspecialidad = {
  Enfermeria: [
    { dia: 'Lunes', horaInicio: '08:00', horaFin: '12:00' },
    { dia: 'Martes', horaInicio: '08:00', horaFin: '12:00' },
    { dia: 'Jueves', horaInicio: '14:00', horaFin: '18:00' }
  ],
  'Clinica Medica': [
    { dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Miercoles', horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Viernes', horaInicio: '14:00', horaFin: '18:00' }
  ],
  Traumatologia: [
    { dia: 'Martes', horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Jueves', horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Viernes', horaInicio: '15:00', horaFin: '18:00' }
  ],
  Neurologia: [
    { dia: 'Lunes', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Miercoles', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Viernes', horaInicio: '09:00', horaFin: '13:00' }
  ],
  Pediatria: [
    { dia: 'Martes', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Jueves', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Sabado', horaInicio: '09:00', horaFin: '12:00' }
  ],
  Dermatologia: [
    { dia: 'Lunes', horaInicio: '10:00', horaFin: '14:00' },
    { dia: 'Miercoles', horaInicio: '10:00', horaFin: '14:00' },
    { dia: 'Viernes', horaInicio: '15:00', horaFin: '19:00' }
  ],
  Endocrinologia: [
    { dia: 'Martes', horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Jueves', horaInicio: '09:00', horaFin: '13:00' },
    { dia: 'Viernes', horaInicio: '14:00', horaFin: '17:00' }
  ],
  Ginecologia: [
    { dia: 'Lunes', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Miercoles', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Sabado', horaInicio: '09:00', horaFin: '12:00' }
  ],
  Urologia: [
    { dia: 'Martes', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Jueves', horaInicio: '14:00', horaFin: '18:00' },
    { dia: 'Viernes', horaInicio: '09:00', horaFin: '12:00' }
  ],
  Otorrinolaringologia: [
    { dia: 'Lunes', horaInicio: '08:00', horaFin: '12:00' },
    { dia: 'Miercoles', horaInicio: '08:00', horaFin: '12:00' },
    { dia: 'Viernes', horaInicio: '13:00', horaFin: '17:00' }
  ]
};

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizarTexto(valor = '') {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function obtenerDiaSemana(fecha) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return dias[fecha.getDay()];
}

function horaAMinutos(hora) {
  const [hours, minutes] = hora.split(':').map(Number);
  return (hours * 60) + minutes;
}

function encontrarMedicoDisponible(fecha, medicosAdmins, horariosBooleanos = {}) {
  const diaSemana = obtenerDiaSemana(fecha);
  const medicosDisponibles = medicosAdmins.filter((medico) => {
    const horarios = medico.horariosAtencion || [];
    return horarios.some((bloque) => normalizarTexto(bloque.dia) === normalizarTexto(diaSemana));
  });

  if (medicosDisponibles.length === 0) return null;

  let medico = randomFrom(medicosDisponibles);
  while (horariosBooleanos[`${medico._id}-${fecha.toISOString().slice(0, 10)}`] && medicosDisponibles.length > 1) {
    const idx = medicosDisponibles.indexOf(medico);
    medicosDisponibles.splice(idx, 1);
    if (medicosDisponibles.length === 0) break;
    medico = randomFrom(medicosDisponibles);
  }

  return medico;
}

function obtenerHoraDisponible(medico, fecha, horariosBooleanos = {}) {
  const diaSemana = obtenerDiaSemana(fecha);
  const horarios = (medico.horariosAtencion || []).filter((bloque) => normalizarTexto(bloque.dia) === normalizarTexto(diaSemana));

  if (horarios.length === 0) return null;

  const horas = [];
  for (const bloque of horarios) {
    const inicio = horaAMinutos(bloque.horaInicio);
    const fin = horaAMinutos(bloque.horaFin);
    for (let m = inicio; m < fin; m += 30) {
      const h = String(Math.floor(m / 60)).padStart(2, '0');
      const min = String(m % 60).padStart(2, '0');
      horas.push(`${h}:${min}`);
    }
  }

  if (horas.length === 0) return null;

  let hora = randomFrom(horas);
  const key = `${medico._id}-${fecha.toISOString().slice(0, 10)}-${hora}`;
  let intentos = 0;
  while (horariosBooleanos[key] && intentos < 5) {
    hora = randomFrom(horas);
    intentos += 1;
  }

  return hora;
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Mongo conectado para seed inicial');

  await Promise.all([
    User.deleteMany({
      $or: [
        { email: /@consultoriosanpablo\.com$/ },
        { email: /@pacientes\.sanpablo\.com$/ },
        { email: /@medicloud\.demo$/ },
        { email: /@paciente\.demo$/ }
      ]
    }),
    Service.deleteMany({ nombre: { $in: serviciosBase.map((s) => s.nombre) } }),
  ]);

  const medicosAdmins = [];
  for (const m of seedUsers.medicosAdmins) {
    const medico = await User.create({
      nombre: m.nombre,
      email: m.email,
      telefono: m.telefono,
      rol: 'admin',
      password: seedUsers.passwordComun,
      especialidad: m.especialidad,
      matriculaProfesional: m.matriculaProfesional,
      bio: `${m.especialidad}. Medico con permisos administrativos.`,
      direccionConsultorio: 'Av. Salud 123, Rosario',
      mapaEmbed: '',
      redesSociales: {
        instagram: 'https://instagram.com/consultoriosanpablo',
        linkedin: 'https://linkedin.com/company/consultorio-san-pablo'
      },
      horariosAtencion: horariosPorEspecialidad[m.especialidad] || [
        { dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00' },
        { dia: 'Miercoles', horaInicio: '14:00', horaFin: '18:00' }
      ]
    });
    medicosAdmins.push(medico);
  }

  const secretarias = [];
  for (const s of seedUsers.secretarias) {
    const secretaria = await User.create({
      nombre: s.nombre,
      email: s.email,
      telefono: s.telefono,
      rol: s.rol,
      password: seedUsers.passwordComun,
      areaSecretaria: s.areaSecretaria,
      turnoLaboral: s.turnoLaboral,
      bio: 'Secretaria administrativa del consultorio'
    });
    secretarias.push(secretaria);
  }

  const pacientes = [];
  for (const p of seedUsers.pacientes) {
    const paciente = await User.create({
      nombre: p.nombre,
      email: p.email,
      telefono: p.telefono,
      rol: p.rol,
      password: seedUsers.passwordComun,
      obraSocial: p.obraSocial,
      numeroAfiliado: p.numeroAfiliado,
      bio: `Paciente con antecedente de ${p.enfermedadPrincipal}`
    });
    pacientes.push({ ...paciente.toObject(), enfermedadPrincipal: p.enfermedadPrincipal });
  }

  const servicios = await Service.insertMany(serviciosBase);

  await Booking.deleteMany({ usuario: { $in: pacientes.map((p) => p._id) } });
  await Receta.deleteMany({ paciente: { $in: pacientes.map((p) => p._id) } });
  await HistoriaClinica.deleteMany({ paciente: { $in: pacientes.map((p) => p._id) } });

  const horas = ['09:00', '09:45', '10:30', '11:15', '12:00', '14:00', '15:00', '16:00'];

  const horariosBooleanos = {};

  for (let i = 0; i < pacientes.length; i += 1) {
    const paciente = pacientes[i];
    const servicio = randomFrom(servicios);
    const enfermedad = paciente.enfermedadPrincipal || randomFrom(enfermedades);

    const fecha = makeDate((i % 7) + 1);
    const medico = encontrarMedicoDisponible(fecha, medicosAdmins, horariosBooleanos);

    if (!medico) {
      console.warn(`No se encontró médico disponible para ${fecha.toISOString().slice(0, 10)}`);
      continue;
    }

    const hora = obtenerHoraDisponible(medico, fecha, horariosBooleanos);

    if (!hora) {
      console.warn(`No se encontró hora disponible para ${medico.nombre} el ${fecha.toISOString().slice(0, 10)}`);
      continue;
    }

    const fechaKey = `${medico._id}-${fecha.toISOString().slice(0, 10)}-${hora}`;
    horariosBooleanos[fechaKey] = true;

    await Booking.create({
      usuario: paciente._id,
      servicio: servicio._id,
      medico: medico._id,
      fecha,
      hora,
      fechaHoraReserva: new Date(),
      estado: i % 4 === 0 ? 'confirmada' : 'pendiente',
      notas: `Control de ${enfermedad}`
    });

    await HistoriaClinica.create({
      paciente: paciente._id,
      medico: medico._id,
      tipo: 'evolucion',
      descripcion: `Paciente con cuadro de ${enfermedad}. Se indica control en 30 dias y seguimiento del tratamiento.`
    });

    const meds = medicamentosPorEnfermedad[enfermedad] || ['Paracetamol 500mg'];
    await Receta.create({
      paciente: paciente._id,
      medico: medico._id,
      esFavorita: i % 3 === 0,
      medicamentos: meds.map((m) => ({
        nombre: m,
        dosis: '1 comprimido',
        presentacion: 'Caja x30',
        indicaciones: 'Tomar cada 12 horas despues de las comidas'
      }))
    });
  }

  const conteoTurnos = await Booking.countDocuments({});
  const conteoHistorias = await HistoriaClinica.countDocuments({});
  const conteoRecetas = await Receta.countDocuments({});

  console.log('Seed inicial completado:');
  console.log(`- Medicos administradores: ${medicosAdmins.length}`);
  console.log(`- Secretarias: ${secretarias.length}`);
  console.log(`- Pacientes: ${pacientes.length}`);
  console.log(`- Servicios: ${servicios.length}`);
  console.log(`- Turnos: ${conteoTurnos}`);
  console.log(`- Historias clinicas: ${conteoHistorias}`);
  console.log(`- Recetas: ${conteoRecetas}`);
  console.log(`Password comun de acceso: ${seedUsers.passwordComun}`);

  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Error en seed inicial:', err);
    await mongoose.disconnect();
    process.exit(1);
  });