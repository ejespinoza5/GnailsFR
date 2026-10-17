import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Clock, MapPin, Menu, Navigation, Phone, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { sitioService, mapas } from '../services/sitio.service'
import { useCarga } from '../hooks/useCarga'
import { DIAS_SEMANA, diaCorto, diaSemana, duracionBonita, horaBonita, hoyISO, numeroDia, precioTexto, sumarDias } from '../utils/fechas'
import Marca from '../components/Marca'
import Loader from '../components/loader/Loader'
import Galeria from '../components/landing/Galeria'
import { Estrellas } from '../components/ui/Estrellas'
import '../styles/landing.css'

const SECCIONES = [
  { id: 'servicios', texto: 'Servicios' },
  { id: 'trabajos', texto: 'Trabajos' },
  { id: 'opiniones', texto: 'Opiniones' },
  { id: 'ubicacion', texto: 'Ubicación' },
]

const fFecha = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })
const ANIO = new Date().getFullYear()

export default function Landing() {
  const { datos, cargando, error, recargar } = useCarga(() => sitioService.landing(), [])

  if (cargando && !datos) return <Loader variante="pantalla" mensaje="Cargando…" />
  if (error && !datos) {
    return (
      <div className="landing-error">
        <Marca grande />
        <p>No pudimos cargar la página. Revisa tu conexión.</p>
        <button type="button" className="boton" onClick={() => recargar()}>
          Reintentar
        </button>
      </div>
    )
  }

  const { sitio, portada, galeria, servicios, horario, resenas, proximosTurnos } = datos
  const hayUbicacion = sitio.latitud !== null && sitio.longitud !== null

  return (
    <div className="landing">
      <Navegacion secciones={SECCIONES.filter((s) => (s.id === 'trabajos' ? galeria.length : s.id === 'ubicacion' ? hayUbicacion : true))} />

      <main>
        <Portada sitio={sitio} portada={portada} proximos={proximosTurnos} hayGaleria={galeria.length > 0} />
        {servicios.length > 0 && <Servicios servicios={servicios} />}
        {galeria.length > 0 && (
          <section id="trabajos" className="seccion-landing seccion-landing--trabajos" aria-labelledby="t-trabajos">
            <div className="landing__ancho">
              <header className="seccion-landing__cabecera">
                <h2 id="t-trabajos">Nuestros trabajos</h2>
                <p>Cada diseño se hace a mano en el estudio. Toca una foto para verla completa.</p>
              </header>
              <Galeria fotos={galeria} />
            </div>
          </section>
        )}
        <Opiniones resenas={resenas} />
        {hayUbicacion && <Ubicacion sitio={sitio} horario={horario} />}
        <Cierre />
      </main>

      <Pie sitio={sitio} hayUbicacion={hayUbicacion} />
    </div>
  )
}

/* ------------------------------------------------------------------ Navegación */

function Navegacion({ secciones }) {
  const { usuario } = useAuth()
  const [solida, setSolida] = useState(false)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    const revisar = () => setSolida(window.scrollY > 40)
    revisar()
    window.addEventListener('scroll', revisar, { passive: true })
    return () => window.removeEventListener('scroll', revisar)
  }, [])

  const cuenta = usuario
    ? {
        a: { admin: '/admin', profesional: '/equipo' }[usuario.rol] ?? '/mis-turnos',
        texto: { admin: 'Panel', profesional: 'Mi agenda' }[usuario.rol] ?? 'Mis turnos',
      }
    : { a: '/login', texto: 'Iniciar sesión' }

  return (
    <header className={`nav-landing${solida || menu ? ' nav-landing--solida' : ''}`}>
      <div className="nav-landing__interior">
        <a href="#inicio" className="nav-landing__marca" aria-label="Geovys Nails, inicio">
          <Marca />
        </a>
        <nav className={`nav-landing__enlaces${menu ? ' nav-landing__enlaces--abierto' : ''}`} aria-label="Secciones">
          {secciones.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setMenu(false)}>
              {s.texto}
            </a>
          ))}
          <Link to={cuenta.a} className="nav-landing__cuenta">
            {cuenta.texto}
          </Link>
        </nav>
        <Link to="/reservar" className="boton boton--sm nav-landing__reservar">
          Reservar
        </Link>
        <button
          type="button"
          className="nav-landing__menu"
          aria-expanded={menu}
          aria-label={menu ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenu((m) => !m)}
        >
          {menu ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ Portada */

function etiquetaDia(fecha) {
  const hoy = hoyISO()
  if (fecha === hoy) return 'Hoy'
  if (fecha === sumarDias(hoy, 1)) return 'Mañana'
  return `${diaCorto(fecha)} ${numeroDia(fecha)}`
}

function Portada({ sitio, portada, proximos, hayGaleria }) {
  const turnos = proximos?.turnos ?? []
  return (
    <section id="inicio" className={`portada${portada ? '' : ' portada--sin-foto'}`} aria-labelledby="t-portada">
      {portada && (
        <img className="portada__foto" src={portada.url} alt="" width={portada.ancho} height={portada.alto} fetchPriority="high" decoding="async" />
      )}
      <div className="portada__velo" aria-hidden="true" />

      <div className="portada__contenido landing__ancho">
        <h1 id="t-portada" className="portada__titulo">
          {sitio.heroTitulo}
        </h1>
        {sitio.heroSubtitulo && <p className="portada__subtitulo">{sitio.heroSubtitulo}</p>}
        <div className="portada__acciones">
          <Link to="/reservar" className="boton boton--grande">
            Reservar mi cita <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {hayGaleria && (
            <a href="#trabajos" className="boton boton--claro boton--grande">
              Ver trabajos
            </a>
          )}
        </div>
      </div>

      {turnos.length > 0 && (
        <div className="cinta-turnos">
          <div className="cinta-turnos__interior landing__ancho">
            <p className="cinta-turnos__titulo">
              <Clock size={16} aria-hidden="true" />
              <span>
                Próximos turnos libres <small>· {proximos.servicio.nombre}</small>
              </span>
            </p>
            <ul className="cinta-turnos__lista">
              {turnos.map((t) => (
                <li key={`${t.fecha}-${t.hora}`}>
                  <Link to="/reservar" className="cinta-turnos__turno">
                    <span>{etiquetaDia(t.fecha)}</span>
                    <strong>{horaBonita(t.hora)}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ Servicios: carta de precios */

function Servicios({ servicios }) {
  return (
    <section id="servicios" className="seccion-landing" aria-labelledby="t-servicios">
      <div className="landing__ancho carta">
        <header className="seccion-landing__cabecera carta__cabecera">
          <h2 id="t-servicios">Servicios</h2>
          <p>Precios por servicio. La duración es aproximada y ya incluye el tiempo para que tus uñas queden perfectas.</p>
          <Link to="/reservar" className="enlace-flecha">
            Elegir y reservar <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </header>
        <ul className="carta__lista">
          {servicios.map((s) => (
            <li key={s.id} className="carta__item">
              <div className="carta__fila">
                <h3>{s.nombre}</h3>
                <span className="carta__puntos" aria-hidden="true" />
                <span className="carta__precio">
                  {s.precioTipo === 'desde' && s.precio !== null && <small>desde</small>}
                  {s.precioTipo === 'desde' && s.precio !== null ? precioTexto({ precio: s.precio }) : precioTexto(s, 'Consultar')}
                </span>
              </div>
              <p className="carta__detalle">
                {duracionBonita(s.duracionMin)}
                {s.descripcion && ` · ${s.descripcion}`}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Opiniones */

function Opiniones({ resenas }) {
  return (
    <section id="opiniones" className="seccion-landing seccion-landing--oscura" aria-labelledby="t-opiniones">
      <div className="landing__ancho opiniones">
        <header className="opiniones__resumen">
          <h2 id="t-opiniones">Lo que dicen nuestras clientas</h2>
          {resenas.total > 0 ? (
            <>
              <p className="opiniones__promedio">
                <span className="opiniones__numero">{resenas.promedio.toFixed(1).replace('.', ',')}</span>
                <Estrellas valor={resenas.promedio} tamano={22} />
              </p>
              <p className="opiniones__total">
                {resenas.total} opinión{resenas.total === 1 ? '' : 'es'} de clientas que ya vinieron al estudio
              </p>
            </>
          ) : (
            <p className="opiniones__total">Las opiniones aparecerán aquí después de las primeras citas.</p>
          )}
          <p className="opiniones__nota">Solo pueden opinar clientas con una cita completada.</p>
        </header>

        {resenas.lista.length > 0 && (
          <ul className="opiniones__lista" aria-label="Opiniones">
            {resenas.lista.map((r) => (
              <li key={r.id} className="opinion">
                <Estrellas valor={r.calificacion} tamano={16} />
                {r.comentario ? <blockquote className="opinion__texto">{r.comentario}</blockquote> : <p className="opinion__texto opinion__texto--solo">Calificó con {r.calificacion} estrellas</p>}
                <footer className="opinion__autora">
                  <span className="opinion__inicial" aria-hidden="true">
                    {r.nombre[0]}
                  </span>
                  <span>
                    <strong>{r.nombre}</strong>
                    <small>{fFecha.format(new Date(r.fecha))}</small>
                  </span>
                </footer>
                {r.respuesta && (
                  <div className="opinion__respuesta">
                    <strong>Respuesta de Geovys Nails</strong>
                    <p>{r.respuesta}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Ubicación y horario */

function Ubicacion({ sitio, horario }) {
  const hoy = diaSemana(hoyISO())
  const porDia = new Map(horario.map((h) => [h.diaSemana, h]))
  return (
    <section id="ubicacion" className="seccion-landing" aria-labelledby="t-ubicacion">
      <div className="landing__ancho ubicacion">
        <div className="ubicacion__mapa">
          <iframe
            title="Ubicación de Geovys Nails en el mapa"
            src={mapas.embebido(sitio.latitud, sitio.longitud)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        <div className="ubicacion__info">
          <h2 id="t-ubicacion">Visítanos</h2>
          {sitio.direccion && (
            <p className="ubicacion__direccion">
              <MapPin size={20} aria-hidden="true" />
              <span>
                {sitio.direccion}
                {sitio.referencia && <small>{sitio.referencia}</small>}
              </span>
            </p>
          )}
          <div className="ubicacion__acciones">
            <a className="boton" href={mapas.comoLlegar(sitio.latitud, sitio.longitud)} target="_blank" rel="noopener noreferrer">
              <Navigation size={17} aria-hidden="true" /> Cómo llegar
            </a>
            {sitio.whatsapp && (
              <a className="boton boton--secundario" href={`https://wa.me/${sitio.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Phone size={17} aria-hidden="true" /> WhatsApp
              </a>
            )}
          </div>

          <h3 className="ubicacion__subtitulo">Horario de atención</h3>
          <dl className="horario-lista">
            {DIAS_SEMANA.map((d) => {
              const h = porDia.get(d.valor)
              return (
                <div key={d.valor} className={d.valor === hoy ? 'horario-lista__hoy' : ''}>
                  <dt>
                    {d.nombre}
                    {d.valor === hoy && <span className="sr-only"> (hoy)</span>}
                  </dt>
                  <dd>{h?.abierto ? `${horaBonita(h.apertura)} – ${horaBonita(h.cierre)}` : 'Cerrado'}</dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </section>
  )
}

function Cierre() {
  return (
    <section className="cierre" aria-labelledby="t-cierre">
      <div className="landing__ancho cierre__interior">
        <h2 id="t-cierre">Tu próxima cita está a un minuto</h2>
        <p>Elige el servicio, la profesional y la hora que te quede mejor. Te confirmamos al instante.</p>
        <Link to="/reservar" className="boton boton--grande">
          Reservar ahora <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Pie */

function IconoInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconoFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
    </svg>
  )
}

function Pie({ sitio, hayUbicacion }) {
  return (
    <footer className="pie">
      <div className="landing__ancho pie__interior">
        <div className="pie__marca">
          <Marca />
          <p>Estudio de uñas · Manicure, pedicure y diseño a mano.</p>
        </div>

        {hayUbicacion && (
          <div className="pie__bloque">
            <h2>Dónde estamos</h2>
            {sitio.direccion && <p>{sitio.direccion}</p>}
            <a href={mapas.comoLlegar(sitio.latitud, sitio.longitud)} target="_blank" rel="noopener noreferrer" className="pie__enlace">
              <MapPin size={15} aria-hidden="true" /> Abrir en Google Maps
            </a>
          </div>
        )}

        <div className="pie__bloque">
          <h2>Contacto</h2>
          {sitio.whatsapp && (
            <a href={`https://wa.me/${sitio.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="pie__enlace">
              <Phone size={15} aria-hidden="true" /> {sitio.whatsapp}
            </a>
          )}
          {sitio.instagram && (
            <a href={`https://instagram.com/${sitio.instagram}`} target="_blank" rel="noopener noreferrer" className="pie__enlace">
              <IconoInstagram /> @{sitio.instagram}
            </a>
          )}
          {sitio.facebook && (
            <a href={sitio.facebook} target="_blank" rel="noopener noreferrer" className="pie__enlace">
              <IconoFacebook /> Facebook
            </a>
          )}
          <Link to="/reservar" className="pie__enlace">
            <ArrowRight size={15} aria-hidden="true" /> Reservar en línea
          </Link>
        </div>
      </div>
      <p className="pie__legal landing__ancho">© {ANIO} Geovys Nails · Geovanna Espinoza</p>
    </footer>
  )
}
