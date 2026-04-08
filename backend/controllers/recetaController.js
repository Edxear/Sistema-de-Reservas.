const Receta = require('../models/Receta');
const HistoriaClinica = require('../models/HistoriaClinica');
const User = require('../models/User');
const { crearNotificacion } = require('./notificacionController');
const { logAuditEvent } = require('../utils/auditLogger');

const INTERACTION_RULES = [
  {
    meds: ['ibuprofeno', 'losartan'],
    severity: 'media',
    message: 'Ibuprofeno puede reducir el efecto antihipertensivo de losartan.',
  },
  {
    meds: ['warfarina', 'aspirina'],
    severity: 'alta',
    message: 'Combinacion con riesgo de sangrado elevado.',
  },
  {
    meds: ['metformina', 'contraste yodado'],
    severity: 'alta',
    message: 'Requiere evaluacion renal previa/post contraste yodado.',
  },
];

const normalizeMedicationName = (value) => String(value || '').trim().toLowerCase();

const buildSafetyAlerts = async ({ paciente, medicamentos }) => {
  const currentMeds = (medicamentos || [])
    .map((m) => normalizeMedicationName(m.nombre))
    .filter(Boolean);

  const recentRecetas = await Receta.find({
    paciente,
    fechaEmision: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  }).select('medicamentos fechaEmision');

  const historicalMeds = new Set();
  recentRecetas.forEach((receta) => {
    (receta.medicamentos || []).forEach((m) => historicalMeds.add(normalizeMedicationName(m.nombre)));
  });

  const alerts = [];

  currentMeds.forEach((med) => {
    if (historicalMeds.has(med)) {
      alerts.push({
        type: 'duplicidad',
        severity: 'media',
        message: `Posible duplicidad terapeutica detectada para ${med}.`,
        medications: [med],
      });
    }
  });

  INTERACTION_RULES.forEach((rule) => {
    if (rule.meds.every((requiredMed) => currentMeds.includes(requiredMed))) {
      alerts.push({
        type: 'interaccion',
        severity: rule.severity,
        message: rule.message,
        medications: rule.meds,
      });
    }
  });

  return alerts;
};

exports.crearReceta = async (req, res) => {
  try {
    const safetyAlerts = await buildSafetyAlerts({
      paciente: req.body.paciente,
      medicamentos: req.body.medicamentos,
    });

    const receta = new Receta({
      ...req.body,
      safetyAlerts,
      medico: req.user.id
    });
    await receta.save();

    // Registrar receta en historia clínica del paciente
    try {
      const [medicoRef, pacienteRef] = await Promise.all([
        User.findById(req.user.id).select('nombre'),
        User.findById(receta.paciente).select('nombre')
      ]);

      const resumenMedicacion = (receta.medicamentos || [])
        .map((m) => m.nombre)
        .filter(Boolean)
        .slice(0, 4)
        .join(', ');

      await HistoriaClinica.create({
        paciente: receta.paciente,
        medico: req.user.id,
        tipo: 'receta',
        eventCategory: 'receta',
        fecha: receta.fechaEmision || new Date(),
        descripcion: `Receta emitida por ${medicoRef?.nombre || 'profesional'} para ${pacienteRef?.nombre || 'paciente'}. Medicación: ${resumenMedicacion || 'sin detalle'}.`,
        clinicalSnapshot: {
          diagnostico: receta.diagnosticoPrincipal || receta.diagnosticoSecundario || '',
          plan: receta.observaciones || '',
        },
        flags: {
          esCritico: safetyAlerts.some((a) => a.severity === 'alta'),
          requiereSeguimiento: safetyAlerts.length > 0,
        },
        metadata: {
          sourceModule: 'recetas',
          referenceId: String(receta._id),
        },
      });
    } catch (histError) {
      console.error('Error registrando receta en historia clínica:', histError.message);
    }

    // Notificar al paciente sobre nueva receta
    try {
      await crearNotificacion(
        receta.paciente,
        'receta_nueva',
        'Tu médico creó una nueva receta para ti. Ya puedes verla en tu perfil.',
        '💊',
        `/perfil?seccion=recetas&recetaId=${receta._id}`,
        receta._id,
        'Receta'
      );
    } catch (notifError) {
      console.error('Error notificando nueva receta al paciente:', notifError.message);
    }

    await logAuditEvent(req, {
      action: 'receta.create',
      resourceType: 'Receta',
      resourceId: receta._id,
      details: `alertas=${safetyAlerts.length}`,
    });

    res.status(201).json({ receta, safetyAlerts });
  } catch (error) {
    res.status(400).json({ message: 'Error creando la receta' });
  }
};

exports.getRecetasPaciente = async (req, res) => {
  try {
    const recetas = await Receta.find({ paciente: req.params.pacienteId }).sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo recetas' });
  }
};

exports.getRecetasFavoritas = async (req, res) => {
  try {
    const recetas = await Receta.find({ medico: req.user.id, esFavorita: true }).sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo recetas favoritas' });
  }
};

exports.getMisRecetas = async (req, res) => {
  try {
    const recetas = await Receta.find({ paciente: req.user.id })
      .populate('medico', 'nombre especialidad')
      .sort({ fechaEmision: -1 });
    res.json(recetas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo recetas del paciente' });
  }
};
