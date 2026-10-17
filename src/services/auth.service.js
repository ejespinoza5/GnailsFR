import { api } from '../api/http'

/** Todo lo que el frontend puede pedirle al backend sobre autenticación. */
export const authService = {
  yo: () => api.get('/auth/me'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  registro: (nombre, email, password) => api.post('/auth/registro', { nombre, email, password }),
  google: (credential) => api.post('/auth/google', { credential }),
  logout: () => api.post('/auth/logout'),
  logoutTodas: () => api.post('/auth/logout-todas'),

  estadoVerificacion: () => api.get('/auth/verificacion'),
  verificarCodigo: (codigo) => api.post('/auth/verificacion', { codigo }),
  reenviarCodigo: () => api.post('/auth/verificacion/reenviar'),

  olvide: (email) => api.post('/auth/olvide', { email }),
  restablecer: (token, password) => api.post('/auth/restablecer', { token, password }),

  actualizarPerfil: (datos) => api.patch('/auth/perfil', datos),
  cambiarPassword: (actual, nueva) => api.put('/auth/password', { actual, nueva }),
  subirFoto: (archivo) => api.subir('/auth/avatar', 'foto', archivo),
  quitarFoto: () => api.delete('/auth/avatar'),
}
