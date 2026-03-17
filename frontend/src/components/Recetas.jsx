import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';

const initialMed = { nombre: '', dosis: '', presentacion: '', indicaciones: '' };

export default function Recetas() {
  const [medicamentos, setMedicamentos] = useState([initialMed]);
  const [favoritas, setFavoritas] = useState([]);
  const [pacienteId, setPacienteId] = useState('');

  const token = localStorage.getItem('token');

  const loadFavoritas = async () => {
    try {
      const res = await API.get('/recetas/favoritas', { headers: { Authorization: `Bearer ${token}` } });
      setFavoritas(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cargando recetas favoritas');
    }
  };

  useEffect(() => {
    loadFavoritas();
  }, []);

  const handleMedChange = (index, field, value) => {
    const next = [...medicamentos];
    next[index][field] = value;
    setMedicamentos(next);
  };

  const addMed = () => setMedicamentos([...medicamentos, initialMed]);
  const removeMed = (index) => setMedicamentos(medicamentos.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    if (!pacienteId) return toast.error('Indica el ID del paciente');

    try {
      await API.post(
        '/recetas',
        { paciente: pacienteId, medicamentos },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Receta creada');
      setMedicamentos([initialMed]);
      loadFavoritas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creando receta');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 20 }}>
      <h1>Recetas</h1>
      <section style={{ marginBottom: 24 }}>
        <h2>Crear receta</h2>
        <form onSubmit={submit}>
          <div>
            <label>ID paciente</label>
            <input value={pacienteId} onChange={(e) => setPacienteId(e.target.value)} required />
          </div>
          {medicamentos.map((med, idx) => (
            <div key={idx} style={{ border: '1px solid #ddd', padding: 12, marginTop: 12 }}>
              <h4>Medicamento {idx + 1}</h4>
              <input
                placeholder="Nombre"
                value={med.nombre}
                onChange={(e) => handleMedChange(idx, 'nombre', e.target.value)}
                required
              />
              <input
                placeholder="Dosis"
                value={med.dosis}
                onChange={(e) => handleMedChange(idx, 'dosis', e.target.value)}
              />
              <input
                placeholder="Presentación"
                value={med.presentacion}
                onChange={(e) => handleMedChange(idx, 'presentacion', e.target.value)}
              />
              <input
                placeholder="Indicaciones"
                value={med.indicaciones}
                onChange={(e) => handleMedChange(idx, 'indicaciones', e.target.value)}
              />
              {medicamentos.length > 1 && (
                <button type="button" onClick={() => removeMed(idx)}>
                  Quitar
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addMed} style={{ marginTop: 12 }}>
            Agregar medicamento
          </button>
          <div>
            <button type="submit" style={{ marginTop: 12 }}>
              Guardar receta
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2>Recetas favoritas</h2>
        {favoritas.length === 0 ? (
          <p>No hay recetas favoritas</p>
        ) : (
          <ul>
            {favoritas.map((r) => (
              <li key={r._id} style={{ marginBottom: 12 }}>
                <strong>{new Date(r.fechaEmision).toLocaleDateString()}</strong> - {r.medicamentos.length} medicamentos
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
