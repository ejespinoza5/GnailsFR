import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import Cargando from './Cargando'

/** Pantalla de inicio según el rol: la dueña va a su panel, la clienta a reservar. */
const INICIO = { admin: '/admin', profesional: '/equipo' }
const inicioSegunRol = (usuario) => INICIO[usuario?.rol] ?? '/reservar'

/** Solo para personas con sesión iniciada y el correo confirmado. */
export function RutaPrivada({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!usuario.emailVerificado) return <Navigate to="/verificar" replace />
  return children
}

/** La pantalla del código: solo con sesión y mientras el correo no esté confirmado. */
export function RutaVerificacion({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.emailVerificado) return <Navigate to={inicioSegunRol(usuario)} replace />
  return children
}

/** Solo para la administradora. Si una clienta entra a /admin, vuelve a su pantalla. */
export function RutaAdmin({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!usuario.emailVerificado) return <Navigate to="/verificar" replace />
  if (usuario.rol !== 'admin') return <Navigate to={inicioSegunRol(usuario)} replace />
  return children
}

/** Agenda de una profesional con acceso a la app (solo ve lo suyo; lo garantiza el backend). */
export function RutaEquipo({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (!usuario.emailVerificado) return <Navigate to="/verificar" replace />
  if (usuario.rol !== 'profesional') return <Navigate to={inicioSegunRol(usuario)} replace />
  return children
}

/** Login y registro: si ya hay sesión, no tiene sentido mostrarlos. */
export function RutaPublica({ children }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()
  if (cargando) return <Cargando />
  if (usuario) {
    const desde = location.state?.desde
    const inicio = inicioSegunRol(usuario)
    // La dueña y la profesional empiezan siempre en su panel (aunque hayan tocado «Reservar»
    // en la página principal); solo vuelven a donde iban si era una pantalla de su panel.
    // Una clienta nunca entra a /admin ni a /equipo.
    const esEquipo = usuario.rol in INICIO
    const destino = desde && (esEquipo ? desde.startsWith(inicio) : !desde.startsWith('/admin') && !desde.startsWith('/equipo')) ? desde : inicio
    return <Navigate to={destino} replace />
  }
  return children
}

