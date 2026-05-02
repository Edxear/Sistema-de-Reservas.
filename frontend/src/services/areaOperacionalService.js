import API from './api';

// ── Incidentes ──────────────────────────────────────────────────────────────

/**
 * @param {{ area?: string, estado?: string, limit?: number }} params
 */
export const getIncidentes = async (params = {}) => {
  const res = await API.get('/area-operacional/incidentes', { params });
  return res.data;
};

/**
 * @param {{ area: string, tipo: string, titulo: string, descripcion?: string, accion?: string }} payload
 */
export const createIncidente = async (payload) => {
  const res = await API.post('/area-operacional/incidentes', payload);
  return res.data;
};

/**
 * @param {string} id
 * @param {{ estado?: string, accion?: string, descripcion?: string }} payload
 */
export const updateIncidente = async (id, payload) => {
  const res = await API.put(`/area-operacional/incidentes/${id}`, payload);
  return res.data;
};

// ── Checklist turno ─────────────────────────────────────────────────────────

/**
 * @param {{ area: string, turno: string, fecha: string }} params ISO date string for fecha
 */
export const getChecklist = async (params = {}) => {
  const res = await API.get('/area-operacional/checklist', { params });
  return res.data;
};

/**
 * @param {{ area: string, turno: string, fecha: string, items: Array }} payload
 */
export const createChecklist = async (payload) => {
  const res = await API.post('/area-operacional/checklist', payload);
  return res.data;
};

/**
 * @param {string} id
 * @param {{ items?: Array, cerrado?: boolean }} payload
 */
export const updateChecklist = async (id, payload) => {
  const res = await API.put(`/area-operacional/checklist/${id}`, payload);
  return res.data;
};
