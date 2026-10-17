import { useMemo, useState } from 'react'
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react'
import { reservasService } from '../../services/reservas.service'
import { useCarga, useEsMovil } from '../../hooks/useCarga'
import {
  diaCorto,
  diaLargo,
  hoyISO,
  horaBonita,
  horaCorta,
  inicioSemana,
  mesCorto,
  numeroDia,
  parteDelDia,
  rangoSemana,
  sumarDias,
} from '../../utils/fechas'
import Loader from '../loader/Loader'
import Alerta from '../ui/Alerta'
import Vacio from '../ui/Vacio'

/**
 * Horario de la semana: columnas por día y filas por hora, como el libro de turnos del salón.
 * Solo muestra turnos que de verdad están libres (los calcula el backend).
 */
export default function HorarioSemana({ servicioId, profesionalId, elegido, onElegir }) {
  const hoy = hoyISO()
  const [semana, setSemana] = useState(() => inicioSemana(elegido?.fecha ?? hoy))
  const movil = useEsMovil()

  const { datos, cargando, error, recargar } = useCarga(
    () => reservasService.disponibilidad({ servicioId, profesionalId, desde: semana, dias: 7 }),
    [servicioId, profesionalId, semana],
  )

  const dias = useMemo(() => datos?.dias ?? [], [datos])
  const hayTurnos = dias.some((d) => d.horarios.length)
  const puedeAtras = semana > inicioSemana(hoy)
  const puedeAdelante = dias.length > 0 && dias.at(-1).estado !== 'fuera_de_rango'

  const cabecera = (
    <div className="semana__nav">
      <button
        type="button"
        className="boton-icono"
        onClick={() => setSemana((s) => sumarDias(s, -7))}
        disabled={!puedeAtras || cargando}
        aria-label="Semana anterior"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <p className="semana__rango" aria-live="polite">
        {rangoSemana(semana)}
      </p>
      <button
        type="button"
        className="boton-icono"
        onClick={() => setSemana((s) => sumarDias(s, 7))}
        disabled={!puedeAdelante || cargando}
        aria-label="Semana siguiente"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
      {semana !== inicioSemana(hoy) && (
        <button type="button" className="boton boton--fantasma boton--sm" onClick={() => setSemana(inicioSemana(hoy))}>
          Esta semana
        </button>
      )}
    </div>
  )

  let cuerpo
  if (cargando && !datos) cuerpo = <Loader mensaje="Buscando turnos libres…" />
  else if (error)
    cuerpo = (
      <Alerta
        accion={
          <button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>
            Reintentar
          </button>
        }
      >
        {error.message}
      </Alerta>
    )
  else if (!hayTurnos)
    cuerpo = (
      <Vacio
        icono={CalendarX2}
        titulo="No quedan turnos esta semana"
        accion={
          puedeAdelante && (
            <button type="button" className="boton boton--secundario" onClick={() => setSemana((s) => sumarDias(s, 7))}>
              Ver la semana siguiente
            </button>
          )
        }
      >
        {dias.every((d) => d.estado === 'fuera_de_rango')
          ? dias[0]?.motivo
          : 'Prueba con otra semana u otra profesional.'}
      </Vacio>
    )
  else
    cuerpo = movil ? (
      <VistaDia dias={dias} hoy={hoy} elegido={elegido} onElegir={onElegir} />
    ) : (
      <Cuadricula dias={dias} hoy={hoy} elegido={elegido} onElegir={onElegir} />
    )

  return (
    <div className={`semana${cargando && datos ? ' semana--actualizando' : ''}`} aria-busy={cargando}>
      {cabecera}
      {cuerpo}
    </div>
  )
}

const esElegido = (elegido, fecha, hora) => elegido?.fecha === fecha && elegido?.hora === hora

/** Escritorio: semana completa como horario (filas = horas, columnas = días). */
function Cuadricula({ dias, hoy, elegido, onElegir }) {
  const horas = useMemo(() => [...new Set(dias.flatMap((d) => d.horarios.map((h) => h.hora)))].sort(), [dias])
  const libres = useMemo(
    () => new Map(dias.map((d) => [d.fecha, new Map(d.horarios.map((h) => [h.hora, h]))])),
    [dias],
  )

  const filas = []
  let parteAnterior = null
  horas.forEach((hora) => {
    const parte = parteDelDia(hora)
    if (parte !== parteAnterior) {
      filas.push({ tipo: 'parte', parte })
      parteAnterior = parte
    }
    filas.push({ tipo: 'hora', hora })
  })

  return (
    <div className="horario" role="grid" aria-label="Turnos libres de la semana" style={{ '--filas': filas.length }}>
      <div className="horario__esquina" aria-hidden="true" />
      {dias.map((d, i) => (
        <div
          key={d.fecha}
          className={`horario__dia${d.fecha === hoy ? ' horario__dia--hoy' : ''}${d.horarios.length ? '' : ' horario__dia--sin'}`}
          style={{ gridColumn: i + 2 }}
          role="columnheader"
        >
          <span className="horario__dia-nombre">{diaCorto(d.fecha)}</span>
          <span className="horario__dia-numero">{numeroDia(d.fecha)}</span>
          <span className="horario__dia-mes">{mesCorto(d.fecha)}</span>
        </div>
      ))}

      {filas.map((f, fila) =>
        f.tipo === 'parte' ? (
          <div key={f.parte} className="horario__parte" style={{ gridRow: fila + 2 }}>
            {f.parte}
          </div>
        ) : (
          <FilaHora key={f.hora} hora={f.hora} fila={fila + 2} dias={dias} libres={libres} elegido={elegido} onElegir={onElegir} />
        ),
      )}

      {/* Días sin turnos: una sola placa vertical con el motivo, en lugar de celdas vacías */}
      {dias.map((d, i) =>
        d.horarios.length ? null : (
          <div key={d.fecha} className="horario__cerrado" style={{ gridColumn: i + 2, gridRow: `2 / span ${filas.length}` }}>
            <span>{d.estado === 'completo' ? 'Completo' : d.estado === 'pasado' ? 'Ya pasó' : 'Sin turnos'}</span>
            {d.motivo && d.estado !== 'pasado' && <small>{d.motivo}</small>}
          </div>
        ),
      )}
    </div>
  )
}

function FilaHora({ hora, fila, dias, libres, elegido, onElegir }) {
  return (
    <>
      <div className="horario__hora" style={{ gridRow: fila }} role="rowheader">
        {horaBonita(hora)}
      </div>
      {dias.map((d, i) => {
        if (!d.horarios.length) return null
        const slot = libres.get(d.fecha).get(hora)
        const estilo = { gridRow: fila, gridColumn: i + 2 }
        if (!slot) return <span key={d.fecha} className="turno turno--vacio" style={estilo} aria-hidden="true" />
        const activo = esElegido(elegido, d.fecha, hora)
        return (
          <button
            key={d.fecha}
            type="button"
            className={`turno${activo ? ' turno--elegido' : ''}`}
            style={estilo}
            aria-pressed={activo}
            aria-label={`${diaLargo(d.fecha)} ${numeroDia(d.fecha)}, ${horaBonita(hora)}`}
            onClick={() => onElegir({ fecha: d.fecha, hora, profesionales: slot.profesionales })}
          >
            {horaCorta(hora)}
          </button>
        )
      })}
    </>
  )
}

/** Celular: tira de días arriba y los turnos del día elegido agrupados por mañana / tarde / noche. */
function VistaDia({ dias, hoy, elegido, onElegir }) {
  const primeroLibre = dias.find((d) => d.horarios.length)?.fecha
  const [fecha, setFecha] = useState(() => (dias.some((d) => d.fecha === elegido?.fecha) ? elegido.fecha : primeroLibre))
  const dia = dias.find((d) => d.fecha === fecha) ?? dias.find((d) => d.fecha === primeroLibre)

  const grupos = []
  for (const h of dia.horarios) {
    const parte = parteDelDia(h.hora)
    if (grupos.at(-1)?.parte !== parte) grupos.push({ parte, turnos: [] })
    grupos.at(-1).turnos.push(h)
  }

  return (
    <div className="vista-dia">
      <div className="tira-dias" role="tablist" aria-label="Día">
        {dias.map((d) => (
          <button
            key={d.fecha}
            type="button"
            role="tab"
            aria-selected={d.fecha === dia.fecha}
            className={`tira-dias__dia${d.fecha === hoy ? ' tira-dias__dia--hoy' : ''}`}
            disabled={!d.horarios.length}
            onClick={() => setFecha(d.fecha)}
          >
            <span className="tira-dias__nombre">{diaCorto(d.fecha)}</span>
            <span className="tira-dias__numero">{numeroDia(d.fecha)}</span>
            <span className="tira-dias__libres">{d.horarios.length ? `${d.horarios.length} libres` : '—'}</span>
          </button>
        ))}
      </div>

      <div className="vista-dia__turnos" role="tabpanel">
        {grupos.map((g) => (
          <section key={g.parte} className="grupo-turnos">
            <h4 className="grupo-turnos__titulo">{g.parte}</h4>
            <div className="grupo-turnos__lista">
              {g.turnos.map((t) => {
                const activo = esElegido(elegido, dia.fecha, t.hora)
                return (
                  <button
                    key={t.hora}
                    type="button"
                    className={`turno${activo ? ' turno--elegido' : ''}`}
                    aria-pressed={activo}
                    onClick={() => onElegir({ fecha: dia.fecha, hora: t.hora, profesionales: t.profesionales })}
                  >
                    {horaBonita(t.hora)}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
