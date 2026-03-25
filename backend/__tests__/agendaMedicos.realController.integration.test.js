const request = require('supertest');

process.env.NODE_ENV = 'test';
jest.mock('../config/db', () => jest.fn(async () => {}));

jest.mock('../services/disponibilidadService', () => ({
  getSlotsByDate: jest.fn(),
  getNextAvailableDates: jest.fn(),
  getWeekSchedule: jest.fn()
}));

const disponibilidadService = require('../services/disponibilidadService');
const app = require('../server');

describe('AgendaMedicos integration con controlador real', () => {
  const medicoId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 400 cuando faltan query params requeridos', async () => {
    const res = await request(app)
      .get(`/api/medicos/${medicoId}/disponibilidad`)
      .query({ fecha: '2030-01-01' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Parámetros "fecha" y "duracion" son requeridos');
    expect(disponibilidadService.getSlotsByDate).not.toHaveBeenCalled();
  });

  it('retorna 200 y slots cuando servicio responde correctamente', async () => {
    disponibilidadService.getSlotsByDate.mockResolvedValue(['09:00', '09:30']);

    const res = await request(app)
      .get(`/api/medicos/${medicoId}/disponibilidad`)
      .query({ fecha: '2030-01-01', duracion: 30 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ slots: ['09:00', '09:30'] });
    expect(disponibilidadService.getSlotsByDate).toHaveBeenCalledWith(medicoId, '2030-01-01', 30, '');
  });

  it('retorna 500 cuando servicio lanza error', async () => {
    disponibilidadService.getSlotsByDate.mockRejectedValue(new Error('fallo controlado'));

    const res = await request(app)
      .get(`/api/medicos/${medicoId}/disponibilidad`)
      .query({ fecha: '2030-01-01', duracion: 30 });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('Error al consultar disponibilidad');
  });
});