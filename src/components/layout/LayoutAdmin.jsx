import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import {
  CalendarDays,
  Clock,
  Gem,
  Globe,
  Menu,
  Megaphone,
  MessageSquareQuote,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Store,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'
import Marca from '../Marca'
import MenuUsuario from './MenuUsuario'
import Campanita from '../notificaciones/Campanita'

const SECCIONES = [
  { a: '/admin', texto: 'Agenda', icono: CalendarDays, fin: true },
  { a: '/admin/servicios', texto: 'Servicios', icono: Gem },
  { a: '/admin/profesionales', texto: 'Profesionales', icono: Users },
  { a: '/admin/horarios', texto: 'Horarios', icono: Clock },
  { a: '/admin/ajustes', texto: 'Reglas de reserva', icono: SlidersHorizontal },
  { a: '/admin/pagina-web', texto: 'Página web', icono: Globe },
  { a: '/admin/opiniones', texto: 'Opiniones', icono: MessageSquareQuote },
  { a: '/admin/promociones', texto: 'Promociones', icono: Megaphone },
]

const SECCIONES_EQUIPO = [
  { a: '/equipo', texto: 'Mi agenda', icono: CalendarDays, fin: true },
  { a: '/equipo/cuenta', texto: 'Mi cuenta', icono: UserRoundCog },
]

// Preferencia de cada persona en su navegador (si no se puede guardar, el menú arranca expandido).
const CLAVE = 'gn_menu_encogido'
const leerPreferencia = () => {
  try {
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

/** modo "admin": la dueña con todo el panel · modo "equipo": una profesional con su agenda. */
export default function LayoutAdmin({ modo = 'admin' }) {
  const secciones = modo === 'equipo' ? SECCIONES_EQUIPO : SECCIONES
  const [encogido, setEncogido] = useState(leerPreferencia)
  const [abiertoMovil, setAbiertoMovil] = useState(false)

  const alternar = () => {
    setEncogido((e) => {
      try {
        localStorage.setItem(CLAVE, e ? '0' : '1')
      } catch {
        /* sin almacenamiento: solo dura esta visita */
      }
      return !e
    })
  }
  const cerrarMovil = () => setAbiertoMovil(false)

  return (
    <div className={`admin${encogido ? ' admin--encogido' : ''}`}>
      <aside className={`riel${abiertoMovil ? ' riel--abierto' : ''}`}>
        <div className="riel__cabecera">
          <NavLink to={secciones[0].a} end className="riel__marca" aria-label="Geovys Nails, inicio del panel" onClick={cerrarMovil}>
            <span className="riel__marca-completa">
              <Marca />
              <span className="riel__rol">{modo === 'equipo' ? 'Profesional' : 'Administración'}</span>
            </span>
            <span className="riel__monograma" aria-hidden="true">
              G
            </span>
          </NavLink>
          <button
            type="button"
            className="riel__menu-movil"
            aria-expanded={abiertoMovil}
            aria-controls="riel-nav"
            aria-label={abiertoMovil ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbiertoMovil((a) => !a)}
          >
            {abiertoMovil ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        <nav id="riel-nav" className="riel__nav" aria-label={modo === 'equipo' ? 'Mi panel' : 'Panel de administración'}>
          {secciones.map(({ a, texto, icono: Icono, fin }) => (
            <NavLink key={a} to={a} end={fin} className="riel__enlace" data-texto={texto} onClick={cerrarMovil}>
              <Icono size={19} strokeWidth={1.75} aria-hidden="true" />
              <span className="riel__texto">{texto}</span>
            </NavLink>
          ))}

          {/* La vista de clienta está disponible, pero aparte y al final: no es su pantalla principal */}
          <span className="riel__separador" aria-hidden="true" />
          <NavLink to="/reservar" className="riel__enlace riel__enlace--secundario" data-texto="Vista de clienta" onClick={cerrarMovil}>
            <Store size={19} strokeWidth={1.75} aria-hidden="true" />
            <span className="riel__texto">Vista de clienta</span>
          </NavLink>
        </nav>

        <div className="riel__pie">
          <Campanita variante="riel" />
          <MenuUsuario enAdmin modo={modo} />
          <button
            type="button"
            className="riel__plegar"
            onClick={alternar}
            aria-expanded={!encogido}
            aria-controls="riel-nav"
            data-texto={encogido ? 'Expandir menú' : 'Encoger menú'}
          >
            {encogido ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
            <span className="riel__texto">Encoger menú</span>
            {encogido && <span className="sr-only">Expandir menú</span>}
          </button>
        </div>
      </aside>

      {abiertoMovil && <button type="button" className="riel__fondo" aria-label="Cerrar menú" tabIndex={-1} onClick={cerrarMovil} />}

      <main className="admin__contenido">
        <Outlet />
      </main>
    </div>
  )
}
