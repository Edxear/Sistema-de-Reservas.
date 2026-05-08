const mongoose = require('mongoose');
const loadEnv = require('../config/loadEnv');
const StrategicModuleDomainSnapshot = require('../models/StrategicModuleDomainSnapshot');
const { STRATEGIC_MODULES_DATA } = require('../data/strategicModulesData');
const { groupStrategicModulesByDomain } = require('../data/strategicModuleDomains');

loadEnv();

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('Falta MONGODB_URI en .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Mongo conectado para seed de modulos estrategicos');

  await StrategicModuleDomainSnapshot.deleteMany({});
  const inserted = await StrategicModuleDomainSnapshot.insertMany(
    groupStrategicModulesByDomain(STRATEGIC_MODULES_DATA).map((domain) => ({
      ...domain,
      modules: domain.modules.map((moduleData) => ({
        ...moduleData,
        lastUpdated: moduleData.lastUpdated ? new Date(moduleData.lastUpdated) : new Date(),
      })),
    })),
  );

  console.log(`Dominios de modulos estrategicos insertados: ${inserted.length}`);
  await mongoose.disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('Error seed modulos estrategicos:', error);
    await mongoose.disconnect();
    process.exit(1);
  });