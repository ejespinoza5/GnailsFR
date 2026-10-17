import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth.service'
import LayoutAuth from '../components/LayoutAuth'
import Loader from '../components/loader/Loader'
import { useAvisos } from '../components/ui/Avisos'

const LARGO = 6
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Pantalla obligatoria tras registrarse con correo: se escribe el código de 6 números que llegó. */
export default function Verificar() {
  const { usuario, actualizarUsuario, logout } = useAuth()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  // { expiraEn, reenviarDesde } en milisegundos absolutos
  const [estado, setEstado] = useState(null)
  const [ahora, setAhora] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const entrada = useRef(null)
  const navegar = useNavigate()
  const avisar = useAvisos()

  const aplicarEstado = (e) => {
    const t = Date.now()
    setAhora(t)
    setEstado({
      expiraEn: e.expiraEn ? new Date(e.expiraEn).getTime() : null,
      reenviarDesde: t + (e.reenviarEnSegundos ?? 0) * 1000,
    })
  }

  useEffect(() => {
    authService.estadoVerificacion().then(aplicarEstado).catch(() => aplicarEstado({ expiraEn: null, reenviarEnSegundos: 0 }))
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const restante = estado?.expiraEn ? Math.max(0, Math.round((estado.expiraEn - ahora) / 1000)) : 0
  const esperaReenvio = estado ? Math.max(0, Math.ceil((estado.reenviarDesde - ahora) / 1000)) : 0
  const vigente = restante > 0

  const verificar = async (valor) => {
    if (valor.length !== LARGO) return setError('El código tiene 6 números')
    setEnviando(true)
    setError('')
    try {
      const { usuario: u } = await authService.verificarCodigo(valor)
      avisar('¡Listo! Tu correo quedó confirmado.')
      actualizarUsuario(u)
      navegar(u.rol === 'admin' ? '/admin' : u.rol === 'profesional' ? '/equipo' : '/reservar', { replace: true })
    } catch (err) {
      setError(err.campos?.codigo ?? err.message)
      setCodigo('')
      setEnviando(false)
      entrada.current?.focus()
      authService.estadoVerificacion().then(aplicarEstado).catch(() => {})
    }
  }

  const cambiar = (e) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, LARGO)
    setCodigo(valor)
    setError('')
    // Al completar los 6 números (escritos, pegados o autocompletados) se envía solo.
    if (valor.length === LARGO) verificar(valor)
  }

  const reenviar = async () => {
    setReenviando(true)
    setError('')
    try {
      aplicarEstado(await authService.reenviarCodigo())
      setCodigo('')
      avisar('Te enviamos un código nuevo')
      entrada.current?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setReenviando(false)
    }
  }

  return (
    <LayoutAuth
      titulo="Confirma tu correo"
      subtitulo={
        <>
          Te enviamos un código de 6 números a <strong>{usuario.email}</strong>. Escríbelo aquí para empezar a reservar.
        </>
      }
      pie={
        <>
          ¿Te equivocaste de correo?{' '}
          <button type="button" className="enlace" onClick={logout}>
            Cerrar sesión
          </button>
        </>
      }
    >
      <form
        className="verificar"
        onSubmit={(e) => {
          e.preventDefault()
          verificar(codigo)
        }}
        noValidate
      >
        <label htmlFor="codigo" className="sr-only">
          Código de verificación
        </label>
        <div className={`codigo${error ? ' codigo--error' : ''}`} onClick={() => entrada.current?.focus()}>
          {/* Un solo campo real (pegar, autocompletar desde el correo o SMS, lectores de pantalla) dibujado como 6 casillas */}
          <input
            ref={entrada}
            id="codigo"
            className="codigo__entrada"
            value={codigo}
            onChange={cambiar}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={LARGO}
            aria-invalid={Boolean(error)}
            aria-describedby="codigo-ayuda"
            disabled={enviando}
            autoFocus
          />
          {Array.from({ length: LARGO }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`codigo__casilla${codigo[i] ? ' codigo__casilla--llena' : ''}${i === codigo.length ? ' codigo__casilla--actual' : ''}`}
            >
              {codigo[i] ?? ''}
            </span>
          ))}
        </div>

        <p id="codigo-ayuda" className={`verificar__estado${error ? ' verificar__estado--error' : ''}`} role={error ? 'alert' : 'status'}>
          {error ||
            (estado === null
              ? ' '
              : vigente
                ? `El código vence en ${mmss(restante)}`
                : 'Tu código venció. Pide uno nuevo.')}
        </p>

        <button type="submit" className="boton" disabled={enviando || codigo.length !== LARGO}>
          Confirmar correo
        </button>

        <div className="verificar__reenviar">
          <MailCheck size={16} aria-hidden="true" />
          <span>¿No te llegó? Revisa la carpeta de spam o</span>
          <button type="button" className="enlace" onClick={reenviar} disabled={reenviando || esperaReenvio > 0}>
            {esperaReenvio > 0 ? `pide otro en ${esperaReenvio} s` : 'envía un código nuevo'}
          </button>
        </div>
      </form>
      {(enviando || reenviando) && <Loader variante="superpuesto" mensaje={enviando ? 'Confirmando…' : 'Enviando código…'} />}
    </LayoutAuth>
  )
}
