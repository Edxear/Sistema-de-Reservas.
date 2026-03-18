import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
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

const plantillaDesdeObraSocial = (obraSocial = '') => {
  const n = obraSocial.toLowerCase();
  if (n.includes('pami')) return 'pami';
  if (n.includes('osde')) return 'osde';
  if (n.includes('swiss')) return 'swiss';
  return 'generica';
};

export default function Recetas() {
  const [medicamentos, setMedicamentos] = useState([initialMed]);
  const [favoritas, setFavoritas] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [esFavorita, setEsFavorita] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [plantilla, setPlantilla] = useState('pami');
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
    return `Receta médica\nPaciente: ${pacienteSeleccionado?.nombre || 'No seleccionado'}\nObra social: ${formData.obraSocial || '-'}\nDiagnóstico principal: ${formData.diagnosticoPrincipal || '-'}\n\nMedicamentos:\n${meds}`;
  }, [medicamentos, pacienteSeleccionado, formData]);

  const preview = () => {
    const target = document.getElementById('receta-preview');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const printReceta = () => window.print();

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
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
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
      await API.post(
        '/recetas',
        { paciente: pacienteId, medicamentos: medicamentosValidos, esFavorita },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Receta creada');
      setMedicamentos([{ ...initialMed }]);
      setEsFavorita(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creando receta');
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
                <label className={styles.label}>Obra social</label>
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
                  <span className={styles.infoLabel}>Obra social</span>
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
