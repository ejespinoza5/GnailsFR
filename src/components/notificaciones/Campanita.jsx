import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Bell, BellOff, CalendarCheck, CalendarClock, CalendarX2, Clock, Megaphone, MessageSquareQuote, Sparkles } from 'lucide-react'
import { notificacionesService } from '../../services/notificaciones.service'
import { useCarga } from '../../hooks/useCarga'

const ICONOS = {
  cita_confirmada: CalendarCheck,
  cita_nueva: CalendarCheck,
  cita_reprogramada: CalendarClock,
  cita_cancelada: CalendarX2,
  recordatorio: Clock,
  promocion: Megaphone,
  opinion: Sparkles,
  opinion_nueva: MessageSquareQuote,
}

const fRelativa = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
function hace(fecha) {
  const seg = (new Date(fecha).getTime() - Date.now()) / 1000
  const minutos = Math.round(seg / 60)
  if (Math.abs(minutos) < 1) return 'ahora'
  if (Math.abs(minutos) < 60) return fRelativa.format(minutos, 'minute')
  const horas = Math.round(minutos / 60)
  if (Math.abs(horas) < 24) return fRelativa.format(horas, 'hour')
  return fRelativa.format(Math.round(horas / 24), 'day')
}

/**
 * Campanita con la bandeja de avisos. Se actualiza cada minuto y al volver a la pestaña.
 * variante "barra" (clienta, arriba a la derecha) o "riel" (panel lateral de la dueña o la profesional).
 */
export default function Campanita({ variante = 'barra' }) {
  const [abierta, setAbierta] = useState(false)
  // Cambios hechos aquí (marcar leídas) que se ven al instante, antes de que responda el servidor.
  const [optimista, setOptimista] = useState(null)
  const raiz = useRef(null)
  const navegar = useNavigate()
  const { datos: cargados, recargar } = useCarga(() => notificacionesService.bandeja(), [])
  const datos = optimista ?? cargados ?? { notificaciones: [], noLeidas: 0 }

  const actualizar = async () => {
    await recargar({ silencioso: true })
    setOptimista(null)
  }

  useEffect(() => {
    const cargar = () => recargar({ silencioso: true })
    const id = setInterval(cargar, 60_000)
    const alVolver = () => document.visibilityState === 'visible' && cargar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [recargar])

  useEffect(() => {
    if (!abierta) return
    const cerrar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !raiz.current?.contains(e.target)) setAbierta(false)
    }
    document.addEventListener('pointerdown', cerrar)
    document.addEventListener('keydown', cerrar)
    return () => {
      document.removeEventListener('pointerdown', cerrar)
      document.removeEventListener('keydown', cerrar)
    }
  }, [abierta])

  const abrir = async (n) => {
    setAbierta(false)
    if (!n.leida) {
      setOptimista({
        noLeidas: Math.max(0, datos.noLeidas - 1),
        notificaciones: datos.notificaciones.map((x) => (x.id === n.id ? { ...x, leida: true } : x)),
      })
      notificacionesService.marcarLeidas([n.id]).then(actualizar, () => setOptimista(null))
    }
    // Solo rutas de la app (los enlaces https de una promoción se abren en otra pestaña).
    if (n.url?.startsWith('/')) navegar(n.url)
    else if (n.url?.startsWith('https://')) window.open(n.url, '_blank', 'noopener,noreferrer')
  }

  const leerTodas = async () => {
    setOptimista({ noLeidas: 0, notificaciones: datos.notificaciones.map((x) => ({ ...x, leida: true })) })
    await notificacionesService.marcarLeidas().then(actualizar, () => setOptimista(null))
  }

  const { notificaciones, noLeidas } = datos
  const etiqueta = noLeidas ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'

  return (
    <div className={`campanita campanita--${variante}`} ref={raiz}>
      <button
        type="button"
        className="campanita__boton"
        aria-label={etiqueta}
        aria-expanded={abierta}
        aria-haspopup="true"
        data-texto="Notificaciones"
        onClick={() => setAbierta((a) => !a)}
      >
        <Bell size={19} strokeWidth={1.8} aria-hidden="true" />
        {variante === 'riel' && <span className="riel__texto">Notificaciones</span>}
        {noLeidas > 0 && <span className="campanita__contador">{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>

      {abierta && (
        <div className="campanita__panel" role="dialog" aria-label="Notificaciones">
          <div className="campanita__cabecera">
            <h2>Notificaciones</h2>
            {noLeidas > 0 && (
              <button type="button" className="enlace" onClick={leerTodas}>
                Marcar todo como leído
              </button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <div className="campanita__vacia">
              <BellOff size={22} aria-hidden="true" />
              <p>Aquí verás tus recordatorios y avisos.</p>
            </div>
          ) : (
            <ul className="campanita__lista">
              {notificaciones.map((n) => {
                const Icono = ICONOS[n.tipo] ?? Bell
                return (
                  <li key={n.id}>
                    <button type="button" className={`aviso-item${n.leida ? '' : ' aviso-item--nuevo'}`} onClick={() => abrir(n)}>
                      <span className={`aviso-item__icono aviso-item__icono--${n.tipo}`} aria-hidden="true">
                        <Icono size={17} />
                      </span>
                      <span className="aviso-item__texto">
                        <strong>{n.titulo}</strong>
                        <span>{n.cuerpo}</span>
                        <small>{hace(n.creadoEn)}</small>
                      </span>
                      {!n.leida && <span className="sr-only">(sin leer)</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
