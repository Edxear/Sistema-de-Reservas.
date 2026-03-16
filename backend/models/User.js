const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
  email: { type: String, required: [true, 'El email es obligatorio'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Email inválido'] },
  password: { type: String, required: [true, 'La contraseña es obligatoria'], minlength: 6, select: false },
  telefono: { type: String, required: [true, 'El teléfono es obligatorio'] },
  rol: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
  fechaRegistro: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.compararPassword = async function(passwordIngresada) {
  return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model('User', userSchema);
