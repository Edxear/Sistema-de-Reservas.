const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
jest.mock('../config/db', () => jest.fn(async () => {}));

jest.mock('../controllers/agendaMedicaController', () => ({
  getDisponibilidad: jest.fn((req, res) => res.status(200).json({ slots: ['09:00'] })),
  getProximasFechas: jest.fn((req, res) => res.status(200).json({ fechas: [] })),
  createOrUpdateAgenda: jest.fn((req, res) => res.status(200).json({ message: 'ok agenda' })),
  deleteAgendaDia: jest.fn((req, res) => res.status(200).json({ message: 'ok delete dia' })),
  createExcepcion: jest.fn((req, res) => res.status(201).json({ message: 'ok excepcion' })),
  getExcepciones: jest.fn((req, res) => res.status(200).json({ excepciones: [] })),
  deleteExcepcion: jest.fn((req, res) => res.status(200).json({ message: 'ok delete excepcion' })),
  getAgendaSemanal: jest.fn((req, res) => res.status(200).json({ schedule: {} }))
}));

const controller = require('../controllers/agendaMedicaController');
const app = require('../server');

function generarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret');
}

describe('Rutas agendaMedicos', () => {
  const medicoId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite consultar disponibilidad sin autenticacion', async () => {
    const res = await request(app)
      .get(`/api/medicos/${medicoId}/disponibilidad`)
      .query({ fecha: '2030-01-01', duracion: 30 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ slots: ['09:00'] });
    expect(controller.getDisponibilidad).toHaveBeenCalled();
  });

  it('bloquea crear agenda sin token', async () => {
    const res = await request(app)
      .post(`/api/medicos/${medicoId}/agenda`)
      .send({ horarios: [] });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token');
    expect(controller.createOrUpdateAgenda).not.toHaveBeenCalled();
  });

  it('bloquea medico intentando modificar agenda de otro medico', async () => {
    const token = generarToken({ _id: '507f191e810c19729de860ea', rol: 'medico' });

    const res = await request(app)
      .post(`/api/medicos/${medicoId}/agenda`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        horarios: [{ dia: 1, horaInicio: '09:00', horaFin: '12:00' }]
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('No puedes modificar la agenda de otro médico');
    expect(controller.createOrUpdateAgenda).not.toHaveBeenCalled();
  });

  it('valida payload de agenda antes de entrar al controlador', async () => {
    const token = generarToken({ _id: medicoId, rol: 'medico' });

    const res = await request(app)
      .post(`/api/medicos/${medicoId}/agenda`)
      .set('Authorization', `Bearer ${token}`)
      .send({ horarios: 'invalido' });

    expect(res.statusCode).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(controller.createOrUpdateAgenda).not.toHaveBeenCalled();
  });

  it('permite crear agenda cuando medico propietario envia payload valido', async () => {
    const token = generarToken({ _id: medicoId, rol: 'medico' });

    const res = await request(app)
      .post(`/api/medicos/${medicoId}/agenda`)
      .set('Authorization', `Bearer ${token}`)
      .send({ horarios: [{ dia: 1, horaInicio: '09:00', horaFin: '12:00' }] });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('ok agenda');
    expect(controller.createOrUpdateAgenda).toHaveBeenCalled();
  });

  it('bloquea acceso a excepciones para rol paciente', async () => {
    const token = generarToken({ _id: '507f191e810c19729de860ea', rol: 'paciente' });

    const res = await request(app)
      .get(`/api/medicos/${medicoId}/excepciones`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('Solo médicos y admins pueden acceder a esto');
    expect(controller.getExcepciones).not.toHaveBeenCalled();
  });
});