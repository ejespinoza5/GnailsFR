import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, LayoutDashboard, LogOut, MonitorSmartphone, UserRoundCog } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Avatar from '../ui/Avatar'
import Loader from '../loader/Loader'

/** Avatar con menú: cambiar de panel y cerrar sesión. */
export default function MenuUsuario({ enAdmin = false, modo = 'admin' }) {
  const { usuario, logout, logoutTodas } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const raiz = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const cerrar = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !raiz.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', cerrar)
    document.addEventListener('keydown', cerrar)
    return () => {
      document.removeEventListener('pointerdown', cerrar)
      document.removeEventListener('keydown', cerrar)
    }
  }, [abierto])

  const salir = async (todas) => {
    setSaliendo(true)
    await (todas ? logoutTodas() : logout())
  }

  const primerNombre = usuario.nombre.split(' ')[0]

  return (
    <div className="menu-usuario" ref={raiz}>
      <button
        type="button"
        className="menu-usuario__boton"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => setAbierto((a) => !a)}
      >
        <Avatar nombre={usuario.nombre} url={usuario.avatarUrl} tamano={34} />
        <span className="menu-usuario__nombre">{primerNombre}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {abierto && (
        <div className="menu-usuario__panel">
          <div className="menu-usuario__cabecera">
            <strong>{usuario.nombre}</strong>
            <span>{usuario.email}</span>
          </div>
          <Link to={enAdmin ? (modo === 'equipo' ? '/equipo/cuenta' : '/admin/cuenta') : '/cuenta'} className="menu-usuario__opcion" onClick={() => setAbierto(false)}>
            <UserRoundCog size={17} aria-hidden="true" /> Mi cuenta
          </Link>
          {!enAdmin && usuario.rol === 'profesional' && (
            <Link to="/equipo" className="menu-usuario__opcion" onClick={() => setAbierto(false)}>
              <LayoutDashboard size={17} aria-hidden="true" /> Mi agenda
            </Link>
          )}
          {!enAdmin && usuario.rol === 'admin' && (
            <Link to="/admin" className="menu-usuario__opcion" onClick={() => setAbierto(false)}>
              <LayoutDashboard size={17} aria-hidden="true" /> Panel de administración
            </Link>
          )}
          <button type="button" className="menu-usuario__opcion" onClick={() => salir(false)}>
            <LogOut size={17} aria-hidden="true" /> Cerrar sesión
          </button>
          <button type="button" className="menu-usuario__opcion menu-usuario__opcion--suave" onClick={() => salir(true)}>
            <MonitorSmartphone size={17} aria-hidden="true" /> Cerrar sesión en todos mis dispositivos
          </button>
        </div>
      )}

      {saliendo && <Loader variante="superpuesto" mensaje="Cerrando sesión…" />}
    </div>
  )
}
