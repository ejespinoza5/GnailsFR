import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import LayoutAuth from '../components/LayoutAuth'
import Campo from '../components/Campo'
import BotonGoogle from '../components/BotonGoogle'
import Loader from '../components/loader/Loader'
import ReglasPassword from '../components/ReglasPassword'
import { passwordValida } from '../utils/password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validar({ nombre, email, password, confirmar }) {
  const e = {}
  if (nombre.trim().length < 2) e.nombre = 'Escribe tu nombre (mínimo 2 letras)'
  if (!EMAIL_RE.test(email.trim())) e.email = 'Ingresa un correo válido'
  if (!passwordValida(password)) e.password = 'La contraseña no cumple todos los requisitos'
  if (!confirmar) e.confirmar = 'Repite tu contraseña'
  else if (confirmar !== password) e.confirmar = 'Las contraseñas no coinciden'
  return e
}

export default function Registro() {
  const { registro, loginGoogle } = useAuth()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '' })
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
    const nuevos = validar(form)
    setErrores(nuevos)
    setErrorGeneral('')
    if (Object.keys(nuevos).length) return

    setEnviando(true)
    try {
      await registro(form.nombre.trim(), form.email.trim(), form.password)
    } catch (err) {
      setErrorGeneral(err.message)
      setErrores(err.campos || {})
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
      titulo="Crea tu cuenta"
      subtitulo="Regístrate en segundos y agenda tu próxima cita."
      pie={
        <>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </>
      }
    >
      <BotonGoogle texto="signup_with" onCredencial={conGoogle} onError={setErrorGeneral} deshabilitado={enviando} />

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
          etiqueta="Nombre completo"
          name="nombre"
          autoComplete="name"
          maxLength={100}
          value={form.nombre}
          onChange={cambiar}
          error={errores.nombre}
          required
        />
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
          autoComplete="new-password"
          maxLength={128}
          value={form.password}
          onChange={cambiar}
          error={errores.password}
          ayuda={<ReglasPassword password={form.password} />}
          required
        />
        <Campo
          etiqueta="Confirmar contraseña"
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
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      {enviando && <Loader variante="superpuesto" mensaje="Creando tu cuenta…" />}
    </LayoutAuth>
  )
}
