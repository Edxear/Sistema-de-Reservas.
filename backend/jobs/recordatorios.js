const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Booking = require('../models/Booking');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarRecordatorios() {
  const ahora = new Date();
  const manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);

  const fechaStr = manana.toISOString().split('T')[0]; // yyyy-mm-dd

  try {
    const reservas = await Booking.find({
      fecha: fechaStr,
      estado: { $in: ['pendiente', 'confirmada'] },
    }).populate('usuario', 'nombre email');

    for (const reserva of reservas) {
      if (!reserva.usuario || !reserva.usuario.email) continue;

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: reserva.usuario.email,
        subject: 'Recordatorio de tu turno para mañana',
        html: `
          <h2>Hola, ${reserva.usuario.nombre}!</h2>
          <p>Te recordamos que tienes un turno programado para <strong>mañana ${fechaStr}</strong> a las <strong>${reserva.hora}</strong>.</p>
          <p>Estado: <strong>${reserva.estado}</strong></p>
          ${reserva.notas ? `<p>Notas: ${reserva.notas}</p>` : ''}
          <p>Si necesitas cancelar o reprogramar, ingresa a la plataforma.</p>
        `,
      });

      console.log(`Recordatorio enviado a ${reserva.usuario.email} para el turno del ${fechaStr}`);
    }
  } catch (err) {
    console.error('Error al enviar recordatorios:', err.message);
  }
}

// Ejecuta todos los días a las 8:00 AM
function iniciarRecordatorios() {
  cron.schedule('0 8 * * *', () => {
    console.log('[CRON] Ejecutando envío de recordatorios...');
    enviarRecordatorios();
  });
  console.log('[CRON] Job de recordatorios registrado (diario 8:00 AM)');
}

module.exports = { iniciarRecordatorios, enviarRecordatorios };
