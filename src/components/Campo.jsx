import { useId, useState } from 'react'

export default function Campo({ etiqueta, error, tipo = 'text', ayuda, ...props }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const esPassword = tipo === 'password'
  const idError = `${id}-error`
  const idAyuda = `${id}-ayuda`
  const describe = [error && idError, ayuda && idAyuda].filter(Boolean).join(' ') || undefined

  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo__control">
        <input
          id={id}
          type={esPassword && visible ? 'text' : tipo}
          aria-invalid={Boolean(error)}
          aria-describedby={describe}
          {...props}
        />
        {esPassword && (
          <button
            type="button"
            className="campo__ojo"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
      {ayuda && <div id={idAyuda}>{ayuda}</div>}
      {error && (
        <p id={idError} className="campo__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
