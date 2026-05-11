const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

jest.mock('../config/db', () => jest.fn(async () => {}));

jest.mock('../controllers/nursingController', () => {
  const ok = (payload = {}) => (req, res) => res.status(200).json(payload);
  const created = (payload = {}) => (req, res) => res.status(201).json(payload);

  return {
    getNursingCatalog: jest.fn(ok({ branches: [] })),
    getNursingConfig: jest.fn(ok({ thresholds: {} })),
    updateNursingConfig: jest.fn(ok({ ok: true })),
    getNursingDashboard: jest.fn(ok({ kpis: {} })),
    getNursingOrganigrama: jest.fn(ok({ byBranch: [] })),
    getNursingWorkload: jest.fn(ok({ workload: [] })),
    createAyudaRapida: jest.fn(ok({ ok: true })),
    listNursingContacts: jest.fn(ok({ items: [] })),

    listInitiatives: jest.fn(ok({ items: [] })),
    createInitiative: jest.fn(created({ ok: true })),
    updateInitiative: jest.fn(ok({ ok: true })),

    listChecklists: jest.fn(ok({ items: [] })),
    createChecklist: jest.fn(created({ ok: true })),

    listIncidents: jest.fn(ok({ items: [] })),
    createIncident: jest.fn(created({ ok: true })),
    updateIncidentStatus: jest.fn(ok({ ok: true })),

    listShiftTasks: jest.fn(ok({ items: [] })),
    generateShiftTasks: jest.fn(created({ generated: 3 })),
    updateShiftTask: jest.fn(ok({ ok: true })),

    listHandoffs: jest.fn(ok({ items: [] })),
    createHandoff: jest.fn(created({ ok: true })),
    updateHandoffStatus: jest.fn(ok({ ok: true })),

    listWoundPhotos: jest.fn(ok({ items: [] })),
    createWoundPhoto: jest.fn(created({ ok: true })),
    updateWoundPhoto: jest.fn(ok({ ok: true })),
  };
});

const nursingController = require('../controllers/nursingController');
const app = require('../server');

const buildToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('nursing routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks access without auth token', async () => {
    const res = await request(app).get('/api/enfermeria/dashboard');

    expect(res.statusCode).toBe(401);
    expect(nursingController.getNursingDashboard).not.toHaveBeenCalled();
  });

  test('allows listing shift tasks with valid token', async () => {
    const token = buildToken({ id: '507f1f77bcf86cd799439011', rol: 'enfermero' });

    const res = await request(app)
      .get('/api/enfermeria/shift-tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(nursingController.listShiftTasks).toHaveBeenCalled();
  });

  test('allows generating shift tasks with valid token', async () => {
    const token = buildToken({ id: '507f1f77bcf86cd799439011', rol: 'enfermero' });

    const res = await request(app)
      .post('/api/enfermeria/shift-tasks/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ rama: 'Guardia', turno: 'manana' });

    expect(res.statusCode).toBe(201);
    expect(nursingController.generateShiftTasks).toHaveBeenCalled();
  });

  test('allows creating handoff with valid token', async () => {
    const token = buildToken({ id: '507f1f77bcf86cd799439011', rol: 'enfermero' });

    const res = await request(app)
      .post('/api/enfermeria/handoffs')
      .set('Authorization', `Bearer ${token}`)
      .send({ rama: 'Guardia', turnoSaliente: 'manana', turnoEntrante: 'tarde' });

    expect(res.statusCode).toBe(201);
    expect(nursingController.createHandoff).toHaveBeenCalled();
  });
});
