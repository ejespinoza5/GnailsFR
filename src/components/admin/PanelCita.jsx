import { useEffect, useRef, useState } from 'react'
import { BellRing, CalendarClock, Check, Mail, Phone, StickyNote, Trash2, UserX, X } from 'lucide-react'
import { agendaService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { fechaLarga, horaBonita, hoyISO, precioTexto } from '../../utils/fechas'
import EstadoCita from '../ui/EstadoCita'
import Alerta from '../ui/Alerta'
import BotonConfirmar from '../ui/BotonConfirmar'
import Loader from '../loader/Loader'
import { useAvisos } from '../ui/Avisos'

/** Detalle de una cita con sus acciones (completar, no asistió, cancelar, reprogramar). */
export default function PanelCita({ cita, esAdmin = true, onCerrar, onCambio }) {
  const [reprogramando, setReprogramando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const avisar = useAvisos()
  const raiz = useRef(null)

  useEffect(() => {
    // En el celular el panel queda debajo de la lista: se lleva a la vista.
    if (window.matchMedia('(max-width: 900px)').matches) raiz.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const cambiarEstado = async (estado, mensaje) => {
    setOcupado(true)
    setError('')
    try {
      const { cita: nueva } = await agendaService.cambiarEstado(cita.id, estado)
      avisar(mensaje)
      await onCambio(nueva)
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  const confirmada = cita.estado === 'confirmada'

  const recordar = async () => {
    setOcupado(true)
    setError('')
    try {
      const { mensaje } = await agendaService.recordatorio(cita.id)
      avisar(mensaje)
    } catch (err) {
      setError(err.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <aside className="panel" ref={raiz} aria-label="Detalle de la cita">
      <div className="panel__cabecera">
        <EstadoCita estado={cita.estado} />
        <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar detalle">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <h2 className="panel__titulo">{cita.cliente.nombre}</h2>
      <div className="panel__contacto">
        {cita.cliente.email ? (
          <a className="panel__correo" href={`mailto:${cita.cliente.email}`}>
            <Mail size={14} aria-hidden="true" /> {cita.cliente.email}
          </a>
        ) : (
          <span className="etiqueta etiqueta--sin-cuenta">Sin cuenta · agendada por el salón</span>
        )}
        {cita.cliente.telefono && (
          <a
            className="panel__correo"
            href={`https://wa.me/${cita.cliente.telefono.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Phone size={14} aria-hidden="true" /> {cita.cliente.telefono}
          </a>
        )}
      </div>

      <dl className="ticket ticket--panel">
        <div>
          <dt>Servicio</dt>
          <dd>{cita.servicio.nombre}</dd>
        </div>
        <div>
          <dt>Cuándo</dt>
          <dd className="primera-mayuscula">
            {fechaLarga(cita.fecha)}
            <br />
            {horaBonita(cita.horaInicio)} – {horaBonita(cita.horaFin)}
          </dd>
        </div>
        <div>
          <dt>Profesional</dt>
          <dd>{cita.profesional.nombre}</dd>
        </div>
        {cita.precio !== null && (
          <div>
            <dt>Precio</dt>
            <dd>{precioTexto(cita)}</dd>
          </div>
        )}
      </dl>

      {cita.notas && (
        <p className="panel__nota">
          <StickyNote size={15} aria-hidden="true" /> {cita.notas}
        </p>
      )}

      <Alerta>{error}</Alerta>

      {reprogramando ? (
        <Reprogramar
          cita={cita}
          esAdmin={esAdmin}
          onCancelar={() => setReprogramando(false)}
          onListo={async (nueva) => {
            avisar('Cita reprogramada')
            setReprogramando(false)
            await onCambio(nueva)
          }}
        />
      ) : (
        <div className="panel__acciones">
          {confirmada && (
            <>
              {cita.cliente.conCuenta && (
                <button type="button" className="boton boton--secundario boton--sm" disabled={ocupado} onClick={recordar}>
                  <BellRing size={16} aria-hidden="true" /> Enviar recordatorio
                </button>
              )}
              <button type="button" className="boton boton--sm" disabled={ocupado} onClick={() => cambiarEstado('completada', 'Cita marcada como completada')}>
                <Check size={16} aria-hidden="true" /> Completada
              </button>
              <button type="button" className="boton boton--secundario boton--sm" disabled={ocupado} onClick={() => setReprogramando(true)}>
                <CalendarClock size={16} aria-hidden="true" /> Reprogramar
              </button>
              <button type="button" className="boton boton--secundario boton--sm" disabled={ocupado} onClick={() => cambiarEstado('no_asistio', 'Marcada como no asistió')}>
                <UserX size={16} aria-hidden="true" /> No asistió
              </button>
              <BotonConfirmar
                className="boton boton--fantasma-peligro boton--sm"
                pregunta="¿Cancelar la cita?"
                confirmar="Sí, cancelar"
                disabled={ocupado}
                onConfirmar={() => cambiarEstado('cancelada', 'Cita cancelada')}
              >
                Cancelar cita
              </BotonConfirmar>
            </>
          )}
          {!confirmada && (
            <button type="button" className="boton boton--secundario boton--sm" disabled={ocupado} onClick={() => cambiarEstado('confirmada', 'La cita volvió a confirmada')}>
              Volver a confirmada
            </button>
          )}
          <BotonConfirmar
            className="boton boton--fantasma-peligro boton--sm"
            pregunta="¿Eliminarla para siempre? También desaparece de «Mis turnos» de la clienta."
            confirmar="Eliminar"
            disabled={ocupado}
            onConfirmar={async () => {
              setOcupado(true)
              try {
                await agendaService.eliminar(cita.id)
                avisar('Cita eliminada')
                await onCambio(null)
              } catch (err) {
                setError(err.message)
                setOcupado(false)
              }
            }}
          >
            <Trash2 size={15} aria-hidden="true" /> Eliminar
          </BotonConfirmar>
        </div>
      )}
    </aside>
  )
}

function Reprogramar({ cita, esAdmin, onCancelar, onListo }) {
  const [fecha, setFecha] = useState(cita.fecha < hoyISO() ? hoyISO() : cita.fecha)
  const [profesionalId, setProfesionalId] = useState(cita.profesional.id)
  const [hora, setHora] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const { datos, cargando, error: errorCarga } = useCarga(
    () => agendaService.disponibilidad({ servicioId: cita.servicio.id, desde: fecha, dias: 1, excluirCitaId: cita.id }),
    [cita.servicio.id, cita.id, fecha],
  )

  const dia = datos?.dias[0]
  const horas = dia?.horarios.filter((h) => h.profesionales.includes(profesionalId)).map((h) => h.hora) ?? []

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      const { cita: nueva } = await agendaService.reprogramar(cita.id, { fecha, hora, profesionalId })
      await onListo(nueva)
    } catch (err) {
      setError(err.message)
      setGuardando(false)
    }
  }

  return (
    <form className="reprogramar" onSubmit={guardar}>
      <h3>Reprogramar</h3>
      <div className="campo">
        <label htmlFor="rp-fecha">Fecha</label>
        <input
          id="rp-fecha"
          type="date"
          className="control"
          min={hoyISO()}
          value={fecha}
          onChange={(e) => {
            if (!e.target.value) return
            setFecha(e.target.value)
            setHora('')
          }}
        />
      </div>
      <div className="campo" hidden={!esAdmin}>
        <label htmlFor="rp-prof">Profesional</label>
        <select
          id="rp-prof"
          className="control"
          value={profesionalId}
          onChange={(e) => {
            setProfesionalId(e.target.value)
            setHora('')
          }}
        >
          {(datos?.profesionales ?? [cita.profesional]).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="rp-hora">Hora</label>
        {cargando ? (
          <Loader mensaje="Buscando horarios…" />
        ) : errorCarga ? (
          <Alerta>{errorCarga.message}</Alerta>
        ) : horas.length ? (
          <select id="rp-hora" className="control" value={hora} onChange={(e) => setHora(e.target.value)} required>
            <option value="">Elige una hora</option>
            {horas.map((h) => (
              <option key={h} value={h}>
                {horaBonita(h)}
              </option>
            ))}
          </select>
        ) : (
          <p className="nota-suave">{dia?.motivo ?? 'No hay horarios libres para esta profesional ese día.'}</p>
        )}
      </div>
      <Alerta>{error}</Alerta>
      <div className="panel__acciones">
        <button type="submit" className="boton boton--sm" disabled={!hora || guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambio'}
        </button>
        <button type="button" className="boton boton--fantasma boton--sm" onClick={onCancelar} disabled={guardando}>
          Volver
        </button>
      </div>
    </form>
  )
}
