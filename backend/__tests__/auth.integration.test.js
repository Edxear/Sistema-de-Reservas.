const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGO_URI = 'mongodb://localhost/test';
process.env.FRONTEND_URL = 'http://localhost:3000';

jest.mock('../config/db', () => jest.fn(async () => {}));

// Mock del modelo User para no necesitar MongoDB real
jest.mock('../models/User');
const User = require('../models/User');

const app = require('../server');

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── Register ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('debería registrar un usuario paciente y devolver token + user', async () => {
    User.findOne.mockResolvedValue(null); // email no existe

    const savedUser = {
      _id: new mongoose.Types.ObjectId(),
      nombre: 'María García',
      email: 'maria@ejemplo.com',
      telefono: '1122334455',
      password: await bcrypt.hash('password123', 10),
      rol: 'paciente',
      esSuperAdminPrincipal: false,
      save: jest.fn().mockResolvedValue(true),
    };
    User.mockImplementation(() => savedUser);

    const res = await request(app).post('/api/auth/register').send({
      nombre: 'María García',
      email: 'maria@ejemplo.com',
      telefono: '1122334455',
      password: 'password123',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.rol).toBe('paciente');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('debería rechazar registro con email ya existente (400)', async () => {
    User.findOne.mockResolvedValue({ _id: '123', email: 'existente@test.com' });

    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Test',
      email: 'existente@test.com',
      telefono: '1199999999',
      password: 'password123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/ya registrado/i);
  });

  it('debería rechazar registro con rol distinto a paciente (403)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      nombre: 'Admin intento',
      email: 'admin@test.com',
      telefono: '1100000000',
      password: 'password123',
      rol: 'admin',
    });

    expect(res.statusCode).toBe(403);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('debería devolver token con credenciales correctas (200)', async () => {
    const hashed = await bcrypt.hash('password123', 10);

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Juan Médico',
        email: 'juan@ejemplo.com',
        telefono: '1199998888',
        rol: 'medico',
        esSuperAdminPrincipal: false,
        password: hashed,
      }),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'juan@ejemplo.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.rol).toBe('medico');
  });

  it('debería rechazar contraseña incorrecta (401)', async () => {
    const hashed = await bcrypt.hash('correcta', 10);

    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: 'test@test.com',
        password: hashed,
        rol: 'paciente',
        esSuperAdminPrincipal: false,
      }),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@test.com',
      password: 'incorrecta',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/credenciales invalidas/i);
  });

  it('debería rechazar usuario inexistente (401)', async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'noexiste@test.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(401);
  });
});

// ─── Ruta protegida ───────────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  it('debería devolver perfil con token válido (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: userId.toString(), rol: 'medico', esSuperAdminPrincipal: false },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    User.findById = jest.fn().mockResolvedValue({
      _id: userId,
      nombre: 'Dr. Test',
      email: 'dr@test.com',
      telefono: '1100001111',
      rol: 'medico',
      esSuperAdminPrincipal: false,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.rol).toBe('medico');
  });

  it('debería rechazar sin token (403)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect([401, 403]).toContain(res.statusCode);
  });
});
