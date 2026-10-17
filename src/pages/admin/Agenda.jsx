import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import { CalendarOff, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { agendaService } from '../../services/reservas.service'
import { useCarga, useEsMovil } from '../../hooks/useCarga'
import { useMinutoActual } from '../../hooks/useMinutoActual'
import {
  aMinutos,
  diaSemana,
  fechaLarga,
  hoyISO,
  horaBonita,
  inicioCuadriculaMes,
  inicioSemana,
  nombreMes,
  rangoSemana,
  sumarDias,
} from '../../utils/fechas'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import EstadoCita from '../../components/ui/EstadoCita'
import PanelCita from '../../components/admin/PanelCita'
import PanelNuevaCita from '../../components/admin/PanelNuevaCita'
import VistaSemana from '../../components/admin/VistaSemana'
import VistaMes from '../../components/admin/VistaMes'

const UNIDAD = 5 // minutos por fila de la cuadrícula
const VISTAS = [
  { id: 'dia', texto: 'Día' },
  { id: 'semana', texto: 'Semana' },
  { id: 'mes', texto: 'Mes' },
]

/** Rango de fechas que carga cada vista. */
function rangoDe(vista, fecha) {
  if (vista === 'semana') {
    const lunes = inicioSemana(fecha)
    return { desde: lunes, hasta: sumarDias(lunes, 6) }
  }
  if (vista === 'mes') {
    const desde = inicioCuadriculaMes(fecha)
    return { desde, hasta: sumarDias(desde, 41) }
  }
  return { desde: fecha, hasta: fecha }
}

/** Avanza o retrocede un día, una semana o un mes. */
function mover(vista, fecha, paso) {
  if (vista === 'semana') return sumarDias(fecha, 7 * paso)
  if (vista === 'mes') {
    const [a, m] = fecha.split('-').map(Number)
    return new Date(Date.UTC(a, m - 1 + paso, 1)).toISOString().slice(0, 10)
  }
  return sumarDias(fecha, paso)
}

const plural = (n, palabra) => `${n} ${palabra}${n === 1 ? '' : 's'}`

export default function Agenda() {
  const [params, setParams] = useSearchParams()
  const hoy = hoyISO()
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(params.get('fecha') ?? '') ? params.get('fecha') : hoy
  const vista = VISTAS.some((v) => v.id === params.get('vista')) ? params.get('vista') : 'dia'
  const [seleccionada, setSeleccionada] = useState(null)
  const [filtroProfesional, setFiltroProfesional] = useState('')
  const [agregando, setAgregando] = useState(false)
  const movil = useEsMovil(900)

  const navegar = (f, v = vista) => {
    setSeleccionada(null)
    setAgregando(false)
    const nuevos = {}
    if (f !== hoy) nuevos.fecha = f
    if (v !== 'dia') nuevos.vista = v
    setParams(nuevos)
  }
  const irA = (f) => navegar(f)

  const { desde, hasta } = rangoDe(vista, fecha)
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const [citas, contexto] = await Promise.all([agendaService.citas({ desde, hasta }), agendaService.contexto(desde, hasta)])
    return { citas: citas.citas, ...contexto }
  }, [desde, hasta])

  // Cada profesional tiene un color fijo: en semana y mes se ve de quién es cada cita.
  const colores = useMemo(() => new Map((datos?.profesionales ?? []).map((p, i) => [p.id, i % 6])), [datos])

  const cita = datos?.citas.find((c) => c.id === seleccionada) ?? null
  const esAdmin = datos?.rol !== 'profesional'
  const elegir = (id) => {
    setAgregando(false)
    setSeleccionada(id)
  }
  const filtradas = (datos?.citas ?? []).filter((c) => vista === 'dia' || !filtroProfesional || c.profesional.id === filtroProfesional)
  const activas = filtradas.filter((c) => c.estado !== 'cancelada')
  const canceladas = filtradas.filter((c) => c.estado === 'cancelada')
  const cerradoLocal = vista === 'dia' && datos?.bloqueos.find((b) => !b.profesionalId)
  const diaHorario = datos?.horario.find((h) => h.diaSemana === diaSemana(fecha))

  const completadas = activas.filter((c) => c.estado === 'completada').length
  const resumen = datos
    ? [plural(activas.length, 'cita'), completadas && plural(completadas, 'completada'), canceladas.length && plural(canceladas.length, 'cancelada')]
        .filter(Boolean)
        .join(' · ')
    : ' '

  const titulo =
    vista === 'semana' ? rangoSemana(inicioSemana(fecha)) : vista === 'mes' ? nombreMes(fecha) : fecha === hoy ? 'Hoy' : fechaLarga(fecha)
  const etiquetaPaso = { dia: 'Día', semana: 'Semana', mes: 'Mes' }[vista]
  const enHoy =
    vista === 'dia' ? fecha === hoy : vista === 'semana' ? inicioSemana(fecha) === inicioSemana(hoy) : fecha.slice(0, 7) === hoy.slice(0, 7)

  return (
    <div className={`agenda${(cita && vista !== 'mes') || agregando ? ' agenda--con-panel' : ''}`}>
      <Encabezado
        titulo={<span className="primera-mayuscula">{titulo}</span>}
        acciones={
          <div className="agenda__controles">
            <button
              type="button"
              className="boton boton--sm"
              onClick={() => {
                setSeleccionada(null)
                setAgregando(true)
              }}
              disabled={!datos}
            >
              <Plus size={16} aria-hidden="true" /> Nueva cita
            </button>
            <div className="segmentos segmentos--compacto" role="tablist" aria-label="Vista del calendario">
              {VISTAS.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={vista === v.id} className="segmento" onClick={() => navegar(fecha, v.id)}>
                  {v.texto}
                </button>
              ))}
            </div>
            <div className="navegador-fecha">
              <button type="button" className="boton-icono" onClick={() => irA(mover(vista, fecha, -1))} aria-label={`${etiquetaPaso} anterior`}>
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button type="button" className="boton boton--secundario boton--sm" onClick={() => irA(hoy)} disabled={enHoy}>
                Hoy
              </button>
              <button type="button" className="boton-icono" onClick={() => irA(mover(vista, fecha, 1))} aria-label={`${etiquetaPaso} siguiente`}>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
              <label className="sr-only" htmlFor="fecha-agenda">
                Ir a una fecha
              </label>
              <input id="fecha-agenda" type="date" className="control control--fecha" value={fecha} onChange={(e) => e.target.value && irA(e.target.value)} />
            </div>
          </div>
        }
      >
        {vista === 'dia' && fecha === hoy ? (
          <span className="primera-mayuscula">
            {fechaLarga(fecha)} · {resumen}
          </span>
        ) : (
          resumen
        )}
      </Encabezado>

      {datos && vista !== 'dia' && esAdmin && datos.profesionales.length > 1 && (
        <div className="leyenda">
          <label className="sr-only" htmlFor="filtro-prof">
            Filtrar por profesional
          </label>
          <select id="filtro-prof" className="control control--filtro" value={filtroProfesional} onChange={(e) => setFiltroProfesional(e.target.value)}>
            <option value="">Todas las profesionales</option>
            {datos.profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          {datos.profesionales
            .filter((p) => !filtroProfesional || p.id === filtroProfesional)
            .map((p) => (
              <span key={p.id} className="leyenda__item">
                <span className={`punto punto--p${colores.get(p.id)}`} aria-hidden="true" /> {p.nombre}
              </span>
            ))}
        </div>
      )}

      {cargando && !datos ? (
        <Loader mensaje="Cargando la agenda…" />
      ) : error && !datos ? (
        <Alerta
          accion={
            <button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>
              Reintentar
            </button>
          }
        >
          {error.message}
        </Alerta>
      ) : (
        <div className="agenda__cuerpo" aria-busy={cargando}>
          <div className="agenda__principal">
            {cerradoLocal && (
              <Alerta tipo="aviso">
                El local está cerrado este día{cerradoLocal.motivo ? `: ${cerradoLocal.motivo}` : ''}.{' '}
                {esAdmin && <Link to="/admin/horarios">Gestionar días cerrados</Link>}
              </Alerta>
            )}
            {vista === 'dia' && !cerradoLocal && diaHorario && !diaHorario.abierto && (
              <Alerta tipo="aviso">Según el horario semanal, el local no atiende este día.</Alerta>
            )}

            {datos.profesionales.length === 0 ? (
              <Vacio icono={Users} titulo="Aún no hay profesionales" accion={esAdmin && <Link to="/admin/profesionales" className="boton">Agregar profesional</Link>}>
                Agrega a tu equipo y los servicios que hace cada una para empezar a recibir reservas.
              </Vacio>
            ) : vista === 'mes' ? (
              <VistaMes
                fecha={fecha}
                hoy={hoy}
                citas={activas}
                horario={datos.horario}
                bloqueos={datos.bloqueos}
                colores={colores}
                movil={movil}
                onElegirDia={(f) => navegar(f, 'dia')}
              />
            ) : vista === 'semana' ? (
              <VistaSemana
                lunes={desde}
                hoy={hoy}
                citas={activas}
                horario={datos.horario}
                bloqueos={datos.bloqueos}
                colores={colores}
                movil={movil}
                seleccionada={seleccionada}
                onElegir={elegir}
                onElegirDia={(f) => navegar(f, 'dia')}
              />
            ) : movil ? (
              <ListaDia citas={activas} seleccionada={seleccionada} onElegir={elegir} />
            ) : (
              <CuadriculaDia
                fecha={fecha}
                esHoy={fecha === hoy}
                citas={activas}
                profesionales={datos.profesionales}
                bloqueos={datos.bloqueos}
                horario={diaHorario}
                seleccionada={seleccionada}
                onElegir={elegir}
              />
            )}

            {vista !== 'mes' && canceladas.length > 0 && (
              <details className="canceladas">
                <summary>
                  Canceladas {vista === 'dia' ? 'este día' : 'esta semana'} ({canceladas.length})
                </summary>
                <ul>
                  {canceladas.map((c) => (
                    <li key={c.id}>
                      <button type="button" className="canceladas__item" onClick={() => elegir(c.id)}>
                        <span className="tabular">{horaBonita(c.horaInicio)}</span> {c.cliente.nombre} · {c.servicio.nombre}
                        <small>{c.canceladaPor === 'cliente' ? 'por la clienta' : 'por el salón'}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {agregando && (
            <PanelNuevaCita
              contexto={datos}
              fechaInicial={fecha}
              onCerrar={() => setAgregando(false)}
              onCreada={async (nueva) => {
                setAgregando(false)
                if (nueva.fecha < desde || nueva.fecha > hasta) irA(nueva.fecha)
                await recargar({ silencioso: true })
                setSeleccionada(nueva.id)
              }}
            />
          )}

          {!agregando && cita && vista !== 'mes' && (
            <PanelCita
              key={cita.id}
              cita={cita}
              esAdmin={esAdmin}
              onCerrar={() => setSeleccionada(null)}
              onCambio={async (nueva) => {
                if (nueva && (nueva.fecha < desde || nueva.fecha > hasta)) irA(nueva.fecha)
                await recargar({ silencioso: true })
                setSeleccionada(nueva ? nueva.id : null)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

/** Escritorio: una columna por profesional y las citas ocupando su duración real. */
function CuadriculaDia({ fecha, esHoy, citas, profesionales, bloqueos, horario, seleccionada, onElegir }) {
  const columnas = useMemo(() => {
    const conCitas = new Set(citas.map((c) => c.profesional.id))
    return profesionales.filter((p) => p.activo || conCitas.has(p.id))
  }, [citas, profesionales])

  // Rango visible: el horario del día, ampliado si hay citas fuera de él.
  const { inicio, fin } = useMemo(() => {
    let ini = horario?.abierto ? aMinutos(horario.apertura) : 9 * 60
    let f = horario?.abierto ? aMinutos(horario.cierre) : 19 * 60
    for (const c of citas) {
      ini = Math.min(ini, aMinutos(c.horaInicio))
      f = Math.max(f, aMinutos(c.horaFin))
    }
    return { inicio: Math.floor(ini / 60) * 60, fin: Math.ceil(f / 60) * 60 }
  }, [horario, citas])

  const ahora = useMinutoActual()
  const filas = (fin - inicio) / UNIDAD
  const fila = (min) => Math.round((min - inicio) / UNIDAD) + 2
  const horas = []
  for (let m = inicio; m < fin; m += 60) horas.push(m)

  const ausente = (p) => bloqueos.find((b) => b.profesionalId === p.id)
  const trabaja = (p) => p.diasLaborales.includes(diaSemana(fecha))

  return (
    <div className="agenda-tabla" role="region" aria-label="Agenda del día" tabIndex={0}>
      <div
        className="agenda-tabla__rejilla"
        style={{ '--columnas': columnas.length, '--filas': filas, gridTemplateRows: `auto repeat(${filas}, var(--unidad))` }}
      >
        <div className="agenda-tabla__esquina" />
        {columnas.map((p, i) => (
          <div key={p.id} className="agenda-tabla__persona" style={{ gridColumn: i + 2 }}>
            <strong>{p.nombre}</strong>
            <small>
              {ausente(p) ? `Ausente${ausente(p).motivo ? ` · ${ausente(p).motivo}` : ''}` : !trabaja(p) ? 'No trabaja hoy' : !p.activo ? 'Inactiva' : `${citas.filter((c) => c.profesional.id === p.id).length} citas`}
            </small>
          </div>
        ))}

        {horas.map((m) => (
          <div key={m} className="agenda-tabla__hora" style={{ gridRow: `${fila(m)} / span ${60 / UNIDAD}` }}>
            {horaBonita(`${String(m / 60).padStart(2, '0')}:00`)}
          </div>
        ))}

        {columnas.map((p, i) => (
          <div
            key={p.id}
            className={`agenda-tabla__columna${ausente(p) || !trabaja(p) ? ' agenda-tabla__columna--libre' : ''}`}
            style={{ gridColumn: i + 2, gridRow: `2 / span ${filas}` }}
            aria-hidden="true"
          />
        ))}

        {citas.map((c) => {
          const col = columnas.findIndex((p) => p.id === c.profesional.id)
          const ini = aMinutos(c.horaInicio)
          const dur = aMinutos(c.horaFin) - ini
          const corta = dur < 40
          return (
            <button
              key={c.id}
              type="button"
              className={`bloque-cita bloque-cita--${c.estado}${c.id === seleccionada ? ' bloque-cita--activa' : ''}${corta ? ' bloque-cita--corta' : ''}`}
              style={{ gridColumn: col + 2, gridRow: `${fila(ini)} / span ${Math.max(1, Math.round(dur / UNIDAD))}` }}
              onClick={() => onElegir(c.id)}
              aria-label={`${horaBonita(c.horaInicio)} a ${horaBonita(c.horaFin)}, ${c.cliente.nombre}, ${c.servicio.nombre}`}
            >
              <span className="bloque-cita__hora">
                {horaBonita(c.horaInicio)}
                {!corta && ` – ${horaBonita(c.horaFin)}`}
              </span>
              <span className="bloque-cita__cliente">{c.cliente.nombre}</span>
              {!corta && <span className="bloque-cita__servicio">{c.servicio.nombre}</span>}
            </button>
          )
        })}

        {esHoy && ahora >= inicio && ahora <= fin && (
          <div className="linea-ahora" style={{ gridRow: fila(ahora), gridColumn: `2 / span ${columnas.length}` }} aria-hidden="true">
            <span className="linea-ahora__gota" />
          </div>
        )}
      </div>
      {citas.length === 0 && (
        <p className="agenda-tabla__vacia">
          <CalendarOff size={18} aria-hidden="true" /> No hay citas este día.
        </p>
      )}
    </div>
  )
}

/** Celular: lista cronológica. */
function ListaDia({ citas, seleccionada, onElegir }) {
  if (!citas.length) return <Vacio icono={CalendarOff} titulo="No hay citas este día" />
  return (
    <ul className="lista-agenda">
      {citas.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            className={`lista-agenda__item${c.id === seleccionada ? ' lista-agenda__item--activa' : ''}`}
            onClick={() => onElegir(c.id)}
          >
            <span className="lista-agenda__hora tabular">
              {horaBonita(c.horaInicio)}
              <small>{horaBonita(c.horaFin)}</small>
            </span>
            <span className="lista-agenda__info">
              <strong>{c.cliente.nombre}</strong>
              <span>
                {c.servicio.nombre} · {c.profesional.nombre}
              </span>
            </span>
            <EstadoCita estado={c.estado} />
          </button>
        </li>
      ))}
    </ul>
  )
}
