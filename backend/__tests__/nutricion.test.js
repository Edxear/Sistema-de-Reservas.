const mongoose = require('mongoose');
const Nutricion = require('../models/Nutricion');

describe('Nutricion Model', () => {
  it('should create a nutrition record', async () => {
    const nutricion = new Nutricion({
      paciente: new mongoose.Types.ObjectId(),
      dieta: 'Dieta balanceada',
      fechaInicio: new Date(),
    });

    expect(nutricion.estado).toBe('activa');
  });
});
