const Appointment = require('../models/Appointment');

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('doctor patient service');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo reservas', error });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ message: 'Error creando reserva', error });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Reservación no encontrada' });
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: 'Error actualizando estado', error });
  }
};
