const DEFAULT_DEMO_MODE = process.env.REACT_APP_DEMO_MODE !== 'false';

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const now = new Date();
const daysFromNow = (days, hour = 9, minute = 0) => {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

const formatDateLabel = (date) => `${date.toLocaleDateString('es-AR')} (${new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date)})`;

const buildInitialState = () => {
  const users = [
    {
      _id: 'demo-user',
      id: 'demo-user',
      nombre: 'Visitante Demo',
      email: 'visitante@demo.local',
      telefono: '341-555-0000',
      rol: 'superadmin',
      esSuperAdminPrincipal: true,
      direccion: 'Rosario Centro',
      bio: 'Perfil demostrativo con acceso transversal al sistema.',
      especialidad: 'Direccion medica',
      matriculaProfesional: 'MP-0001',
      direccionConsultorio: 'Av. San Martin 1400, Rosario',
      fotoPerfil: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      contactoEmergencia: 'Guardia central',
      documento: '30000000',
      genero: 'otro',
    },
    {
      _id: 'med-1',
      nombre: 'Dra. Laura Gomez',
      email: 'laura.gomez@demo.local',
      telefono: '341-555-1111',
      rol: 'medico',
      especialidad: 'clinica medica',
      matriculaProfesional: 'MP-2451',
      direccionConsultorio: 'Consultorio 2, Piso 1',
      bio: 'Especialista en seguimiento ambulatorio y coordinacion clinica.',
      fotoPerfil: 'https://images.unsplash.com/photo-1594824388853-d0c6f6d7f9a4?auto=format&fit=crop&w=400&q=80',
      obraSocial: '',
      numeroAfiliado: '',
      alergias: '',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00' },
        { dia: 'Miercoles', horaInicio: '10:00', horaFin: '14:00' },
      ],
      direccionConsultorioPublica: 'Av. Pellegrini 550, Rosario',
      mapaEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3353.238185515222!2d-60.6505!3d-32.9537!2m3!1f0!2f0!3f0!',
      redesSociales: { instagram: 'https://instagram.com/demo_clinica', linkedin: 'https://linkedin.com/company/demo-clinica' },
    },
    {
      _id: 'med-2',
      nombre: 'Dr. Martin Ruiz',
      email: 'martin.ruiz@demo.local',
      telefono: '341-555-2222',
      rol: 'medico',
      especialidad: 'cardiologia',
      matriculaProfesional: 'MP-3110',
      direccionConsultorio: 'Consultorio 5, Piso 2',
      bio: 'Cardiologia clinica y manejo integral de riesgo cardiovascular.',
      fotoPerfil: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      horariosAtencion: [
        { dia: 'Martes', horaInicio: '08:30', horaFin: '12:30' },
        { dia: 'Jueves', horaInicio: '14:00', horaFin: '18:00' },
      ],
      direccionConsultorioPublica: 'Bv. Oroño 1240, Rosario',
      mapaEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3352.9!2d-60.653!3d-32.95!2m3!1f0!2f0!3f0!',
      redesSociales: { instagram: 'https://instagram.com/cardiologia.demo' },
    },
    {
      _id: 'med-3',
      nombre: 'Dra. Julieta Morales',
      email: 'julieta.morales@demo.local',
      telefono: '341-555-2233',
      rol: 'medico',
      especialidad: 'pediatria',
      matriculaProfesional: 'MP-3621',
      direccionConsultorio: 'Consultorio 7, Pediatria',
      bio: 'Pediatra enfocada en controles integrales y prevencion.',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '14:00', horaFin: '18:00' },
        { dia: 'Viernes', horaInicio: '08:00', horaFin: '12:00' },
      ],
    },
    {
      _id: 'med-4',
      nombre: 'Dr. Tomas Ibarra',
      email: 'tomas.ibarra@demo.local',
      telefono: '341-555-2244',
      rol: 'medico',
      especialidad: 'traumatologia',
      matriculaProfesional: 'MP-4012',
      direccionConsultorio: 'Consultorio 9, Piso 2',
      bio: 'Traumatologia deportiva y rehabilitacion funcional.',
      horariosAtencion: [
        { dia: 'Martes', horaInicio: '09:00', horaFin: '13:00' },
        { dia: 'Jueves', horaInicio: '15:00', horaFin: '19:00' },
      ],
    },
    {
      _id: 'med-5',
      nombre: 'Dra. Camila Prado',
      email: 'camila.prado@demo.local',
      telefono: '341-555-2255',
      rol: 'medico',
      especialidad: 'neurologia',
      matriculaProfesional: 'MP-4188',
      direccionConsultorio: 'Consultorio 4, Piso 3',
      bio: 'Consulta neurologica ambulatoria y seguimiento de cefaleas.',
      horariosAtencion: [
        { dia: 'Miercoles', horaInicio: '08:30', horaFin: '12:30' },
        { dia: 'Viernes', horaInicio: '13:30', horaFin: '17:30' },
      ],
    },
    {
      _id: 'med-6',
      nombre: 'Dr. Agustin Neri',
      email: 'agustin.neri@demo.local',
      telefono: '341-555-2266',
      rol: 'medico',
      especialidad: 'gastroenterologia',
      matriculaProfesional: 'MP-4301',
      direccionConsultorio: 'Consultorio 10, Piso 1',
      bio: 'Patologia digestiva cronica y estudios funcionales.',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '08:00', horaFin: '12:00' },
        { dia: 'Jueves', horaInicio: '09:00', horaFin: '13:00' },
      ],
    },
    {
      _id: 'med-7',
      nombre: 'Dra. Valentina Mendez',
      email: 'valentina.mendez@demo.local',
      telefono: '341-555-2277',
      rol: 'medico',
      especialidad: 'endocrinologia',
      matriculaProfesional: 'MP-4477',
      direccionConsultorio: 'Consultorio 3, Piso 2',
      bio: 'Seguimiento de diabetes, obesidad y patologia tiroidea.',
      horariosAtencion: [
        { dia: 'Martes', horaInicio: '14:00', horaFin: '18:00' },
        { dia: 'Viernes', horaInicio: '09:00', horaFin: '13:00' },
      ],
    },
    {
      _id: 'med-8',
      nombre: 'Dr. Nicolas Ferraro',
      email: 'nicolas.ferraro@demo.local',
      telefono: '341-555-2288',
      rol: 'medico',
      especialidad: 'dermatologia',
      matriculaProfesional: 'MP-4620',
      direccionConsultorio: 'Consultorio 12, Piso 1',
      bio: 'Dermatologia clinica y lesiones pigmentadas.',
      horariosAtencion: [
        { dia: 'Miercoles', horaInicio: '14:00', horaFin: '18:00' },
        { dia: 'Sabado', horaInicio: '08:00', horaFin: '11:00' },
      ],
    },
    {
      _id: 'med-9',
      nombre: 'Dra. Paula Cejas',
      email: 'paula.cejas@demo.local',
      telefono: '341-555-2299',
      rol: 'medico',
      especialidad: 'neumonologia',
      matriculaProfesional: 'MP-4709',
      direccionConsultorio: 'Consultorio 6, Piso 2',
      bio: 'Asma, EPOC y rehabilitacion respiratoria.',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '10:00', horaFin: '14:00' },
        { dia: 'Jueves', horaInicio: '08:00', horaFin: '12:00' },
      ],
    },
    {
      _id: 'med-10',
      nombre: 'Dr. Bruno Ledesma',
      email: 'bruno.ledesma@demo.local',
      telefono: '341-555-2210',
      rol: 'medico',
      especialidad: 'clinica medica',
      matriculaProfesional: 'MP-4895',
      direccionConsultorio: 'Consultorio 8, Piso 1',
      bio: 'Clinica de adulto mayor y polifarmacia.',
      horariosAtencion: [
        { dia: 'Martes', horaInicio: '08:00', horaFin: '12:00' },
        { dia: 'Viernes', horaInicio: '14:00', horaFin: '18:00' },
      ],
    },
    {
      _id: 'nurse-1',
      nombre: 'Lic. Ana Perez',
      email: 'ana.perez@demo.local',
      telefono: '341-555-3333',
      rol: 'enfermero',
      especialidad: 'enfermeria clinica',
      bio: 'Referente de calidad y seguridad del paciente.',
    },
    {
      _id: 'sec-1',
      nombre: 'Lucia Fernandez',
      email: 'lucia.fernandez@demo.local',
      telefono: '341-555-4444',
      rol: 'secretaria',
      areaSecretaria: 'Admisiones',
      turnoLaboral: 'Manana',
    },
    {
      _id: 'pat-1',
      nombre: 'Carlos Benitez',
      email: 'carlos.benitez@demo.local',
      telefono: '341-555-5551',
      rol: 'paciente',
      obraSocial: 'Obra Social',
      numeroAfiliado: 'SM-245677',
      alergias: 'Penicilina',
      documento: '27456789',
      genero: 'masculino',
      contactoEmergencia: 'Laura Benitez - 341-555-1010',
    },
    {
      _id: 'pat-2',
      nombre: 'Marta Sosa',
      email: 'marta.sosa@demo.local',
      telefono: '341-555-5552',
      rol: 'paciente',
      obraSocial: 'OSDE',
      numeroAfiliado: 'OS-109977',
      alergias: 'Ninguna',
      documento: '30123456',
      genero: 'femenino',
      contactoEmergencia: 'Jose Sosa - 341-555-2020',
    },
    {
      _id: 'pat-3',
      nombre: 'Sofia Acuna',
      email: 'sofia.acuna@demo.local',
      telefono: '341-555-5553',
      rol: 'paciente',
      obraSocial: 'IAPOS',
      numeroAfiliado: 'IA-88012',
      alergias: 'Ibuprofeno',
      documento: '33456789',
      genero: 'femenino',
      contactoEmergencia: 'Claudio Acuna - 341-555-3030',
    },
    {
      _id: 'pat-4',
      nombre: 'Diego Peralta',
      email: 'diego.peralta@demo.local',
      telefono: '341-555-5554',
      rol: 'paciente',
      obraSocial: 'Galeno',
      numeroAfiliado: 'GA-77319',
      alergias: 'Ninguna',
      documento: '28999888',
      genero: 'masculino',
      contactoEmergencia: 'Nora Peralta - 341-555-4040',
    },
    {
      _id: 'pat-5',
      nombre: 'Florencia Rios',
      email: 'florencia.rios@demo.local',
      telefono: '341-555-5555',
      rol: 'paciente',
      obraSocial: 'OSDE',
      numeroAfiliado: 'OS-77812',
      alergias: 'Aspirina',
      documento: '31567890',
      genero: 'femenino',
      contactoEmergencia: 'Julian Rios - 341-555-5050',
    },
    {
      _id: 'pat-6',
      nombre: 'Ricardo Mena',
      email: 'ricardo.mena@demo.local',
      telefono: '341-555-5556',
      rol: 'paciente',
      obraSocial: 'PAMI',
      numeroAfiliado: 'PA-44602',
      alergias: 'Ninguna',
      documento: '22333444',
      genero: 'masculino',
      contactoEmergencia: 'Mariela Mena - 341-555-6060',
    },
    {
      _id: 'pat-7',
      nombre: 'Candela Nuñez',
      email: 'candela.nunez@demo.local',
      telefono: '341-555-5557',
      rol: 'paciente',
      obraSocial: 'IAPOS',
      numeroAfiliado: 'IA-44190',
      alergias: 'Lactosa',
      documento: '34222777',
      genero: 'femenino',
      contactoEmergencia: 'Ramon Nuñez - 341-555-7070',
    },
    {
      _id: 'pat-8',
      nombre: 'Leandro Quiroga',
      email: 'leandro.quiroga@demo.local',
      telefono: '341-555-5558',
      rol: 'paciente',
      obraSocial: 'Obra Social',
      numeroAfiliado: 'SM-98711',
      alergias: 'Ninguna',
      documento: '27666111',
      genero: 'masculino',
      contactoEmergencia: 'Paula Quiroga - 341-555-8080',
    },
    {
      _id: 'pat-9',
      nombre: 'Mariana Soler',
      email: 'mariana.soler@demo.local',
      telefono: '341-555-5559',
      rol: 'paciente',
      obraSocial: 'Federada Salud',
      numeroAfiliado: 'FS-55110',
      alergias: 'Naproxeno',
      documento: '29900666',
      genero: 'femenino',
      contactoEmergencia: 'Pedro Soler - 341-555-9090',
    },
    {
      _id: 'pat-10',
      nombre: 'Oscar Villalba',
      email: 'oscar.villalba@demo.local',
      telefono: '341-555-5560',
      rol: 'paciente',
      obraSocial: 'Sancor Salud',
      numeroAfiliado: 'SS-10233',
      alergias: 'Ninguna',
      documento: '25888000',
      genero: 'masculino',
      contactoEmergencia: 'Elena Villalba - 341-555-1011',
    },
  ];

  const services = [
    { _id: 'srv-1', nombre: 'Consulta clinica medica', duracion: 30, precio: 12000 },
    { _id: 'srv-2', nombre: 'Control cardiologico', duracion: 45, precio: 16500 },
    { _id: 'srv-3', nombre: 'Seguimiento enfermeria', duracion: 30, precio: 9000 },
    { _id: 'srv-4', nombre: 'Teleconsulta general', duracion: 20, precio: 7500 },
  ];

  const bookings = [
    { _id: 'book-1', usuarioId: 'pat-1', medicoId: 'med-1', servicioId: 'srv-1', fecha: daysFromNow(1, 9, 0), hora: '09:00', estado: 'confirmada', notas: 'Control mensual', createdAt: daysFromNow(-5, 10, 0) },
    { _id: 'book-2', usuarioId: 'pat-2', medicoId: 'med-2', servicioId: 'srv-2', fecha: daysFromNow(2, 10, 30), hora: '10:30', estado: 'pendiente', notas: 'Dolor precordial leve', createdAt: daysFromNow(-4, 11, 0) },
    { _id: 'book-3', usuarioId: 'pat-3', medicoId: 'med-1', servicioId: 'srv-4', fecha: daysFromNow(3, 15, 0), hora: '15:00', estado: 'reprogramada', notas: 'Seguimiento pos guardia', createdAt: daysFromNow(-2, 8, 0) },
    { _id: 'book-4', usuarioId: 'pat-1', medicoId: 'med-2', servicioId: 'srv-2', fecha: daysFromNow(-1, 11, 0), hora: '11:00', estado: 'atendida', notas: 'Chequeo con resultados', createdAt: daysFromNow(-12, 9, 0) },
    { _id: 'book-5', usuarioId: 'pat-2', medicoId: 'med-1', servicioId: 'srv-1', fecha: daysFromNow(5, 8, 30), hora: '08:30', estado: 'confirmada', notas: 'Renovacion medicacion', createdAt: daysFromNow(-1, 12, 0) },
    { _id: 'book-6', usuarioId: 'pat-3', medicoId: 'med-2', servicioId: 'srv-2', fecha: daysFromNow(7, 16, 0), hora: '16:00', estado: 'pendiente', notas: 'Consulta anual', createdAt: daysFromNow(-3, 13, 0) },
  ];

  const teleconsultas = [
    { _id: 'tele-1', pacienteId: 'pat-1', medicoId: 'med-1', fechaProgramada: daysFromNow(1, 18, 0), enlaceSala: 'https://meet.example/demo-tele-1', estado: 'programada', motivo: 'Seguimiento clinico', createdAt: daysFromNow(-1, 14, 0) },
    { _id: 'tele-2', pacienteId: 'pat-2', medicoId: 'med-2', fechaProgramada: daysFromNow(4, 12, 0), enlaceSala: 'https://meet.example/demo-tele-2', estado: 'confirmada', motivo: 'Revision de estudios', createdAt: daysFromNow(-2, 15, 0) },
  ];

  const ratings = [
    { _id: 'rat-1', medicoId: 'med-1', userId: 'pat-1', calificacion: 5, comentario: 'Muy clara y cercana.' },
    { _id: 'rat-2', medicoId: 'med-1', userId: 'pat-2', calificacion: 4, comentario: 'Explico bien el tratamiento.' },
    { _id: 'rat-3', medicoId: 'med-2', userId: 'pat-3', calificacion: 5, comentario: 'Excelente seguimiento.' },
  ];

  const privateComments = [
    { _id: 'pc-1', medicoId: 'med-1', targetUserId: 'med-1', authorId: 'demo-user', contenido: 'Destaca en adherencia a protocolos y comunicacion con pacientes.', createdAt: daysFromNow(-6, 9, 0) },
    { _id: 'pc-2', medicoId: 'med-2', targetUserId: 'med-2', authorId: 'demo-user', contenido: 'Muy buena coordinacion con cardiologia y diagnostico por imagen.', createdAt: daysFromNow(-4, 9, 0) },
  ];

  const colleagueRatings = [
    {
      _id: 'cr-1',
      targetUserId: 'med-1',
      authorId: 'demo-user',
      comentario: 'Excelente liderazgo de consultorio.',
      estado: 'cerrado',
      categories: {
        calidad_atencion: 5,
        trabajo_equipo: 5,
        comunicacion: 4,
        actitud: 5,
        desempeno_general: 5,
      },
      createdAt: daysFromNow(-10, 10, 0),
    },
    {
      _id: 'cr-2',
      targetUserId: 'nurse-1',
      authorId: 'demo-user',
      comentario: 'Buena respuesta ante eventos criticos.',
      estado: 'en_revision',
      categories: {
        calidad_atencion: 4,
        trabajo_equipo: 5,
        comunicacion: 5,
        actitud: 4,
        desempeno_general: 4,
      },
      createdAt: daysFromNow(-8, 10, 0),
    },
  ];

  const supportTickets = [
    { _id: 'tick-1', codigo: 'SUP-1001', titulo: 'Intermitencia en agenda medica', descripcion: 'Demoras al confirmar reprogramaciones.', criticidad: 'alto', estado: 'en_progreso', soporteNivel: 'L2', tipoGestion: 'incidente', areaClinica: 'Consultorios externos', modulo: 'Turnos', impactoClinico: 'Riesgo de superposicion de turnos', solicitanteNombre: 'Lucia Fernandez', solicitanteRol: 'secretaria', solicitanteArea: 'Admisiones', tags: ['agenda', 'turnos'], createdAt: daysFromNow(-3, 9, 0), updatedAt: daysFromNow(-1, 16, 0), encuesta: { puntuacion: 4 } },
    { _id: 'tick-2', codigo: 'SUP-1002', titulo: 'Actualizacion de articulo de protocolo', descripcion: 'Incorporar nueva plantilla de trazabilidad.', criticidad: 'medio', estado: 'abierto', soporteNivel: 'L1', tipoGestion: 'requerimiento', areaClinica: 'Calidad', modulo: 'KB', impactoClinico: 'Estandarizacion documental', solicitanteNombre: 'Ana Perez', solicitanteRol: 'enfermero', solicitanteArea: 'Enfermeria', tags: ['kb'], createdAt: daysFromNow(-2, 11, 0), updatedAt: daysFromNow(-2, 11, 0) },
    { _id: 'tick-3', codigo: 'SUP-1003', titulo: 'Solicitud autorizacion - Obra Social', descripcion: 'Autorizacion de estudio contrastado. Afiliado: SM-245677', criticidad: 'medio', estado: 'resuelto', soporteNivel: 'L2', tipoGestion: 'obra_social', areaClinica: 'Gestion institucional', modulo: 'Cobertura', impactoClinico: 'Paciente referencia: Carlos Benitez', solicitanteNombre: 'Visitante Demo', solicitanteRol: 'superadmin', solicitanteArea: 'Gestion', tags: ['obra_social', 'interinstitucional'], createdAt: daysFromNow(-5, 8, 0), updatedAt: daysFromNow(-4, 14, 0), encuesta: { puntuacion: 5 } },
    { _id: 'tick-4', codigo: 'SUP-1004', titulo: 'Falla en impresora de recetas - Consultorio 2', descripcion: 'Impresora no responde al imprimir recetas. Pacientes en espera.', criticidad: 'critico', estado: 'abierto', soporteNivel: 'L1', tipoGestion: 'incidente', areaClinica: 'Consultorios externos', modulo: 'Recetas', impactoClinico: 'Demora en entrega de medicacion', solicitanteNombre: 'Dra. Laura Gomez', solicitanteRol: 'medico', solicitanteArea: 'Consultorios', tags: ['hardware', 'impresora'], createdAt: daysFromNow(-1, 14, 0), updatedAt: daysFromNow(-1, 14, 0) },
    { _id: 'tick-5', codigo: 'SUP-1005', titulo: 'Alta de nuevo medico en sistema', descripcion: 'Dr. Bruno Ledesma debe tener acceso completo al modulo de recetas y turnos.', criticidad: 'bajo', estado: 'abierto', soporteNivel: 'L1', tipoGestion: 'requerimiento', areaClinica: 'Gestion', modulo: 'Usuarios', impactoClinico: 'Sin impacto directo', solicitanteNombre: 'Visitante Demo', solicitanteRol: 'superadmin', solicitanteArea: 'Gestion', tags: ['usuarios', 'alta'], createdAt: daysFromNow(-4, 10, 0), updatedAt: daysFromNow(-4, 10, 0) },
    { _id: 'tick-6', codigo: 'SUP-1006', titulo: 'SLA vencido - Ticket de farmacia', descripcion: 'El ticket de farmacia lleva 48hs sin respuesta L2.', criticidad: 'alto', estado: 'en_espera', soporteNivel: 'L2', tipoGestion: 'escalamiento', areaClinica: 'Farmacia', modulo: 'Soporte', impactoClinico: 'Posible desabastecimiento de insumos', solicitanteNombre: 'Oscar Villalba', solicitanteRol: 'admin', solicitanteArea: 'Farmacia', tags: ['sla', 'escalamiento'], createdAt: daysFromNow(-6, 9, 0), updatedAt: daysFromNow(-2, 17, 0) },
  ];

  const bedUnits = [
    { _id: 'bed-1', codigo: 'A-101', sector: 'Clinica medica', estado: 'ocupada', observaciones: 'Paciente en monitoreo', paciente: 'Carlos Benitez', updatedAt: daysFromNow(0, 7, 30) },
    { _id: 'bed-2', codigo: 'A-102', sector: 'Clinica medica', estado: 'libre', observaciones: 'Disponible para ingreso', paciente: '', updatedAt: daysFromNow(0, 8, 0) },
    { _id: 'bed-3', codigo: 'UTI-01', sector: 'UTI', estado: 'limpieza', observaciones: 'Alta reciente', paciente: '', updatedAt: daysFromNow(0, 9, 15) },
    { _id: 'bed-4', codigo: 'P-201', sector: 'Pediatria', estado: 'mantenimiento', observaciones: 'Cambio de barandas', paciente: '', updatedAt: daysFromNow(0, 10, 0) },
    { _id: 'bed-5', codigo: 'A-103', sector: 'Clinica medica', estado: 'ocupada', observaciones: 'Control de signos cada 4h', paciente: 'Marta Sosa', updatedAt: daysFromNow(0, 10, 20) },
    { _id: 'bed-6', codigo: 'A-104', sector: 'Clinica medica', estado: 'reservada', observaciones: 'Ingreso programado post quirurgico', paciente: '', updatedAt: daysFromNow(0, 10, 45) },
    { _id: 'bed-7', codigo: 'UTI-02', sector: 'UTI', estado: 'ocupada', observaciones: 'Ventilacion no invasiva', paciente: 'Ricardo Mena', updatedAt: daysFromNow(0, 11, 10) },
    { _id: 'bed-8', codigo: 'UTI-03', sector: 'UTI', estado: 'aislamiento', observaciones: 'Precauciones de contacto', paciente: 'Leandro Quiroga', updatedAt: daysFromNow(0, 11, 35) },
    { _id: 'bed-9', codigo: 'P-202', sector: 'Pediatria', estado: 'ocupada', observaciones: 'Hidratacion EV', paciente: 'Candela Nuñez', updatedAt: daysFromNow(0, 12, 5) },
    { _id: 'bed-10', codigo: 'P-203', sector: 'Pediatria', estado: 'libre', observaciones: 'Alta sanitaria lista', paciente: '', updatedAt: daysFromNow(0, 12, 20) },
    { _id: 'bed-11', codigo: 'QX-01', sector: 'Recuperacion postquirurgica', estado: 'ocupada', observaciones: 'Post anestesia inmediata', paciente: 'Diego Peralta', updatedAt: daysFromNow(0, 12, 40) },
    { _id: 'bed-12', codigo: 'QX-02', sector: 'Recuperacion postquirurgica', estado: 'limpieza', observaciones: 'Cambio de ropa de cama', paciente: '', updatedAt: daysFromNow(0, 13, 0) },
  ];

  const knowledgeArticles = [
    { _id: 'kb-1', codigo: 'KB-001', titulo: 'Escalamiento de incidentes criticos', contenido: 'Checklist de contencion, comunicacion y cierre de incidente.', categoria: 'operacion', estado: 'publicado', version: 3, updatedAt: daysFromNow(-7, 10, 0) },
    { _id: 'kb-2', codigo: 'KB-002', titulo: 'Carga operativa de enfermeria', contenido: 'Criterios para distribuir dotacion segun pacientes y alertas.', categoria: 'enfermeria', estado: 'publicado', version: 2, updatedAt: daysFromNow(-6, 11, 0) },
  ];

  const recetas = [
    { _id: 'rec-1', pacienteId: 'pat-1', medicoId: 'med-1', diagnosticoPrincipal: 'Hipertension arterial', diagnosticoSecundario: 'Dislipidemia', observaciones: 'Control en 30 dias. No suspender sin consulta.', medicamentos: [{ nombre: 'Losartan', dosis: '50mg', presentacion: 'Comprimidos', indicaciones: '1 cada 12h con agua' }, { nombre: 'Atorvastatina', dosis: '40mg', presentacion: 'Comprimidos', indicaciones: '1 por noche con cena' }, { nombre: 'AAS', dosis: '100mg', presentacion: 'Comprimidos', indicaciones: '1 al dia con desayuno' }], createdAt: daysFromNow(-15, 9, 0) },
    { _id: 'rec-2', pacienteId: 'pat-2', medicoId: 'med-2', diagnosticoPrincipal: 'Arritmia sinusal', diagnosticoSecundario: '', observaciones: 'Reevaluar ECG en proxima consulta.', medicamentos: [{ nombre: 'Bisoprolol', dosis: '2.5mg', presentacion: 'Comprimidos', indicaciones: '1 por dia en ayunas' }], createdAt: daysFromNow(-10, 10, 0) },
    { _id: 'rec-3', pacienteId: 'pat-5', medicoId: 'med-7', diagnosticoPrincipal: 'Hipotiroidismo primario', diagnosticoSecundario: '', observaciones: 'Tomar en ayunas, 30 min antes del desayuno. No suspender.', medicamentos: [{ nombre: 'Levotiroxina', dosis: '50mcg', presentacion: 'Comprimidos', indicaciones: '1 por dia en ayunas' }], createdAt: daysFromNow(-20, 9, 30) },
    { _id: 'rec-4', pacienteId: 'pat-4', medicoId: 'med-4', diagnosticoPrincipal: 'Fractura de perone', diagnosticoSecundario: 'Dolor postquirurgico', observaciones: 'No superar 3 tomas por dia. Revisar en 7 dias.', medicamentos: [{ nombre: 'Ibuprofeno', dosis: '600mg', presentacion: 'Comprimidos', indicaciones: '1 cada 8h con alimentos' }, { nombre: 'Pantoprazol', dosis: '40mg', presentacion: 'Comprimidos', indicaciones: '1 por dia en ayunas (gastroproteccion)' }], createdAt: daysFromNow(-5, 14, 0) },
    { _id: 'rec-5', pacienteId: 'pat-3', medicoId: 'med-5', diagnosticoPrincipal: 'Cefalea tensional', diagnosticoSecundario: 'Ansiedad moderada', observaciones: 'Solo en crisis. No usar diariamente.', medicamentos: [{ nombre: 'Ibuprofeno', dosis: '400mg', presentacion: 'Comprimidos', indicaciones: 'A demanda en cefalea, max 3 veces/dia' }, { nombre: 'Alprazolam', dosis: '0.25mg', presentacion: 'Comprimidos', indicaciones: '1/2 comprimido nocturno por 15 dias' }], createdAt: daysFromNow(-8, 11, 0) },
  ];

  const recetaFavoritas = [
    { _id: 'fav-1', nombre: 'Analgesico simple', medicamentos: [{ nombre: 'Paracetamol', dosis: '500mg', presentacion: 'Comprimidos', indicaciones: '1 cada 8h si dolor' }] },
    { _id: 'fav-2', nombre: 'Antibiotico de via aerea superior', medicamentos: [{ nombre: 'Amoxicilina', dosis: '875mg', presentacion: 'Comprimidos', indicaciones: '1 cada 12h por 7 dias' }] },
  ];

  const historiaClinica = [
    { _id: 'hc-1', pacienteId: 'pat-1', fecha: daysFromNow(-60, 9, 0), tipo: 'evolucion', eventCategory: 'evolucion', descripcion: 'Ingresa por guardia con HTA descompensada. PA 180/110. Se inicia captopril 25mg.', clinicalSnapshot: { diagnostico: 'HTA estadio II', plan: 'Captopril 25mg c/8h, dieta hiposodica, control en 7 dias' }, flags: { esCritico: true, requiereSeguimiento: true } },
    { _id: 'hc-2', pacienteId: 'pat-1', fecha: daysFromNow(-45, 11, 0), tipo: 'laboratorio', eventCategory: 'estudio', descripcion: 'Perfil lipidico con mejoria parcial. LDL 148. Se mantiene atorvastatina.', clinicalSnapshot: { diagnostico: 'Dislipemia mixta', plan: 'Atorvastatina 40mg noche. Nuevo perfil en 3 meses.' }, flags: { esCritico: false, requiereSeguimiento: true } },
    { _id: 'hc-3', pacienteId: 'pat-1', fecha: daysFromNow(-30, 10, 0), tipo: 'evolucion', eventCategory: 'evolucion', descripcion: 'Buen control tensional. PA 130/80. Tolera bien tratamiento.', clinicalSnapshot: { diagnostico: 'HTA controlada', plan: 'Continuar esquema actual. Control mensual.' }, flags: { esCritico: false, requiereSeguimiento: false } },
    { _id: 'hc-4', pacienteId: 'pat-1', fecha: daysFromNow(-10, 9, 30), tipo: 'receta', eventCategory: 'receta', descripcion: 'Renovacion de receta antihipertensiva y estatina.', clinicalSnapshot: { diagnostico: 'HTA + dislipemia', plan: 'Captopril 25mg + Atorvastatina 40mg. Laboratorio en 60 dias.' }, flags: { esCritico: false, requiereSeguimiento: false } },
    { _id: 'hc-5', pacienteId: 'pat-2', fecha: daysFromNow(-40, 10, 30), tipo: 'interconsulta', eventCategory: 'evolucion', descripcion: 'Se solicita Holter 24hs y control en cardiologia por palpitaciones en reposo.', clinicalSnapshot: { diagnostico: 'Arritmia en estudio', plan: 'Holter 24hs, ECG basal, evitar estimulantes.' }, flags: { esCritico: true, requiereSeguimiento: true } },
    { _id: 'hc-6', pacienteId: 'pat-2', fecha: daysFromNow(-20, 9, 0), tipo: 'laboratorio', eventCategory: 'estudio', descripcion: 'Holter sin bloqueos significativos. Extrasistoles ventriculares aisladas.', clinicalSnapshot: { diagnostico: 'EV aisladas, benignas', plan: 'Control en 3 meses. Sin tratamiento por ahora.' }, flags: { esCritico: false, requiereSeguimiento: true } },
    { _id: 'hc-7', pacienteId: 'pat-3', fecha: daysFromNow(-35, 11, 0), tipo: 'evolucion', eventCategory: 'evolucion', descripcion: 'Primera consulta. Paciente con cefalea tensional recurrente y ansiedad moderada.', clinicalSnapshot: { diagnostico: 'Cefalea tensional + ansiedad', plan: 'Ibuprofeno a demanda, derivacion a psicologia.' }, flags: { esCritico: false, requiereSeguimiento: true } },
    { _id: 'hc-8', pacienteId: 'pat-4', fecha: daysFromNow(-25, 14, 0), tipo: 'evolucion', eventCategory: 'evolucion', descripcion: 'Fractura de perone derecho. Radiografia confirmada. Inmovilizacion con bota.', clinicalSnapshot: { diagnostico: 'Fractura perone distal no desplazada', plan: 'Bota de yeso 3 semanas, ibuprofeno 600mg c/8h, RX control.' }, flags: { esCritico: false, requiereSeguimiento: true } },
    { _id: 'hc-9', pacienteId: 'pat-5', fecha: daysFromNow(-50, 9, 0), tipo: 'laboratorio', eventCategory: 'estudio', descripcion: 'TSH 8.2 mUI/L. T4 libre baja. Se diagnostica hipotiroidismo primario.', clinicalSnapshot: { diagnostico: 'Hipotiroidismo primario', plan: 'Levotiroxina 50mcg en ayunas. Control en 6 semanas.' }, flags: { esCritico: false, requiereSeguimiento: true } },
    { _id: 'hc-10', pacienteId: 'pat-6', fecha: daysFromNow(-15, 10, 0), tipo: 'evolucion', eventCategory: 'evolucion', descripcion: 'EPOC estable. Saturacion 95%. Espirometria pendiente.', clinicalSnapshot: { diagnostico: 'EPOC estadio II', plan: 'Salbutamol inhalador rescate. Espirometria en 30 dias.' }, flags: { esCritico: false, requiereSeguimiento: true } },
    { _id: 'hc-11', pacienteId: 'pat-7', fecha: daysFromNow(-8, 11, 30), tipo: 'evolucion', eventCategory: 'evolucion', descripcion: 'Broncoespasmo leve. Buena respuesta a broncodilatador. Alta medica.', clinicalSnapshot: { diagnostico: 'Crisis asmatica leve', plan: 'Salbutamol 4 puff c/4h por 48hs, control con pediatra.' }, flags: { esCritico: false, requiereSeguimiento: false } },
    { _id: 'hc-12', pacienteId: 'pat-8', fecha: daysFromNow(-20, 9, 0), tipo: 'interconsulta', eventCategory: 'evolucion', descripcion: 'Perdida de 8kg en 2 meses sin causa aparente. Se solicita panel oncologico basico.', clinicalSnapshot: { diagnostico: 'Sindrome constitucional en estudio', plan: 'Hemograma, VSG, TAC toracoabdominal, interconsulta nutricion.' }, flags: { esCritico: true, requiereSeguimiento: true } },
  ];

  const ordenesMedicas = [
    { _id: 'ord-1', pacienteId: 'pat-1', medicoId: 'med-1', tipo: 'laboratorio', prioridad: 'alta', estado: 'solicitada', indicacion: 'Laboratorio general y hepatograma', diagnostico: 'Control anual', fechaObjetivo: daysFromNow(3, 8, 0), resultadoResumen: '' },
    { _id: 'ord-2', pacienteId: 'pat-2', medicoId: 'med-2', tipo: 'imagen', prioridad: 'media', estado: 'en_proceso', indicacion: 'Ecocardiograma doppler', diagnostico: 'Soplo funcional', fechaObjetivo: daysFromNow(5, 8, 0), resultadoResumen: 'Turno coordinado con imagenes.' },
    { _id: 'ord-3', pacienteId: 'pat-3', medicoId: 'med-5', tipo: 'interconsulta', prioridad: 'alta', estado: 'solicitada', indicacion: 'Interconsulta a neurologia por cefalea persistente', diagnostico: 'Cefalea cronica', fechaObjetivo: daysFromNow(2, 9, 0), resultadoResumen: '' },
    { _id: 'ord-4', pacienteId: 'pat-4', medicoId: 'med-4', tipo: 'procedimiento', prioridad: 'urgente', estado: 'en_proceso', indicacion: 'Inmovilizacion de miembro inferior y control de dolor', diagnostico: 'Fractura de perone', fechaObjetivo: daysFromNow(0, 14, 0), resultadoResumen: 'Procedimiento iniciado en sala de yesos.' },
    { _id: 'ord-5', pacienteId: 'pat-5', medicoId: 'med-7', tipo: 'laboratorio', prioridad: 'media', estado: 'completada', indicacion: 'Perfil tiroideo completo y glucemia basal', diagnostico: 'Hipotiroidismo subclinico', fechaObjetivo: daysFromNow(-1, 8, 0), resultadoResumen: 'TSH elevada, ajustar dosis y control en 6 semanas.' },
    { _id: 'ord-6', pacienteId: 'pat-6', medicoId: 'med-9', tipo: 'imagen', prioridad: 'baja', estado: 'solicitada', indicacion: 'Rx torax frente y perfil', diagnostico: 'Control EPOC', fechaObjetivo: daysFromNow(6, 8, 0), resultadoResumen: '' },
    { _id: 'ord-7', pacienteId: 'pat-7', medicoId: 'med-3', tipo: 'procedimiento', prioridad: 'media', estado: 'cancelada', indicacion: 'Nebulizacion supervisada en sala de pediatria', diagnostico: 'Broncoespasmo leve', fechaObjetivo: daysFromNow(1, 11, 0), resultadoResumen: 'Suspendida por evolucion favorable y alta temprana.' },
    { _id: 'ord-8', pacienteId: 'pat-8', medicoId: 'med-10', tipo: 'interconsulta', prioridad: 'alta', estado: 'en_proceso', indicacion: 'Interconsulta a nutricion por perdida ponderal', diagnostico: 'Sindrome constitucional en estudio', fechaObjetivo: daysFromNow(4, 10, 0), resultadoResumen: 'Primera evaluacion nutricional realizada.' },
  ];

  const organigramaItems = [
    { _id: 'org-1', area: 'Direccion medica', parentId: null, jefe: 'Visitante Demo', subjefe: 'Coordinacion clinica', orden: 1, activo: true, equipos: ['Calidad', 'Soporte'], puestos: [{ nombre: 'Direccion', personas: ['Visitante Demo'] }] },
    { _id: 'org-2', area: 'Consultorios externos', parentId: 'org-1', jefe: 'Dra. Laura Gomez', subjefe: 'Lucia Fernandez', orden: 2, activo: true, equipos: ['Admision', 'Programacion'], puestos: [{ nombre: 'Medicos staff', personas: ['Dra. Laura Gomez', 'Dr. Martin Ruiz'] }] },
    { _id: 'org-3', area: 'Enfermeria', parentId: 'org-1', jefe: 'Lic. Ana Perez', subjefe: '', orden: 3, activo: true, equipos: ['Calidad asistencial'], puestos: [{ nombre: 'Referentes', personas: ['Lic. Ana Perez'] }] },
  ];

  const organigramaAudit = [
    { _id: 'orgaudit-1', createdAt: daysFromNow(-4, 12, 0), action: 'update', actor: { nombre: 'Visitante Demo' }, targetArea: 'Consultorios externos', summary: 'Se actualizo el orden y responsables del bloque.' },
    { _id: 'orgaudit-2', createdAt: daysFromNow(-9, 15, 0), action: 'create', actor: { nombre: 'Visitante Demo' }, targetArea: 'Enfermeria', summary: 'Alta del bloque de calidad asistencial.' },
  ];

  const nursing = {
    contacts: [
      { _id: 'nc-1', nombre: 'Guardia adultos', rol: 'enfermero', interno: '3201', canal: 'radio', estado: 'disponible' },
      { _id: 'nc-2', nombre: 'UTI', rol: 'enfermero', interno: '4102', canal: 'telefono', estado: 'ocupado' },
      { _id: 'nc-3', nombre: 'Farmacia clinica', rol: 'admin', interno: '2500', canal: 'chat', estado: 'disponible' },
    ],
    woundPhotos: [
      { _id: 'wp-1', pacienteRef: 'Carlos Benitez', evolucion: 'Granulacion favorable', estado: 'seguimiento', createdAt: daysFromNow(-3, 9, 0), fotoUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=400&q=80' },
    ],
    initiatives: [
      { _id: 'ni-1', titulo: 'Pase de guardia estandarizado', descripcion: 'Implementar checklist unico por rama.', categoria: 'transversal', rama: 'Guardia', prioridad: 'alta', estado: 'en_progreso', responsable: 'Lic. Ana Perez', fechaObjetivo: daysFromNow(15, 8, 0) },
      { _id: 'ni-2', titulo: 'Tablero de camas diario', descripcion: 'Actualizacion de ocupacion por turno.', categoria: 'digitalizacion', rama: 'Internacion', prioridad: 'media', estado: 'pendiente', responsable: 'Lucia Fernandez', fechaObjetivo: daysFromNow(20, 8, 0) },
    ],
    checklists: [
      { _id: 'nch-1', rama: 'Guardia', turno: 'manana', pacientesAtendidos: 28, dotacionPlanificada: 8, dotacionPresente: 8, alertasCriticas: 2, cumplimientoProtocolos: 96, adherenciaCapacitacion: 91, observaciones: 'Turno estable', createdAt: daysFromNow(-1, 7, 0) },
      { _id: 'nch-2', rama: 'Internacion', turno: 'tarde', pacientesAtendidos: 22, dotacionPlanificada: 7, dotacionPresente: 6, alertasCriticas: 1, cumplimientoProtocolos: 89, adherenciaCapacitacion: 87, observaciones: 'Refuerzo requerido en medicacion', createdAt: daysFromNow(-2, 14, 0) },
    ],
    incidents: [
      { _id: 'nin-1', rama: 'Guardia', tipo: 'medicacion', severidad: 'media', descripcion: 'Doble chequeo detecto dosis incompleta.', pacienteRef: 'pat-1', acciones: 'Se corrigio antes de administrar.', estado: 'cerrado', createdAt: daysFromNow(-4, 10, 0) },
      { _id: 'nin-2', rama: 'Internacion', tipo: 'caida', severidad: 'baja', descripcion: 'Sin lesion. Se refuerza prevencion.', pacienteRef: 'pat-2', acciones: 'Reentrenamiento del equipo.', estado: 'seguimiento', createdAt: daysFromNow(-6, 11, 0) },
    ],
    config: {
      thresholds: {
        eventosPor1000: { greenMax: 5, yellowMax: 10 },
        respuestaMin: { greenMax: 15, yellowMax: 45 },
        cumplimientoChecklistPct: { yellowMin: 85, greenMin: 95 },
        ausentismoPct: { greenMax: 5, yellowMax: 10 },
        adherenciaCapacitacionPct: { yellowMin: 80, greenMin: 92 },
      },
      permissions: {
        canViewModule: true,
        canCreateChecklist: true,
        canCreateIncident: true,
        canManageIncidentStatus: true,
        canManageInitiatives: true,
        canConfigureThresholds: true,
      },
    },
  };

  const notifications = [
    { _id: 'noti-1', titulo: 'Turno confirmado', mensaje: 'Carlos Benitez confirmo asistencia a la consulta del lunes.', leido: false, tipo: 'reserva_confirmada', enlace: '/turnos', createdAt: daysFromNow(-1, 13, 0) },
    { _id: 'noti-2', titulo: 'Alerta operativa', mensaje: 'Cama UTI-01 en limpieza programada. Sector al 92% de ocupacion.', leido: false, tipo: 'sistema', createdAt: daysFromNow(-2, 9, 30) },
    { _id: 'noti-3', titulo: 'Orden medica pendiente', mensaje: 'Orden de laboratorio para Sofia Acuna requiere resultado urgente.', leido: false, tipo: 'orden_medica', enlace: '/ordenes-medicas', createdAt: daysFromNow(-1, 8, 0) },
    { _id: 'noti-4', titulo: 'Ticket de soporte', mensaje: 'SUP-101: Falla en impresora de recetas — critico — sin resolver.', leido: false, tipo: 'soporte', enlace: '/soporte', createdAt: daysFromNow(-3, 11, 0) },
    { _id: 'noti-5', titulo: 'Nueva teleconsulta programada', mensaje: 'Teleconsulta con Diego Peralta programada para manana a las 10:00.', leido: false, tipo: 'teleconsulta', enlace: '/teleconsultas', createdAt: daysFromNow(0, 17, 0) },
    { _id: 'noti-6', titulo: 'Receta lista para imprimir', mensaje: 'Receta de Florencia Rios fue generada y esta lista.', leido: true, tipo: 'receta', enlace: '/recetas', createdAt: daysFromNow(-4, 10, 0) },
    { _id: 'noti-7', titulo: 'Evaluacion de colega', mensaje: 'Dr. Martin Ruiz recibio una nueva valoracion de desempeno.', leido: true, tipo: 'valoracion', createdAt: daysFromNow(-5, 14, 30) },
  ];

  return {
    users,
    services,
    bookings,
    teleconsultas,
    ratings,
    privateComments,
    colleagueRatings,
    supportTickets,
    bedUnits,
    knowledgeArticles,
    recetas,
    recetaFavoritas,
    historiaClinica,
    ordenesMedicas,
    organigramaItems,
    organigramaAudit,
    nursing,
    notifications,
    counters: {
      booking: 100,
      teleconsulta: 100,
      ticket: 100,
      receta: 100,
      orden: 100,
      rating: 100,
      comment: 100,
      organigrama: 100,
      audit: 100,
      initiative: 100,
      checklist: 100,
      incident: 100,
      woundPhoto: 100,
      article: 100,
      notification: 100,
    },
  };
};

let demoState = buildInitialState();

const nextId = (key, prefix) => {
  demoState.counters[key] += 1;
  return `${prefix}-${demoState.counters[key]}`;
};

export const isDemoModeEnabled = () => {
  if (typeof window === 'undefined') return DEFAULT_DEMO_MODE;
  const override = window.localStorage.getItem('demoModeOverride');
  if (override === 'true') return true;
  if (override === 'false') return false;
  return DEFAULT_DEMO_MODE;
};

const getUser = (id) => demoState.users.find((item) => item._id === id || item.id === id) || null;
const getDoctor = (id) => getUser(id);
const getPatient = (id) => getUser(id);
const getService = (id) => demoState.services.find((item) => item._id === id) || null;

const enrichBooking = (booking) => ({
  ...booking,
  usuario: getPatient(booking.usuarioId),
  medico: getDoctor(booking.medicoId),
  servicio: getService(booking.servicioId),
});

const enrichTeleconsulta = (item) => ({
  ...item,
  paciente: getPatient(item.pacienteId),
  medico: getDoctor(item.medicoId),
});

const enrichOrden = (item) => ({
  ...item,
  paciente: getPatient(item.pacienteId),
  medico: getDoctor(item.medicoId),
});

const enrichReceta = (item) => ({
  ...item,
  paciente: getPatient(item.pacienteId),
  medico: getDoctor(item.medicoId),
});

const textIncludes = (haystack, query) => String(haystack || '').toLowerCase().includes(String(query || '').toLowerCase());

const computeBookingMetrics = (bookings) => {
  const byEstado = bookings.reduce((acc, booking) => {
    acc[booking.estado] = (acc[booking.estado] || 0) + 1;
    return acc;
  }, {});

  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const total = bookings.filter((booking) => String(booking.fecha).slice(0, 10) === key).length;
    return { label: date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), total };
  });

  return {
    total: bookings.length,
    todayTotal: bookings.filter((booking) => String(booking.fecha).slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    byEstado,
    trend,
  };
};

const computePatientSummaries = () => {
  const patients = demoState.users.filter((user) => user.rol === 'paciente');
  return patients.map((patient) => {
    const bookings = demoState.bookings.filter((item) => item.usuarioId === patient._id);
    const lastBooking = [...bookings].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0] || null;
    return {
      _id: patient._id,
      paciente: patient,
      totalTurnos: bookings.length,
      pendientes: bookings.filter((item) => ['pendiente', 'confirmada', 'reprogramada'].includes(item.estado)).length,
      ultimoTurno: lastBooking,
      obraSocial: patient.obraSocial || '-',
    };
  });
};

const computeBedMetrics = () => ({
  total: demoState.bedUnits.length,
  byEstado: demoState.bedUnits.reduce((acc, bed) => {
    acc[bed.estado] = (acc[bed.estado] || 0) + 1;
    return acc;
  }, {}),
});

const computeSupportMetrics = () => {
  const total = demoState.supportTickets.length;
  const withSurvey = demoState.supportTickets.filter((ticket) => ticket.encuesta?.puntuacion);
  const avgSurvey = withSurvey.length
    ? (withSurvey.reduce((acc, ticket) => acc + ticket.encuesta.puntuacion, 0) / withSurvey.length).toFixed(1)
    : 0;
  return {
    total,
    responseSlaPct: 94,
    resolutionSlaPct: 89,
    avgSurvey: Number(avgSurvey),
  };
};

const computeSupportAdvancedMetrics = () => ({
  kpis: {
    abiertos: demoState.supportTickets.filter((ticket) => ['abierto', 'en_progreso', 'en_espera'].includes(ticket.estado)).length,
    criticosAbiertos: demoState.supportTickets.filter((ticket) => ticket.criticidad === 'critico' && ticket.estado !== 'cerrado').length,
    ocupacionCamasPct: Math.round(((computeBedMetrics().byEstado.ocupada || 0) / Math.max(1, demoState.bedUnits.length)) * 100),
    teleconsultasProximas: demoState.teleconsultas.filter((item) => new Date(item.fechaProgramada) >= now).length,
  },
  alerts: [
    { id: 'al-1', severity: 'high', title: 'Backlog operativo', message: 'Hay tickets abiertos que requieren seguimiento antes de 24h.' },
    { id: 'al-2', severity: 'medium', title: 'Capacidad UTI', message: 'La ocupacion de areas criticas supera el umbral de observacion.' },
  ],
});

const computeNursingDashboard = () => ({
  windowDays: 30,
  kpis: {
    eventosAdversosPor1000PacientesDia: 4.2,
    tiempoRespuestaAlertasMin: 12,
    cumplimientoChecklistPct: 94,
    infeccionesAsistenciales: 1,
    ausentismoPct: 4,
    adherenciaCapacitacionPct: 90,
  },
  semaforoGlobal: {
    eventosAdversosPor1000PacientesDia: 'green',
    tiempoRespuestaAlertasMin: 'green',
    cumplimientoChecklistPct: 'yellow',
    ausentismoPct: 'green',
    adherenciaCapacitacionPct: 'yellow',
  },
  initiativesSummary: {
    total: demoState.nursing.initiatives.length,
    enProgreso: demoState.nursing.initiatives.filter((item) => item.estado === 'en_progreso').length,
  },
  branchSummary: [
    { rama: 'Guardia', incidentes: 3, cumplimientoProtocolos: 96, eventosPor1000: 3.1, semaforo: 'green' },
    { rama: 'Internacion', incidentes: 5, cumplimientoProtocolos: 89, eventosPor1000: 6.7, semaforo: 'yellow' },
  ],
  recentIncidents: deepClone(demoState.nursing.incidents.slice(0, 5)),
  recentChecklists: deepClone(demoState.nursing.checklists.slice(0, 5)),
  permissions: deepClone(demoState.nursing.config.permissions),
});

const computeNursingOrganigrama = () => ({
  hierarchy: [
    { _id: 'nh-1', rama: 'Guardia', responsable: 'Lic. Ana Perez', equipo: '12 personas', turno: 'Rotativo' },
    { _id: 'nh-2', rama: 'Internacion', responsable: 'Carla Medina', equipo: '10 personas', turno: 'Mixto' },
  ],
  branches: ['Guardia', 'Internacion', 'UTI', 'Pediatria'],
  byBranch: [
    { rama: 'Guardia', personal: 12, cobertura: 'Completa', referentes: ['Lic. Ana Perez'] },
    { rama: 'Internacion', personal: 10, cobertura: 'Ajustada', referentes: ['Carla Medina'] },
  ],
  total: 22,
});

const computeNursingWorkload = () => ({
  overview: { pacientes: 50, dotacionPresente: 18, alertasCriticas: 3, ocupacionPct: 87 },
  porRama: [
    { rama: 'Guardia', pacientes: 18, dotacion: 7, indice: 2.6 },
    { rama: 'Internacion', pacientes: 22, dotacion: 8, indice: 2.75 },
    { rama: 'UTI', pacientes: 10, dotacion: 3, indice: 3.33 },
  ],
});

const listDoctors = (query = '') => {
  const doctors = demoState.users.filter((user) => user.rol === 'medico');
  if (!query) return doctors;
  return doctors.filter((doctor) => textIncludes(`${doctor.nombre} ${doctor.especialidad}`, query));
};

const listPatients = (query = '') => {
  const patients = demoState.users.filter((user) => user.rol === 'paciente');
  if (!query) return patients;
  return patients.filter((patient) => textIncludes(`${patient.nombre} ${patient.email} ${patient.obraSocial}`, query));
};

const getDoctorSchedule = (doctorId) => {
  const doctor = getDoctor(doctorId);
  return doctor?.horariosAtencion || [{ dia: 'Lunes', horaInicio: '09:00', horaFin: '13:00' }];
};

const getDisponibilidadMock = (doctorId, dateValue) => {
  const date = dateValue ? new Date(`${dateValue}T09:00:00`) : new Date();
  const day = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date).toLowerCase();
  const schedule = getDoctorSchedule(doctorId).filter((slot) => String(slot.dia || '').toLowerCase() === day);
  const hours = schedule.length ? ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] : ['14:00', '14:30', '15:00'];
  return { slots: hours };
};

const getProximasFechasMock = (doctorId, dias = 45) => {
  const fechas = [];
  for (let index = 0; index < dias && fechas.length < 8; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    fechas.push({ value: iso, label: formatDateLabel(date), slots: getDisponibilidadMock(doctorId, iso).slots.length });
  }
  return { fechas };
};

const getAgendaSemanalMock = (doctorId) => ({
  schedule: getDoctorSchedule(doctorId).reduce((acc, slot) => {
    const key = String(slot.dia || '').toLowerCase();
    acc[key] = acc[key] || [];
    acc[key].push({ horaInicio: slot.horaInicio, horaFin: slot.horaFin });
    return acc;
  }, {}),
});

const response = (config, data, status = 200) => Promise.resolve({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config,
  request: { mock: true },
});

const getParams = (config, url) => {
  const parsedUrl = new URL(url, 'http://demo.local');
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  return { ...query, ...(config.params || {}) };
};

const cleanPath = (url) => {
  const parsedUrl = new URL(url, 'http://demo.local');
  return parsedUrl.pathname.replace(/^\/api/, '');
};

export const mockApiRequest = async (config) => {
  const method = String(config.method || 'get').toLowerCase();
  const path = cleanPath(config.url || '/');
  const params = getParams(config, config.url || '/');
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {});

  if (method === 'delete') {
    return response(config, {
      ok: true,
      _demoBlocked: true,
      message: 'Accion bloqueada en modo demo. Los datos ficticios no se eliminan.',
      path,
    });
  }

  if (method === 'get' && path === '/auth/me') {
    return response(config, { user: getUser('demo-user') });
  }
  if (method === 'put' && path === '/auth/me') {
    const current = getUser('demo-user');
    Object.assign(current, body || {});
    return response(config, { user: deepClone(current) });
  }
  if (method === 'post' && (path === '/auth/login' || path === '/auth/register' || path === '/auth/logout')) {
    return response(config, { user: getUser('demo-user'), ok: true });
  }

  if (method === 'get' && path === '/doctors') {
    return response(config, deepClone(listDoctors(params.search || params.q || '')));
  }
  if (method === 'post' && path === '/doctors') {
    const created = { _id: nextId('organigrama', 'med'), rol: 'medico', ...body };
    demoState.users.push(created);
    return response(config, deepClone(created));
  }
  if (/^\/doctors\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    const doctor = getDoctor(id);
    if (method === 'get') return response(config, deepClone(doctor));
    if (method === 'put') {
      Object.assign(doctor, body || {});
      return response(config, deepClone(doctor));
    }
    if (method === 'delete') {
      demoState.users = demoState.users.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (/^\/medicos\/[^/]+\/disponibilidad$/.test(path) && method === 'get') {
    const doctorId = path.split('/')[2];
    return response(config, getDisponibilidadMock(doctorId, params.fecha));
  }
  if (/^\/medicos\/[^/]+\/proximas-fechas$/.test(path) && method === 'get') {
    const doctorId = path.split('/')[2];
    return response(config, getProximasFechasMock(doctorId, Number(params.dias || 45)));
  }
  if (/^\/medicos\/[^/]+\/agenda\/semanal$/.test(path) && method === 'get') {
    const doctorId = path.split('/')[2];
    return response(config, getAgendaSemanalMock(doctorId));
  }
  if (/^\/medicos\/[^/]+\/perfil-publico$/.test(path) && method === 'get') {
    const doctorId = path.split('/')[2];
    const doctor = getDoctor(doctorId);
    return response(config, {
      nombre: doctor?.nombre,
      bio: doctor?.bio,
      fotoPerfil: doctor?.fotoPerfil,
      horariosAtencion: doctor?.horariosAtencion || [],
      direccionConsultorio: doctor?.direccionConsultorioPublica || doctor?.direccionConsultorio,
      mapaEmbed: doctor?.mapaEmbed || '',
      redesSociales: doctor?.redesSociales || {},
    });
  }

  if (method === 'get' && path === '/services') {
    return response(config, deepClone(demoState.services));
  }
  if (method === 'post' && path === '/services') {
    const created = { _id: nextId('article', 'srv'), ...body };
    demoState.services.push(created);
    return response(config, deepClone(created));
  }
  if (/^\/services\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    if (method === 'put') {
      const current = getService(id);
      Object.assign(current, body || {});
      return response(config, deepClone(current));
    }
    if (method === 'delete') {
      demoState.services = demoState.services.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (method === 'get' && path === '/bookings') {
    let rows = demoState.bookings.map(enrichBooking);
    if (params.estado) rows = rows.filter((item) => item.estado === params.estado);
    if (params.usuario) rows = rows.filter((item) => item.usuario?._id === params.usuario);
    const page = Number(params.page || 1);
    const limit = Number(params.limit || rows.length || 10);
    const start = (page - 1) * limit;
    return response(config, { bookings: deepClone(rows.slice(start, start + limit)), total: rows.length, page, limit });
  }
  if (method === 'post' && path === '/bookings') {
    const created = {
      _id: nextId('booking', 'book'),
      usuarioId: body.usuario || body.usuarioId || 'pat-1',
      medicoId: body.medico || body.medicoId,
      servicioId: body.servicio || body.servicioId,
      fecha: body.fecha,
      hora: body.hora,
      estado: 'pendiente',
      notas: body.notas || '',
      createdAt: new Date().toISOString(),
    };
    demoState.bookings.unshift(created);
    return response(config, { booking: deepClone(enrichBooking(created)) }, 201);
  }
  if (method === 'get' && path === '/bookings/metrics') {
    return response(config, computeBookingMetrics(demoState.bookings));
  }
  if (method === 'get' && path === '/bookings/patient-summaries') {
    return response(config, computePatientSummaries());
  }
  if (/^\/bookings\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    const current = demoState.bookings.find((item) => item._id === id);
    if (method === 'put') {
      Object.assign(current, body || {});
      return response(config, { booking: deepClone(enrichBooking(current)) });
    }
    if (method === 'delete') {
      demoState.bookings = demoState.bookings.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (method === 'post' && path === '/pagos/crear-preferencia') {
    return response(config, { init_point: 'https://frontend-iota-sooty-49.vercel.app/dashboard?demoPago=ok' });
  }

  if (method === 'get' && path === '/patients') {
    return response(config, deepClone(listPatients(params.search || '')));
  }
  if (method === 'post' && path === '/patients') {
    const created = { _id: nextId('organigrama', 'pat'), rol: 'paciente', ...body };
    demoState.users.push(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/patients\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    const patient = getPatient(id);
    if (method === 'put') {
      Object.assign(patient, body || {});
      return response(config, deepClone(patient));
    }
    if (method === 'delete') {
      demoState.users = demoState.users.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (method === 'get' && path === '/teleconsultas/mis') {
    return response(config, deepClone(demoState.teleconsultas.map(enrichTeleconsulta)));
  }
  if (method === 'post' && path === '/teleconsultas') {
    const created = {
      _id: nextId('teleconsulta', 'tele'),
      pacienteId: body.pacienteId || body.paciente || 'pat-1',
      medicoId: body.medicoId || body.medico || 'med-1',
      fechaProgramada: body.fechaProgramada || daysFromNow(2, 17, 0),
      enlaceSala: body.enlaceSala || 'https://meet.example/demo-nueva',
      estado: 'programada',
      motivo: body.motivo || 'Teleconsulta demo',
      createdAt: new Date().toISOString(),
    };
    demoState.teleconsultas.unshift(created);
    return response(config, deepClone(enrichTeleconsulta(created)), 201);
  }
  if (/^\/teleconsultas\/[^/]+\/estado$/.test(path) && method === 'put') {
    const id = path.split('/')[2];
    const current = demoState.teleconsultas.find((item) => item._id === id);
    Object.assign(current, body || {});
    return response(config, deepClone(enrichTeleconsulta(current)));
  }

  if (method === 'get' && path === '/users') {
    let rows = [...demoState.users];
    if (params.search) rows = rows.filter((item) => textIncludes(`${item.nombre} ${item.email} ${item.rol}`, params.search));
    return response(config, deepClone(rows));
  }
  if (method === 'get' && path === '/users/buscar') {
    let rows = [...demoState.users];
    if (params.rol) rows = rows.filter((item) => item.rol === params.rol);
    if (params.search) rows = rows.filter((item) => textIncludes(`${item.nombre} ${item.email}`, params.search));
    return response(config, deepClone(rows));
  }
  if (/^\/users\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    const current = getUser(id);
    if (method === 'put') {
      Object.assign(current, body || {});
      return response(config, deepClone(current));
    }
    if (method === 'delete') {
      demoState.users = demoState.users.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (method === 'get' && path === '/ratings/medico/med-1') {
    return response(config, deepClone(demoState.ratings.filter((item) => item.medicoId === 'med-1')));
  }
  if (/^\/ratings\/medico\/[^/]+$/.test(path) && method === 'get') {
    const medicoId = path.split('/')[3];
    return response(config, deepClone(demoState.ratings.filter((item) => item.medicoId === medicoId)));
  }
  if (/^\/ratings\/mio\/[^/]+$/.test(path) && method === 'get') {
    const medicoId = path.split('/')[3];
    const mine = demoState.ratings.find((item) => item.medicoId === medicoId && item.userId === 'pat-1') || null;
    return response(config, deepClone(mine));
  }
  if (/^\/ratings\/medico\/[^/]+$/.test(path) && method === 'post') {
    const medicoId = path.split('/')[3];
    const created = { _id: nextId('rating', 'rat'), medicoId, userId: 'pat-1', calificacion: body.calificacion, comentario: body.comentario || '' };
    demoState.ratings.push(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/ratings\/[^/]+$/.test(path) && method === 'delete') {
    const id = path.split('/')[2];
    demoState.ratings = demoState.ratings.filter((item) => item._id !== id);
    return response(config, { ok: true });
  }

  if (/^\/comentarios-privados\/medico\/[^/]+$/.test(path)) {
    const targetId = path.split('/')[3];
    if (method === 'get') {
      return response(config, deepClone(demoState.privateComments.filter((item) => item.targetUserId === targetId || item.medicoId === targetId)));
    }
    if (method === 'post') {
      const created = { _id: nextId('comment', 'pc'), medicoId: targetId, targetUserId: targetId, authorId: 'demo-user', contenido: body.contenido, createdAt: new Date().toISOString() };
      demoState.privateComments.unshift(created);
      return response(config, deepClone(created), 201);
    }
  }
  if (/^\/comentarios-privados\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    const current = demoState.privateComments.find((item) => item._id === id);
    if (method === 'put') {
      Object.assign(current, body || {});
      return response(config, deepClone(current));
    }
    if (method === 'delete') {
      demoState.privateComments = demoState.privateComments.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (method === 'get' && path === '/colleague-ratings/staff-directory') {
    return response(config, deepClone(demoState.users.filter((item) => item.rol !== 'paciente')));
  }
  if (/^\/colleague-ratings\/user\/[^/]+\/summary$/.test(path) && method === 'get') {
    const targetUserId = path.split('/')[3];
    const rows = demoState.colleagueRatings.filter((item) => item.targetUserId === targetUserId);
    const totals = {};
    rows.forEach((row) => {
      Object.entries(row.categories || {}).forEach(([key, value]) => {
        totals[key] = totals[key] || [];
        totals[key].push(value);
      });
    });
    const categoryAverages = Object.fromEntries(Object.entries(totals).map(([key, values]) => [key, values.reduce((acc, value) => acc + value, 0) / values.length]));
    const ratings = rows.map((row) => ({ ...row, autor: getUser(row.authorId) }));
    const myRatings = ratings.filter((row) => row.authorId === 'demo-user');
    const avgValues = Object.values(categoryAverages);
    return response(config, {
      average: avgValues.length ? Number((avgValues.reduce((acc, value) => acc + value, 0) / avgValues.length).toFixed(1)) : 0,
      total: ratings.length,
      ratings: deepClone(ratings),
      myRating: myRatings[0] || null,
      myRatings: deepClone(myRatings),
      categoryAverages,
    });
  }
  if (/^\/colleague-ratings\/user\/[^/]+$/.test(path) && method === 'post') {
    const targetUserId = path.split('/')[3];
    const created = { _id: nextId('rating', 'cr'), targetUserId, authorId: 'demo-user', comentario: body.comentario || '', estado: 'cerrado', categories: body.categories || {}, createdAt: new Date().toISOString() };
    demoState.colleagueRatings.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/colleague-ratings\/records$/.test(path) && method === 'get') {
    return response(config, deepClone(demoState.colleagueRatings.map((row) => ({ ...row, targetUser: getUser(row.targetUserId), author: getUser(row.authorId) }))));
  }
  if (/^\/colleague-ratings\/[^/]+$/.test(path) && method === 'delete') {
    const id = path.split('/')[2];
    demoState.colleagueRatings = demoState.colleagueRatings.filter((item) => item._id !== id);
    return response(config, { ok: true });
  }

  if (method === 'get' && path === '/support/metrics') {
    return response(config, computeSupportMetrics());
  }
  if (method === 'get' && path === '/support/metrics/advanced') {
    return response(config, computeSupportAdvancedMetrics());
  }
  if (method === 'get' && path === '/support/tickets') {
    let rows = [...demoState.supportTickets];
    if (params.criticidad) rows = rows.filter((item) => item.criticidad === params.criticidad);
    if (params.estado) rows = rows.filter((item) => item.estado === params.estado);
    if (params.soporteNivel) rows = rows.filter((item) => item.soporteNivel === params.soporteNivel);
    if (params.tipoGestion) rows = rows.filter((item) => item.tipoGestion === params.tipoGestion);
    if (params.q) rows = rows.filter((item) => textIncludes(`${item.titulo} ${item.descripcion} ${(item.tags || []).join(' ')}`, params.q));
    return response(config, deepClone(rows));
  }
  if (method === 'post' && (path === '/support/tickets' || path === '/support/cobertura')) {
    const created = { _id: nextId('ticket', 'tick'), codigo: `SUP-${demoState.counters.ticket}`, estado: 'abierto', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
    demoState.supportTickets.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/support\/tickets\/[^/]+\/survey$/.test(path) && method === 'post') {
    const id = path.split('/')[3];
    const current = demoState.supportTickets.find((item) => item._id === id);
    current.encuesta = body;
    return response(config, deepClone(current));
  }
  if (/^\/support\/tickets\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/')[3];
    const current = demoState.supportTickets.find((item) => item._id === id);
    Object.assign(current, body || {}, { updatedAt: new Date().toISOString() });
    return response(config, deepClone(current));
  }
  if (method === 'get' && path === '/support/kb/articles') {
    let rows = [...demoState.knowledgeArticles];
    if (params.estado) rows = rows.filter((item) => item.estado === params.estado);
    return response(config, deepClone(rows));
  }
  if (method === 'post' && path === '/support/kb/articles') {
    const created = { _id: nextId('article', 'kb'), estado: 'publicado', version: 1, updatedAt: new Date().toISOString(), ...body };
    demoState.knowledgeArticles.unshift(created);
    return response(config, deepClone(created), 201);
  }

  if (method === 'get' && path === '/censo-camas') {
    return response(config, { metrics: computeBedMetrics(), beds: deepClone(demoState.bedUnits) });
  }
  if (method === 'post' && path === '/censo-camas') {
    const created = { _id: nextId('organigrama', 'bed'), updatedAt: new Date().toISOString(), ...body };
    demoState.bedUnits.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/censo-camas\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/')[2];
    const current = demoState.bedUnits.find((item) => item._id === id);
    Object.assign(current, body || {}, { updatedAt: new Date().toISOString() });
    return response(config, deepClone(current));
  }

  if (method === 'get' && path === '/organigrama') {
    let rows = [...demoState.organigramaItems];
    if (params.status === 'activos') rows = rows.filter((item) => item.activo !== false);
    if (params.status === 'inactivos') rows = rows.filter((item) => item.activo === false);
    if (params.q) rows = rows.filter((item) => textIncludes(`${item.area} ${item.jefe} ${item.subjefe} ${(item.equipos || []).join(' ')}`, params.q));
    const page = Number(params.page || 1);
    const limit = Number(params.limit || rows.length || 12);
    const start = (page - 1) * limit;
    return response(config, { items: deepClone(rows.slice(start, start + limit)), meta: { page, limit, totalItems: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / limit)) } });
  }
  if (method === 'get' && path === '/organigrama/audit') {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 10);
    const start = (page - 1) * limit;
    return response(config, { items: deepClone(demoState.organigramaAudit.slice(start, start + limit)), meta: { page, limit, totalItems: demoState.organigramaAudit.length, totalPages: Math.max(1, Math.ceil(demoState.organigramaAudit.length / limit)) } });
  }
  if (method === 'post' && path === '/organigrama') {
    const created = { _id: nextId('organigrama', 'org'), ...body };
    demoState.organigramaItems.push(created);
    demoState.organigramaAudit.unshift({ _id: nextId('audit', 'orgaudit'), createdAt: new Date().toISOString(), action: 'create', actor: { nombre: 'Visitante Demo' }, targetArea: created.area, summary: 'Creacion de area en demo.' });
    return response(config, deepClone(created), 201);
  }
  if (method === 'put' && path === '/organigrama/reorder') {
    const items = Array.isArray(body.items) ? body.items : [];
    items.forEach((item, index) => {
      const current = demoState.organigramaItems.find((row) => row._id === item._id);
      if (current) current.orden = index + 1;
    });
    return response(config, { ok: true });
  }
  if (/^\/organigrama\/[^/]+$/.test(path)) {
    const id = path.split('/')[2];
    const current = demoState.organigramaItems.find((item) => item._id === id);
    if (method === 'put') {
      Object.assign(current, body || {});
      return response(config, deepClone(current));
    }
    if (method === 'delete') {
      demoState.organigramaItems = demoState.organigramaItems.filter((item) => item._id !== id);
      return response(config, { ok: true });
    }
  }

  if (method === 'get' && path === '/enfermeria/catalog') {
    return response(config, { branches: ['Guardia', 'Internacion', 'UTI', 'Pediatria'], hierarchy: computeNursingOrganigrama().hierarchy });
  }
  if (method === 'get' && path === '/enfermeria/dashboard') {
    return response(config, computeNursingDashboard());
  }
  if (method === 'get' && path === '/enfermeria/organigrama') {
    return response(config, computeNursingOrganigrama());
  }
  if (method === 'get' && path === '/enfermeria/workload') {
    return response(config, computeNursingWorkload());
  }
  if (method === 'post' && path === '/enfermeria/ayuda-rapida') {
    return response(config, { ok: true, ticket: { _id: nextId('ticket', 'help'), ...body } }, 201);
  }
  if (method === 'get' && path === '/enfermeria/config') {
    return response(config, deepClone(demoState.nursing.config));
  }
  if (method === 'put' && path === '/enfermeria/config') {
    demoState.nursing.config = { ...demoState.nursing.config, ...body };
    return response(config, deepClone(demoState.nursing.config));
  }
  if (method === 'get' && path === '/enfermeria/initiatives') {
    return response(config, { items: deepClone(demoState.nursing.initiatives) });
  }
  if (method === 'post' && path === '/enfermeria/initiatives') {
    const created = { _id: nextId('initiative', 'ni'), ...body };
    demoState.nursing.initiatives.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/enfermeria\/initiatives\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/')[3];
    const current = demoState.nursing.initiatives.find((item) => item._id === id);
    Object.assign(current, body || {});
    return response(config, deepClone(current));
  }
  if (method === 'get' && path === '/enfermeria/checklists') {
    return response(config, { items: deepClone(demoState.nursing.checklists) });
  }
  if (method === 'post' && path === '/enfermeria/checklists') {
    const created = { _id: nextId('checklist', 'nch'), createdAt: new Date().toISOString(), ...body };
    demoState.nursing.checklists.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (method === 'get' && path === '/enfermeria/incidents') {
    return response(config, { items: deepClone(demoState.nursing.incidents) });
  }
  if (method === 'post' && path === '/enfermeria/incidents') {
    const created = { _id: nextId('incident', 'nin'), estado: 'abierto', createdAt: new Date().toISOString(), ...body };
    demoState.nursing.incidents.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/enfermeria\/incidents\/[^/]+\/status$/.test(path) && method === 'put') {
    const id = path.split('/')[3];
    const current = demoState.nursing.incidents.find((item) => item._id === id);
    current.estado = body.estado || current.estado;
    current.resultado = body.resultado || current.resultado;
    return response(config, deepClone(current));
  }
  if (method === 'get' && path === '/enfermeria/contacts') {
    return response(config, deepClone(demoState.nursing.contacts));
  }
  if (method === 'get' && path === '/enfermeria/wound-photos') {
    return response(config, deepClone(demoState.nursing.woundPhotos));
  }
  if (method === 'post' && path === '/enfermeria/wound-photos') {
    const created = { _id: nextId('woundPhoto', 'wp'), createdAt: new Date().toISOString(), fotoUrl: body.fotoUrl || demoState.nursing.woundPhotos[0]?.fotoUrl, ...body };
    demoState.nursing.woundPhotos.unshift(created);
    return response(config, deepClone(created), 201);
  }
  if (/^\/enfermeria\/wound-photos\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/')[3];
    const current = demoState.nursing.woundPhotos.find((item) => item._id === id);
    Object.assign(current, body || {});
    return response(config, deepClone(current));
  }

  if (method === 'get' && path === '/ordenes-medicas') {
    let rows = demoState.ordenesMedicas.map(enrichOrden);
    if (params.estado) rows = rows.filter((item) => item.estado === params.estado);
    if (params.tipo) rows = rows.filter((item) => item.tipo === params.tipo);
    if (params.prioridad) rows = rows.filter((item) => item.prioridad === params.prioridad);
    return response(config, deepClone(rows));
  }
  if (/^\/ordenes-medicas\/paciente\/[^/]+$/.test(path) && method === 'get') {
    const patientId = path.split('/')[3];
    return response(config, deepClone(demoState.ordenesMedicas.filter((item) => item.pacienteId === patientId).map(enrichOrden)));
  }
  if (method === 'post' && path === '/ordenes-medicas') {
    const created = { _id: nextId('orden', 'ord'), medicoId: 'med-1', pacienteId: body.paciente, estado: 'solicitada', resultadoResumen: '', ...body };
    demoState.ordenesMedicas.unshift(created);
    return response(config, deepClone(enrichOrden(created)), 201);
  }
  if (/^\/ordenes-medicas\/[^/]+\/estado$/.test(path) && method === 'put') {
    const id = path.split('/')[2];
    const current = demoState.ordenesMedicas.find((item) => item._id === id);
    Object.assign(current, body || {});
    return response(config, deepClone(enrichOrden(current)));
  }

  if (method === 'get' && path === '/recetas/favoritas') {
    return response(config, deepClone(demoState.recetaFavoritas));
  }
  if (method === 'get' && path === '/recetas/mis') {
    return response(config, deepClone(demoState.recetas.filter((item) => item.pacienteId === 'pat-1').map(enrichReceta)));
  }
  if (/^\/recetas\/paciente\/[^/]+$/.test(path) && method === 'get') {
    const patientId = path.split('/')[3];
    return response(config, deepClone(demoState.recetas.filter((item) => item.pacienteId === patientId).map(enrichReceta)));
  }
  if (method === 'post' && path === '/recetas') {
    const created = { _id: nextId('receta', 'rec'), pacienteId: body.paciente, medicoId: 'med-1', createdAt: new Date().toISOString(), ...body };
    demoState.recetas.unshift(created);
    if (body.esFavorita) {
      demoState.recetaFavoritas.unshift({ _id: nextId('receta', 'fav'), nombre: body.diagnosticoPrincipal || 'Nueva favorita', medicamentos: body.medicamentos || [] });
    }
    return response(config, { ...deepClone(enrichReceta(created)), safetyAlerts: [{ severity: 'media', message: 'Verificar interacciones con medicacion cronica antes de imprimir.' }] }, 201);
  }

  if (/^\/historia-clinica\/paciente\/[^/]+\/longitudinal$/.test(path) && method === 'get') {
    const patientId = path.split('/')[3];
    const records = deepClone(demoState.historiaClinica.filter((item) => item.pacienteId === patientId));
    const summary = {
      total: records.length,
      criticos: records.filter((r) => r.flags?.esCritico).length,
      requiereSeguimiento: records.filter((r) => r.flags?.requiereSeguimiento).length,
    };
    return response(config, { records, summary });
  }
  if (/^\/historia-clinica\/paciente\/[^/]+$/.test(path) && method === 'get') {
    const patientId = path.split('/')[3];
    return response(config, deepClone(demoState.historiaClinica.filter((item) => item.pacienteId === patientId)));
  }
  if (method === 'post' && path === '/historia-clinica') {
    const created = { _id: nextId('article', 'hc'), fecha: new Date().toISOString(), ...body };
    demoState.historiaClinica.unshift(created);
    return response(config, deepClone(created), 201);
  }

  if (method === 'get' && path === '/notificaciones') {
    const notificaciones = deepClone(demoState.notifications);
    return response(config, { notificaciones, noLeidas: notificaciones.filter((item) => !item.leido).length });
  }
  if (/^\/notificaciones\/[^/]+$/.test(path) && method === 'put') {
    const id = path.split('/')[2];
    const current = demoState.notifications.find((item) => item._id === id);
    if (current) current.leido = true;
    return response(config, { ok: true });
  }
  if (path === '/notificaciones/marcar-todas-leidas' && method === 'patch') {
    demoState.notifications = demoState.notifications.map((item) => ({ ...item, leido: true }));
    return response(config, { ok: true });
  }

  return response(config, {});
};

export const resetDemoState = () => {
  demoState = buildInitialState();
};