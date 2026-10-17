import { api } from '../api/http'

/** Landing pública: un solo pedido trae todo (portada, servicios, galería, opiniones, ubicación). */
export const sitioService = {
  landing: () => api.get('/publico/landing'),
}

/** Edición de la página desde el panel. Todas devuelven el contenido actualizado. */
export const sitioAdminService = {
  contenido: () => api.get('/admin/sitio'),
  guardarTextos: (d) => api.put('/admin/sitio/textos', d),
  guardarUbicacion: (d) => api.put('/admin/sitio/ubicacion', d),
  resolverMapa: (url) => api.post('/admin/sitio/resolver-mapa', { url }),
  subirPortada: (archivo) => api.subir('/admin/sitio/portada', 'foto', archivo),
  quitarPortada: () => api.delete('/admin/sitio/portada'),
  subirFoto: (archivo) => api.subir('/admin/sitio/galeria', 'foto', archivo),
  actualizarFoto: (id, d) => api.patch(`/admin/sitio/galeria/${encodeURIComponent(id)}`, d),
  ordenar: (ids) => api.put('/admin/sitio/galeria/orden', { ids }),
  eliminarFoto: (id) => api.delete(`/admin/sitio/galeria/${encodeURIComponent(id)}`),

  resenas: () => api.get('/admin/resenas'),
  moderar: (id, d) => api.patch(`/admin/resenas/${encodeURIComponent(id)}`, d),
}

/** La opinión propia de la clienta. */
export const resenaService = {
  mia: () => api.get('/resenas/mia'),
  guardar: (d) => api.put('/resenas/mia', d),
  eliminar: () => api.delete('/resenas/mia'),
}

/** Enlaces de Google Maps a partir de las coordenadas (no requieren clave de API). */
export const mapas = {
  embebido: (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}&z=16&hl=es&output=embed`,
  comoLlegar: (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
}
