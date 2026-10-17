import { api } from '../api/http'

export const notificacionesService = {
  bandeja: () => api.get('/notificaciones'),
  marcarLeidas: (ids = null) => api.post('/notificaciones/leer', { ids }),
  registrarDispositivo: (token) => api.post('/notificaciones/dispositivos', { token }),
  quitarDispositivo: (token) => api.request('/notificaciones/dispositivos', { method: 'DELETE', body: { token } }),
  preferencias: () => api.get('/notificaciones/preferencias'),
  guardarPreferencias: (d) => api.put('/notificaciones/preferencias', d),
}

export const campanasService = {
  listar: () => api.get('/admin/campanas'),
  crear: (d) => api.post('/admin/campanas', d),
  cancelar: (id) => api.patch(`/admin/campanas/${encodeURIComponent(id)}/cancelar`),
}
