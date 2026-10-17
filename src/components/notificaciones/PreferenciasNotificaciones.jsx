import { useState } from 'react'
import { BellRing, Share, SquarePlus } from 'lucide-react'
import { notificacionesService } from '../../services/notificaciones.service'
import { useCarga } from '../../hooks/useCarga'
import { activarPush, desactivarPush, estadoPush } from '../../push/push'
import Alerta from '../ui/Alerta'
import { useAvisos } from '../ui/Avisos'

/** En «Mi cuenta»: activar las notificaciones en este dispositivo y elegir qué avisos recibir. */
export default function PreferenciasNotificaciones({ esClienta = true }) {
  const { datos, recargar } = useCarga(() => notificacionesService.preferencias(), [])
  const [guardando, setGuardando] = useState(false)
  const avisar = useAvisos()

  const cambiar = async (campo, valor) => {
    setGuardando(true)
    try {
      await notificacionesService.guardarPreferencias({ ...datos.preferencias, [campo]: valor })
      await recargar({ silencioso: true })
      avisar('Preferencias guardadas')
    } catch (err) {
      avisar(err.message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="seccion" aria-labelledby="t-notif">
      <h2 id="t-notif" className="seccion__titulo">
        Notificaciones
      </h2>
      <p className="seccion__texto">
        Todos los avisos quedan en la campanita de la app. Actívalas en tu celular para recibirlas aunque la app esté cerrada.
      </p>

      <ActivarEnDispositivo />

      {datos && esClienta && (
        <div className="preferencias">
          <label className="interruptor">
            <input type="checkbox" checked={datos.preferencias.recordatorios} disabled={guardando} onChange={(e) => cambiar('recordatorios', e.target.checked)} />
            <span className="interruptor__pista" aria-hidden="true" />
            <span>
              <strong>Recordatorios de mis citas</strong>
              <small>El día anterior y 30, 15 y 5 minutos antes.</small>
            </span>
          </label>
          <label className="interruptor">
            <input type="checkbox" checked={datos.preferencias.promociones} disabled={guardando} onChange={(e) => cambiar('promociones', e.target.checked)} />
            <span className="interruptor__pista" aria-hidden="true" />
            <span>
              <strong>Promociones y novedades</strong>
              <small>Descuentos y fechas especiales del salón. Puedes apagarlas cuando quieras.</small>
            </span>
          </label>
          <p className="campo__ayuda">Los avisos sobre tus citas (confirmación, cambios o cancelaciones) siempre llegan.</p>
        </div>
      )}
    </section>
  )
}

/** Botón para activar o desactivar las push en este navegador, con la guía para iPhone. */
export function ActivarEnDispositivo({ compacto = false }) {
  const [estado, setEstado] = useState(estadoPush)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const avisar = useAvisos()

  const activar = async () => {
    setOcupado(true)
    setError('')
    try {
      await activarPush()
      setEstado('activo')
      avisar('¡Listo! Te avisaremos en este dispositivo.')
    } catch (err) {
      setEstado(estadoPush())
      setError(err.message || 'No se pudieron activar las notificaciones.')
    } finally {
      setOcupado(false)
    }
  }

  const desactivar = async () => {
    setOcupado(true)
    await desactivarPush()
    setEstado(estadoPush())
    setOcupado(false)
    avisar('Ya no recibirás notificaciones en este dispositivo')
  }

  if (estado === 'no-configurado' || estado === 'no-soportado') {
    return compacto ? null : (
      <p className="nota-suave">
        {estado === 'no-configurado'
          ? 'Las notificaciones en el celular todavía no están configuradas en el salón. Mientras tanto, revisa la campanita.'
          : 'Este navegador no admite notificaciones. Revisa la campanita al entrar.'}
      </p>
    )
  }

  if (estado === 'requiere-instalar') {
    return (
      <div className="activar-push activar-push--ios">
        <BellRing size={20} aria-hidden="true" />
        <div>
          <strong>En iPhone, primero agrega la app a tu pantalla de inicio</strong>
          <p>
            Toca <Share size={14} aria-label="Compartir" /> <em>Compartir</em> → <SquarePlus size={14} aria-hidden="true" /> <em>Agregar a inicio</em>. Luego abre
            Geovys Nails desde ese ícono y activa las notificaciones.
          </p>
        </div>
      </div>
    )
  }

  if (estado === 'bloqueado') {
    return (
      <Alerta tipo="aviso">
        Las notificaciones están bloqueadas para esta página. Actívalas en la configuración del navegador (el candado junto a la dirección) y vuelve a intentar.
      </Alerta>
    )
  }

  if (estado === 'activo') {
    return compacto ? null : (
      <div className="activar-push activar-push--activo">
        <BellRing size={20} aria-hidden="true" />
        <div>
          <strong>Activadas en este dispositivo</strong>
          <p>Te llegarán aunque la app esté cerrada.</p>
        </div>
        <button type="button" className="boton boton--fantasma boton--sm" onClick={desactivar} disabled={ocupado}>
          Desactivar
        </button>
      </div>
    )
  }

  return (
    <div className="activar-push">
      <BellRing size={20} aria-hidden="true" />
      <div>
        <strong>{compacto ? '¿Te avisamos antes de tu cita?' : 'Recibe los avisos en este dispositivo'}</strong>
        <p>Te recordamos el día anterior y 30, 15 y 5 minutos antes.</p>
        {error && <p className="campo__error">{error}</p>}
      </div>
      <button type="button" className="boton boton--sm" onClick={activar} disabled={ocupado}>
        {ocupado ? 'Activando…' : 'Activar notificaciones'}
      </button>
    </div>
  )
}
