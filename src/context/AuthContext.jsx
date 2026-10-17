import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { onSesionExpirada } from '../api/http'
import { authService } from '../services/auth.service'
import { olvidarDispositivo, sincronizarPush } from '../push/push'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Si el refresh token ya no sirve (expiró o se cerró la sesión), se manda al login.
  useEffect(() => {
    onSesionExpirada(() => setUsuario(null))
  }, [])

  // Al abrir la app se pregunta al backend si hay sesión. Si el access token
  // venció, el cliente lo renueva automáticamente con el refresh token.
  useEffect(() => {
    authService
      .yo()
      .then((d) => {
        setUsuario(d.usuario)
        sincronizarPush()
      })
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const d = await authService.login(email, password)
    setUsuario(d.usuario)
  }, [])

  const registro = useCallback(async (nombre, email, password) => {
    const d = await authService.registro(nombre, email, password)
    setUsuario(d.usuario)
  }, [])

  const loginGoogle = useCallback(async (credential) => {
    const d = await authService.google(credential)
    setUsuario(d.usuario)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Este dispositivo deja de recibir los avisos de esta cuenta.
      await olvidarDispositivo()
      await authService.logout()
    } finally {
      setUsuario(null)
      window.google?.accounts.id.disableAutoSelect()
    }
  }, [])

  const logoutTodas = useCallback(async () => {
    try {
      await olvidarDispositivo()
      await authService.logoutTodas()
    } finally {
      setUsuario(null)
      window.google?.accounts.id.disableAutoSelect()
    }
  }, [])

  /** Tras editar el perfil o la foto, el backend devuelve el usuario actualizado. */
  const actualizarUsuario = useCallback((u) => setUsuario(u), [])

  const valor = useMemo(
    () => ({ usuario, cargando, login, registro, loginGoogle, logout, logoutTodas, actualizarUsuario }),
    [usuario, cargando, login, registro, loginGoogle, logout, logoutTodas, actualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
