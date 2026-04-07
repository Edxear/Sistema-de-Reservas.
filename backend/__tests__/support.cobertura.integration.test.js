const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret';

jest.mock('../config/db', () => jest.fn(async () => {}));
jest.mock('../utils/auditLogger', () => ({
  logAuditEvent: jest.fn(async () => {}),
}));

jest.mock('../models/User', () => ({
  findById: jest.fn(),
}));

jest.mock('../models/SupportTicket', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
}));

const User = require('../models/User');
const SupportTicket = require('../models/SupportTicket');
const app = require('../server');

const tokenFor = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'secret');

describe('Support cobertura integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('should reject cobertura request for non-admin roles', async () => {
    User.findById.mockResolvedValue({ _id: 'u-med', rol: 'medico', esSuperAdminPrincipal: false });

    const res = await request(app)
      .post('/api/support/cobertura')
      .set('Authorization', `Bearer ${tokenFor({ id: 'u-med', rol: 'medico' })}`)
      .send({
        obraSocial: 'OSDE',
        descripcion: 'Solicitud de autorizacion',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Acceso de administrador requerido/i);
  });

  it('should validate cobertura schema and return 400 on invalid payload', async () => {
    User.findById.mockResolvedValue({ _id: 'u-admin', rol: 'admin', esSuperAdminPrincipal: false });

    const res = await request(app)
      .post('/api/support/cobertura')
      .set('Authorization', `Bearer ${tokenFor({ id: 'u-admin', rol: 'admin' })}`)
      .send({
        descripcion: '',
        criticidad: 'urgente',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Solicitud de cobertura invalida');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(SupportTicket.create).not.toHaveBeenCalled();
  });

  it('should create cobertura request through dedicated endpoint for admin', async () => {
    User.findById.mockResolvedValue({ _id: 'u-admin', rol: 'admin', esSuperAdminPrincipal: false });
    SupportTicket.create.mockImplementation(async (payload) => ({ _id: 't-1', ...payload }));

    const res = await request(app)
      .post('/api/support/cobertura')
      .set('Authorization', `Bearer ${tokenFor({ id: 'u-admin', rol: 'admin', nombre: 'Admin Uno' })}`)
      .send({
        obraSocial: 'PAMI',
        tipoSolicitud: 'autorizacion',
        descripcion: 'Necesita autorizacion de modulo B',
        nroAfiliado: 'AF-001',
        pacienteRef: 'PAC-99',
        criticidad: 'alto',
      });

    expect(res.statusCode).toBe(201);
    expect(SupportTicket.create).toHaveBeenCalledWith(expect.objectContaining({
      tipoGestion: 'obra_social',
      criticidad: 'alto',
      modulo: 'Cobertura',
      soporteNivel: 'L2',
      tags: expect.arrayContaining(['obra_social', 'interinstitucional', 'autorizacion', 'pami']),
    }));
    expect(res.body.tipoGestion).toBe('obra_social');
  });

  it('should accept recetas flow via /support/tickets with tipoGestion obra_social', async () => {
    User.findById.mockResolvedValue({ _id: 'u-admin', rol: 'admin', esSuperAdminPrincipal: false });
    SupportTicket.create.mockImplementation(async (payload) => ({ _id: 't-2', ...payload }));

    const res = await request(app)
      .post('/api/support/tickets')
      .set('Authorization', `Bearer ${tokenFor({ id: 'u-admin', rol: 'admin', nombre: 'Admin Uno' })}`)
      .send({
        tipoGestion: 'obra_social',
        obraSocial: 'IOMA',
        tipoSolicitud: 'facturacion',
        descripcion: 'Ajuste de facturacion requerido',
        nroAfiliado: 'AF-444',
        criticidad: 'medio',
      });

    expect(res.statusCode).toBe(201);
    expect(SupportTicket.create).toHaveBeenCalledWith(expect.objectContaining({
      tipoGestion: 'obra_social',
      titulo: 'Solicitud facturacion - IOMA',
      modulo: 'Cobertura',
    }));
    expect(res.body.tipoGestion).toBe('obra_social');
  });
});
