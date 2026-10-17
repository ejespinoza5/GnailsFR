import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarClock, Check, Clock, Gem, MessageSquareText, Sparkles, UserRound } from 'lucide-react'
import { reservasService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { useAuth } from '../../context/AuthContext'
import { NOTA_PRECIO_VARIABLE, duracionBonita, fechaLarga, horaBonita, precioTexto, precioVariable, diaMes } from '../../utils/fechas'
import HorarioSemana from '../../components/reserva/HorarioSemana'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Avatar from '../../components/ui/Avatar'
import Vacio from '../../components/ui/Vacio'
import { ActivarEnDispositivo } from '../../components/notificaciones/PreferenciasNotificaciones'

const CUALQUIERA = { id: null, nombre: 'Cualquier profesional' }

export default function Reservar() {
  const { usuario } = useAuth()
  const [paso, setPaso] = useState(1)
  const [servicio, setServicio] = useState(null)
  const [profesional, setProfesional] = useState(null)
  const [turno, setTurno] = useState(null)
  const [notas, setNotas] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [cita, setCita] = useState(null)
  const [mensajeReserva, setMensajeReserva] = useState('')

  const elegirServicio = (s) => {
    setServicio(s)
    setProfesional(null)
    setTurno(null)
    setPaso(2)
  }
  const elegirProfesional = (p) => {
    setProfesional(p)
    setTurno(null)
    setPaso(3)
  }
  const elegirTurno = (t) => {
    setTurno(t)
    setError('')
    setPaso(4)
  }

  const confirmar = async () => {
    setEnviando(true)
    setError('')
    try {
      const { cita, mensajeReserva } = await reservasService.reservar({
        servicioId: servicio.id,
        profesionalId: profesional.id,
        fecha: turno.fecha,
        hora: turno.hora,
        notas: notas.trim() || null,
      })
      setCita(cita)
      setMensajeReserva(mensajeReserva ?? '')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
      // Si alguien tomó el turno mientras tanto, se vuelve a mostrar el horario actualizado.
      if (err.codigo === 'HORARIO_OCUPADO') {
        setTurno(null)
        setPaso(3)
      }
    } finally {
      setEnviando(false)
    }
  }

  const reiniciar = () => {
    setCita(null)
    setServicio(null)
    setProfesional(null)
    setTurno(null)
    setNotas('')
    setPaso(1)
  }

  if (cita) return <Comprobante cita={cita} mensaje={mensajeReserva} onOtra={reiniciar} />

  return (
    <div className="reservar">
      <header className="reservar__cabecera">
        <h1>Reserva tu cita</h1>
        <p>Hola, {usuario.nombre.split(' ')[0]}. Elige tu servicio y te mostramos solo los turnos libres.</p>
      </header>

      {paso === 3 && error && <Alerta>{error}</Alerta>}

      <ol className="pasos">
        <Paso
          numero={1}
          titulo="Servicio"
          icono={Gem}
          paso={paso}
          onEditar={() => setPaso(1)}
          resumen={
            servicio && (
              <>
                <strong>{servicio.nombre}</strong>
                <span>
                  {duracionBonita(servicio.duracionMin)}
                  {` · ${precioTexto(servicio)}`}
                </span>
              </>
            )
          }
        >
          <ElegirServicio elegido={servicio} onElegir={elegirServicio} />
        </Paso>

        <Paso
          numero={2}
          titulo="Profesional"
          icono={UserRound}
          paso={paso}
          onEditar={() => setPaso(2)}
          resumen={profesional && <strong>{profesional.nombre}</strong>}
        >
          {servicio && <ElegirProfesional servicioId={servicio.id} elegido={profesional} onElegir={elegirProfesional} />}
        </Paso>

        <Paso
          numero={3}
          titulo="Día y hora"
          icono={CalendarClock}
          paso={paso}
          onEditar={() => setPaso(3)}
          resumen={
            turno && (
              <>
                <strong className="primera-mayuscula">{fechaLarga(turno.fecha)}</strong>
                <span>{horaBonita(turno.hora)}</span>
              </>
            )
          }
        >
          {servicio && profesional && (
            <HorarioSemana servicioId={servicio.id} profesionalId={profesional.id} elegido={turno} onElegir={elegirTurno} />
          )}
        </Paso>

        <Paso numero={4} titulo="Confirmar" icono={Check} paso={paso}>
          {turno && (
            <div className="confirmacion">
              <dl className="ticket">
                <div>
                  <dt>Servicio</dt>
                  <dd>{servicio.nombre}</dd>
                </div>
                <div>
                  <dt>Cuándo</dt>
                  <dd className="primera-mayuscula">
                    {fechaLarga(turno.fecha)}, {horaBonita(turno.hora)}
                  </dd>
                </div>
                <div>
                  <dt>Duración</dt>
                  <dd>{duracionBonita(servicio.duracionMin)}</dd>
                </div>
                <div>
                  <dt>Profesional</dt>
                  <dd>{profesional.id ? profesional.nombre : 'La que esté libre a esa hora'}</dd>
                </div>
                <div className="ticket__total">
                  <dt>Precio</dt>
                  <dd>
                    {precioTexto(servicio)}
                    {precioVariable(servicio) && <small className="ticket__nota">{NOTA_PRECIO_VARIABLE}</small>}
                  </dd>
                </div>
              </dl>

              <div className="campo">
                <label htmlFor="notas">
                  <MessageSquareText size={16} aria-hidden="true" /> Nota para el salón <span className="opcional">(opcional)</span>
                </label>
                <textarea
                  id="notas"
                  className="control"
                  rows={3}
                  maxLength={300}
                  placeholder="Ej.: quiero un tono nude, tengo una uña rota…"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
                <p className="campo__ayuda">{300 - notas.length} caracteres disponibles</p>
              </div>

              {error && <Alerta>{error}</Alerta>}

              <button type="button" className="boton boton--ancho" onClick={confirmar} disabled={enviando}>
                Confirmar reserva
              </button>
            </div>
          )}
        </Paso>
      </ol>

      {enviando && <Loader variante="superpuesto" mensaje="Reservando tu cita…" />}
    </div>
  )
}

/** Cada paso se pliega en una línea de resumen cuando ya se eligió. */
function Paso({ numero, titulo, icono: Icono, paso, resumen, onEditar, children }) {
  const abierto = paso === numero
  const hecho = paso > numero
  const estado = abierto ? 'abierto' : hecho ? 'hecho' : 'pendiente'

  return (
    <li className={`paso paso--${estado}`} aria-current={abierto ? 'step' : undefined}>
      <div className="paso__cabecera">
        <span className="paso__marca" aria-hidden="true">
          {hecho ? <Check size={16} strokeWidth={2.5} /> : <Icono size={16} />}
        </span>
        <h2 className="paso__titulo">
          <span className="sr-only">Paso {numero}: </span>
          {titulo}
        </h2>
        {hecho && resumen && <div className="paso__resumen">{resumen}</div>}
        {hecho && onEditar && (
          <button type="button" className="paso__cambiar" onClick={onEditar}>
            Cambiar<span className="sr-only"> {titulo.toLowerCase()}</span>
          </button>
        )}
      </div>
      {abierto && <div className="paso__cuerpo">{children}</div>}
    </li>
  )
}

function ElegirServicio({ elegido, onElegir }) {
  const { datos, cargando, error, recargar } = useCarga(() => reservasService.servicios(), [])

  if (cargando) return <Loader mensaje="Cargando servicios…" />
  if (error)
    return (
      <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>
        {error.message}
      </Alerta>
    )
  if (!datos.servicios.length)
    return (
      <Vacio icono={Sparkles} titulo="Aún no hay servicios para reservar">
        El salón está preparando su catálogo. Vuelve pronto.
      </Vacio>
    )

  return (
    <div className="opciones" role="radiogroup" aria-label="Servicio">
      {datos.servicios.map((s) => (
        <button
          key={s.id}
          type="button"
          role="radio"
          aria-checked={elegido?.id === s.id}
          className="opcion"
          onClick={() => onElegir(s)}
        >
          <span className="opcion__principal">
            <span className="opcion__nombre">{s.nombre}</span>
            {s.descripcion && <span className="opcion__detalle">{s.descripcion}</span>}
            {(s.disponibleDesde || s.disponibleHasta) && (
              <span className="etiqueta etiqueta--temporada">
                {s.disponibleDesde && s.disponibleHasta
                  ? `Del ${diaMes(s.disponibleDesde)} al ${diaMes(s.disponibleHasta)}`
                  : s.disponibleHasta
                    ? `Hasta el ${diaMes(s.disponibleHasta)}`
                    : `Desde el ${diaMes(s.disponibleDesde)}`}
              </span>
            )}
          </span>
          <span className="opcion__meta">
            <span className="opcion__duracion">
              <Clock size={14} aria-hidden="true" /> {duracionBonita(s.duracionMin)}
            </span>
            <span className={`opcion__precio${s.precio === null ? ' opcion__precio--consultar' : ''}`}>
              {s.precioTipo === 'desde' && s.precio !== null && <small>Desde</small>}
              {s.precioTipo === 'desde' && s.precio !== null ? precioTexto({ precio: s.precio }) : precioTexto(s)}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}

function ElegirProfesional({ servicioId, elegido, onElegir }) {
  const { datos, cargando, error, recargar } = useCarga(() => reservasService.profesionales(servicioId), [servicioId])

  if (cargando) return <Loader mensaje="Cargando profesionales…" />
  if (error)
    return (
      <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>
        {error.message}
      </Alerta>
    )

  const opciones = [CUALQUIERA, ...datos.profesionales]

  return (
    <div className="opciones opciones--rejilla" role="radiogroup" aria-label="Profesional">
      {opciones.map((p) => (
        <button
          key={p.id ?? 'cualquiera'}
          type="button"
          role="radio"
          aria-checked={elegido !== null && elegido.id === p.id}
          className={`opcion opcion--persona${p.id ? '' : ' opcion--cualquiera'}`}
          onClick={() => onElegir(p)}
        >
          {p.id ? (
            <Avatar nombre={p.nombre} tamano={44} />
          ) : (
            <span className="avatar avatar--cualquiera" aria-hidden="true">
              <Sparkles size={20} />
            </span>
          )}
          <span className="opcion__principal">
            <span className="opcion__nombre">{p.nombre}</span>
            <span className="opcion__detalle">{p.id ? p.descripcion || 'Profesional del salón' : 'Ves todos los horarios en que al menos una está libre'}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function Comprobante({ cita, mensaje, onOtra }) {
  return (
    <div className="comprobante">
      <span className="comprobante__sello" aria-hidden="true">
        <Check size={30} strokeWidth={2.25} />
      </span>
      <h1>¡Tu cita está reservada!</h1>
      <p className="comprobante__texto">Te esperamos. Si necesitas cambiarla, puedes hacerlo desde «Mis turnos».</p>

      {mensaje && (
        <p className="mensaje-reserva" role="note">
          <Clock size={18} aria-hidden="true" /> {mensaje}
        </p>
      )}

      <dl className="ticket ticket--comprobante">
        <div>
          <dt>Servicio</dt>
          <dd>{cita.servicio.nombre}</dd>
        </div>
        <div>
          <dt>Cuándo</dt>
          <dd className="primera-mayuscula">
            {fechaLarga(cita.fecha)}, {horaBonita(cita.horaInicio)} a {horaBonita(cita.horaFin)}
          </dd>
        </div>
        <div>
          <dt>Te atiende</dt>
          <dd>{cita.profesional.nombre}</dd>
        </div>
        <div className="ticket__total">
          <dt>Precio</dt>
          <dd>
            {precioTexto(cita)}
            {precioVariable(cita) && <small className="ticket__nota">{NOTA_PRECIO_VARIABLE}</small>}
          </dd>
        </div>
      </dl>

      <ActivarEnDispositivo compacto />

      <div className="comprobante__acciones">
        <Link to="/mis-turnos" className="boton">
          Ver mis turnos
        </Link>
        <button type="button" className="boton boton--secundario" onClick={onOtra}>
          Reservar otra cita
        </button>
      </div>
    </div>
  )
}
