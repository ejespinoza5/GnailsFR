import { useState } from 'react'
import { Link } from 'react-router'
import { MailCheck } from 'lucide-react'
import { authService } from '../services/auth.service'
import LayoutAuth from '../components/LayoutAuth'
import Campo from '../components/Campo'
import Loader from '../components/loader/Loader'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(email.trim())) return setError('Ingresa un correo válido')
    setEnviando(true)
    setErrorGeneral('')
    try {
      const { mensaje } = await authService.olvide(email.trim())
      setEnviado(mensaje)
    } catch (err) {
      setErrorGeneral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <LayoutAuth titulo="Revisa tu correo" pie={<Link to="/login">Volver a iniciar sesión</Link>}>
        <div className="aviso-correo">
          <span className="aviso-correo__icono" aria-hidden="true">
            <MailCheck size={26} strokeWidth={1.75} />
          </span>
          <p>{enviado}</p>
          <p className="aviso-correo__nota">
            El enlace vence en 30 minutos. ¿No llegó?{' '}
            <button type="button" className="enlace" onClick={() => setEnviado(null)}>
              Intentar otra vez
            </button>
          </p>
        </div>
      </LayoutAuth>
    )
  }

  return (
    <LayoutAuth
      titulo="¿Olvidaste tu contraseña?"
      subtitulo="Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una nueva."
      pie={
        <>
          ¿La recordaste? <Link to="/login">Iniciar sesión</Link>
        </>
      }
    >
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
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          error={error}
          required
          autoFocus
        />
        <button type="submit" className="boton" disabled={enviando}>
          Enviar enlace
        </button>
      </form>
      {enviando && <Loader variante="superpuesto" mensaje="Enviando enlace…" />}
    </LayoutAuth>
  )
}
