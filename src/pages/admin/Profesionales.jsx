import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { KeyRound, Pencil, Plus, Users, X } from 'lucide-react'
import { adminService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { DIAS_SEMANA, duracionBonita } from '../../utils/fechas'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import Avatar from '../../components/ui/Avatar'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import CampoForm from '../../components/ui/CampoForm'
import { useAvisos } from '../../components/ui/Avisos'
import FondoCajon from '../../components/ui/Cajon'

const VACIO = { nombre: '', descripcion: '', diasLaborales: [1, 2, 3, 4, 5, 6], servicios: [], activo: true }

export default function Profesionales() {
  const { datos, cargando, error, recargar } = useCarga(async () => {
    const [p, s] = await Promise.all([adminService.profesionales(), adminService.servicios()])
    return { profesionales: p.profesionales, servicios: s.servicios }
  }, [])
  const [editando, setEditando] = useState(null)
  const avisar = useAvisos()
  const cerrarEditor = useCallback(() => setEditando(null), [])

  const nombreServicio = (id) => datos?.servicios.find((s) => s.id === id)?.nombre

  const eliminar = async (p) => {
    try {
      await adminService.eliminarProfesional(p.id)
      avisar('Profesional eliminada')
      if (editando?.id === p.id) setEditando(null)
      await recargar({ silencioso: true })
    } catch (err) {
      avisar(err.message, 'error')
    }
  }

  return (
    <div className={`gestion${editando ? ' gestion--con-panel' : ''}`}>
      <Encabezado
        titulo="Profesionales"
        acciones={
          <button type="button" className="boton boton--sm" onClick={() => setEditando('nuevo')}>
            <Plus size={16} aria-hidden="true" /> Nueva profesional
          </button>
        }
      >
        Tu equipo, los días que trabaja cada una y los servicios que realiza.
      </Encabezado>

      <div className="gestion__cuerpo">
        <div className="gestion__lista">
          {cargando && !datos ? (
            <Loader mensaje="Cargando equipo…" />
          ) : error && !datos ? (
            <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>{error.message}</Alerta>
          ) : datos.profesionales.length === 0 ? (
            <Vacio icono={Users} titulo="Agrega a tu equipo" accion={<button type="button" className="boton" onClick={() => setEditando('nuevo')}>Nueva profesional</button>}>
              Cada profesional tiene sus días de trabajo y los servicios que sabe hacer.
            </Vacio>
          ) : (
            <ul className="lista-personas">
              {datos.profesionales.map((p) => (
                <li key={p.id} className={`persona${p.activo ? '' : ' persona--inactiva'}${editando?.id === p.id ? ' persona--activa' : ''}`}>
                  <Avatar nombre={p.nombre} tamano={46} />
                  <div className="persona__info">
                    <div className="persona__nombre">
                      <strong>{p.nombre}</strong>
                      {!p.activo && <span className="interruptor-etiqueta">Inactiva</span>}
                    </div>
                    {p.descripcion && <p className="persona__desc">{p.descripcion}</p>}
                    <div className="semana-mini" aria-label="Días que trabaja">
                      {DIAS_SEMANA.map((d) => (
                        <span key={d.valor} className={`semana-mini__dia${p.diasLaborales.includes(d.valor) ? ' semana-mini__dia--on' : ''}`} title={d.nombre}>
                          <span aria-hidden="true">{d.corto}</span>
                          <span className="sr-only">{d.nombre}: {p.diasLaborales.includes(d.valor) ? 'trabaja' : 'libre'}</span>
                        </span>
                      ))}
                    </div>
                    {p.cuenta && (
                      <p className="persona__acceso">
                        <KeyRound size={14} aria-hidden="true" /> Entra a la app con {p.cuenta.email}
                      </p>
                    )}
                    <p className="persona__servicios">
                      {p.servicios.length ? p.servicios.map(nombreServicio).filter(Boolean).join(' · ') : <span className="texto-aviso">Sin servicios asignados: no recibe reservas</span>}
                    </p>
                  </div>
                  <div className="persona__acciones">
                    <button type="button" className="boton boton--fantasma boton--sm" onClick={() => setEditando(p)}>
                      <Pencil size={15} aria-hidden="true" /> Editar
                    </button>
                    <BotonConfirmar className="boton boton--fantasma-peligro boton--sm" pregunta="¿Eliminar?" confirmar="Eliminar" onConfirmar={() => eliminar(p)}>
                      Eliminar
                    </BotonConfirmar>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {editando && <FondoCajon onCerrar={cerrarEditor} />}
        {editando && (
          <EditorProfesional
            key={editando === 'nuevo' ? 'nuevo' : editando.id}
            profesional={editando === 'nuevo' ? null : editando}
            servicios={datos?.servicios ?? []}
            onCerrar={cerrarEditor}
            onGuardado={async (nuevo) => {
              avisar(nuevo ? 'Profesional agregada' : 'Cambios guardados')
              setEditando(null)
              await recargar({ silencioso: true })
            }}
          />
        )}
      </div>
    </div>
  )
}

function EditorProfesional({ profesional, servicios, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() => (profesional ? { ...profesional, descripcion: profesional.descripcion ?? '' } : VACIO))
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const alternar = (campo, valor) =>
    setForm((f) => ({
      ...f,
      [campo]: f[campo].includes(valor) ? f[campo].filter((x) => x !== valor) : [...f[campo], valor],
    }))

  const guardar = async (e) => {
    e.preventDefault()
    const cuerpo = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      diasLaborales: form.diasLaborales,
      servicios: form.servicios,
      activo: form.activo,
    }
    setGuardando(true)
    setError('')
    try {
      if (profesional) await adminService.actualizarProfesional(profesional.id, cuerpo)
      else await adminService.crearProfesional(cuerpo)
      await onGuardado(!profesional)
    } catch (err) {
      setError(err.message)
      setErrores(err.campos ?? {})
      setGuardando(false)
    }
  }

  return (
    <aside className="panel" aria-label={profesional ? 'Editar profesional' : 'Nueva profesional'}>
      <div className="panel__cabecera">
        <h2 className="panel__titulo">{profesional ? 'Editar profesional' : 'Nueva profesional'}</h2>
        <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <form className="formulario" onSubmit={guardar} noValidate>
        <CampoForm id="pf-nombre" etiqueta="Nombre" error={errores.nombre}>
          <input id="pf-nombre" className="control" maxLength={100} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required autoFocus />
        </CampoForm>

        <CampoForm id="pf-desc" etiqueta="Especialidad o presentación" opcional error={errores.descripcion} ayuda="Las clientas lo ven al elegir profesional.">
          <input id="pf-desc" className="control" maxLength={300} placeholder="Ej.: Especialista en acrílicas y nail art" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </CampoForm>

        <fieldset className="grupo-campos">
          <legend>Días que trabaja</legend>
          <div className="dias-toggle">
            {DIAS_SEMANA.map((d) => (
              <label key={d.valor} className="dia-toggle">
                <input type="checkbox" checked={form.diasLaborales.includes(d.valor)} onChange={() => alternar('diasLaborales', d.valor)} />
                <span title={d.nombre}>
                  <span aria-hidden="true">{d.nombre.slice(0, 3)}</span>
                  <span className="sr-only">{d.nombre}</span>
                </span>
              </label>
            ))}
          </div>
          {errores.diasLaborales && <p className="campo__error">{errores.diasLaborales}</p>}
          <p className="campo__ayuda">Para un día libre puntual (vacaciones, cita médica) usa «Horarios → Días cerrados».</p>
        </fieldset>

        <fieldset className="grupo-campos">
          <legend>Servicios que realiza</legend>
          {servicios.length === 0 ? (
            <p className="campo__ayuda">
              Primero crea servicios en <Link to="/admin/servicios">Servicios</Link>.
            </p>
          ) : (
            <div className="lista-checks">
              {servicios.map((s) => (
                <label key={s.id} className="check">
                  <input type="checkbox" checked={form.servicios.includes(s.id)} onChange={() => alternar('servicios', s.id)} />
                  <span>
                    {s.nombre}
                    <small>
                      {duracionBonita(s.duracionMin)}
                      {!s.activo && ' · oculto'}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          )}
          {errores.servicios && <p className="campo__error">{errores.servicios}</p>}
        </fieldset>

        {profesional && <AccesoApp profesional={profesional} />}

        <label className="interruptor">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          <span className="interruptor__pista" aria-hidden="true" />
          <span>
            <strong>Recibe reservas</strong>
            <small>Apágalo si ya no trabaja en el salón; sus citas pasadas se conservan.</small>
          </span>
        </label>

        <Alerta>{error}</Alerta>

        <div className="formulario__acciones">
          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? 'Guardando…' : profesional ? 'Guardar cambios' : 'Agregar profesional'}
          </button>
          <button type="button" className="boton boton--fantasma" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </form>
    </aside>
  )
}

/**
 * Acceso a la app: la profesional se registra con su correo (como cualquier clienta)
 * y aquí se vincula esa cuenta. Desde ese momento entra a «Mi agenda» y ve solo sus citas.
 */
function AccesoApp({ profesional }) {
  const [cuenta, setCuenta] = useState(profesional.cuenta)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const avisar = useAvisos()

  const dar = async () => {
    setGuardando(true)
    setError('')
    try {
      const { profesional: p } = await adminService.darAcceso(profesional.id, email.trim())
      setCuenta(p.cuenta)
      setEmail('')
      avisar(`${profesional.nombre} ya puede entrar a su agenda`)
    } catch (err) {
      setError(err.campos?.email ?? err.message)
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async () => {
    try {
      await adminService.quitarAcceso(profesional.id)
      setCuenta(null)
      avisar('Acceso quitado')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <fieldset className="grupo-campos acceso-app">
      <legend>Acceso a la app</legend>
      {cuenta ? (
        <>
          <p className="acceso-app__estado">
            <KeyRound size={16} aria-hidden="true" />
            <span>
              Entra con <strong>{cuenta.email}</strong> y ve solo su agenda: puede agendar, reprogramar, cancelar y eliminar sus citas.
            </span>
          </p>
          <BotonConfirmar className="boton boton--fantasma-peligro boton--sm" pregunta="¿Quitarle el acceso?" confirmar="Quitar" onConfirmar={quitar}>
            Quitar acceso
          </BotonConfirmar>
        </>
      ) : (
        <>
          <p className="campo__ayuda">
            Pídele que se registre en la app con su correo y que lo confirme. Luego escribe ese correo aquí.
          </p>
          <div className="fila-boton">
            <label className="sr-only" htmlFor="acceso-email">
              Correo de la cuenta de {profesional.nombre}
            </label>
            <input
              id="acceso-email"
              className="control"
              type="email"
              inputMode="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
            />
            <button type="button" className="boton boton--secundario" onClick={dar} disabled={guardando || email.trim().length < 5}>
              {guardando ? 'Dando acceso…' : 'Dar acceso'}
            </button>
          </div>
        </>
      )}
      {error && <p className="campo__error">{error}</p>}
    </fieldset>
  )
}
