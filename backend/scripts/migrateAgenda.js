const mongoose = require('mongoose');
const loadEnv = require('../config/loadEnv');

const User = require('../models/User');
const AgendaMedica = require('../models/AgendaMedica');

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: Falta MONGODB_URI en .env');
  process.exit(1);
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

/**
 * Normaliza texto: quita acentos y convierte a minúsculas
 */
function normalizarTexto(texto = '') {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Obtiene el número del día (0-6) a partir del nombre del día
 * Ejemplo: "Lunes" → 1, "Domingo" → 0
 */
function getDiaNumero(nombreDia) {
  const nombreNormalizado = normalizarTexto(nombreDia);
  const index = DIAS_SEMANA.findIndex((d) => normalizarTexto(d) === nombreNormalizado);
  return index >= 0 ? index : null;
}

/**
 * Ejecuta la migración de horariosAtencion → AgendaMedica
 */
async function migrateAgenda() {
  try {
    console.log('='.repeat(60));
    console.log('INICIANDO MIGRACIÓN: horariosAtencion → AgendaMedica');
    console.log('='.repeat(60));

    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado a MongoDB\n');

    // Obtener todos los médicos con horariosAtencion
    const medicosConHorarios = await User.find({
      rol: 'medico',
      horariosAtencion: { $exists: true, $ne: [] }
    });

    console.log(`Encontrados ${medicosConHorarios.length} médicos con horariosAtencion\n`);

    if (medicosConHorarios.length === 0) {
      console.log('⚠ No hay médicos para migrar. Fin de la operación.');
      await mongoose.connection.close();
      return;
    }

    let totalAgendasCreadas = 0;
    let medicosFailidos = 0;

    // Por cada médico
    for (let i = 0; i < medicosConHorarios.length; i += 1) {
      const medico = medicosConHorarios[i];
      console.log(`[${i + 1}/${medicosConHorarios.length}] Migrando: ${medico.nombre} (${medico.email})`);

      try {
        const horariosAtencion = medico.horariosAtencion || [];
        let agendasDelMedico = 0;

        // Por cada horario en horariosAtencion
        for (const horario of horariosAtencion) {
          const { dia: nombreDia, horaInicio, horaFin } = horario;

          // Validar estructura
          if (!nombreDia || !horaInicio || !horaFin) {
            console.warn(`  ⚠ Horario inválido (faltantes), saltando: ${JSON.stringify(horario)}`);
            continue;
          }

          // Convertir nombre día a número
          const diaNumero = getDiaNumero(nombreDia);
          if (diaNumero === null) {
            console.warn(`  ⚠ Día inválido "${nombreDia}", saltando`);
            continue;
          }

          // Verificar si ya existe esto para este médico
          const existente = await AgendaMedica.findOne({
            medico: medico._id,
            tipo: 'fijo',
            dia: diaNumero
          });

          if (existente) {
            console.log(`  → Ya existe agenda para ${DIAS_SEMANA[diaNumero]}, actualizando`);
            existente.horaInicio = horaInicio;
            existente.horaFin = horaFin;
            existente.disponible = true;
            await existente.save();
          } else {
            // Crear nueva agenda
            const newAgenda = new AgendaMedica({
              medico: medico._id,
              tipo: 'fijo',
              dia: diaNumero,
              horaInicio,
              horaFin,
              disponible: true,
              razon: 'Migración desde horariosAtencion'
            });
            await newAgenda.save();
          }

          agendasDelMedico += 1;
          totalAgendasCreadas += 1;
        }

        // Marcar médico como migrado
        medico.agendaConfiguracion = {
          tipo: 'nueva_agenda',
          migradoEl: new Date()
        };
        await medico.save();

        console.log(`  ✓ ${agendasDelMedico} horario(s) migrado(s)\n`);
      } catch (error) {
        medicosFailidos += 1;
        console.error(`  ✗ Error migrando ${medico.nombre}: ${error.message}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log('RESULTADO DE LA MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`Total de agendas creadas: ${totalAgendasCreadas}`);
    console.log(`Médicos procesados correctamente: ${medicosConHorarios.length - medicosFailidos}`);
    console.log(`Médicos con error: ${medicosFailidos}`);
    console.log('='.repeat(60));

    if (medicosFailidos === 0) {
      console.log('✓ MIGRACIÓN COMPLETADA SIN ERRORES!');
    } else {
      console.log(`⚠ MIGRACIÓN COMPLETADA CON ${medicosFailidos} ERROR(ES)`);
    }

    await mongoose.connection.close();
    process.exit(medicosFailidos === 0 ? 0 : 1);
  } catch (error) {
    console.error('ERROR CRÍTICO:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar
migrateAgenda();
