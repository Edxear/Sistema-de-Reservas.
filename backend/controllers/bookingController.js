const Booking = require('../models/Booking');

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('usuario servicio');
    res.json(bookings);
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
