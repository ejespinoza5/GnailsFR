import { useState } from 'react'
import { adminService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import CampoForm from '../../components/ui/CampoForm'
import { useAvisos } from '../../components/ui/Avisos'

const INTERVALOS = [10, 15, 20, 30, 45, 60]
const ANTICIPACION = [
  [0, 'Sin mínimo'],
  [30, '30 minutos'],
  [60, '1 hora'],
  [120, '2 horas'],
  [180, '3 horas'],
  [360, '6 horas'],
  [720, '12 horas'],
  [1440, '1 día'],
  [2880, '2 días'],
]

export default function Ajustes() {
  const { datos, cargando, error, recargar } = useCarga(() => adminService.configuracion(), [])

  return (
    <div className="pagina-admin">
      <Encabezado titulo="Reglas de reserva">Cómo y con cuánta anticipación pueden reservar y cancelar tus clientas.</Encabezado>
      {cargando && !datos ? (
        <Loader mensaje="Cargando reglas…" />
      ) : error && !datos ? (
        <Alerta>{error.message}</Alerta>
      ) : (
        <FormReglas guardadas={datos.configuracion} onGuardado={() => recargar({ silencioso: true })} />
      )}
    </div>
  )
}

function FormReglas({ guardadas, onGuardado }) {
  const [form, setForm] = useState(guardadas)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const avisar = useAvisos()

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrorGeneral('')
    try {
      const { mensajeReserva, ...numeros } = form
      const cuerpo = { ...Object.fromEntries(Object.entries(numeros).map(([k, v]) => [k, Number(v)])), mensajeReserva }
      await adminService.guardarConfiguracion(cuerpo)
      avisar('Reglas guardadas')
      await onGuardado()
    } catch (err) {
      setErrorGeneral(err.message)
      setErrores(err.campos ?? {})
    } finally {
      setGuardando(false)
    }
  }

  return (
          <form className="seccion formulario formulario--ajustes" onSubmit={guardar} noValidate>
            <CampoForm id="aj-int" etiqueta="Los turnos empiezan cada" error={errores.intervaloMin} ayuda="Con 30 minutos se ofrecen turnos a las 9:00, 9:30, 10:00…">
              <select id="aj-int" className="control" value={form.intervaloMin} onChange={(e) => cambiar('intervaloMin', e.target.value)}>
                {INTERVALOS.map((m) => (
                  <option key={m} value={m}>
                    {m} minutos
                  </option>
                ))}
              </select>
            </CampoForm>

            <CampoForm id="aj-ant" etiqueta="Anticipación mínima para reservar" error={errores.anticipacionMin} ayuda="Evita reservas de último minuto que no alcanzas a atender.">
              <select id="aj-ant" className="control" value={form.anticipacionMin} onChange={(e) => cambiar('anticipacionMin', e.target.value)}>
                {ANTICIPACION.some(([v]) => v === Number(form.anticipacionMin)) ? null : (
                  <option value={form.anticipacionMin}>{form.anticipacionMin} minutos</option>
                )}
                {ANTICIPACION.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </CampoForm>

            <CampoForm id="aj-dias" etiqueta="Se puede reservar hasta" error={errores.diasMaximos}>
              <div className="control-sufijo">
                <input id="aj-dias" type="number" className="control control--corto" min={1} max={365} value={form.diasMaximos} onChange={(e) => cambiar('diasMaximos', e.target.value)} />
                <span>días adelante</span>
              </div>
            </CampoForm>

            <CampoForm id="aj-canc" etiqueta="La clienta puede cancelar hasta" error={errores.horasCancelacion} ayuda="Después de ese plazo solo tú puedes cancelar o reprogramar.">
              <div className="control-sufijo">
                <input id="aj-canc" type="number" className="control control--corto" min={0} max={168} value={form.horasCancelacion} onChange={(e) => cambiar('horasCancelacion', e.target.value)} />
                <span>horas antes</span>
              </div>
            </CampoForm>

            <CampoForm id="aj-max" etiqueta="Citas próximas por clienta" error={errores.maxCitasActivas} ayuda="Límite de turnos reservados a la vez. Evita que una persona acapare la agenda.">
              <div className="control-sufijo">
                <input id="aj-max" type="number" className="control control--corto" min={1} max={20} value={form.maxCitasActivas} onChange={(e) => cambiar('maxCitasActivas', e.target.value)} />
                <span>como máximo</span>
              </div>
            </CampoForm>

            <CampoForm
              id="aj-msg"
              etiqueta="Mensaje al reservar"
              opcional
              error={errores.mensajeReserva}
              ayuda="Lo ve la clienta en el comprobante, en «Mis turnos», en la confirmación y en los recordatorios (día anterior y 30 minutos antes). Déjalo vacío para no mostrar nada."
            >
              <textarea
                id="aj-msg"
                className="control"
                rows={2}
                maxLength={200}
                placeholder="Recuerda llegar 5 minutitos antes para empezar a tiempo. ¡Te esperamos!"
                value={form.mensajeReserva}
                onChange={(e) => cambiar('mensajeReserva', e.target.value)}
              />
            </CampoForm>

            <Alerta>{errorGeneral}</Alerta>

            <div className="formulario__acciones">
              <button type="submit" className="boton" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar reglas'}
              </button>
            </div>
          </form>
  )
}
