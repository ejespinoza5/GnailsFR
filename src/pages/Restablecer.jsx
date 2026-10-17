import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { authService } from '../services/auth.service'
import LayoutAuth from '../components/LayoutAuth'
import Campo from '../components/Campo'
import ReglasPassword from '../components/ReglasPassword'
import Loader from '../components/loader/Loader'
import { useAvisos } from '../components/ui/Avisos'
import { passwordValida } from '../utils/password'

/** El token llega en el fragmento (#token=…): no se envía al servidor al abrir la página. */
function leerToken() {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  return token && /^[A-Za-z0-9_-]{30,100}$/.test(token) ? token : null
}

export default function Restablecer() {
  const [token] = useState(leerToken)
  const [form, setForm] = useState({ password: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navegar = useNavigate()
  const avisar = useAvisos()

  if (!token) {
    return (
      <LayoutAuth
        titulo="Enlace no válido"
        subtitulo="El enlace está incompleto o ya no sirve. Pide uno nuevo y ábrelo desde el último correo que recibas."
      >
        <Link to="/recuperar" className="boton boton--ancho">
          Pedir un enlace nuevo
        </Link>
      </LayoutAuth>
    )
  }

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((er) => ({ ...er, [name]: undefined }))
  }

  const enviar = async (e) => {
    e.preventDefault()
    const nuevos = {}
    if (!passwordValida(form.password)) nuevos.password = 'La contraseña no cumple todos los requisitos'
    if (form.confirmar !== form.password) nuevos.confirmar = 'Las contraseñas no coinciden'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setEnviando(true)
    setErrorGeneral('')
    try {
      await authService.restablecer(token, form.password)
      // Se quita el token de la barra de direcciones y del historial.
      window.history.replaceState(null, '', '/restablecer')
      avisar('Contraseña actualizada. Inicia sesión con la nueva.')
      navegar('/login', { replace: true })
    } catch (err) {
      setErrorGeneral(err.campos?.token ? err.campos.token : err.message)
      setErrores(err.campos ?? {})
      setEnviando(false)
    }
  }

  return (
    <LayoutAuth titulo="Elige una nueva contraseña" subtitulo="Por seguridad, cerraremos tu sesión en todos tus dispositivos.">
      {errorGeneral && (
        <p className="alerta" role="alert">
          {errorGeneral} {errores.token && <Link to="/recuperar">Pedir otro enlace</Link>}
        </p>
      )}
      <form onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Nueva contraseña"
          tipo="password"
          name="password"
          autoComplete="new-password"
          maxLength={128}
          value={form.password}
          onChange={cambiar}
          error={errores.password}
          ayuda={<ReglasPassword password={form.password} />}
          required
          autoFocus
        />
        <Campo
          etiqueta="Repite la contraseña"
          tipo="password"
          name="confirmar"
          autoComplete="new-password"
          maxLength={128}
          value={form.confirmar}
          onChange={cambiar}
          error={errores.confirmar}
          required
        />
        <button type="submit" className="boton" disabled={enviando}>
          Guardar contraseña
        </button>
      </form>
      {enviando && <Loader variante="superpuesto" mensaje="Guardando…" />}
    </LayoutAuth>
  )
}
