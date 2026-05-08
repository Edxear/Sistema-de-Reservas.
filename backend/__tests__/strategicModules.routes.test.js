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
    expect(res.body.module.liveMetrics[0].value).toBe('512');
  });
});