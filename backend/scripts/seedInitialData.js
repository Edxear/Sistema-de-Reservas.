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

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(0, 0, 0, 0);
  return d;
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
      horariosAtencion: [
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

  for (let i = 0; i < pacientes.length; i += 1) {
    const paciente = pacientes[i];
    const medico = medicosAdmins[i % medicosAdmins.length];
    const servicio = randomFrom(servicios);
    const enfermedad = paciente.enfermedadPrincipal || randomFrom(enfermedades);

    const fecha = makeDate((i % 7) + 1);
    const hora = horas[i % horas.length];

    await Booking.create({
      usuario: paciente._id,
      servicio: servicio._id,
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

  console.log('Seed inicial completado:');
  console.log(`- Medicos administradores: ${medicosAdmins.length}`);
  console.log(`- Secretarias: ${secretarias.length}`);
  console.log(`- Pacientes: ${pacientes.length}`);
  console.log(`- Servicios: ${servicios.length}`);
  console.log(`- Turnos: ${pacientes.length}`);
  console.log(`- Historias clinicas: ${pacientes.length}`);
  console.log(`- Recetas: ${pacientes.length}`);
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