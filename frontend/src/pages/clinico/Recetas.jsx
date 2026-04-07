import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { canAccessSupport } from '../../utils/roles';
import { createSupportTicket, listSupportTickets } from '../../services/soporteService';
import styles from './Recetas.module.css';

const initialMed = { nombre: '', dosis: '', presentacion: '', indicaciones: '', cantidad: '1' };
const medsSugeridos = ['Losartan 50mg', 'Amlodipina 5mg', 'Metformina 850mg', 'Omeprazol 20mg', 'Paracetamol 500mg'];
const dosisSugeridas = ['1 comprimido cada 12h', '1 comprimido cada 24h', '1 cucharada cada 8h'];
const indicacionesSugeridas = ['Tomar despues de las comidas', 'Tomar con abundante agua', 'Control en 30 dias'];
const diagnosticosSugeridos = ['I10', 'E11', 'J45', 'M54', 'K29', 'E78'];
const plantillas = [
  { value: 'pami', label: 'PAMI' },
  { value: 'osde', label: 'OSDE' },
  { value: 'swiss', label: 'Swiss Medical' },
  { value: 'generica', label: 'Genérica' },
];
const CRITICIDAD = ['critico', 'alto', 'medio', 'bajo'];
const ESTADOS = ['abierto', 'en_progreso', 'en_espera', 'resuelto', 'cerrado'];
const initialCoberturaForm = {
  obraSocial: '',
  tipoSolicitud: 'autorizacion',
  pacienteRef: '',
  nroAfiliado: '',
  descripcion: '',
  criticidad: 'medio',
};

const plantillaDesdeObraSocial = (obraSocial = '') => {
  const n = obraSocial.toLowerCase();
  if (n.includes('pami')) return 'pami';
  if (n.includes('osde')) return 'osde';
  if (n.includes('swiss')) return 'swiss';
  return 'generica';
};

export default function Recetas() {
  const { user } = useAuth();
  const role = user?.rol;
  const canManageCobertura = canAccessSupport(role);
  const location = useLocation();
  const [medicamentos, setMedicamentos] = useState([initialMed]);
  const [favoritas, setFavoritas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [esFavorita, setEsFavorita] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [plantilla, setPlantilla] = useState('pami');
  const [printOrientation, setPrintOrientation] = useState('landscape');
  const [coberturaForm, setCoberturaForm] = useState(initialCoberturaForm);
  const [coberturaFilter, setCoberturaFilter] = useState({ q: '', estado: '', desde: '', hasta: '' });
  const [coberturaTickets, setCoberturaTickets] = useState([]);
  const [loadingCobertura, setLoadingCobertura] = useState(false);
  const previewRef = useRef(null);
  const [formData, setFormData] = useState({
    obraSocial: '',
    numeroAfiliado: '',
    diagnosticoPrincipal: '',
    diagnosticoSecundario: '',
    observaciones: '',
    establecimiento: 'Consultorio San Pablo',
    unidadOperativa: 'Rosario'
  });

  const token = localStorage.getItem('token');

  const loadData = async () => {
    try {
      const [favRes, bookingsRes] = await Promise.all([
        API.get('/recetas/favoritas', { headers: { Authorization: `Bearer ${token}` } }),
        API.get('/bookings', { params: { page: 1, limit: 200 }, headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setFavoritas(favRes.data || []);
      setBookings(bookingsRes.data?.bookings || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cargando datos de recetas');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadCoberturaTickets = async () => {
    if (!canManageCobertura) return;
    setLoadingCobertura(true);
    try {
      const data = await listSupportTickets({ tipoGestion: 'obra_social' });
      const parsed = Array.isArray(data) ? data : [];
      setCoberturaTickets(parsed.filter((t) => t.tipoGestion === 'obra_social'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo cargar historial de cobertura');
    } finally {
      setLoadingCobertura(false);
    }
  };

  useEffect(() => {
    loadCoberturaTickets();
  }, [canManageCobertura]);

  const pacientes = useMemo(() => {
    const byId = new Map();
    for (const booking of bookings) {
      if (booking?.usuario?._id) {
        byId.set(booking.usuario._id, booking.usuario);
      }
    }
    return Array.from(byId.values()).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [bookings]);

  const pacienteSeleccionado = useMemo(
    () => pacientes.find((p) => p._id === pacienteId) || null,
    [pacientes, pacienteId]
  );

  const coberturaRequests = useMemo(() => {
    const query = String(coberturaFilter.q || '').trim().toLowerCase();
    const desdeTs = coberturaFilter.desde ? new Date(`${coberturaFilter.desde}T00:00:00`).getTime() : null;
    const hastaTs = coberturaFilter.hasta ? new Date(`${coberturaFilter.hasta}T23:59:59`).getTime() : null;

    return coberturaTickets
      .filter((t) => (coberturaFilter.estado ? t.estado === coberturaFilter.estado : true))
      .filter((t) => {
        if (!query) return true;
        const haystack = [
          t.titulo,
          t.descripcion,
          t.codigo,
          Array.isArray(t.tags) ? t.tags.join(' ') : '',
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .filter((t) => {
        const createdTs = new Date(t.createdAt).getTime();
        if (desdeTs && createdTs < desdeTs) return false;
        if (hastaTs && createdTs > hastaTs) return false;
        return true;
      })
      .slice(0, 30);
  }, [coberturaTickets, coberturaFilter]);

  const pacienteIdQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('pacienteId') || '';
  }, [location.search]);

  useEffect(() => {
    if (!pacienteIdQuery || pacientes.length === 0) return;
    const found = pacientes.find((p) => p._id === pacienteIdQuery);
    if (!found) return;
    setPacienteId(found._id);
    setPacienteQuery(`${found.nombre} (${found.email})`);
  }, [pacienteIdQuery, pacientes]);

  useEffect(() => {
    if (!pacienteSeleccionado) return;
    const obraSocialDetectada = pacienteSeleccionado.obraSocial || '';
    setFormData((prev) => ({
      ...prev,
      obraSocial: obraSocialDetectada || prev.obraSocial,
      numeroAfiliado: pacienteSeleccionado.numeroAfiliado || prev.numeroAfiliado,
    }));
    if (obraSocialDetectada) {
      setPlantilla(plantillaDesdeObraSocial(obraSocialDetectada));
    }
  }, [pacienteSeleccionado]);

  const handleMedChange = (index, field, value) => {
    const next = [...medicamentos];
    next[index][field] = value;
    setMedicamentos(next);
  };

  const addMed = () => setMedicamentos([...medicamentos, { ...initialMed }]);
  const removeMed = (index) => setMedicamentos(medicamentos.filter((_, i) => i !== index));

  const onPacienteInput = (value) => {
    setPacienteQuery(value);
    const found = pacientes.find((p) => `${p.nombre} (${p.email})` === value);
    if (found) {
      setPacienteId(found._id);
      return;
    }
    setPacienteId('');
  };

  const shareText = useMemo(() => {
    const meds = medicamentos
      .filter((m) => m.nombre)
      .map((m, idx) => `${idx + 1}. ${m.nombre} - ${m.dosis || 'sin dosis'}`)
      .join('\n');
    return `Receta médica\nPaciente: ${pacienteSeleccionado?.nombre || 'No seleccionado'}\nCobertura: ${formData.obraSocial || '-'}\nDiagnóstico principal: ${formData.diagnosticoPrincipal || '-'}\n\nMedicamentos:\n${meds}`;
  }, [medicamentos, pacienteSeleccionado, formData]);

  const preview = () => {
    const target = document.getElementById('receta-preview');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const printReceta = () => {
    if (!previewRef.current) return;

    const printWindow = window.open('', '_blank', 'width=1280,height=900');
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión');
      return;
    }

    const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const isPortrait = printOrientation === 'portrait';
    const targetWidth = isPortrait ? '198mm' : '285mm';
    const targetHeight = isPortrait ? '285mm' : '198mm';

    const printStyles = `
      <style>
        @page { size: A4 ${isPortrait ? 'portrait' : 'landscape'}; margin: 6mm; }
        html, body { margin: 0; padding: 0; background: #fff; }
        body { display: flex; justify-content: center; align-items: flex-start; }
        .print-root { width: 100%; display: flex; justify-content: center; }
        #receta-preview {
          width: ${targetWidth} !important;
          min-height: ${targetHeight} !important;
          max-height: ${targetHeight} !important;
          margin: 0 auto !important;
        }
      </style>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Receta para impresión</title>
          ${styleNodes}
          ${printStyles}
        </head>
        <body>
          <div class="print-root">${previewRef.current.outerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Receta medica',
          text: shareText,
        });
      } catch {
        // Ignorar cancelacion del usuario
      }
      return;
    }
    setShowShareOptions((prev) => !prev);
  };

  const exportPdf = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: '#f2f2f2' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: printOrientation, unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 4, 4, pageWidth - 8, pageHeight - 8);
    pdf.save(`receta-${pacienteSeleccionado?.nombre || 'paciente'}.pdf`);
  };

  const qrValue = useMemo(() => {
    const payload = {
      paciente: pacienteSeleccionado?.nombre || '',
      afiliado: formData.numeroAfiliado || '',
      obraSocial: formData.obraSocial || '',
      diagnosticoPrincipal: formData.diagnosticoPrincipal || '',
      diagnosticoSecundario: formData.diagnosticoSecundario || '',
      medicamentos: medicamentos
        .filter((m) => m.nombre)
        .map((m) => ({ nombre: m.nombre, dosis: m.dosis, presentacion: m.presentacion })),
      emision: new Date().toISOString(),
    };

    return JSON.stringify(payload);
  }, [pacienteSeleccionado, formData, medicamentos]);

  const submit = async (e) => {
    e.preventDefault();
    if (!pacienteId) return toast.error('Selecciona un paciente desde el autocompletado');

    const medicamentosValidos = medicamentos
      .filter((m) => m.nombre.trim())
      .map((m) => ({
        nombre: m.nombre.trim(),
        dosis: m.dosis.trim(),
        presentacion: m.presentacion.trim(),
        indicaciones: m.indicaciones.trim(),
      }));

    if (medicamentosValidos.length === 0) return toast.error('Agrega al menos un medicamento');

    try {
      const res = await API.post(
        '/recetas',
        {
          paciente: pacienteId,
          medicamentos: medicamentosValidos,
          esFavorita,
          diagnosticoPrincipal: formData.diagnosticoPrincipal,
          diagnosticoSecundario: formData.diagnosticoSecundario,
          observaciones: formData.observaciones,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Receta creada');

      const alerts = Array.isArray(res.data?.safetyAlerts) ? res.data.safetyAlerts : [];
      if (alerts.length > 0) {
        alerts.slice(0, 3).forEach((alert) => {
          toast.warn(`Alerta de seguridad (${alert.severity}): ${alert.message}`);
        });
      }

      setMedicamentos([{ ...initialMed }]);
      setEsFavorita(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creando receta');
    }
  };

  const handleCreateCoberturaRequest = async (e) => {
    e.preventDefault();
    if (!canManageCobertura) {
      toast.error('Solo administradores pueden registrar solicitudes con cobertura');
      return;
    }
    if (!coberturaForm.obraSocial.trim() || !coberturaForm.descripcion.trim()) {
      toast.error('Completa cobertura y descripcion para registrar la solicitud');
      return;
    }

    try {
      await createSupportTicket({
        titulo: `Solicitud ${coberturaForm.tipoSolicitud} - ${coberturaForm.obraSocial.trim()}`,
        descripcion: `${coberturaForm.descripcion.trim()}${coberturaForm.nroAfiliado?.trim() ? `\nAfiliado: ${coberturaForm.nroAfiliado.trim()}` : ''}`,
        criticidad: coberturaForm.criticidad,
        tipoGestion: 'obra_social',
        soporteNivel: 'L2',
        areaClinica: 'Gestion institucional',
        modulo: 'Cobertura',
        impactoClinico: coberturaForm.pacienteRef?.trim() ? `Paciente referencia: ${coberturaForm.pacienteRef.trim()}` : '',
        solicitanteNombre: user?.nombre || '',
        solicitanteRol: role || '',
        solicitanteArea: 'Gestion',
        requiresChangeValidation: false,
        tags: [
          'obra_social',
          'interinstitucional',
          coberturaForm.tipoSolicitud,
          coberturaForm.obraSocial.trim().toLowerCase().replace(/\s+/g, '_'),
        ],
      });

      setCoberturaForm(initialCoberturaForm);
      toast.success('Solicitud de cobertura registrada');
      await loadCoberturaTickets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo registrar la solicitud con cobertura');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Recetas</h1>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={preview}>Ver</button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={printReceta}>Imprimir</button>
          <button type="button" className={styles.btn} onClick={exportPdf}>Exportar PDF</button>
          <button type="button" className={`${styles.btn} ${styles.btnAccent}`} onClick={shareNative}>Compartir</button>
        </div>
      </div>

      <div className={styles.layout}>
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>Autocompletar receta</h2>
          <form onSubmit={submit} className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Paciente</label>
              <input
                className={styles.input}
                list="pacientes-list"
                value={pacienteQuery}
                onChange={(e) => onPacienteInput(e.target.value)}
                placeholder="Buscar por nombre o email"
                required
              />
              <datalist id="pacientes-list">
                {pacientes.map((p) => (
                  <option key={p._id} value={`${p.nombre} (${p.email})`} />
                ))}
              </datalist>
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Cobertura</label>
                <input
                  className={styles.input}
                  value={formData.obraSocial}
                  onChange={(e) => setFormData({ ...formData, obraSocial: e.target.value })}
                  placeholder="PAMI, OSDE, etc"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Plantilla</label>
                <select
                  className={styles.select}
                  value={plantilla}
                  onChange={(e) => setPlantilla(e.target.value)}
                >
                  {plantillas.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Orientación de impresión</label>
                <select
                  className={styles.select}
                  value={printOrientation}
                  onChange={(e) => setPrintOrientation(e.target.value)}
                >
                  <option value="landscape">Horizontal (A4)</option>
                  <option value="portrait">Vertical (A4)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nro de afiliado</label>
                <input
                  className={styles.input}
                  value={formData.numeroAfiliado}
                  onChange={(e) => setFormData({ ...formData, numeroAfiliado: e.target.value })}
                  placeholder="Codigo de afiliado"
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Diagnostico principal</label>
                <input
                  className={styles.input}
                  list="diag-codes"
                  value={formData.diagnosticoPrincipal}
                  onChange={(e) => setFormData({ ...formData, diagnosticoPrincipal: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Diagnostico secundario</label>
                <input
                  className={styles.input}
                  list="diag-codes"
                  value={formData.diagnosticoSecundario}
                  onChange={(e) => setFormData({ ...formData, diagnosticoSecundario: e.target.value })}
                />
              </div>
            </div>

            <datalist id="diag-codes">
              {diagnosticosSugeridos.map((code) => (
                <option key={code} value={code} />
              ))}
            </datalist>

            <div className={styles.formGroup}>
              <label className={styles.label}>Observaciones</label>
              <textarea
                className={styles.textarea}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Indicaciones generales"
              />
            </div>

            <div className={styles.medsHeader}>Medicamentos</div>
            {medicamentos.map((med, idx) => (
              <div key={`med-${idx}`} className={styles.medCard}>
                <div className={styles.medTop}>
                  <span className={styles.medTitle}>Medicamento {idx + 1}</span>
                  {medicamentos.length > 1 && (
                    <button type="button" className={`${styles.btn} ${styles.btnDanger}`} onClick={() => removeMed(idx)}>
                      Quitar
                    </button>
                  )}
                </div>
                <input
                  className={styles.input}
                  list="meds-list"
                  placeholder="Nombre"
                  value={med.nombre}
                  onChange={(e) => handleMedChange(idx, 'nombre', e.target.value)}
                  required
                />
                <datalist id="meds-list">
                  {medsSugeridos.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>

                <div className={styles.row2}>
                  <input
                    className={styles.input}
                    list="dosis-list"
                    placeholder="Dosis"
                    value={med.dosis}
                    onChange={(e) => handleMedChange(idx, 'dosis', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Presentacion"
                    value={med.presentacion}
                    onChange={(e) => handleMedChange(idx, 'presentacion', e.target.value)}
                  />
                </div>

                <datalist id="dosis-list">
                  {dosisSugeridas.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>

                <div className={styles.row2}>
                  <input
                    className={styles.input}
                    list="indicaciones-list"
                    placeholder="Indicaciones"
                    value={med.indicaciones}
                    onChange={(e) => handleMedChange(idx, 'indicaciones', e.target.value)}
                  />
                  <input
                    className={styles.input}
                    placeholder="Cant. rec."
                    value={med.cantidad}
                    onChange={(e) => handleMedChange(idx, 'cantidad', e.target.value)}
                  />
                </div>

                <datalist id="indicaciones-list">
                  {indicacionesSugeridas.map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
              </div>
            ))}

            <div className={styles.actions}>
              <button type="button" className={styles.btn} onClick={addMed}>Agregar medicamento</button>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={esFavorita}
                  onChange={(e) => setEsFavorita(e.target.checked)}
                  style={{ marginRight: 8 }}
                />
                Marcar como favorita
              </label>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Guardar receta</button>
            </div>
          </form>

          {showShareOptions && (
            <div className={styles.shareRow}>
              <a className={styles.btn} href={`mailto:?subject=Receta medica&body=${encodeURIComponent(shareText)}`}>Email</a>
              <a className={styles.btn} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">WhatsApp</a>
              <a className={styles.btn} href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">X</a>
            </div>
          )}

          <h3 className={styles.sectionTitle} style={{ marginTop: 16 }}>Recetas favoritas</h3>
          {favoritas.length === 0 ? (
            <p>No hay recetas favoritas.</p>
          ) : (
            <ul className={styles.favoriteList}>
              {favoritas.map((r) => (
                <li key={r._id} className={styles.favoriteItem}>
                  {new Date(r.fechaEmision).toLocaleDateString()} - {r.medicamentos.length} medicamento(s)
                </li>
              ))}
            </ul>
          )}

          <h3 className={styles.sectionTitle} style={{ marginTop: 16 }}>Cobertura</h3>
          {!canManageCobertura ? (
            <p className={styles.coverageHint}>Disponible para roles de administración dentro del flujo unificado de Recetas.</p>
          ) : (
            <div className={styles.coverageBlock}>
              <form onSubmit={handleCreateCoberturaRequest} className={styles.formGrid}>
                <div className={styles.row2}>
                  <input
                    className={styles.input}
                    placeholder="Cobertura"
                    value={coberturaForm.obraSocial}
                    onChange={(e) => setCoberturaForm((prev) => ({ ...prev, obraSocial: e.target.value }))}
                    required
                  />
                  <select
                    className={styles.select}
                    value={coberturaForm.tipoSolicitud}
                    onChange={(e) => setCoberturaForm((prev) => ({ ...prev, tipoSolicitud: e.target.value }))}
                  >
                    <option value="autorizacion">Autorizacion</option>
                    <option value="rechazo">Reconsideracion de rechazo</option>
                    <option value="auditoria">Auditoria / documentacion</option>
                    <option value="facturacion">Ajuste de facturacion</option>
                    <option value="prestacion">Alta o modificacion de prestacion</option>
                  </select>
                </div>

                <div className={styles.row2}>
                  <input
                    className={styles.input}
                    placeholder="Paciente referencia (opcional)"
                    value={coberturaForm.pacienteRef}
                    onChange={(e) => setCoberturaForm((prev) => ({ ...prev, pacienteRef: e.target.value }))}
                  />
                  <input
                    className={styles.input}
                    placeholder="Nro afiliado (opcional)"
                    value={coberturaForm.nroAfiliado}
                    onChange={(e) => setCoberturaForm((prev) => ({ ...prev, nroAfiliado: e.target.value }))}
                  />
                </div>

                <div className={styles.row2}>
                  <select
                    className={styles.select}
                    value={coberturaForm.criticidad}
                    onChange={(e) => setCoberturaForm((prev) => ({ ...prev, criticidad: e.target.value }))}
                  >
                    {CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div />
                </div>

                <textarea
                  className={styles.textarea}
                  placeholder="Detalle de solicitud"
                  value={coberturaForm.descripcion}
                  onChange={(e) => setCoberturaForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                  required
                />

                <div className={styles.actions}>
                  <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Registrar solicitud</button>
                </div>
              </form>

              <div className={styles.formGrid} style={{ marginTop: 10 }}>
                <div className={styles.row2}>
                  <input
                    className={styles.input}
                    placeholder="Buscar por texto/codigo"
                    value={coberturaFilter.q}
                    onChange={(e) => setCoberturaFilter((prev) => ({ ...prev, q: e.target.value }))}
                  />
                  <select
                    className={styles.select}
                    value={coberturaFilter.estado}
                    onChange={(e) => setCoberturaFilter((prev) => ({ ...prev, estado: e.target.value }))}
                  >
                    <option value="">Todos los estados</option>
                    {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                  </select>
                </div>

                <div className={styles.row2}>
                  <input
                    type="date"
                    className={styles.input}
                    value={coberturaFilter.desde}
                    onChange={(e) => setCoberturaFilter((prev) => ({ ...prev, desde: e.target.value }))}
                  />
                  <input
                    type="date"
                    className={styles.input}
                    value={coberturaFilter.hasta}
                    onChange={(e) => setCoberturaFilter((prev) => ({ ...prev, hasta: e.target.value }))}
                  />
                </div>
              </div>

              {loadingCobertura ? <p style={{ marginTop: 10 }}>Cargando historial...</p> : null}
              {!loadingCobertura && coberturaRequests.length === 0 ? <p style={{ marginTop: 10 }}>No hay solicitudes para los filtros aplicados.</p> : null}
              {!loadingCobertura && coberturaRequests.length > 0 ? (
                <ul className={styles.favoriteList}>
                  {coberturaRequests.map((req) => (
                    <li key={req._id} className={styles.favoriteItem}>
                      <strong>{req.titulo}</strong>
                      <div className={styles.requestMeta}>Codigo: {req.codigo} | Estado: {req.estado} | Criticidad: {req.criticidad}</div>
                      <div>{req.descripcion}</div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
        </section>

        <section className={styles.previewWrap}>
          <article ref={previewRef} className={`${styles.prescription} ${styles[`template_${plantilla}`]}`} id="receta-preview">
            <div className={styles.left}>
              <div className={styles.topRow}>
                <div>
                  <div className={styles.brand}>{plantillas.find((p) => p.value === plantilla)?.label || 'Receta'}</div>
                  <div className={styles.unit}>UNIDAD OPERATIVA {formData.unidadOperativa}</div>
                </div>
                <div className={styles.barcode} />
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoLine}>
                  <span className={styles.infoLabel}>Apellido y nombre</span>
                  <span className={styles.infoValue}>{pacienteSeleccionado?.nombre || 'Paciente no seleccionado'}</span>
                </div>
                <div className={styles.infoLine}>
                  <span className={styles.infoLabel}>Nro beneficiario</span>
                  <span className={styles.infoValue}>{formData.numeroAfiliado || '-'}</span>
                </div>
                <div className={styles.infoLine}>
                  <span className={styles.infoLabel}>Cobertura</span>
                  <span className={styles.infoValue}>{formData.obraSocial || '-'}</span>
                </div>
              </div>

              <div className={styles.medSection}>
                {medicamentos.map((m, idx) => (
                  <div className={styles.medRow} key={`preview-med-${idx}`}>
                    <div className={styles.rp}>Rp./{idx + 1}</div>
                    <div className={styles.medText}>
                      {m.nombre || 'Medicamento'}
                      {m.dosis ? ` (${m.dosis})` : ''}
                      {m.presentacion ? ` - ${m.presentacion}` : ''}
                      {m.indicaciones ? ` - ${m.indicaciones}` : ''}
                    </div>
                    <div className={styles.cant}>{m.cantidad || '1'}</div>
                  </div>
                ))}
              </div>

              <div className={styles.signatureArea}>
                <div className={styles.signatureTitle}>Firma y sello aclaratorio profesional</div>
                <div className={styles.qrWrap}>
                  <QRCodeCanvas value={qrValue} size={110} includeMargin bgColor="#f2f2f2" fgColor="#1f2937" />
                </div>
                <div className={styles.signatureName}>Profesional: {JSON.parse(localStorage.getItem('user') || '{}')?.nombre || '---'}</div>
                <div>Establecimiento: {formData.establecimiento}</div>
                <div>Observaciones: {formData.observaciones || '-'}</div>
              </div>

              <div className={styles.diagnosis}>
                <div className={styles.diagCard}>
                  <div className={styles.diagTitle}>Diagnostico principal</div>
                  <div className={styles.diagCode}>{formData.diagnosticoPrincipal || '-'}</div>
                </div>
                <div className={styles.diagCard}>
                  <div className={styles.diagTitle}>Diagnostico secundario</div>
                  <div className={styles.diagCode}>{formData.diagnosticoSecundario || '-'}</div>
                </div>
              </div>
            </div>

            <aside className={styles.right}>
              <div className={styles.ticket}>TROQUEL 1</div>
              <div className={styles.ticket}>TROQUEL 2</div>
              <div className={styles.ticket}>TROQUEL 3</div>
            </aside>
          </article>
        </section>
      </div>
    </div>
  );
}

