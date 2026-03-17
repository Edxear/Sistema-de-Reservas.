const Booking = require('../models/Booking');

exports.getBookings = async (req, res) => {
  try {
    const { usuario, servicio, estado, fecha, page = 1, limit = 10 } = req.query;
    const query = {};

    // Los pacientes solo pueden ver sus propias reservas
    if (req.user?.rol === 'paciente') {
      query.usuario = req.user.id;
    }

    // Solo los admin/medico pueden filtrar por otros usuarios
    if (req.user?.rol !== 'paciente' && usuario) query.usuario = usuario;

    if (servicio) query.servicio = servicio;
    if (estado) query.estado = estado;
    if (fecha) query.fecha = new Date(fecha);

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('usuario servicio')
      .sort({ fecha: 1, hora: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    res.json({ total, page: parseInt(page, 10), limit: parseInt(limit, 10), bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo reservas', error });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Reserva duplicada en mismo servicio, fecha y hora' });
    }
    res.status(400).json({ message: 'Error creando reserva', error });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando reserva', error });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    res.json({ message: 'Reserva eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error eliminando reserva', error });
  }
};
