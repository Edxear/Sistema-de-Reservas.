const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerUser = async (req, res) => {
  try {
    const { nombre, email, telefono, password, rol } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email ya registrado' });

    const user = new User({ nombre, email, telefono, password, rol });
    await user.save();

    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user._id, nombre: user.nombre, email: user.email, telefono: user.telefono, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ message: 'Error registrando usuario', error });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Credenciales invalidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales invalidas' });

    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, nombre: user.nombre, email: user.email, telefono: user.telefono, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error });
  }
};
