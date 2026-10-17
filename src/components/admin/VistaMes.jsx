import { useMemo } from 'react'
import { diaSemana, fechaLarga, horaCorta, inicioCuadriculaMes, numeroDia, sumarDias } from '../../utils/fechas'

const ENCABEZADOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/** El mes como cuadrícula de 6 semanas. Cada día muestra sus citas; al tocarlo se abre ese día. */
export default function VistaMes({ fecha, hoy, citas, horario, bloqueos, colores, movil, onElegirDia }) {
  const mes = fecha.slice(0, 7)
  const dias = useMemo(() => {
    const inicio = inicioCuadriculaMes(fecha)
    return Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i))
  }, [fecha])

  const porDia = useMemo(() => {
    const m = new Map()
    for (const c of [...citas].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))) {
      if (!m.has(c.fecha)) m.set(c.fecha, [])
      m.get(c.fecha).push(c)
    }
    return m
  }, [citas])

  const cerrado = (f) => {
    const local = bloqueos.find((b) => b.fecha === f && !b.profesionalId)
    if (local) return local.motivo || 'Cerrado'
    return horario.find((h) => h.diaSemana === diaSemana(f))?.abierto ? null : 'Cerrado'
  }

  const visibles = movil ? 0 : 3

  return (
    <div className="mes" role="grid" aria-label="Citas del mes">
      {ENCABEZADOS.map((d) => (
        <div key={d} className="mes__encabezado" role="columnheader">
          {movil ? d[0] : d}
        </div>
      ))}
      {dias.map((d) => {
        const lista = porDia.get(d) ?? []
        const motivo = cerrado(d)
        const clases = [
          'mes__dia',
          d.slice(0, 7) !== mes && 'mes__dia--fuera',
          d === hoy && 'mes__dia--hoy',
          motivo && 'mes__dia--cerrado',
          d < hoy && 'mes__dia--pasado',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <button
            key={d}
            type="button"
            role="gridcell"
            className={clases}
            onClick={() => onElegirDia(d)}
            aria-label={`${fechaLarga(d)}: ${lista.length ? `${lista.length} citas` : motivo ?? 'sin citas'}`}
          >
            <span className="mes__numero">{numeroDia(d)}</span>
            {motivo && !lista.length && !movil && <span className="mes__cerrado">{motivo}</span>}
            {movil ? (
              lista.length > 0 && (
                <span className="mes__puntos" aria-hidden="true">
                  {lista.slice(0, 4).map((c) => (
                    <span key={c.id} className={`punto punto--p${colores.get(c.profesional.id) ?? 0}`} />
                  ))}
                </span>
              )
            ) : (
              <span className="mes__citas" aria-hidden="true">
                {lista.slice(0, visibles).map((c) => (
                  <span key={c.id} className="mes__cita">
                    <span className={`punto punto--p${colores.get(c.profesional.id) ?? 0}`} />
                    <span className="tabular">{horaCorta(c.horaInicio)}</span> {c.cliente.nombre.split(' ')[0]}
                  </span>
                ))}
                {lista.length > visibles && <span className="mes__mas">+{lista.length - visibles} más</span>}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
