const User = require('../models/User');
const HistoriaClinica = require('../models/HistoriaClinica');

const toIsoDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const toFhirPatient = (user) => ({
  resourceType: 'Patient',
  id: String(user._id),
  identifier: user.documento ? [{ system: 'urn:integrasalud:documento', value: user.documento }] : [],
  name: [{ text: user.nombre }],
  telecom: [
    user.telefono ? { system: 'phone', value: user.telefono } : null,
    user.email ? { system: 'email', value: user.email } : null,
  ].filter(Boolean),
  gender: user.genero || 'unknown',
  birthDate: user.fechaNacimiento ? toIsoDate(user.fechaNacimiento)?.slice(0, 10) : undefined,
  address: user.direccion ? [{ text: user.direccion }] : [],
});

exports.getFhirPatient = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const paciente = await User.findById(pacienteId).select('nombre email telefono documento genero fechaNacimiento direccion alergias rol');

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    return res.json(toFhirPatient(paciente));
  } catch (error) {
    return res.status(500).json({ message: 'Error generando recurso FHIR Patient', error });
  }
};

exports.getFhirClinicalBundle = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const paciente = await User.findById(pacienteId).select('nombre email telefono documento genero fechaNacimiento direccion alergias rol');

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const registros = await HistoriaClinica.find({ paciente: pacienteId })
      .populate('medico', 'nombre')
      .sort({ fecha: -1 })
      .limit(200);

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: toFhirPatient(paciente),
        },
        ...registros.map((item) => ({
          resource: {
            resourceType: 'Observation',
            id: String(item._id),
            status: 'final',
            category: [{ text: item.tipo || 'evolucion' }],
            code: { text: item.eventCategory || item.tipo || 'evolucion' },
            subject: { reference: `Patient/${pacienteId}` },
            performer: item.medico?.nombre ? [{ display: item.medico.nombre }] : [],
            effectiveDateTime: toIsoDate(item.fecha),
            valueString: item.descripcion,
            note: [
              item.clinicalSnapshot?.diagnostico ? { text: `Diagnostico: ${item.clinicalSnapshot.diagnostico}` } : null,
              item.clinicalSnapshot?.plan ? { text: `Plan: ${item.clinicalSnapshot.plan}` } : null,
            ].filter(Boolean),
          },
        })),
      ],
    };

    return res.json(bundle);
  } catch (error) {
    return res.status(500).json({ message: 'Error generando bundle clinico FHIR', error });
  }
};

exports.getHL7AdtA04 = async (req, res) => {
  try {
    const { pacienteId } = req.params;
    const paciente = await User.findById(pacienteId).select('nombre email telefono documento genero fechaNacimiento direccion rol');

    if (!paciente || paciente.rol !== 'paciente') {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const now = new Date();
    const ts = now.toISOString().replace(/[-:]/g, '').split('.')[0];

    const message = [
      `MSH|^~\\&|IntegraSalud|Hospital|SistemaExterno|RedClinica|${ts}||ADT^A04|${now.getTime()}|P|2.5`,
      `EVN|A04|${ts}`,
      `PID|1||${paciente.documento || paciente._id}||${paciente.nombre || ''}||${paciente.fechaNacimiento ? toIsoDate(paciente.fechaNacimiento)?.slice(0, 10).replace(/-/g, '') : ''}|${(paciente.genero || '').slice(0, 1).toUpperCase()}|||${paciente.direccion || ''}||${paciente.telefono || ''}|${paciente.email || ''}`,
      `PV1|1|O|||MED||||||||||||||||||||||||||||||||||||||||${ts}`,
    ].join('\n');

    return res.type('text/plain').send(message);
  } catch (error) {
    return res.status(500).json({ message: 'Error generando mensaje HL7 ADT', error });
  }
};
