const nodemailer = require('nodemailer');

// Configurar transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Funciones de plantilla HTML

function emailCrearReserva(paciente, medico, fecha, hora, servicio, precio) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Confirmación de Solicitud de Reserva</title>
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
            <h2>Tu Solicitud de Reserva</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${paciente}</strong>,</p>
            <p>Tu solicitud de turno ha sido recibida y se encuentra pendiente de confirmación de pago.</p>
            <h3>Detalles de tu turno:</h3>
            <ul>
              <li><strong>Profesional:</strong> ${medico}</li>
              <li><strong>Servicio:</strong> ${servicio}</li>
              <li><strong>Fecha:</strong> ${new Date(fecha).toLocaleDateString('es-AR')}</li>
              <li><strong>Hora:</strong> ${hora}</li>
              <li><strong>Costo:</strong> $${precio}</li>
            </ul>
            <p>Completa el pago para confirmar tu turno. Si tienes preguntas, no dudes en contactarnos.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailConfirmarReserva(paciente, medico, fecha, hora, servicio, precio) {
  const fechaICS = generarICS(fecha, hora, servicio, medico);
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>¡Reserva Confirmada!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #34a853; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .btn { display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
          strong { color: #34a853; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Reserva Confirmada!</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${paciente}</strong>,</p>
            <p>Tu turno ha sido confirmado exitosamente.</p>
            <h3>Detalles de tu turno:</h3>
            <ul>
              <li><strong>Profesional:</strong> ${medico}</li>
              <li><strong>Servicio:</strong> ${servicio}</li>
              <li><strong>Fecha:</strong> ${new Date(fecha).toLocaleDateString('es-AR')}</li>
              <li><strong>Hora:</strong> ${hora}</li>
              <li><strong>Costo:</strong> $${precio}</li>
            </ul>
            <p>Te recomendamos agregar este evento a tu calendario.</p>
            <p style="text-align: center; margin-top: 20px;">
              <a href="data:text/calendar;base64,${Buffer.from(fechaICS).toString('base64')}" class="btn">
                Descargar evento para calendario
              </a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailReprogramar(nombrePaciente, nombreMedico, fechaNueva, horaNueva, servicio) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Tu Turno ha sido Reprogramado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #fbbc04; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
          strong { color: #fbbc04; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Turno Reprogramado</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${nombrePaciente}</strong>,</p>
            <p>Tu turno ha sido reprogramado.</p>
            <h3>Nuevos detalles:</h3>
            <ul>
              <li><strong>Profesional:</strong> ${nombreMedico}</li>
              <li><strong>Servicio:</strong> ${servicio}</li>
              <li><strong>Nueva Fecha:</strong> ${new Date(fechaNueva).toLocaleDateString('es-AR')}</li>
              <li><strong>Nueva Hora:</strong> ${horaNueva}</li>
            </ul>
            <p>Si esta nueva fecha no te viene bien, contáctanos de inmediato.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailCancelar(nombrePaciente, nombreMedico, fechaOriginal, horaOriginal, servicio, motivo = '') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Turno Cancelado</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea4335; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
          strong { color: #ea4335; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Turno Cancelado</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${nombrePaciente}</strong>,</p>
            <p>Te informamos que tu turno ha sido cancelado.</p>
            <h3>Detalles del turno cancelado:</h3>
            <ul>
              <li><strong>Profesional:</strong> ${nombreMedico}</li>
              <li><strong>Servicio:</strong> ${servicio}</li>
              <li><strong>Fecha:</strong> ${new Date(fechaOriginal).toLocaleDateString('es-AR')}</li>
              <li><strong>Hora:</strong> ${horaOriginal}</li>
              ${motivo ? `<li><strong>Motivo:</strong> ${motivo}</li>` : ''}
            </ul>
            <p>Si deseas agendar otro turno, por favor ingresa a la plataforma o contáctanos.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailAtendida(nombrePaciente, nombreMedico, fechaTurno, servicio) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>¡Tu Turno fue Completado!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #34a853; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; }
          .btn { display: inline-block; background: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
          strong { color: #34a853; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>¡Turno Completado!</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${nombrePaciente}</strong>,</p>
            <p>Tu turno con <strong>${nombreMedico}</strong> ha sido completado.</p>
            <h3>Detalles del turno:</h3>
            <ul>
              <li><strong>Profesional:</strong> ${nombreMedico}</li>
              <li><strong>Servicio:</strong> ${servicio}</li>
              <li><strong>Fecha:</strong> ${new Date(fechaTurno).toLocaleDateString('es-AR')}</li>
            </ul>
            <p>Tu opinión es muy importante para nosotros. ¿Podrías calificar tu experiencia?</p>
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.FRONTEND_URL || 'https://localhost:3000'}/feedback" class="btn" style="margin-right: 0;">
                Dejar Calificación
              </a>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function emailReservaAlMedico(nombreMedico, nombrePaciente, fecha, hora, servicio, telefonoPaciente = '') {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Nuevo Turno Asignado</title>
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
            <h2>Nuevo Turno Asignado</h2>
          </div>
          <div class="content">
            <p>Hola Dr./Dra. <strong>${nombreMedico}</strong>,</p>
            <p>Te informamos que se ha asignado un nuevo turno a tu agenda.</p>
            <h3>Detalles del turno:</h3>
            <ul>
              <li><strong>Paciente:</strong> ${nombrePaciente}</li>
              <li><strong>Servicio:</strong> ${servicio}</li>
              <li><strong>Fecha:</strong> ${new Date(fecha).toLocaleDateString('es-AR')}</li>
              <li><strong>Hora:</strong> ${hora}</li>
              ${telefonoPaciente ? `<li><strong>Teléfono del Paciente:</strong> ${telefonoPaciente}</li>` : ''}
            </ul>
            <p>Por favor, ten en cuenta este turno en tu agenda.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Sistema de Reservas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Helper: Generar archivo ICS para calendario
function generarICS(fecha, hora, servicio, medico) {
  const [hours, minutes] = hora.split(':').map(Number);
  const startDate = new Date(fecha);
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1); // Duración por defecto: 1 hora
  
  const formatoICS = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sistema de Reservas//NONSGML Reservas Médicas//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTSTART:${formatoICS(startDate)}
DTEND:${formatoICS(endDate)}
SUMMARY:Turno - ${servicio} con ${medico}
DESCRIPTION:Turno confirmado en Sistema de Reservas Médicas
UID:${startDate.getTime()}@sistema-reservas.local
CREATED:${formatoICS(new Date())}
LAST-MODIFIED:${formatoICS(new Date())}
END:VEVENT
END:VCALENDAR`;
  
  return ics;
}

// Función principal de envío
async function sendEmail(to, subject, html, attachments = []) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️  EMAIL_USER o EMAIL_PASS no configurados. Email no enviado a:', to);
      return { success: false, reason: 'Config missing' };
    }

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      attachments,
    });

    console.log(`✓ Email enviado a ${to} - ${subject}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`✗ Error enviando email a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Funciones de envío sin bloqueo (background)
function enviarEmailBackground(to, subject, html, attachments = []) {
  // Ejecutar sin await para no bloquear
  setImmediate(async () => {
    await sendEmail(to, subject, html, attachments);
  });
}

module.exports = {
  sendEmail,
  enviarEmailBackground,
  emailCrearReserva,
  emailConfirmarReserva,
  emailReprogramar,
  emailCancelar,
  emailAtendida,
  emailReservaAlMedico,
  generarICS,
};
