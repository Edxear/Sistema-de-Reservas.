const Patient = require('../models/Patient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerPatient = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await Patient.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email ya registrado' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const patient = new Patient({ name, email, phone, password: hashed });
    await patient.save();

    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.status(201).json({ token, patient });
  } catch (error) {
    res.status(500).json({ message: 'Error registrando paciente', error });
  }
};

exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ email }).select('+password');
    if (!patient) return res.status(401).json({ message: 'Credenciales invalidas' });

    const valid = await bcrypt.compare(password, patient.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales invalidas' });

    const token = jwt.sign({ id: patient._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token, patient });
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error });
  }
};
