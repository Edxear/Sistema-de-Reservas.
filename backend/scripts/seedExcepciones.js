const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');

const User = require('../models/User');
const AgendaExcepcion = require('../models/AgendaExcepcion');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: Falta MONGODB_URI en .env');
  process.exit(1);
}

/**
 * Carga excepciones iniciales (feriados, cierre de consultorio, etc.)
 */
async function seedExcepciones() {
  try {
    console.log('='.repeat(60));
    console.log('CARGANDO EXCEPCIONES INICIALES');
    console.log('='.repeat(60));

    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado a MongoDB\n');

    // Leer archivo de excepciones
    const excepcionesPath = path.resolve(__dirname, '../seeds/excepciones-iniciales.json');
    const excepcionesData = JSON.parse(fs.readFileSync(excepcionesPath, 'utf-8'));

    console.log(`Encontradas ${excepcionesData.length} excepciones a cargar\n`);

    // Obtener todos los médicos
    const medicos = await User.find({ rol: 'medico' });
    console.log(`Encontrados ${medicos.length} médicos\n`);

    if (medicos.length === 0) {
      console.log('⚠ No hay médicos en la BD. Cargando solo excepciones globales.\n');
    }

    let excepcionesCreadas = 0;
    let errores = 0;

    // Por cada excepción en el archivo
    for (const excepcionData of excepcionesData) {
      const { tipoExcepcion, fecha, razon, aplicaATodos } = excepcionData;

      console.log(`Procesando excepción: ${tipoExcepcion} - ${fecha}`);

      try {
        if (aplicaATodos && medicos.length > 0) {
          // Crear para todos los médicos
          for (const medico of medicos) {
            const excepcion = new AgendaExcepcion({
              medico: medico._id,
              fecha: new Date(fecha),
              tipoExcepcion,
              disponible: false,
              razon: razon || 'Feriado o cierre de consultorio'
            });
            await excepcion.save();
          }
          console.log(`  ✓ Creada para ${medicos.length} médicos\n`);
          excepcionesCreadas += medicos.length;
        } else {
          // Información para que el admin la cree manualmente
          console.log(`  → Excepción requiere asignación manual a médicos específicos\n`);
        }
      } catch (error) {
        errores += 1;
        console.error(`  ✗ Error: ${error.message}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log('RESULTADO');
    console.log('='.repeat(60));
    console.log(`Excepciones creadas: ${excepcionesCreadas}`);
    console.log(`Errores: ${errores}`);
    console.log('='.repeat(60));

    await mongoose.connection.close();
    process.exit(errores === 0 ? 0 : 1);
  } catch (error) {
    console.error('ERROR CRÍTICO:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar
seedExcepciones();
