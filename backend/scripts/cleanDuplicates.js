const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Organigrama = require('../models/Organigrama');

async function cleanDuplicates() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema_reservas');
    
    console.log('🔍 Buscando duplicados en organigramas...');
    
    // Obtener todos los organigramas
    const allOrganizaciones = await Organigrama.find();
    console.log(`📊 Total de registros: ${allOrganizaciones.length}`);
    
    // Agrupar por nombre y departamento
    const grouped = {};
    allOrganizaciones.forEach(org => {
      const key = `${org.nombre}|${org.departamento || 'sin-dept'}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(org);
    });
    
    // Encontrar duplicados
    let duplicateCount = 0;
    const toDelete = [];
    
    Object.entries(grouped).forEach(([key, items]) => {
      if (items.length > 1) {
        console.log(`\n⚠️  Duplicados encontrados: "${key}" (${items.length} registros)`);
        // Mantener el primero, marcar el resto para borrar
        const [first, ...rest] = items;
        rest.forEach(item => {
          console.log(`   Eliminando: ${item._id}`);
          toDelete.push(item._id);
        });
        duplicateCount += rest.length;
      }
    });
    
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Eliminando ${toDelete.length} duplicados...`);
      const result = await Organigrama.deleteMany({ _id: { $in: toDelete } });
      console.log(`✅ Eliminados: ${result.deletedCount} registros`);
    } else {
      console.log('✅ No hay duplicados');
    }
    
    // Mostrar estado final
    const finalCount = await Organigrama.countDocuments();
    console.log(`\n📈 Estado final: ${finalCount} registros únicos`);
    
    // Listar todos los registros finales
    const finalOrganizaciones = await Organigrama.find().select('nombre departamento puesto');
    console.log('\n📋 Registros finales:');
    finalOrganizaciones.forEach((org, idx) => {
      console.log(`  ${idx + 1}. ${org.nombre} - ${org.departamento || 'N/A'} - ${org.puesto || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDuplicates();
