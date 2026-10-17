import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ExternalLink, ImagePlus, Link2, LocateFixed, Trash2, Upload } from 'lucide-react'
import { sitioAdminService, mapas } from '../../services/sitio.service'
import { useCarga } from '../../hooks/useCarga'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import CampoForm from '../../components/ui/CampoForm'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import { useAvisos } from '../../components/ui/Avisos'

const PESTANAS = [
  { id: 'portada', texto: 'Portada' },
  { id: 'trabajos', texto: 'Trabajos' },
  { id: 'ubicacion', texto: 'Ubicación y contacto' },
]
const MAX_FOTO = 10 * 1024 * 1024

export default function PaginaWeb() {
  const { datos, cargando, error, recargar } = useCarga(() => sitioAdminService.contenido(), [])
  const [contenido, setContenido] = useState(null)
  const [pestana, setPestana] = useState('portada')
  const actual = contenido ?? datos

  return (
    <div className="pagina-admin pagina-web">
      <Encabezado
        titulo="Página web"
        acciones={
          <a href="/" target="_blank" rel="noopener noreferrer" className="boton boton--secundario boton--sm">
            <ExternalLink size={16} aria-hidden="true" /> Ver la página
          </a>
        }
      >
        Lo que ven tus clientas en la página principal: la foto de portada, tus trabajos y dónde encontrarte.
      </Encabezado>

      <div className="segmentos" role="tablist" aria-label="Secciones de la página">
        {PESTANAS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={pestana === p.id} className="segmento" onClick={() => setPestana(p.id)}>
            {p.texto}
            {p.id === 'trabajos' && actual && <span className="contador">{actual.galeria.length}</span>}
          </button>
        ))}
      </div>

      {cargando && !actual ? (
        <Loader mensaje="Cargando la página…" />
      ) : error && !actual ? (
        <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>{error.message}</Alerta>
      ) : pestana === 'portada' ? (
        <Portada contenido={actual} onCambio={setContenido} />
      ) : pestana === 'trabajos' ? (
        <Trabajos contenido={actual} onCambio={setContenido} />
      ) : (
        <Ubicacion key="ubicacion" sitio={actual.sitio} onGuardado={(sitio) => setContenido({ ...actual, sitio })} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Portada */

function Portada({ contenido, onCambio }) {
  const [form, setForm] = useState({ heroTitulo: contenido.sitio.heroTitulo, heroSubtitulo: contenido.sitio.heroSubtitulo })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const archivo = useRef(null)
  const avisar = useAvisos()

  const sinCambios = form.heroTitulo === contenido.sitio.heroTitulo && form.heroSubtitulo === contenido.sitio.heroSubtitulo

  const subir = async (e) => {
    const foto = e.target.files?.[0]
    e.target.value = ''
    if (!foto) return
    if (foto.size > MAX_FOTO) return setErrores({ foto: 'La foto pesa más de 10 MB.' })
    setSubiendo(true)
    setErrores({})
    try {
      onCambio(await sitioAdminService.subirPortada(foto))
      avisar('Foto de portada actualizada')
    } catch (err) {
      setErrores({ foto: err.campos?.foto ?? err.message })
    } finally {
      setSubiendo(false)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    try {
      const { sitio } = await sitioAdminService.guardarTextos(form)
      onCambio({ ...contenido, sitio })
      avisar('Textos de portada guardados')
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="editor-portada">
      {/* Vista previa en vivo: la foto con el mismo velo oscuro y los textos que verá la clienta */}
      <div className="vista-portada" aria-label="Vista previa de la portada">
        {contenido.portada && <img src={contenido.portada.url} alt="" />}
        <div className="vista-portada__velo" />
        <div className="vista-portada__texto">
          <strong>{form.heroTitulo || 'Tu título'}</strong>
          {form.heroSubtitulo && <span>{form.heroSubtitulo}</span>}
          <em>Reservar mi cita</em>
        </div>
        {subiendo && (
          <div className="vista-portada__cargando">
            <Loader mensaje="Optimizando la foto…" />
          </div>
        )}
      </div>

      <div className="seccion">
        <h2 className="seccion__titulo">Foto de portada</h2>
        <p className="seccion__texto">
          Una foto horizontal y luminosa de tu trabajo o del estudio. Le ponemos un velo oscuro para que el texto se lea siempre. Mínimo 1600 px de ancho, hasta 10 MB.
        </p>
        <div className="panel__acciones">
          <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={subir} />
          <button type="button" className="boton boton--sm" onClick={() => archivo.current.click()} disabled={subiendo}>
            <Upload size={16} aria-hidden="true" /> {contenido.portada ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {contenido.portada && (
            <BotonConfirmar
              className="boton boton--fantasma-peligro boton--sm"
              pregunta="¿Quitar la foto?"
              confirmar="Quitar"
              onConfirmar={async () => {
                onCambio(await sitioAdminService.quitarPortada())
                avisar('Foto de portada quitada')
              }}
            >
              <Trash2 size={15} aria-hidden="true" /> Quitar
            </BotonConfirmar>
          )}
        </div>
        <Alerta>{errores.foto}</Alerta>

        <form className="formulario" onSubmit={guardar} noValidate>
          <CampoForm id="pt-titulo" etiqueta="Título" error={errores.heroTitulo} ayuda="Corto y con fuerza: se ve en letras grandes.">
            <input id="pt-titulo" className="control" maxLength={120} value={form.heroTitulo} onChange={(e) => setForm({ ...form, heroTitulo: e.target.value })} />
          </CampoForm>
          <CampoForm id="pt-sub" etiqueta="Texto debajo del título" opcional error={errores.heroSubtitulo}>
            <textarea id="pt-sub" className="control" rows={2} maxLength={240} value={form.heroSubtitulo} onChange={(e) => setForm({ ...form, heroSubtitulo: e.target.value })} />
          </CampoForm>
          <Alerta>{errores.general}</Alerta>
          <div className="formulario__acciones">
            <button type="submit" className="boton" disabled={guardando || sinCambios}>
              {guardando ? 'Guardando…' : 'Guardar textos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Galería de trabajos */

function Trabajos({ contenido, onCambio }) {
  const [subiendo, setSubiendo] = useState(null) // { actual, total }
  const [error, setError] = useState('')
  const archivo = useRef(null)
  const avisar = useAvisos()
  const fotos = contenido.galeria

  const subir = async (e) => {
    const lista = [...(e.target.files ?? [])]
    e.target.value = ''
    if (!lista.length) return
    setError('')
    let ultimo = contenido
    let fallidas = 0
    for (let i = 0; i < lista.length; i++) {
      setSubiendo({ actual: i + 1, total: lista.length })
      if (lista[i].size > MAX_FOTO) {
        fallidas++
        continue
      }
      try {
        ultimo = await sitioAdminService.subirFoto(lista[i])
        onCambio(ultimo)
      } catch (err) {
        fallidas++
        setError(err.message)
      }
    }
    setSubiendo(null)
    const subidas = lista.length - fallidas
    if (subidas) avisar(`${subidas} foto${subidas === 1 ? '' : 's'} agregada${subidas === 1 ? '' : 's'}`)
    if (fallidas) setError(`${fallidas} foto${fallidas === 1 ? '' : 's'} no se pudo subir (máx. 10 MB, JPG, PNG o WebP).`)
  }

  const mover = async (indice, paso) => {
    const ids = fotos.map((f) => f.id)
    const destino = indice + paso
    ;[ids[indice], ids[destino]] = [ids[destino], ids[indice]]
    try {
      onCambio(await sitioAdminService.ordenar(ids))
    } catch (err) {
      setError(err.message)
    }
  }

  const actualizar = async (foto, cambios) => {
    try {
      onCambio(await sitioAdminService.actualizarFoto(foto.id, { titulo: foto.titulo, visible: foto.visible, ...cambios }))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="trabajos-admin">
      <div className="trabajos-admin__barra">
        <p className="seccion__texto">
          Se muestran en la página en este orden. Puedes subir varias a la vez; las optimizamos para que carguen rápido. {fotos.length} de 60.
        </p>
        <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={subir} />
        <button type="button" className="boton boton--sm" onClick={() => archivo.current.click()} disabled={Boolean(subiendo)}>
          <ImagePlus size={16} aria-hidden="true" /> Agregar fotos
        </button>
      </div>
      <Alerta>{error}</Alerta>
      {subiendo && <Loader mensaje={`Subiendo ${subiendo.actual} de ${subiendo.total}…`} />}

      {fotos.length === 0 && !subiendo ? (
        <Vacio icono={ImagePlus} titulo="Muestra tus mejores trabajos" accion={<button type="button" className="boton" onClick={() => archivo.current.click()}>Agregar fotos</button>}>
          Las fotos aparecerán en la sección «Nuestros trabajos» de la página principal.
        </Vacio>
      ) : (
        <ul className="fotos-admin">
          {fotos.map((f, i) => (
            <li key={f.id} className={`foto-admin${f.visible ? '' : ' foto-admin--oculta'}`}>
              <div className="foto-admin__imagen">
                <img src={f.miniatura} alt={f.titulo ?? ''} loading="lazy" />
                {!f.visible && <span className="foto-admin__estado">Oculta</span>}
              </div>
              <label className="sr-only" htmlFor={`ft-${f.id}`}>
                Título de la foto {i + 1}
              </label>
              <input
                id={`ft-${f.id}`}
                className="control foto-admin__titulo"
                placeholder="Título (opcional)"
                maxLength={100}
                defaultValue={f.titulo ?? ''}
                onBlur={(e) => e.target.value.trim() !== (f.titulo ?? '') && actualizar(f, { titulo: e.target.value.trim() || null })}
              />
              <div className="foto-admin__acciones">
                <button type="button" className="boton-icono" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover antes">
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <button type="button" className="boton-icono" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} aria-label="Mover después">
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="boton-icono"
                  onClick={() => actualizar(f, { visible: !f.visible })}
                  aria-label={f.visible ? 'Ocultar de la página' : 'Mostrar en la página'}
                  title={f.visible ? 'Ocultar de la página' : 'Mostrar en la página'}
                >
                  {f.visible ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
                </button>
                <BotonConfirmar
                  className="boton-icono boton-icono--peligro"
                  pregunta="¿Eliminar?"
                  confirmar="Sí"
                  onConfirmar={async () => {
                    onCambio(await sitioAdminService.eliminarFoto(f.id))
                    avisar('Foto eliminada')
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span className="sr-only">Eliminar foto</span>
                </BotonConfirmar>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ Ubicación y contacto */

const METODOS = [
  { id: 'enlace', texto: 'Enlace de Google Maps', icono: Link2 },
  { id: 'gps', texto: 'Mi ubicación actual', icono: LocateFixed },
  { id: 'coordenadas', texto: 'Escribir coordenadas' },
]

function Ubicacion({ sitio, onGuardado }) {
  const [form, setForm] = useState({
    direccion: sitio.direccion ?? '',
    referencia: sitio.referencia ?? '',
    latitud: sitio.latitud ?? '',
    longitud: sitio.longitud ?? '',
    mapsUrl: sitio.mapsUrl ?? '',
    whatsapp: sitio.whatsapp ?? '',
    instagram: sitio.instagram ?? '',
    facebook: sitio.facebook ?? '',
  })
  const [metodo, setMetodo] = useState('enlace')
  const [errores, setErrores] = useState({})
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState('')
  const avisar = useAvisos()

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  const lat = Number(form.latitud)
  const lng = Number(form.longitud)
  const coordsValidas = form.latitud !== '' && form.longitud !== '' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

  const desdeEnlace = async () => {
    setBuscando(true)
    setErrores({})
    setAviso('')
    try {
      const r = await sitioAdminService.resolverMapa(form.mapsUrl)
      setForm((f) => ({ ...f, latitud: r.latitud, longitud: r.longitud, direccion: f.direccion || r.nombre || '' }))
      setAviso(`Encontramos el punto: ${r.latitud}, ${r.longitud}. Revisa el mapa y guarda.`)
    } catch (err) {
      setErrores({ mapsUrl: err.campos?.mapsUrl ?? err.message })
    } finally {
      setBuscando(false)
    }
  }

  const desdeGps = () => {
    setErrores({})
    setAviso('')
    if (!navigator.geolocation) return setErrores({ gps: 'Tu navegador no permite obtener la ubicación.' })
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setForm((f) => ({ ...f, latitud: Number(latitude.toFixed(6)), longitud: Number(longitude.toFixed(6)) }))
        setAviso(`Ubicación obtenida con una precisión de unos ${Math.round(accuracy)} m. Revisa el mapa y guarda.`)
        setBuscando(false)
      },
      (err) => {
        setErrores({
          gps:
            err.code === err.PERMISSION_DENIED
              ? 'No diste permiso para usar tu ubicación. Actívalo en el candado de la barra de direcciones.'
              : 'No pudimos obtener tu ubicación. Prueba con el enlace de Google Maps.',
        })
        setBuscando(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    try {
      const { sitio: s } = await sitioAdminService.guardarUbicacion({
        ...form,
        latitud: form.latitud === '' ? null : Number(form.latitud),
        longitud: form.longitud === '' ? null : Number(form.longitud),
      })
      onGuardado(s)
      setAviso('')
      avisar('Ubicación y contacto guardados')
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="editor-ubicacion" onSubmit={guardar} noValidate>
      <div className="seccion">
        <h2 className="seccion__titulo">Ubicación del local</h2>
        <p className="seccion__texto">Elige cómo marcar el punto en el mapa. Se muestra en la página y en el pie, con el botón «Cómo llegar».</p>

        <div className="segmentos segmentos--compacto metodos" role="tablist" aria-label="Cómo marcar la ubicación">
          {METODOS.map((m) => (
            <button key={m.id} type="button" role="tab" aria-selected={metodo === m.id} className="segmento" onClick={() => setMetodo(m.id)}>
              {m.texto}
            </button>
          ))}
        </div>

        {metodo === 'enlace' && (
          <CampoForm id="ub-url" etiqueta="Enlace de Google Maps" error={errores.mapsUrl} ayuda="En Google Maps: busca tu local → Compartir → Copiar enlace, y pégalo aquí.">
            <div className="fila-boton">
              <input id="ub-url" className="control" inputMode="url" placeholder="https://maps.app.goo.gl/…" value={form.mapsUrl} onChange={(e) => cambiar('mapsUrl', e.target.value)} />
              <button type="button" className="boton boton--secundario" onClick={desdeEnlace} disabled={buscando || form.mapsUrl.trim().length < 10}>
                Obtener ubicación
              </button>
            </div>
          </CampoForm>
        )}
        {metodo === 'gps' && (
          <div className="campo">
            <p className="campo__ayuda">Hazlo estando dentro del local, desde el celular: usa el GPS para marcar el punto exacto.</p>
            <button type="button" className="boton boton--secundario" onClick={desdeGps} disabled={buscando}>
              <LocateFixed size={16} aria-hidden="true" /> Usar mi ubicación actual
            </button>
            {errores.gps && <p className="campo__error">{errores.gps}</p>}
          </div>
        )}

        <div className="fila-campos">
          <CampoForm id="ub-lat" etiqueta="Latitud" error={errores.latitud}>
            <input id="ub-lat" className="control" inputMode="decimal" placeholder="-0.225120" value={form.latitud} onChange={(e) => cambiar('latitud', e.target.value)} readOnly={metodo !== 'coordenadas'} />
          </CampoForm>
          <CampoForm id="ub-lng" etiqueta="Longitud" error={errores.longitud}>
            <input id="ub-lng" className="control" inputMode="decimal" placeholder="-79.161901" value={form.longitud} onChange={(e) => cambiar('longitud', e.target.value)} readOnly={metodo !== 'coordenadas'} />
          </CampoForm>
        </div>

        {buscando && <Loader mensaje="Buscando la ubicación…" />}
        {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

        <div className="mapa-previo">
          {coordsValidas ? (
            <iframe title="Vista previa del mapa" src={mapas.embebido(lat, lng)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <p>Aquí verás el mapa cuando marques la ubicación.</p>
          )}
        </div>

        <CampoForm id="ub-dir" etiqueta="Dirección" opcional error={errores.direccion}>
          <input id="ub-dir" className="control" maxLength={200} placeholder="Av. Quito y Río Toachi, Santo Domingo" value={form.direccion} onChange={(e) => cambiar('direccion', e.target.value)} />
        </CampoForm>
        <CampoForm id="ub-ref" etiqueta="Referencia" opcional error={errores.referencia}>
          <input id="ub-ref" className="control" maxLength={200} placeholder="Frente al parque, segundo piso" value={form.referencia} onChange={(e) => cambiar('referencia', e.target.value)} />
        </CampoForm>
      </div>

      <div className="seccion">
        <h2 className="seccion__titulo">Contacto y redes</h2>
        <p className="seccion__texto">Aparecen en la sección de ubicación y en el pie de la página. Deja vacío lo que no uses.</p>
        <div className="formulario">
          <CampoForm id="ub-wa" etiqueta="WhatsApp" opcional error={errores.whatsapp}>
            <input id="ub-wa" className="control" type="tel" inputMode="tel" placeholder="+593 99 123 4567" value={form.whatsapp} onChange={(e) => cambiar('whatsapp', e.target.value)} />
          </CampoForm>
          <CampoForm id="ub-ig" etiqueta="Instagram" opcional error={errores.instagram}>
            <input id="ub-ig" className="control" placeholder="@geovysnails" value={form.instagram} onChange={(e) => cambiar('instagram', e.target.value)} />
          </CampoForm>
          <CampoForm id="ub-fb" etiqueta="Facebook (enlace)" opcional error={errores.facebook}>
            <input id="ub-fb" className="control" inputMode="url" placeholder="https://facebook.com/…" value={form.facebook} onChange={(e) => cambiar('facebook', e.target.value)} />
          </CampoForm>
          <Alerta>{errores.general}</Alerta>
          <div className="formulario__acciones">
            <button type="submit" className="boton" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar ubicación y contacto'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
