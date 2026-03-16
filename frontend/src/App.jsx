import React, { useEffect, useState } from 'react';
import { getDoctors, createAppointment } from './services/appointmentService';
import { getServices } from './services/serviceService';

function App() {
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [patient, setPatient] = useState({ name: '', email: '', phone: '' });
  const [date, setDate] = useState('');

  useEffect(() => {
    (async () => {
      const data = await getDoctors();
      setDoctors(data);
      if (data.length > 0) setSelectedDoctor(data[0]._id);

      const srv = await getServices();
      setServices(srv);
      if (srv.length > 0) setSelectedService(srv[0]._id);
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createAppointment({
      doctor: selectedDoctor,
      service: selectedService,
      patient: patient._id || null,
      date: new Date(date),
    });
    alert('Turno solicitado');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Reserva de turnos - Consultorio</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Doctor:</label>
          <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>
            ))}
          </select>
        </div>
        <div>
          <label>Servicio:</label>
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
            {services.map((s) => (
              <option key={s._id} value={s._id}>{s.nombre} - {s.duracion} min - ${s.precio}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Paciente Nombre:</label>
          <input type="text" value={patient.name} onChange={(e) => setPatient({ ...patient, name: e.target.value })} required />
        </div>
        <div>
          <label>Email:</label>
          <input type="email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} required />
        </div>
        <div>
          <label>Teléfono:</label>
          <input type="text" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })} required />
        </div>
        <div>
          <label>Fecha y hora:</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <button type="submit">Reservar turno</button>
      </form>
    </div>
  );
}

export default App;
