import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import LayoutAuth from '../components/LayoutAuth'
import Campo from '../components/Campo'
import BotonGoogle from '../components/BotonGoogle'
import Loader from '../components/loader/Loader'

export default function Login() {
  const { login, loginGoogle } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((er) => ({ ...er, [name]: undefined }))
  }

  const enviar = async (e) => {
    e.preventDefault()
    const nuevos = {}
    if (!form.email.trim()) nuevos.email = 'Ingresa tu correo'
    if (!form.password) nuevos.password = 'Ingresa tu contraseña'
    setErrores(nuevos)
    setErrorGeneral('')
    if (Object.keys(nuevos).length) return

    setEnviando(true)
    try {
      await login(form.email.trim(), form.password)
      // La redirección la hace <RutaPublica> al detectar la sesión.
    } catch (err) {
      setErrorGeneral(err.message)
      setErrores(err.campos || {})
      setForm((f) => ({ ...f, password: '' }))
    } finally {
      setEnviando(false)
    }
  }

  const conGoogle = useCallback(
    async (credential) => {
      setErrorGeneral('')
      setEnviando(true)
      try {
        await loginGoogle(credential)
      } catch (err) {
        setErrorGeneral(err.message)
        setEnviando(false)
      }
    },
    [loginGoogle],
  )

  return (
    <LayoutAuth
      titulo="Bienvenida de nuevo"
      subtitulo="Inicia sesión para reservar o revisar tus citas."
      pie={
        <>
          ¿Aún no tienes cuenta? <Link to="/registro">Crear cuenta</Link>
        </>
      }
    >
      <BotonGoogle texto="signin_with" onCredencial={conGoogle} onError={setErrorGeneral} deshabilitado={enviando} />

      <div className="separador">
        <span>o con tu correo</span>
      </div>

      {errorGeneral && (
        <p className="alerta" role="alert">
          {errorGeneral}
        </p>
      )}

      <form onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Correo electrónico"
          tipo="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          value={form.email}
          onChange={cambiar}
          error={errores.email}
          required
        />
        <Campo
          etiqueta="Contraseña"
          tipo="password"
          name="password"
          autoComplete="current-password"
          maxLength={128}
          value={form.password}
          onChange={cambiar}
          error={errores.password}
          required
        />
        <Link to="/recuperar" className="olvide">
          ¿Olvidaste tu contraseña?
        </Link>
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>
      {enviando && <Loader variante="superpuesto" mensaje="Iniciando sesión…" />}
    </LayoutAuth>
  )
}
