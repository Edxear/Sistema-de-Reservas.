const { MercadoPagoConfig, Preference } = require('mercadopago');
const Booking = require('../models/Booking');
const User = require('../models/User');
const {
  enviarEmailBackground,
  emailConfirmarReserva,
  emailReservaAlMedico,
} = require('../utils/mailer');

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

// POST /api/pagos/crear-preferencia
// Body: { bookingId }
const crearPreferencia = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'bookingId es requerido' });
    }

    const booking = await Booking.findById(bookingId).populate('servicio');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    // Solo el dueño de la reserva puede pagar
    if (booking.usuario.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: booking._id.toString(),
            title: booking.servicio?.nombre || 'Turno médico',
            quantity: 1,
            unit_price: booking.servicio?.precio || 1,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${process.env.FRONTEND_URL}/dashboard?pago=success`,
          failure: `${process.env.FRONTEND_URL}/dashboard?pago=failure`,
          pending: `${process.env.FRONTEND_URL}/dashboard?pago=pending`,
        },
        auto_return: 'approved',
        external_reference: booking._id.toString(),
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/pagos/webhook`,
      },
    });

    res.json({ init_point: response.init_point, id: response.id });
  } catch (err) {
    console.error('[PAGO] Error al crear preferencia:', err.message);
    res.status(500).json({ message: 'Error al crear preferencia de pago' });
  }
};

// POST /api/pagos/webhook  (llamado por Mercado Pago)
const webhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment' && data?.id) {
      // Aquí podrías consultar el pago via SDK y actualizar el estado de la reserva
      // Por ahora marcamos la reserva como confirmada usando external_reference
      const { Payment } = require('mercadopago');
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });

      if (payment.status === 'approved') {
        // Actualizar estado a confirmada
        const booking = await Booking.findByIdAndUpdate(
          payment.external_reference,
          { estado: 'confirmada' },
          { new: true }
        )
          .populate('usuario', 'nombre email telefono')
          .populate('servicio', 'nombre precio')
          .populate('medico', 'nombre email especialidad');

        // Enviar emails de confirmación en background
        if (booking) {
          setImmediate(async () => {
            try {
              const paciente = booking.usuario;
              const medico = booking.medico;
              const servicio = booking.servicio;

              // Email al paciente
              if (paciente?.email) {
                const html = emailConfirmarReserva(
                  paciente.nombre,
                  medico?.nombre || 'Profesional',
                  booking.fecha,
                  booking.hora,
                  servicio?.nombre || 'Servicio',
                  servicio?.precio || 0
                );
                enviarEmailBackground(
                  paciente.email,
                  '✅ ¡Tu reserva ha sido confirmada!',
                  html
                );
              }

              // Email al médico
              if (medico?.email) {
                const html = emailReservaAlMedico(
                  medico.nombre,
                  paciente?.nombre || 'Paciente',
                  booking.fecha,
                  booking.hora,
                  servicio?.nombre || 'Servicio',
                  paciente?.telefono
                );
                enviarEmailBackground(
                  medico.email,
                  '📅 Nuevo turno asignado en tu agenda',
                  html
                );
              }

              console.log(`✓ [WEBHOOK] Emails de confirmación enviados para booking ${payment.external_reference}`);
            } catch (emailErr) {
              console.error(`✗ [WEBHOOK] Error enviando emails:`, emailErr.message);
            }
          });
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('[WEBHOOK] Error:', err.message);
    res.sendStatus(200); // Siempre 200 para que MP no reintente
  }
};

module.exports = { crearPreferencia, webhook };
