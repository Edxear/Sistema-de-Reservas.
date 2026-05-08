const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';

jest.mock('../config/db', () => jest.fn(async () => {}));
jest.mock('../models/StrategicModuleDomainSnapshot');

const StrategicModuleDomainSnapshot = require('../models/StrategicModuleDomainSnapshot');
const app = require('../server');

const buildToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('strategic modules routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('lists only modules visible to the authenticated role', async () => {
    StrategicModuleDomainSnapshot.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            key: 'clinico',
            title: 'Clinico',
            order: 1,
            modules: [
              {
                slug: 'historia-clinica-electronica',
                title: 'Historia Clinica Electronica (HCE)',
                allowedRoles: ['medico', 'admin'],
                status: 'operativo',
                owner: 'Direccion medica digital',
                liveMetrics: [],
                highlights: [],
                checkpoints: [],
                timeline: [],
              },
            ],
          },
          {
            key: 'finanzas',
            title: 'Finanzas',
            order: 2,
            modules: [
              {
                slug: 'facturacion-cobranzas',
                title: 'Facturacion y Cobranzas',
                allowedRoles: ['admin'],
                status: 'operativo',
                owner: 'Administracion financiera',
                liveMetrics: [],
                highlights: [],
                checkpoints: [],
                timeline: [],
              },
            ],
          },
        ]),
      }),
    });

    const res = await request(app)
      .get('/api/strategic-modules')
      .set('Authorization', `Bearer ${buildToken({ id: 'user-1', rol: 'medico' })}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.modules).toHaveLength(1);
    expect(res.body.modules[0].slug).toBe('historia-clinica-electronica');
    expect(res.body.domains).toHaveLength(1);
    expect(res.body.domains[0].key).toBe('clinico');
  });

  test('returns module detail when role has access', async () => {
    StrategicModuleDomainSnapshot.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            key: 'operaciones',
            title: 'Operaciones',
            order: 1,
            modules: [
              {
                slug: 'gestion-agenda-avanzada',
                title: 'Gestion de Agenda Avanzada',
                allowedRoles: ['secretaria', 'admin'],
                status: 'operativo',
                owner: 'Coordinacion ambulatoria',
                liveMetrics: [{ label: 'Recordatorios hoy', value: '512' }],
                highlights: ['Recordatorios multicanal'],
                checkpoints: [{ name: 'Envio de recordatorios', state: 'ok', note: 'Cobertura diaria completa' }],
                timeline: [{ event: 'Backfill por prioridad', eta: 'Sprint actual' }],
              },
            ],
          },
        ]),
      }),
    });

    const res = await request(app)
      .get('/api/strategic-modules/gestion-agenda-avanzada')
      .set('Authorization', `Bearer ${buildToken({ id: 'user-2', rol: 'secretaria' })}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.module.slug).toBe('gestion-agenda-avanzada');
    expect(res.body.module.localBackend).toBe(true);
  });

  test('returns 403 when role has no access to module detail', async () => {
    StrategicModuleDomainSnapshot.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            key: 'seguridad',
            title: 'Seguridad',
            order: 1,
            modules: [
              {
                slug: 'control-acceso-por-rol',
                title: 'Control de Acceso por Rol',
                allowedRoles: ['admin', 'superadmin'],
                status: 'operativo',
                owner: 'Seguridad TI',
                liveMetrics: [],
                highlights: [],
                checkpoints: [],
                timeline: [],
              },
            ],
          },
        ]),
      }),
    });

    const res = await request(app)
      .get('/api/strategic-modules/control-acceso-por-rol')
      .set('Authorization', `Bearer ${buildToken({ id: 'user-3', rol: 'secretaria' })}`);

    expect(res.statusCode).toBe(403);
  });

  test('returns 404 for unknown module slug', async () => {
    StrategicModuleDomainSnapshot.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            key: 'clinico',
            title: 'Clinico',
            order: 1,
            modules: [
              {
                slug: 'historia-clinica-electronica',
                title: 'Historia Clinica Electronica (HCE)',
                allowedRoles: ['medico', 'admin'],
                status: 'operativo',
                owner: 'Direccion medica digital',
                liveMetrics: [],
                highlights: [],
                checkpoints: [],
                timeline: [],
              },
            ],
          },
        ]),
      }),
    });

    const res = await request(app)
      .get('/api/strategic-modules/modulo-que-no-existe')
      .set('Authorization', `Bearer ${buildToken({ id: 'user-4', rol: 'admin' })}`);

    expect(res.statusCode).toBe(404);
  });

  test('PATCH checkpoint updates state when authorized', async () => {
    const mockModule = {
      slug: 'auditoria-logs',
      title: 'Auditoria y Logs',
      allowedRoles: ['admin', 'superadmin'],
      status: 'operativo',
      owner: 'Seguridad',
      liveMetrics: [],
      highlights: [],
      checkpoints: [{ name: 'Retencion de logs', state: 'ok', note: 'Activo' }],
      timeline: [],
    };

    const mockDomain = {
      key: 'cumplimiento',
      title: 'Cumplimiento',
      order: 1,
      modules: [mockModule],
      markModified: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
    };

    StrategicModuleDomainSnapshot.findOne = jest.fn().mockResolvedValue(mockDomain);

    const res = await request(app)
      .patch('/api/strategic-modules/auditoria-logs/checkpoints')
      .set('Authorization', `Bearer ${buildToken({ id: 'user-5', rol: 'admin' })}`)
      .send({ name: 'Retencion de logs', state: 'warn', note: 'Revision en curso' });

    expect(res.statusCode).toBe(200);
    expect(res.body.checkpoint.state).toBe('warn');
    expect(res.body.checkpoint.note).toBe('Revision en curso');
    expect(mockDomain.save).toHaveBeenCalled();
  });

  test('PATCH checkpoint returns 400 for invalid state', async () => {
    const res = await request(app)
      .patch('/api/strategic-modules/auditoria-logs/checkpoints')
      .set('Authorization', `Bearer ${buildToken({ id: 'user-6', rol: 'admin' })}`)
      .send({ name: 'Retencion de logs', state: 'invalido' });

    expect(res.statusCode).toBe(400);
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/strategic-modules');
    expect(res.statusCode).toBe(401);
  });
});