import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarOff, Trash2 } from 'lucide-react'
import { adminService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { DIAS_SEMANA, fechaLarga, hoyISO, sumarDias } from '../../utils/fechas'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import CampoForm from '../../components/ui/CampoForm'
import { useAvisos } from '../../components/ui/Avisos'

export default function Horarios() {
  return (
    <div className="pagina-admin">
      <Encabezado titulo="Horarios">Cuándo atiende el local y qué días no se reciben turnos.</Encabezado>
      <div className="secciones">
        <HorarioSemanal />
        <DiasCerrados />
      </div>
    </div>
  )
}

function HorarioSemanal() {
  const { datos, cargando, error, recargar } = useCarga(() => adminService.horario(), [])

  return (
    <section className="seccion" aria-labelledby="t-semana">
      <h2 id="t-semana" className="seccion__titulo">Horario de atención</h2>
      <p className="seccion__texto">Los turnos se ofrecen dentro de este horario. Cada profesional además tiene sus propios días de trabajo.</p>
      {cargando && !datos ? (
        <Loader mensaje="Cargando horario…" />
      ) : error && !datos ? (
        <Alerta>{error.message}</Alerta>
      ) : (
        <FormHorario key={JSON.stringify(datos.dias)} guardados={datos.dias} onGuardado={() => recargar({ silencioso: true })} />
      )}
    </section>
  )
}

function FormHorario({ guardados, onGuardado }) {
  const [dias, setDias] = useState(guardados)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const avisar = useAvisos()

  const cambiar = (dia, campo, valor) => setDias((ds) => ds.map((d) => (d.diaSemana === dia ? { ...d, [campo]: valor } : d)))
  const invalido = dias?.some((d) => d.abierto && d.cierre <= d.apertura)
  const sinCambios = JSON.stringify(dias) === JSON.stringify(guardados)

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrorGuardar('')
    try {
      await adminService.guardarHorario(dias)
      avisar('Horario guardado')
      await onGuardado()
    } catch (err) {
      setErrorGuardar(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
          <form onSubmit={guardar} className="horario-semanal">
            {DIAS_SEMANA.map(({ valor, nombre }) => {
              const d = dias.find((x) => x.diaSemana === valor)
              const mal = d.abierto && d.cierre <= d.apertura
              return (
                <div key={valor} className={`horario-semanal__fila${d.abierto ? '' : ' horario-semanal__fila--cerrado'}`}>
                  <label className="interruptor interruptor--compacto">
                    <input type="checkbox" checked={d.abierto} onChange={(e) => cambiar(valor, 'abierto', e.target.checked)} />
                    <span className="interruptor__pista" aria-hidden="true" />
                    <strong>{nombre}</strong>
                  </label>
                  {d.abierto ? (
                    <div className="horario-semanal__horas">
                      <label className="sr-only" htmlFor={`ap-${valor}`}>Apertura del {nombre}</label>
                      <input id={`ap-${valor}`} type="time" step={900} className="control control--hora" value={d.apertura} onChange={(e) => cambiar(valor, 'apertura', e.target.value)} />
                      <span aria-hidden="true">a</span>
                      <label className="sr-only" htmlFor={`ci-${valor}`}>Cierre del {nombre}</label>
                      <input id={`ci-${valor}`} type="time" step={900} className={`control control--hora${mal ? ' control--error' : ''}`} value={d.cierre} onChange={(e) => cambiar(valor, 'cierre', e.target.value)} aria-invalid={mal} />
                    </div>
                  ) : (
                    <span className="horario-semanal__cerrado">Cerrado</span>
                  )}
                </div>
              )
            })}
            {invalido && <Alerta>La hora de cierre debe ser después de la apertura.</Alerta>}
            <Alerta>{errorGuardar}</Alerta>
            <div className="formulario__acciones">
              <button type="submit" className="boton" disabled={guardando || invalido || sinCambios}>
                {guardando ? 'Guardando…' : 'Guardar horario'}
              </button>
              {!sinCambios && (
                <button type="button" className="boton boton--fantasma" onClick={() => setDias(guardados)} disabled={guardando}>
                  Descartar cambios
                </button>
              )}
            </div>
          </form>
  )
}

function DiasCerrados() {
  const hoy = hoyISO()
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const [b, p] = await Promise.all([adminService.bloqueos(hoy, sumarDias(hoy, 365)), adminService.profesionales()])
    return { bloqueos: b.bloqueos, profesionales: p.profesionales }
  }, [hoy])
  const [form, setForm] = useState({ fecha: '', profesionalId: '', motivo: '' })
  const [errores, setErrores] = useState({})
  const [aviso, setAviso] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const avisar = useAvisos()

  const agregar = async (e) => {
    e.preventDefault()
    if (!form.fecha) return setErrores({ fecha: 'Elige la fecha' })
    setGuardando(true)
    setErrores({})
    setAviso(null)
    try {
      const { citasAfectadas } = await adminService.crearBloqueo({
        fecha: form.fecha,
        profesionalId: form.profesionalId || null,
        motivo: form.motivo || null,
      })
      avisar('Día bloqueado')
      if (citasAfectadas) setAviso({ fecha: form.fecha, n: citasAfectadas })
      setForm({ fecha: '', profesionalId: form.profesionalId, motivo: '' })
      await recargar({ silencioso: true })
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async (b) => {
    try {
      await adminService.eliminarBloqueo(b.id)
      avisar('Día habilitado de nuevo')
      await recargar({ silencioso: true })
    } catch (err) {
      avisar(err.message, 'error')
    }
  }

  return (
    <section className="seccion" aria-labelledby="t-cerrados">
      <h2 id="t-cerrados" className="seccion__titulo">Días cerrados y ausencias</h2>
      <p className="seccion__texto">Feriados, vacaciones o el día libre de una profesional. Ese día no se ofrecerán turnos.</p>

      <form className="formulario formulario--fila" onSubmit={agregar} noValidate>
        <CampoForm id="bq-fecha" etiqueta="Fecha" error={errores.fecha}>
          <input id="bq-fecha" type="date" className="control" min={hoy} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
        </CampoForm>
        <CampoForm id="bq-quien" etiqueta="Aplica a">
          <select id="bq-quien" className="control" value={form.profesionalId} onChange={(e) => setForm({ ...form, profesionalId: e.target.value })}>
            <option value="">Todo el local</option>
            {datos?.profesionales.map((p) => (
              <option key={p.id} value={p.id}>
                Solo {p.nombre}
              </option>
            ))}
          </select>
        </CampoForm>
        <CampoForm id="bq-motivo" etiqueta="Motivo" opcional>
          <input id="bq-motivo" className="control" maxLength={150} placeholder="Ej.: Feriado" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
        </CampoForm>
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Bloquear día'}
        </button>
      </form>

      <Alerta>{errores.general}</Alerta>
      {aviso && (
        <Alerta tipo="aviso">
          Ese día ya hay {aviso.n} cita{aviso.n === 1 ? '' : 's'} confirmada{aviso.n === 1 ? '' : 's'}. Siguen en pie hasta que las canceles o reprogrames.{' '}
          <Link to={`/admin?fecha=${aviso.fecha}`}>Ver en la agenda</Link>
        </Alerta>
      )}

      {cargando && !datos ? (
        <Loader mensaje="Cargando días cerrados…" />
      ) : error && !datos ? (
        <Alerta>{error.message}</Alerta>
      ) : datos.bloqueos.length === 0 ? (
        <Vacio icono={CalendarOff} titulo="No hay días bloqueados">
          Todos los días siguen el horario de atención.
        </Vacio>
      ) : (
        <ul className="lista-bloqueos">
          {datos.bloqueos.map((b) => (
            <li key={b.id} className="bloqueo">
              <div>
                <strong className="primera-mayuscula">{fechaLarga(b.fecha)}</strong>
                <span>
                  {b.profesionalNombre ? `Solo ${b.profesionalNombre}` : 'Todo el local'}
                  {b.motivo && ` · ${b.motivo}`}
                </span>
              </div>
              <button type="button" className="boton-icono" onClick={() => quitar(b)} aria-label={`Quitar bloqueo del ${fechaLarga(b.fecha)}`}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
