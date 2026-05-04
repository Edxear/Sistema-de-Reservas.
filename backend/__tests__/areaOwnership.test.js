jest.mock('../models/BedUnit', () => ({
  findById: jest.fn(),
}));

const BedUnit = require('../models/BedUnit');
const areaOwnership = require('../middleware/areaOwnership');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('areaOwnership middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('permite bypass para admin sin consultar cama', async () => {
    const req = {
      user: { rol: 'admin' },
      params: { id: 'bed-id' },
    };
    const res = createRes();
    const next = jest.fn();

    await areaOwnership('bed')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(BedUnit.findById).not.toHaveBeenCalled();
  });

  test('devuelve 404 cuando la cama no existe', async () => {
    BedUnit.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = {
      user: { rol: 'enfermero' },
      params: { id: 'missing-bed' },
    };
    const res = createRes();
    const next = jest.fn();

    await areaOwnership('bed')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Cama no encontrada' });
    expect(next).not.toHaveBeenCalled();
  });

  test('bloquea enfermero fuera de su area en recurso bed', async () => {
    BedUnit.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ sector: 'Guardia Adultos' }),
    });

    const req = {
      user: {
        rol: 'enfermero',
        areaOrganigrama: 'Salud Mental',
      },
      params: { id: 'bed-1' },
    };
    const res = createRes();
    const next = jest.fn();

    await areaOwnership('bed')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite enfermero de area compatible en recurso bed', async () => {
    BedUnit.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ sector: 'Guardia de adultos' }),
    });

    const req = {
      user: {
        rol: 'enfermero',
        sectorOrganigrama: 'Guardia Central',
      },
      params: { id: 'bed-2' },
    };
    const res = createRes();
    const next = jest.fn();

    await areaOwnership('bed')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('bloquea recurso area cuando area solicitada no coincide con perfil', async () => {
    const req = {
      user: {
        rol: 'enfermero',
        areaOrganigrama: 'Salud Mental',
      },
      body: { area: 'guardia' },
      query: {},
    };
    const res = createRes();
    const next = jest.fn();

    await areaOwnership('area')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
