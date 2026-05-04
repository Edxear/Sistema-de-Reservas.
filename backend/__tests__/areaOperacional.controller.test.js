jest.mock('../models/AreaOperacional', () => ({
  Incidente: {
    find: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
  ChecklistTurno: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../utils/auditLogger', () => ({
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
}));

const { Incidente, ChecklistTurno } = require('../models/AreaOperacional');
const { logAuditEvent } = require('../utils/auditLogger');
const controller = require('../controllers/areaOperacionalController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('areaOperacionalController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('listIncidentes rechaza area invalida', async () => {
    const req = {
      query: { area: 'invalid-area' },
    };
    const res = createRes();

    await controller.listIncidentes(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Area invalida' });
    expect(Incidente.find).not.toHaveBeenCalled();
  });

  test('createIncidente devuelve 403 cuando el usuario no tiene acceso al area', async () => {
    const req = {
      body: {
        area: 'guardia',
        titulo: 'Incidente de prueba',
      },
      user: {
        id: 'user-1',
        rol: 'enfermero',
        areaOrganigrama: 'Salud Mental',
      },
    };
    const res = createRes();

    await controller.createIncidente(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Incidente.create).not.toHaveBeenCalled();
  });

  test('createIncidente crea registro y audita cuando el usuario tiene acceso', async () => {
    Incidente.create.mockResolvedValue({ _id: 'inc-1' });
    Incidente.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({ _id: 'inc-1', titulo: 'Titulo valido' }),
    });

    const req = {
      body: {
        area: 'guardia',
        tipo: 'medio',
        titulo: '  Titulo valido  ',
        descripcion: 'Descripcion',
      },
      user: {
        id: 'user-1',
        rol: 'enfermero',
        areaOrganigrama: 'Guardia Central',
      },
    };
    const res = createRes();

    await controller.createIncidente(req, res);

    expect(Incidente.create).toHaveBeenCalledWith(expect.objectContaining({
      area: 'guardia',
      titulo: 'Titulo valido',
      creadoPor: 'user-1',
    }));
    expect(logAuditEvent).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('createChecklist devuelve 409 ante clave unica duplicada', async () => {
    const duplicateError = new Error('duplicate');
    duplicateError.code = 11000;
    ChecklistTurno.create.mockRejectedValue(duplicateError);

    const req = {
      body: {
        area: 'guardia',
        turno: 'manana',
        fecha: '2026-05-03',
      },
      user: {
        id: 'user-1',
        rol: 'admin',
      },
    };
    const res = createRes();

    await controller.createChecklist(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ya existe un checklist para este area, turno y fecha' });
  });

  test('updateChecklist devuelve 409 cuando checklist ya esta cerrado', async () => {
    ChecklistTurno.findById.mockResolvedValue({
      _id: 'check-1',
      area: 'guardia',
      cerrado: true,
    });

    const req = {
      params: { id: 'check-1' },
      body: { items: [] },
      user: {
        id: 'user-1',
        rol: 'admin',
      },
    };
    const res = createRes();

    await controller.updateChecklist(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'El checklist ya fue cerrado y no puede modificarse' });
  });
});
