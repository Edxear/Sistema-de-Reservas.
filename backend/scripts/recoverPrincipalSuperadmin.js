const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../models/User');
const seedUsers = require('../seeds/usuarios-iniciales.json');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const principalFromSeed = seedUsers.principalSuperAdmin || {};
const principalSuperAdminData = {
  nombre: process.env.SUPERADMIN_NOMBRE || principalFromSeed.nombre || 'Administrador Principal',
  email: String(process.env.SUPERADMIN_EMAIL || principalFromSeed.email || 'admin.principal@integraSalud.com').trim().toLowerCase(),
  telefono: process.env.SUPERADMIN_TELEFONO || principalFromSeed.telefono || '3415000000',
  password: process.env.SEED_SUPERADMIN_PASSWORD || process.env.SUPERADMIN_PASSWORD || principalFromSeed.password || 'Admin1234',
};

if (!MONGODB_URI) {
  console.error('Falta MONGODB_URI en .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email: principalSuperAdminData.email });

  if (!existing) {
    const created = new User({
      nombre: principalSuperAdminData.nombre,
      email: principalSuperAdminData.email,
      telefono: principalSuperAdminData.telefono,
      password: principalSuperAdminData.password,
      rol: 'superadmin',
      esSuperAdminPrincipal: true,
      areaOrganigrama: 'Direccion General',
      sectorOrganigrama: 'Direccion Ejecutiva',
      cargoOrganigrama: 'Administrador Supremo',
      bio: 'Cuenta principal de administracion suprema.',
    });
    await created.save();
    console.log(`Superadmin principal creado: ${created.email}`);
    return;
  }

  existing.nombre = principalSuperAdminData.nombre;
  existing.telefono = principalSuperAdminData.telefono;
  existing.rol = 'superadmin';
  existing.esSuperAdminPrincipal = true;
  existing.password = principalSuperAdminData.password;

  await existing.save();
  console.log(`Superadmin principal actualizado: ${existing.email}`);
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Error recuperando superadmin principal:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
