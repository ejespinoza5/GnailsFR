export class ErrorApi extends Error {
  constructor(mensaje, status, campos = {}, codigo) {
    super(mensaje)
    this.status = status
    this.campos = campos
    this.codigo = codigo
  }
}

// Rutas donde un 401 significa "datos incorrectos", no "token vencido".
const SIN_RENOVACION = ['/auth/login', '/auth/registro', '/auth/google', '/auth/refresh', '/auth/logout', '/auth/olvide', '/auth/restablecer']

// Si la renovación falla (sesión cerrada o expirada), AuthContext se entera por aquí.
let alExpirarSesion = () => {}
export function onSesionExpirada(fn) {
  alExpirarSesion = fn
}

async function llamar(ruta, { method = 'GET', body } = {}) {
  let respuesta
  try {
    respuesta = await fetch(`/api${ruta}`, {
      method,
      credentials: 'include', // envía las cookies HttpOnly; JavaScript nunca ve los tokens
      // FormData (fotos): el navegador pone el Content-Type multipart con su separador.
      headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ErrorApi('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 0)
  }

  if (respuesta.status === 204) return null

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new ErrorApi(datos.error || 'Ocurrió un error inesperado', respuesta.status, datos.campos, datos.codigo)
  }
  return datos
}

// Una sola renovación a la vez: si varias peticiones fallan juntas, todas esperan la misma.
let renovacionEnCurso = null
export function renovarSesion() {
  renovacionEnCurso ??= llamar('/auth/refresh', { method: 'POST' }).finally(() => {
    renovacionEnCurso = null
  })
  return renovacionEnCurso
}

/**
 * Hace la petición; si el access token venció (401), renueva la sesión con el
 * refresh token y repite la petición una vez. La clienta no nota nada.
 */
async function peticion(ruta, opciones) {
  try {
    return await llamar(ruta, opciones)
  } catch (err) {
    if (err.status !== 401 || SIN_RENOVACION.includes(ruta)) throw err

    try {
      await renovarSesion()
    } catch (errRenovar) {
      if (errRenovar.status === 401) alExpirarSesion()
      throw errRenovar
    }
    return llamar(ruta, opciones)
  }
}

/**
 * Cliente HTTP genérico: todos los servicios del frontend lo usan.
 * Ya renueva el token automáticamente; los servicios no se preocupan por eso.
 */
export const api = {
  get: (ruta) => peticion(ruta),
  post: (ruta, body) => peticion(ruta, { method: 'POST', body }),
  put: (ruta, body) => peticion(ruta, { method: 'PUT', body }),
  patch: (ruta, body) => peticion(ruta, { method: 'PATCH', body }),
  delete: (ruta) => peticion(ruta, { method: 'DELETE' }),
  request: (ruta, opciones) => peticion(ruta, opciones),
  /** Sube un archivo (multipart/form-data). */
  subir: (ruta, campo, archivo) => {
    const datos = new FormData()
    datos.append(campo, archivo)
    return peticion(ruta, { method: 'POST', body: datos })
  },
}
