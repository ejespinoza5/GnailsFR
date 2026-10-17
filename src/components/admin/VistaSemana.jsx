import { useMemo } from 'react'
import { CalendarOff, Check } from 'lucide-react'
import { useMinutoActual } from '../../hooks/useMinutoActual'
import { aMinutos, diaCorto, diaSemana, fechaLarga, horaBonita, horaCorta, mesCorto, numeroDia, sumarDias } from '../../utils/fechas'
import EstadoCita from '../ui/EstadoCita'
import Vacio from '../ui/Vacio'

const PX_MIN = 1.2 // alto en píxeles de cada minuto

/**
 * La semana como horario: una columna por día y las citas en su hora real,
 * coloreadas por profesional. Si dos citas se cruzan (distintas profesionales)
 * se reparten el ancho de la columna.
 */
export default function VistaSemana({ lunes, hoy, citas, horario, bloqueos, colores, movil, seleccionada, onElegir, onElegirDia }) {
  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)), [lunes])
  const porDia = useMemo(() => {
    const m = new Map(dias.map((d) => [d, []]))
    for (const c of citas) m.get(c.fecha)?.push(c)
    for (const lista of m.values()) lista.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    return m
  }, [dias, citas])

  const cerrado = (fecha) => {
    const local = bloqueos.find((b) => b.fecha === fecha && !b.profesionalId)
    if (local) return local.motivo || 'Cerrado'
    return horario.find((h) => h.diaSemana === diaSemana(fecha))?.abierto ? null : 'Cerrado'
  }

  if (movil) return <ListaSemana dias={dias} porDia={porDia} hoy={hoy} cerrado={cerrado} seleccionada={seleccionada} onElegir={onElegir} onElegirDia={onElegirDia} />

  // Rango visible: desde la apertura más temprana hasta el cierre más tardío de la semana.
  let inicio = 24 * 60
  let fin = 0
  for (const h of horario) {
    if (!h.abierto) continue
    inicio = Math.min(inicio, aMinutos(h.apertura))
    fin = Math.max(fin, aMinutos(h.cierre))
  }
  for (const c of citas) {
    inicio = Math.min(inicio, aMinutos(c.horaInicio))
    fin = Math.max(fin, aMinutos(c.horaFin))
  }
  if (inicio >= fin) [inicio, fin] = [9 * 60, 19 * 60]
  inicio = Math.floor(inicio / 60) * 60
  fin = Math.ceil(fin / 60) * 60
  const horas = []
  for (let m = inicio; m < fin; m += 60) horas.push(m)

  return (
    <div className="semana-agenda" role="region" aria-label="Agenda de la semana" tabIndex={0}>
      <div className="semana-agenda__rejilla" style={{ '--alto': `${(fin - inicio) * PX_MIN}px`, '--hora': `${60 * PX_MIN}px` }}>
        <div className="semana-agenda__esquina" />
        {dias.map((d) => (
          <button
            key={d}
            type="button"
            className={`semana-agenda__dia${d === hoy ? ' semana-agenda__dia--hoy' : ''}`}
            onClick={() => onElegirDia(d)}
            aria-label={`Ver el ${fechaLarga(d)}`}
          >
            <span className="semana-agenda__nombre">{diaCorto(d)}</span>
            <span className="semana-agenda__numero">{numeroDia(d)}</span>
            <span className="semana-agenda__cuenta">{porDia.get(d).length ? `${porDia.get(d).length} citas` : mesCorto(d)}</span>
          </button>
        ))}

        <div className="semana-agenda__horas" aria-hidden="true">
          {horas.map((m) => (
            <span key={m} style={{ top: (m - inicio) * PX_MIN }}>
              {horaBonita(`${String(m / 60).padStart(2, '0')}:00`)}
            </span>
          ))}
        </div>

        {dias.map((d) => (
          <ColumnaDia
            key={d}
            fecha={d}
            citas={porDia.get(d)}
            inicio={inicio}
            esHoy={d === hoy}
            cerrado={cerrado(d)}
            colores={colores}
            seleccionada={seleccionada}
            onElegir={onElegir}
          />
        ))}
      </div>
    </div>
  )
}

function ColumnaDia({ citas, inicio, esHoy, cerrado, colores, seleccionada, onElegir }) {
  const ahora = useMinutoActual()

  // Carriles: las citas que se cruzan forman un grupo y se reparten el ancho;
  // una cita sin cruces ocupa la columna entera.
  const ubicadas = useMemo(() => {
    const resultado = []
    let grupo = []
    let finGrupo = -1
    let fines = []
    const cerrarGrupo = () => {
      for (const u of grupo) u.carriles = fines.length
      resultado.push(...grupo)
      grupo = []
      fines = []
    }
    for (const c of citas) {
      const ini = aMinutos(c.horaInicio)
      const fin = aMinutos(c.horaFin)
      if (ini >= finGrupo) cerrarGrupo()
      let carril = fines.findIndex((f) => f <= ini)
      if (carril === -1) carril = fines.push(0) - 1
      fines[carril] = fin
      finGrupo = Math.max(finGrupo, fin)
      grupo.push({ c, carril, ini, dur: fin - ini })
    }
    cerrarGrupo()
    return resultado
  }, [citas])

  return (
    <div className={`semana-agenda__columna${cerrado ? ' semana-agenda__columna--cerrada' : ''}`}>
      {cerrado && !citas.length && <span className="semana-agenda__cerrado">{cerrado}</span>}
      {ubicadas.map(({ c, carril, carriles, ini, dur }) => {
        const corta = dur * PX_MIN < 46
        return (
          <button
            key={c.id}
            type="button"
            className={`bloque-semana bloque-semana--p${colores.get(c.profesional.id) ?? 0} bloque-semana--${c.estado}${c.id === seleccionada ? ' bloque-semana--activa' : ''}`}
            style={{
              top: (ini - inicio) * PX_MIN,
              height: Math.max(dur * PX_MIN - 2, 20),
              left: `calc(${(100 / carriles) * carril}% + 3px)`,
              width: `calc(${100 / carriles}% - 6px)`,
            }}
            onClick={() => onElegir(c.id)}
            aria-label={`${horaBonita(c.horaInicio)}, ${c.cliente.nombre}, ${c.servicio.nombre} con ${c.profesional.nombre}`}
            title={`${horaBonita(c.horaInicio)} – ${horaBonita(c.horaFin)} · ${c.cliente.nombre} · ${c.servicio.nombre} · ${c.profesional.nombre}`}
          >
            <span className="bloque-semana__hora">
              {horaCorta(c.horaInicio)}
              {c.estado === 'completada' && <Check size={12} strokeWidth={3} aria-hidden="true" />}
            </span>
            {!corta && <span className="bloque-semana__cliente">{c.cliente.nombre.split(' ')[0]}</span>}
          </button>
        )
      })}
      {esHoy && ahora >= inicio && (
        <div className="linea-ahora linea-ahora--semana" style={{ top: (ahora - inicio) * PX_MIN }} aria-hidden="true">
          <span className="linea-ahora__gota" />
        </div>
      )}
    </div>
  )
}

/** Celular: la semana como lista agrupada por día. */
function ListaSemana({ dias, porDia, hoy, cerrado, seleccionada, onElegir, onElegirDia }) {
  if (!dias.some((d) => porDia.get(d).length)) return <Vacio icono={CalendarOff} titulo="No hay citas esta semana" />
  return (
    <div className="lista-semana">
      {dias.map((d) => {
        const lista = porDia.get(d)
        return (
          <section key={d} className="lista-semana__dia">
            <button type="button" className={`lista-semana__titulo${d === hoy ? ' lista-semana__titulo--hoy' : ''}`} onClick={() => onElegirDia(d)}>
              <span className="primera-mayuscula">{fechaLarga(d)}</span>
              <small>{lista.length ? `${lista.length} citas` : cerrado(d) ?? 'Sin citas'}</small>
            </button>
            {lista.length > 0 && (
              <ul className="lista-agenda">
                {lista.map((c) => (
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
            )}
          </section>
        )
      })}
    </div>
  )
}
