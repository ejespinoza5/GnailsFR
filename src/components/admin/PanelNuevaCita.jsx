import { useEffect, useRef, useState } from 'react'
import { Search, UserPlus, UserRound, X } from 'lucide-react'
import { agendaService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { duracionBonita, horaBonita, hoyISO, precioTexto } from '../../utils/fechas'
import Alerta from '../ui/Alerta'
import CampoForm from '../ui/CampoForm'
import Loader from '../loader/Loader'
import { useAvisos } from '../ui/Avisos'

/**
 * Agendar desde el salón (dueña o profesional): para una clienta con cuenta o
 * para alguien que escribió por WhatsApp o llegó al local (solo nombre y teléfono).
 * Una profesional solo agenda a su nombre.
 */
export default function PanelNuevaCita({ contexto, fechaInicial, onCerrar, onCreada }) {
  const esProfesional = contexto.rol === 'profesional'
  const [tipoCliente, setTipoCliente] = useState('cuenta')
  const [clienta, setClienta] = useState(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [servicioId, setServicioId] = useState('')
  const [profesionalId, setProfesionalId] = useState(esProfesional ? contexto.profesionalId : '')
  const [fecha, setFecha] = useState(fechaInicial < hoyISO() ? hoyISO() : fechaInicial)
  const [hora, setHora] = useState('')
  const [notas, setNotas] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const avisar = useAvisos()

  const servicio = contexto.servicios.find((s) => s.id === servicioId)
  const posibles = contexto.profesionales.filter((p) => p.activo && (!servicioId || p.servicios.includes(servicioId)))

  const listo = servicioId && profesionalId && fecha
  const { datos: disponibilidad, cargando: buscandoHoras } = useCarga(
    () => (listo ? agendaService.disponibilidad({ servicioId, profesionalId, desde: fecha, dias: 1 }) : Promise.resolve(null)),
    [servicioId, profesionalId, fecha],
  )
  const dia = disponibilidad?.dias[0]
  const horas = dia?.horarios.filter((h) => h.profesionales.includes(profesionalId)).map((h) => h.hora) ?? []

  const guardar = async (e) => {
    e.preventDefault()
    const nuevos = {}
    if (tipoCliente === 'cuenta' && !clienta) nuevos.clienta = 'Busca y elige a la clienta'
    if (tipoCliente === 'sin' && nombre.trim().length < 2) nuevos.clienteNombre = 'Escribe el nombre'
    if (!servicioId) nuevos.servicioId = 'Elige el servicio'
    if (!profesionalId) nuevos.profesionalId = 'Elige la profesional'
    if (!hora) nuevos.hora = 'Elige la hora'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setGuardando(true)
    try {
      const { cita } = await agendaService.agendar({
        clienteId: tipoCliente === 'cuenta' ? clienta.id : null,
        clienteNombre: tipoCliente === 'sin' ? nombre.trim() : null,
        clienteTelefono: tipoCliente === 'sin' ? telefono.trim() || null : null,
        servicioId,
        profesionalId,
        fecha,
        hora,
        notas: notas.trim() || null,
      })
      avisar('Cita agendada')
      await onCreada(cita)
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
      setGuardando(false)
    }
  }

  return (
    <aside className="panel" aria-label="Nueva cita">
      <div className="panel__cabecera">
        <h2 className="panel__titulo">Nueva cita</h2>
        <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <form className="formulario" onSubmit={guardar} noValidate>
        <fieldset className="grupo-campos">
          <legend>¿Para quién?</legend>
          <div className="segmentos segmentos--compacto" role="tablist" aria-label="Tipo de clienta">
            <button type="button" role="tab" aria-selected={tipoCliente === 'cuenta'} className="segmento" onClick={() => setTipoCliente('cuenta')}>
              <UserRound size={15} aria-hidden="true" /> Con cuenta
            </button>
            <button type="button" role="tab" aria-selected={tipoCliente === 'sin'} className="segmento" onClick={() => setTipoCliente('sin')}>
              <UserPlus size={15} aria-hidden="true" /> Sin cuenta
            </button>
          </div>
          {tipoCliente === 'cuenta' ? (
            <BuscarClienta elegida={clienta} onElegir={setClienta} error={errores.clienta} />
          ) : (
            <div className="formulario nueva-cita__sin-cuenta">
              <CampoForm id="nc-nombre" etiqueta="Nombre" error={errores.clienteNombre}>
                <input id="nc-nombre" className="control" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
              </CampoForm>
              <CampoForm id="nc-tel" etiqueta="Teléfono / WhatsApp" opcional error={errores.clienteTelefono}>
                <input id="nc-tel" className="control" type="tel" inputMode="tel" maxLength={20} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </CampoForm>
            </div>
          )}
        </fieldset>

        <CampoForm id="nc-serv" etiqueta="Servicio" error={errores.servicioId}>
          <select
            id="nc-serv"
            className="control"
            value={servicioId}
            onChange={(e) => {
              setServicioId(e.target.value)
              setHora('')
              if (!esProfesional) setProfesionalId('')
            }}
          >
            <option value="">Elige un servicio</option>
            {contexto.servicios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} · {duracionBonita(s.duracionMin)}
                {s.precio !== null ? ` · ${precioTexto(s)}` : ''}
              </option>
            ))}
          </select>
        </CampoForm>

        {!esProfesional && (
          <CampoForm id="nc-prof" etiqueta="Profesional" error={errores.profesionalId}>
            <select
              id="nc-prof"
              className="control"
              value={profesionalId}
              disabled={!servicioId}
              onChange={(e) => {
                setProfesionalId(e.target.value)
                setHora('')
              }}
            >
              <option value="">{servicioId ? 'Elige quién la atiende' : 'Primero elige el servicio'}</option>
              {posibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </CampoForm>
        )}

        <div className="fila-campos">
          <CampoForm id="nc-fecha" etiqueta="Fecha">
            <input
              id="nc-fecha"
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
          </CampoForm>
          <CampoForm id="nc-hora" etiqueta="Hora" error={errores.hora}>
            {!listo ? (
              <select id="nc-hora" className="control" disabled>
                <option>—</option>
              </select>
            ) : buscandoHoras ? (
              <Loader mensaje="" />
            ) : horas.length ? (
              <select id="nc-hora" className="control" value={hora} onChange={(e) => setHora(e.target.value)}>
                <option value="">Elige</option>
                {horas.map((h) => (
                  <option key={h} value={h}>
                    {horaBonita(h)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="nota-suave nueva-cita__sin-horas">{dia?.motivo ?? 'No hay horarios libres ese día.'}</p>
            )}
          </CampoForm>
        </div>
        {servicio && <p className="campo__ayuda">Ocupa {duracionBonita(servicio.duracionMin)} de la agenda.</p>}

        <CampoForm id="nc-notas" etiqueta="Notas" opcional>
          <textarea id="nc-notas" className="control" rows={2} maxLength={300} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </CampoForm>

        <Alerta>{errores.general}</Alerta>
        <div className="formulario__acciones">
          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? 'Agendando…' : 'Agendar cita'}
          </button>
          <button type="button" className="boton boton--fantasma" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </form>
    </aside>
  )
}

function BuscarClienta({ elegida, onElegir, error }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const turno = useRef(0)

  useEffect(() => {
    const q = texto.trim()
    if (q.length < 2) return
    const mio = ++turno.current
    // Espera a que deje de escribir para no consultar en cada letra.
    const id = setTimeout(async () => {
      setBuscando(true)
      try {
        const { clientas } = await agendaService.buscarClientas(q)
        if (mio === turno.current) setResultados(clientas)
      } catch {
        if (mio === turno.current) setResultados([])
      } finally {
        if (mio === turno.current) setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(id)
  }, [texto])

  if (elegida) {
    return (
      <div className="clienta-elegida">
        <UserRound size={18} aria-hidden="true" />
        <span>
          <strong>{elegida.nombre}</strong>
          <small>{elegida.email}</small>
        </span>
        <button type="button" className="boton boton--fantasma boton--sm" onClick={() => onElegir(null)}>
          Cambiar
        </button>
      </div>
    )
  }

  const mostrar = texto.trim().length >= 2
  return (
    <div className="buscar-clienta">
      <div className="control-prefijo">
        <span aria-hidden="true">
          <Search size={16} />
        </span>
        <label className="sr-only" htmlFor="nc-buscar">
          Buscar clienta por nombre, correo o teléfono
        </label>
        <input
          id="nc-buscar"
          className="control"
          placeholder="Nombre, correo o teléfono"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoComplete="off"
        />
      </div>
      {error && <p className="campo__error">{error}</p>}
      {mostrar && (
        <ul className="buscar-clienta__lista" aria-live="polite">
          {buscando && !resultados.length ? (
            <li className="nota-suave">Buscando…</li>
          ) : resultados.length ? (
            resultados.map((c) => (
              <li key={c.id}>
                <button type="button" className="buscar-clienta__opcion" onClick={() => onElegir(c)}>
                  <strong>{c.nombre}</strong>
                  <small>
                    {c.email}
                    {c.telefono && ` · ${c.telefono}`}
                  </small>
                </button>
              </li>
            ))
          ) : (
            <li className="nota-suave">Ninguna clienta coincide. Puedes agendarla «Sin cuenta».</li>
          )}
        </ul>
      )}
    </div>
  )
}
