/*
 * Service worker de Geovys Nails.
 * Recibe las notificaciones push (Firebase Cloud Messaging) y las muestra aunque la app esté cerrada.
 * Firebase envía mensajes de "datos" { titulo, cuerpo, url, tipo }; aquí se les da el formato de la marca.
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()))

self.addEventListener('push', (evento) => {
  let mensaje = {}
  try {
    const crudo = evento.data ? evento.data.json() : {}
    // FCM entrega { data: {...} }; un push de prueba puede traer los campos directo.
    mensaje = crudo.data ?? crudo
  } catch {
    mensaje = { cuerpo: evento.data ? evento.data.text() : '' }
  }

  const titulo = mensaje.titulo || 'Geovys Nails'
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: mensaje.cuerpo || '',
      icon: '/iconos/icono-192.png',
      badge: '/iconos/badge-96.png',
      lang: 'es',
      // Los recordatorios de la misma cita se reemplazan (no se apilan 30, 15 y 5 minutos).
      tag: mensaje.tipo === 'recordatorio' ? 'recordatorio' : undefined,
      renotify: mensaje.tipo === 'recordatorio',
      data: { url: mensaje.url || '/' },
    }),
  )
})

// Al tocar la notificación: si la app ya está abierta se enfoca y navega; si no, se abre.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  // Solo rutas de la propia app: una URL externa nunca se abre desde aquí.
  const ruta = String(evento.notification.data?.url || '/')
  const destino = new URL(ruta.startsWith('/') && !ruta.startsWith('//') ? ruta : '/', self.location.origin).href

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (new URL(v.url).origin === self.location.origin && 'focus' in v) {
          v.navigate(destino)
          return v.focus()
        }
      }
      return self.clients.openWindow(destino)
    }),
  )
})
