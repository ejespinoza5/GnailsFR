import { api } from '../api/http'

const qs = (params) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()

/** Lo que la clienta puede pedirle al backend. */
export const reservasService = {
  servicios: () => api.get('/servicios'),
  profesionales: (servicioId) => api.get(`/servicios/${encodeURIComponent(servicioId)}/profesionales`),
  disponibilidad: ({ servicioId, profesionalId, desde, dias = 7 }) =>
    api.get(`/disponibilidad?${qs({ servicioId, profesionalId, desde, dias })}`),
  misCitas: () => api.get('/citas/mias'),
  reservar: (datos) => api.post('/citas', datos),
  cancelar: (id) => api.patch(`/citas/${encodeURIComponent(id)}/cancelar`),
}

/** Panel de la administradora. */
export const adminService = {
  servicios: () => api.get('/admin/servicios'),
  crearServicio: (d) => api.post('/admin/servicios', d),
  actualizarServicio: (id, d) => api.put(`/admin/servicios/${encodeURIComponent(id)}`, d),
  eliminarServicio: (id) => api.delete(`/admin/servicios/${encodeURIComponent(id)}`),

  profesionales: () => api.get('/admin/profesionales'),
  crearProfesional: (d) => api.post('/admin/profesionales', d),
  actualizarProfesional: (id, d) => api.put(`/admin/profesionales/${encodeURIComponent(id)}`, d),
  eliminarProfesional: (id) => api.delete(`/admin/profesionales/${encodeURIComponent(id)}`),

  horario: () => api.get('/admin/horario'),
  guardarHorario: (dias) => api.put('/admin/horario', { dias }),
  bloqueos: (desde, hasta) => api.get(`/admin/bloqueos?${qs({ desde, hasta })}`),
  crearBloqueo: (d) => api.post('/admin/bloqueos', d),
  eliminarBloqueo: (id) => api.delete(`/admin/bloqueos/${encodeURIComponent(id)}`),

  configuracion: () => api.get('/admin/configuracion'),
  guardarConfiguracion: (d) => api.put('/admin/configuracion', d),

  darAcceso: (id, email) => api.post(`/admin/profesionales/${encodeURIComponent(id)}/acceso`, { email }),
  quitarAcceso: (id) => api.delete(`/admin/profesionales/${encodeURIComponent(id)}/acceso`),
}

/** Agenda del equipo: la dueña ve todo; una profesional, solo lo suyo (lo decide el backend). */
export const agendaService = {
  contexto: (desde, hasta) => api.get(`/agenda/contexto?${qs({ desde, hasta })}`),
  citas: (filtros) => api.get(`/agenda/citas?${qs(filtros)}`),
  agendar: (d) => api.post('/agenda/citas', d),
  cambiarEstado: (id, estado) => api.patch(`/agenda/citas/${encodeURIComponent(id)}/estado`, { estado }),
  reprogramar: (id, d) => api.patch(`/agenda/citas/${encodeURIComponent(id)}/reprogramar`, d),
  eliminar: (id) => api.delete(`/agenda/citas/${encodeURIComponent(id)}`),
  disponibilidad: (params) => api.get(`/agenda/disponibilidad?${qs(params)}`),
  buscarClientas: (q) => api.get(`/agenda/clientas?${qs({ q })}`),
  recordatorio: (id) => api.post(`/agenda/citas/${encodeURIComponent(id)}/recordatorio`),
}
