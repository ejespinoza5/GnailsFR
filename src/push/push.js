import { notificacionesService } from '../services/notificaciones.service'

/*
 * Notificaciones push con Firebase Cloud Messaging.
 * El SDK de Firebase se carga solo cuando hace falta (no pesa en la carga inicial).
 * El token de este dispositivo se guarda en el navegador para poder olvidarlo al cerrar sesión.
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY
const CLAVE_TOKEN = 'gn_push_token'

const leer = () => {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    return null
  }
}
const guardar = (t) => {
  try {
    if (t) localStorage.setItem(CLAVE_TOKEN, t)
    else localStorage.removeItem(CLAVE_TOKEN)
  } catch {
    /* sin almacenamiento: se vuelve a pedir el token la próxima vez */
  }
}

export const pushConfigurado = Boolean(config.apiKey && config.projectId && config.messagingSenderId && config.appId && VAPID)

/** iPhone/iPad solo reciben push si la app se agregó a la pantalla de inicio. */
export function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
export function instaladaComoApp() {
  return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
}

/** 'no-configurado' | 'no-soportado' | 'requiere-instalar' | 'bloqueado' | 'activo' | 'inactivo' */
export function estadoPush() {
  if (!pushConfigurado) return 'no-configurado'
  if (esIOS() && !instaladaComoApp()) return 'requiere-instalar'
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'no-soportado'
  if (Notification.permission === 'denied') return 'bloqueado'
  return Notification.permission === 'granted' && leer() ? 'activo' : 'inactivo'
}

async function obtenerToken() {
  const registro = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const [{ initializeApp, getApps }, { getMessaging, getToken }] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ])
  const app = getApps()[0] ?? initializeApp(config)
  return getToken(getMessaging(app), { vapidKey: VAPID, serviceWorkerRegistration: registro })
}

/** Pide permiso (debe llamarse desde un toque del usuario) y registra este dispositivo. */
export async function activarPush() {
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') throw new Error('No diste permiso para las notificaciones.')
  const token = await obtenerToken()
  await notificacionesService.registrarDispositivo(token)
  guardar(token)
  return token
}

/** Deja de recibir push en este dispositivo (la bandeja de la app sigue funcionando). */
export async function desactivarPush() {
  const token = leer()
  guardar(null)
  if (token) await notificacionesService.quitarDispositivo(token).catch(() => {})
}

/**
 * Al abrir la app con el permiso ya dado, se refresca el token (Firebase lo rota de vez en cuando)
 * y se asocia a quien tiene la sesión. No muestra nada ni pide permisos.
 */
export async function sincronizarPush() {
  if (!pushConfigurado || Notification?.permission !== 'granted' || !leer()) return
  try {
    const token = await obtenerToken()
    await notificacionesService.registrarDispositivo(token)
    guardar(token)
  } catch {
    /* sin conexión o Firebase no disponible: se intenta en la próxima visita */
  }
}

/** Al cerrar sesión: este dispositivo deja de recibir los avisos de esta cuenta. */
export async function olvidarDispositivo() {
  const token = leer()
  if (!token) return
  await notificacionesService.quitarDispositivo(token).catch(() => {})
}
