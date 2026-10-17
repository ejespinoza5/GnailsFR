import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { AvisosProvider } from './components/ui/Avisos'
import { RutaAdmin, RutaEquipo, RutaPrivada, RutaPublica, RutaVerificacion } from './components/Rutas'
import LayoutCliente from './components/layout/LayoutCliente'
import LayoutAdmin from './components/layout/LayoutAdmin'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Recuperar from './pages/Recuperar'
import Restablecer from './pages/Restablecer'
import Cuenta from './pages/Cuenta'
import Verificar from './pages/Verificar'
import Landing from './pages/Landing'
import PaginaWeb from './pages/admin/PaginaWeb'
import Opiniones from './pages/admin/Opiniones'
import Notificaciones from './pages/admin/Notificaciones'
import Reservar from './pages/cliente/Reservar'
import MisTurnos from './pages/cliente/MisTurnos'
import Agenda from './pages/admin/Agenda'
import Servicios from './pages/admin/Servicios'
import Profesionales from './pages/admin/Profesionales'
import Horarios from './pages/admin/Horarios'
import Ajustes from './pages/admin/Ajustes'

export default function App() {
  return (
    <AuthProvider>
      <AvisosProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<RutaPublica><Login /></RutaPublica>} />
            <Route path="/registro" element={<RutaPublica><Registro /></RutaPublica>} />
            <Route path="/recuperar" element={<RutaPublica><Recuperar /></RutaPublica>} />
            {/* Sin RutaPublica: el enlace del correo debe funcionar aunque haya una sesión abierta */}
            <Route path="/restablecer" element={<Restablecer />} />

            <Route path="/verificar" element={<RutaVerificacion><Verificar /></RutaVerificacion>} />

            {/* Página principal pública: la ve cualquiera, con o sin sesión */}
            <Route path="/" element={<Landing />} />

            <Route element={<RutaPrivada><LayoutCliente /></RutaPrivada>}>
              <Route path="/reservar" element={<Reservar />} />
              <Route path="/mis-turnos" element={<MisTurnos />} />
              <Route path="/cuenta" element={<Cuenta />} />
            </Route>

            <Route path="/admin" element={<RutaAdmin><LayoutAdmin /></RutaAdmin>}>
              <Route index element={<Agenda />} />
              <Route path="servicios" element={<Servicios />} />
              <Route path="profesionales" element={<Profesionales />} />
              <Route path="horarios" element={<Horarios />} />
              <Route path="ajustes" element={<Ajustes />} />
              <Route path="pagina-web" element={<PaginaWeb />} />
              <Route path="opiniones" element={<Opiniones />} />
              <Route path="promociones" element={<Notificaciones />} />
              <Route path="cuenta" element={<Cuenta />} />
            </Route>

            {/* Profesionales con acceso: su agenda y su cuenta */}
            <Route path="/equipo" element={<RutaEquipo><LayoutAdmin modo="equipo" /></RutaEquipo>}>
              <Route index element={<Agenda />} />
              <Route path="cuenta" element={<Cuenta />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AvisosProvider>
    </AuthProvider>
  )
}
