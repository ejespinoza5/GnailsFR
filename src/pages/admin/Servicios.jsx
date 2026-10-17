import { useCallback, useState } from 'react'
import { Gem, Pencil, Plus, X } from 'lucide-react'
import { adminService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { diaMes, duracionBonita, precioTexto } from '../../utils/fechas'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import { useAvisos } from '../../components/ui/Avisos'
import FondoCajon from '../../components/ui/Cajon'
import CampoForm from '../../components/ui/CampoForm'

const VACIO = { nombre: '', descripcion: '', duracionMin: 60, precio: '', precioTipo: 'fijo', precioMax: '', disponibleDesde: '', disponibleHasta: '', activo: true }

const TIPOS_PRECIO = [
  { id: 'fijo', texto: 'Fijo', ejemplo: '$18,50' },
  { id: 'desde', texto: 'Desde', ejemplo: 'Desde $25,00' },
  { id: 'rango', texto: 'Rango', ejemplo: '$20,00 – $35,00' },
  { id: 'consultar', texto: 'En el salón', ejemplo: 'Precio en el salón' },
]
const DURACIONES = [30, 45, 60, 90, 120]

export default function Servicios() {
  const { datos, cargando, error, recargar } = useCarga(() => adminService.servicios(), [])
  const [editando, setEditando] = useState(null) // null | 'nuevo' | servicio
  const avisar = useAvisos()
  const cerrarEditor = useCallback(() => setEditando(null), [])

  const eliminar = async (s) => {
    try {
      await adminService.eliminarServicio(s.id)
      avisar('Servicio eliminado')
      if (editando?.id === s.id) setEditando(null)
      await recargar({ silencioso: true })
    } catch (err) {
      avisar(err.message, 'error')
    }
  }

  return (
    <div className={`gestion${editando ? ' gestion--con-panel' : ''}`}>
      <Encabezado
        titulo="Servicios"
        acciones={
          <button type="button" className="boton boton--sm" onClick={() => setEditando('nuevo')}>
            <Plus size={16} aria-hidden="true" /> Nuevo servicio
          </button>
        }
      >
        Lo que tus clientas pueden reservar. La duración define cuánto tiempo ocupa en la agenda.
      </Encabezado>

      <div className="gestion__cuerpo">
        <div className="gestion__lista">
          {cargando && !datos ? (
            <Loader mensaje="Cargando servicios…" />
          ) : error && !datos ? (
            <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>{error.message}</Alerta>
          ) : datos.servicios.length === 0 ? (
            <Vacio icono={Gem} titulo="Crea tu primer servicio" accion={<button type="button" className="boton" onClick={() => setEditando('nuevo')}>Nuevo servicio</button>}>
              Por ejemplo «Manicure semipermanente», 60 minutos. Luego asígnalo a tus profesionales.
            </Vacio>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Duración</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Profesionales</th>
                  <th scope="col">Estado</th>
                  <th scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {datos.servicios.map((s) => (
                  <tr key={s.id} className={`${s.activo ? '' : 'tabla__fila--inactiva'}${editando?.id === s.id ? ' tabla__fila--activa' : ''}`}>
                    <td data-etiqueta="Servicio">
                      <strong className="tabla__nombre">{s.nombre}</strong>
                      {s.descripcion && <span className="tabla__detalle">{s.descripcion}</span>}
                      {(s.disponibleDesde || s.disponibleHasta) && (
                        <span className="etiqueta etiqueta--temporada">
                          {s.disponibleDesde ? diaMes(s.disponibleDesde) : '…'} – {s.disponibleHasta ? diaMes(s.disponibleHasta) : '…'}
                        </span>
                      )}
                    </td>
                    <td data-etiqueta="Duración" className="tabular">{duracionBonita(s.duracionMin)}</td>
                    <td data-etiqueta="Precio" className="tabular">{precioTexto(s, '—')}</td>
                    <td data-etiqueta="Profesionales">
                      {s.profesionales ? s.profesionales : <span className="texto-aviso">Ninguna</span>}
                    </td>
                    <td data-etiqueta="Estado">
                      <span className={`interruptor-etiqueta${s.activo ? ' interruptor-etiqueta--on' : ''}`}>{s.activo ? 'Activo' : 'Oculto'}</span>
                    </td>
                    <td className="tabla__acciones">
                      <button type="button" className="boton boton--fantasma boton--sm" onClick={() => setEditando(s)}>
                        <Pencil size={15} aria-hidden="true" /> Editar
                      </button>
                      <BotonConfirmar className="boton boton--fantasma-peligro boton--sm" pregunta="¿Eliminar?" confirmar="Eliminar" onConfirmar={() => eliminar(s)}>
                        Eliminar
                      </BotonConfirmar>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {datos?.servicios.some((s) => s.activo && !s.profesionales) && (
            <Alerta tipo="aviso">Los servicios sin profesionales no aparecen para reservar. Asígnalos en «Profesionales».</Alerta>
          )}
        </div>

        {editando && <FondoCajon onCerrar={cerrarEditor} />}
        {editando && (
          <EditorServicio
            key={editando === 'nuevo' ? 'nuevo' : editando.id}
            servicio={editando === 'nuevo' ? null : editando}
            onCerrar={cerrarEditor}
            onGuardado={async (s, nuevo) => {
              avisar(nuevo ? 'Servicio creado' : 'Cambios guardados')
              setEditando(null)
              await recargar({ silencioso: true })
              return s
            }}
          />
        )}
      </div>
    </div>
  )
}

function EditorServicio({ servicio, onCerrar, onGuardado }) {
  const [form, setForm] = useState(() =>
    servicio
      ? {
          ...servicio,
          descripcion: servicio.descripcion ?? '',
          precio: servicio.precio ?? '',
          precioTipo: servicio.precio === null ? 'consultar' : servicio.precioTipo,
          precioMax: servicio.precioMax ?? '',
          disponibleDesde: servicio.disponibleDesde ?? '',
          disponibleHasta: servicio.disponibleHasta ?? '',
        }
      : VACIO,
  )
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    const cuerpo = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      duracionMin: Number(form.duracionMin),
      // "En el salón" = sin precio; el resto envía el tipo y, si es rango, el máximo.
      precio: form.precioTipo === 'consultar' || form.precio === '' ? null : Number(form.precio),
      precioTipo: form.precioTipo === 'consultar' ? 'fijo' : form.precioTipo,
      precioMax: form.precioTipo === 'rango' && form.precioMax !== '' ? Number(form.precioMax) : null,
      disponibleDesde: form.disponibleDesde || null,
      disponibleHasta: form.disponibleHasta || null,
      activo: form.activo,
    }
    setGuardando(true)
    setError('')
    try {
      const { servicio: s } = servicio
        ? await adminService.actualizarServicio(servicio.id, cuerpo)
        : await adminService.crearServicio(cuerpo)
      await onGuardado(s, !servicio)
    } catch (err) {
      setError(err.message)
      setErrores(err.campos ?? {})
      setGuardando(false)
    }
  }

  return (
    <aside className="panel" aria-label={servicio ? 'Editar servicio' : 'Nuevo servicio'}>
      <div className="panel__cabecera">
        <h2 className="panel__titulo">{servicio ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <button type="button" className="boton-icono" onClick={onCerrar} aria-label="Cerrar">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <form className="formulario" onSubmit={guardar} noValidate>
        <CampoForm id="sv-nombre" etiqueta="Nombre" error={errores.nombre}>
          <input id="sv-nombre" className="control" value={form.nombre} maxLength={100} onChange={(e) => cambiar('nombre', e.target.value)} required autoFocus />
        </CampoForm>

        <CampoForm id="sv-desc" etiqueta="Descripción" opcional error={errores.descripcion}>
          <textarea id="sv-desc" className="control" rows={2} maxLength={500} value={form.descripcion} onChange={(e) => cambiar('descripcion', e.target.value)} />
        </CampoForm>

        <CampoForm id="sv-dur" etiqueta="Duración (minutos)" error={errores.duracionMin}>
          <div className="duracion">
            <input id="sv-dur" type="number" className="control control--corto" min={5} max={480} step={5} value={form.duracionMin} onChange={(e) => cambiar('duracionMin', e.target.value)} required />
            <div className="chips" role="group" aria-label="Duraciones frecuentes">
              {DURACIONES.map((d) => (
                <button key={d} type="button" className="chip" aria-pressed={Number(form.duracionMin) === d} onClick={() => cambiar('duracionMin', d)}>
                  {duracionBonita(d)}
                </button>
              ))}
            </div>
          </div>
        </CampoForm>

        <fieldset className="grupo-campos">
          <legend>Precio</legend>
          <div className="tipos-precio" role="radiogroup" aria-label="Tipo de precio">
            {TIPOS_PRECIO.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={form.precioTipo === t.id}
                className="tipo-precio"
                onClick={() => cambiar('precioTipo', t.id)}
              >
                <strong>{t.texto}</strong>
                <small>{t.ejemplo}</small>
              </button>
            ))}
          </div>
          {form.precioTipo !== 'consultar' && (
            <div className={form.precioTipo === 'rango' ? 'fila-campos' : ''}>
              <CampoForm id="sv-precio" etiqueta={form.precioTipo === 'rango' ? 'Desde' : form.precioTipo === 'desde' ? 'Precio mínimo' : 'Precio'} error={errores.precio}>
                <div className="control-prefijo">
                  <span aria-hidden="true">$</span>
                  <input id="sv-precio" type="number" className="control" min={0} step="0.01" inputMode="decimal" value={form.precio} onChange={(e) => cambiar('precio', e.target.value)} />
                </div>
              </CampoForm>
              {form.precioTipo === 'rango' && (
                <CampoForm id="sv-precio-max" etiqueta="Hasta" error={errores.precioMax}>
                  <div className="control-prefijo">
                    <span aria-hidden="true">$</span>
                    <input id="sv-precio-max" type="number" className="control" min={0} step="0.01" inputMode="decimal" value={form.precioMax} onChange={(e) => cambiar('precioMax', e.target.value)} />
                  </div>
                </CampoForm>
              )}
            </div>
          )}
          <p className="campo__ayuda">
            {form.precioTipo === 'desde' || form.precioTipo === 'rango'
              ? 'Al reservar, la clienta verá que el precio final se confirma en el salón según el diseño.'
              : form.precioTipo === 'consultar'
                ? 'La clienta verá «Precio en el salón».'
                : 'La clienta verá este precio exacto.'}{' '}
            Se verá así: <strong>{form.precioTipo === 'consultar' ? 'Precio en el salón' : precioTexto({ precio: form.precio === '' ? 0 : Number(form.precio), precioTipo: form.precioTipo, precioMax: form.precioMax === '' ? 0 : Number(form.precioMax) })}</strong>
          </p>
        </fieldset>

        <fieldset className="grupo-campos">
          <legend>
            Temporada <span className="opcional">(opcional)</span>
          </legend>
          <p className="campo__ayuda">Para servicios que solo se ofrecen unas fechas. Vacío = todo el año.</p>
          <div className="fila-campos">
            <CampoForm id="sv-desde" etiqueta="Desde" error={errores.disponibleDesde}>
              <input id="sv-desde" type="date" className="control" value={form.disponibleDesde} onChange={(e) => cambiar('disponibleDesde', e.target.value)} />
            </CampoForm>
            <CampoForm id="sv-hasta" etiqueta="Hasta" error={errores.disponibleHasta}>
              <input id="sv-hasta" type="date" className="control" min={form.disponibleDesde || undefined} value={form.disponibleHasta} onChange={(e) => cambiar('disponibleHasta', e.target.value)} />
            </CampoForm>
          </div>
        </fieldset>

        <label className="interruptor">
          <input type="checkbox" checked={form.activo} onChange={(e) => cambiar('activo', e.target.checked)} />
          <span className="interruptor__pista" aria-hidden="true" />
          <span>
            <strong>Disponible para reservar</strong>
            <small>Si lo apagas, deja de aparecer pero se conserva su historial.</small>
          </span>
        </label>

        <Alerta>{error}</Alerta>

        <div className="formulario__acciones">
          <button type="submit" className="boton" disabled={guardando}>
            {guardando ? 'Guardando…' : servicio ? 'Guardar cambios' : 'Crear servicio'}
          </button>
          <button type="button" className="boton boton--fantasma" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </form>
    </aside>
  )
}
