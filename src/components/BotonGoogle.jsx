import { useEffect, useRef, useState } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const URL_SCRIPT = 'https://accounts.google.com/gsi/client'

let promesaScript
function cargarScriptGoogle() {
  promesaScript ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = URL_SCRIPT
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = () => {
      promesaScript = undefined
      reject(new Error('No se pudo cargar Google'))
    }
    document.head.appendChild(s)
  })
  return promesaScript
}

/**
 * Botón oficial de Google Identity Services.
 * Google entrega un ID token (JWT firmado) y el backend lo verifica.
 * texto: 'signin_with' | 'signup_with' | 'continue_with'
 */
export default function BotonGoogle({ texto = 'continue_with', onCredencial, onError, deshabilitado }) {
  const contenedor = useRef(null)
  const callback = useRef(onCredencial)
  const [fallo, setFallo] = useState(!CLIENT_ID)

  useEffect(() => {
    callback.current = onCredencial
  }, [onCredencial])

  useEffect(() => {
    if (!CLIENT_ID) return
    let activo = true

    cargarScriptGoogle()
      .then(() => {
        if (!activo || !contenedor.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => callback.current?.(r.credential),
          ux_mode: 'popup',
          context: texto === 'signup_with' ? 'signup' : 'signin',
          cancel_on_tap_outside: true,
        })
        window.google.accounts.id.renderButton(contenedor.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: texto,
          logo_alignment: 'center',
          locale: 'es',
          width: Math.min(contenedor.current.offsetWidth || 360, 400),
        })
      })
      .catch(() => {
        if (activo) {
          setFallo(true)
          onError?.('No pudimos cargar el acceso con Google. Puedes usar tu correo.')
        }
      })

    return () => {
      activo = false
    }
  }, [texto, onError])

  if (fallo) {
    return (
      <p className="aviso-google">
        {CLIENT_ID ? 'El acceso con Google no está disponible ahora.' : 'Falta configurar VITE_GOOGLE_CLIENT_ID.'}
      </p>
    )
  }

  return (
    <div className={`boton-google${deshabilitado ? ' boton-google--inactivo' : ''}`} aria-busy={deshabilitado}>
      <div ref={contenedor} />
    </div>
  )
}
