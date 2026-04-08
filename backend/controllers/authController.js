const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const GOOGLE_MAPS_EMBED_PREFIX = 'https://www.google.com/maps/embed';

function sanitizeMapEmbed(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let candidate = raw;
  const iframeMatch = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (iframeMatch?.[1]) {
    candidate = iframeMatch[1].trim();
  }

  if (!candidate.startsWith(GOOGLE_MAPS_EMBED_PREFIX)) {
    return null;
  }

  return candidate;
}

const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
});

const setAuthCookie = (res, token) => {
  res.cookie('auth_token', token, buildAuthCookieOptions());
};

const serializeUser = (user) => ({
  id: user._id,
  nombre: user.nombre,
  email: user.email,
  telefono: user.telefono,
  rol: user.rol,
  documento: user.documento || '',
  direccion: user.direccion || '',
  fechaNacimiento: user.fechaNacimiento || null,
  genero: user.genero || '',
  bio: user.bio || '',
  fotoPerfil: user.fotoPerfil || '',
  direccionConsultorio: user.direccionConsultorio || '',
  mapaEmbed: user.mapaEmbed || '',
  redesSociales: user.redesSociales || {},
  horariosAtencion: user.horariosAtencion || [],
  especialidad: user.especialidad || '',
  matriculaProfesional: user.matriculaProfesional || '',
  obraSocial: user.obraSocial || '',
  numeroAfiliado: user.numeroAfiliado || '',
  alergias: user.alergias || '',
  contactoEmergencia: user.contactoEmergencia || '',
  areaSecretaria: user.areaSecretaria || '',
  turnoLaboral: user.turnoLaboral || '',
  esSuperAdminPrincipal: Boolean(user.esSuperAdminPrincipal),
  ramaEnfermeria: user.ramaEnfermeria || '',
  rolJerarquicoEnfermeria: user.rolJerarquicoEnfermeria || '',
  areaOrganigrama: user.areaOrganigrama || '',
  sectorOrganigrama: user.sectorOrganigrama || '',
  cargoOrganigrama: user.cargoOrganigrama || '',
});

exports.registerUser = async (req, res) => {
  try {
    const { nombre, email, telefono, password, rol } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (rol && rol !== 'paciente') {
      return res.status(403).json({ message: 'El registro publico solo permite cuentas de paciente' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: 'Email ya registrado' });

    const user = new User({ nombre, email: normalizedEmail, telefono, password, rol: 'paciente' });
    await user.save();

    const token = jwt.sign(
      { id: user._id, rol: user.rol, esSuperAdminPrincipal: Boolean(user.esSuperAdminPrincipal) },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );
    setAuthCookie(res, token);
    res.status(201).json({ token, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error registrando usuario' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) return res.status(401).json({ message: 'Credenciales invalidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales invalidas' });

    const token = jwt.sign(
      { id: user._id, rol: user.rol, esSuperAdminPrincipal: Boolean(user.esSuperAdminPrincipal) },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );
    setAuthCookie(res, token);
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error en login' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo perfil' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const baseFields = [
      'nombre', 'telefono', 'documento', 'direccion', 'fechaNacimiento', 'genero',
      'bio', 'fotoPerfil', 'redesSociales', 'contactoEmergencia'
    ];

    const roleFields = {
      paciente: ['obraSocial', 'numeroAfiliado', 'alergias'],
      secretaria: ['areaSecretaria', 'turnoLaboral'],
      enfermero: ['especialidad', 'matriculaProfesional', 'direccionConsultorio', 'mapaEmbed', 'horariosAtencion'],
      medico: ['especialidad', 'matriculaProfesional', 'direccionConsultorio', 'mapaEmbed', 'horariosAtencion'],
      admin: ['especialidad', 'matriculaProfesional', 'direccionConsultorio', 'mapaEmbed', 'horariosAtencion', 'areaSecretaria', 'turnoLaboral'],
      superadmin: ['especialidad', 'matriculaProfesional', 'direccionConsultorio', 'mapaEmbed', 'horariosAtencion', 'areaSecretaria', 'turnoLaboral'],
    };

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const allowed = new Set([...(baseFields), ...((roleFields[user.rol]) || [])]);
    for (const key of Object.keys(req.body)) {
      if (allowed.has(key)) {
        if (key === 'mapaEmbed') {
          const sanitizedMap = sanitizeMapEmbed(req.body[key]);
          if (sanitizedMap === null) {
            return res.status(400).json({ message: 'mapaEmbed invalido. Solo se permite Google Maps embed.' });
          }
          user[key] = sanitizedMap;
          continue;
        }
        user[key] = req.body[key];
      }
    }

    await user.save();
    res.json({ message: 'Perfil actualizado', user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error actualizando perfil' });
  }
};

exports.logoutUser = async (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return res.status(200).json({ message: 'Sesion cerrada' });
};
