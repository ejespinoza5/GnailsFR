import { Link, NavLink, Outlet } from 'react-router'
import { ArrowLeft, CalendarHeart, CalendarPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Marca from '../Marca'
import MenuUsuario from './MenuUsuario'
import Campanita from '../notificaciones/Campanita'

const PANEL = { admin: { a: '/admin', texto: 'Volver al panel' }, profesional: { a: '/equipo', texto: 'Volver a mi agenda' } }

export default function LayoutCliente() {
  const { usuario } = useAuth()
  const panel = PANEL[usuario?.rol]
  return (
    <div className="cliente">
      <header className="barra">
        <div className="barra__interior">
          <NavLink to="/" className="barra__marca" aria-label="Geovys Nails, página principal">
            <Marca />
          </NavLink>
          <nav className="pestanas" aria-label="Secciones">
            <NavLink to="/reservar" className="pestana">
              <CalendarPlus size={18} aria-hidden="true" /> Reservar
            </NavLink>
            <NavLink to="/mis-turnos" className="pestana">
              <CalendarHeart size={18} aria-hidden="true" /> Mis turnos
            </NavLink>
          </nav>
          {panel && (
            <Link to={panel.a} className="volver-panel">
              <ArrowLeft size={16} aria-hidden="true" /> <span>{panel.texto}</span>
            </Link>
          )}
          <Campanita />
          <MenuUsuario />
        </div>
      </header>
      <main className="cliente__contenido">
        <Outlet />
      </main>
    </div>
  )
}
