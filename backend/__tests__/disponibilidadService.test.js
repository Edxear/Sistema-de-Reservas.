const disponibilidadService = require('../services/disponibilidadService');
const AgendaMedica = require('../models/AgendaMedica');
const AgendaExcepcion = require('../models/AgendaExcepcion');
const Booking = require('../models/Booking');
const User = require('../models/User');

jest.mock('../models/AgendaMedica', () => ({ find: jest.fn() }));
jest.mock('../models/AgendaExcepcion', () => ({ find: jest.fn() }));
jest.mock('../models/Booking', () => ({ find: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn() }));

function getFechaFuturaConDia(diaObjetivo) {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);

  while (fecha.getDay() !== diaObjetivo) {
    fecha.setDate(fecha.getDate() + 1);
  }

  return fecha.toISOString().slice(0, 10);
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('disponibilidadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula slots excluyendo reservas y excepciones parciales', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const fecha = getFechaFuturaConDia(1); // lunes

    User.findById.mockResolvedValue({ _id: medicoId, rol: 'medico' });
    AgendaMedica.find.mockResolvedValue([
      { dia: 1, horaInicio: '09:00', horaFin: '11:00', disponible: true }
    ]);
    AgendaExcepcion.find.mockResolvedValue([
      { horaInicio: '10:00', horaFin: '10:30' }
    ]);
    Booking.find.mockResolvedValue([
      { hora: '09:30' }
    ]);

    const slots = await disponibilidadService.getSlotsByDate(medicoId, fecha, 30);

    expect(slots).toEqual(['09:00', '10:30']);
    expect(User.findById).toHaveBeenCalledWith(medicoId);
    expect(AgendaMedica.find).toHaveBeenCalled();
    expect(AgendaExcepcion.find).toHaveBeenCalled();
    expect(Booking.find).toHaveBeenCalled();
  });

  it('retorna arreglo vacío para fecha pasada', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaPasada = toLocalIsoDate(ayer);

    User.findById.mockResolvedValue({ _id: medicoId, rol: 'medico' });

    const slots = await disponibilidadService.getSlotsByDate(medicoId, fechaPasada, 30);

    expect(slots).toEqual([]);
    expect(AgendaMedica.find).not.toHaveBeenCalled();
    expect(AgendaExcepcion.find).not.toHaveBeenCalled();
    expect(Booking.find).not.toHaveBeenCalled();
  });

  it('lanza error cuando el usuario no es medico valido', async () => {
    const fecha = getFechaFuturaConDia(2);
    User.findById.mockResolvedValue({ _id: 'x', rol: 'paciente' });

    await expect(
      disponibilidadService.getSlotsByDate('507f1f77bcf86cd799439011', fecha, 30)
    ).rejects.toThrow('Médico no encontrado o usuario inválido');
  });

  it('acepta profesionales con rol admin para cálculo de disponibilidad', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const fecha = getFechaFuturaConDia(1);

    User.findById.mockResolvedValue({ _id: medicoId, rol: 'admin' });
    AgendaMedica.find.mockResolvedValue([
      { dia: 1, horaInicio: '09:00', horaFin: '10:00', disponible: true }
    ]);
    AgendaExcepcion.find.mockResolvedValue([]);
    Booking.find.mockResolvedValue([]);

    const slots = await disponibilidadService.getSlotsByDate(medicoId, fecha, 30);
    expect(slots).toEqual(['09:00', '09:30']);
  });

  it('construye agenda semanal normalizada por dia', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    AgendaMedica.find.mockResolvedValue([
      { dia: 1, horaInicio: '09:00', horaFin: '12:00', disponible: true },
      { dia: 3, horaInicio: '14:00', horaFin: '18:00', disponible: true }
    ]);

    const schedule = await disponibilidadService.getWeekSchedule(medicoId);

    expect(schedule.lunes).toEqual([
      { horaInicio: '09:00', horaFin: '12:00', disponible: true }
    ]);
    expect(schedule.miercoles).toEqual([
      { horaInicio: '14:00', horaFin: '18:00', disponible: true }
    ]);
    expect(schedule.viernes).toEqual([]);
  });

  it('retorna vacío cuando hay excepción de día completo', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const fecha = getFechaFuturaConDia(1);

    User.findById.mockResolvedValue({ _id: medicoId, rol: 'medico' });
    AgendaMedica.find.mockResolvedValue([
      { dia: 1, horaInicio: '09:00', horaFin: '11:00', disponible: true }
    ]);
    AgendaExcepcion.find.mockResolvedValue([
      { horaInicio: null, horaFin: null }
    ]);
    Booking.find.mockResolvedValue([]);

    const slots = await disponibilidadService.getSlotsByDate(medicoId, fecha, 30);
    expect(slots).toEqual([]);
  });

  it('pasa excludeBookingId al query de bookings', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const fecha = getFechaFuturaConDia(1);
    const excludeBookingId = 'booking-abc-123';

    User.findById.mockResolvedValue({ _id: medicoId, rol: 'medico' });
    AgendaMedica.find.mockResolvedValue([
      { dia: 1, horaInicio: '09:00', horaFin: '10:00', disponible: true }
    ]);
    AgendaExcepcion.find.mockResolvedValue([]);
    Booking.find.mockResolvedValue([]);

    await disponibilidadService.getSlotsByDate(medicoId, fecha, 30, excludeBookingId);

    expect(Booking.find).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: { $ne: excludeBookingId }
      })
    );
  });

  it('usa fallback legacy de horariosAtencion cuando no hay agenda fija', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const fecha = getFechaFuturaConDia(1);

    User.findById
      .mockResolvedValueOnce({ _id: medicoId, rol: 'medico' })
      .mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({
          horariosAtencion: [{ dia: 'Lunes', horaInicio: '08:00', horaFin: '09:00' }]
        })
      });

    AgendaMedica.find.mockResolvedValue([]);
    AgendaExcepcion.find.mockResolvedValue([]);
    Booking.find.mockResolvedValue([]);

    const slots = await disponibilidadService.getSlotsByDate(medicoId, fecha, 30);
    expect(slots).toEqual(['08:00', '08:30']);
  });

  it('isSlotAvailable devuelve true/false según disponibilidad', async () => {
    const medicoId = '507f1f77bcf86cd799439011';
    const fecha = getFechaFuturaConDia(1);

    User.findById.mockResolvedValue({ _id: medicoId, rol: 'medico' });
    AgendaMedica.find.mockResolvedValue([
      { dia: 1, horaInicio: '09:00', horaFin: '10:00', disponible: true }
    ]);
    AgendaExcepcion.find.mockResolvedValue([]);
    Booking.find.mockResolvedValue([{ hora: '09:30' }]);

    const libre = await disponibilidadService.isSlotAvailable(medicoId, fecha, '09:00', 30);
    const ocupado = await disponibilidadService.isSlotAvailable(medicoId, fecha, '09:30', 30);

    expect(libre).toBe(true);
    expect(ocupado).toBe(false);
  });
});