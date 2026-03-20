const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/mailer');

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

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Recordatorio de tu turno</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4285f4; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; border: 1px solid #ddd; }
              .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
              strong { color: #4285f4; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Recordatorio de Tu Turno</h2>
              </div>
              <div class="content">
                <p>Hola <strong>${reserva.usuario.nombre}</strong>,</p>
                <p>Te recordamos que tienes un turno programado para <strong>mañana ${fechaStr}</strong> a las <strong>${reserva.hora}</strong>.</p>
                <p>Estado: <strong>${reserva.estado}</strong></p>
                ${reserva.notas ? `<p>Notas: ${reserva.notas}</p>` : ''}
                <p>Si necesitas cancelar o reprogramar, ingresa a la plataforma.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail(
        reserva.usuario.email,
        'Recordatorio de tu turno para mañana',
        html
      );

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
