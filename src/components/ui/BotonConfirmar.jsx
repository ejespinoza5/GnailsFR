import { useState } from 'react'

/**
 * Acción irreversible con confirmación en el mismo lugar (sin ventanas modales):
 * el primer clic pregunta, el segundo ejecuta.
 */
export default function BotonConfirmar({
  children,
  pregunta = '¿Seguro?',
  confirmar = 'Sí',
  onConfirmar,
  className = 'boton boton--secundario boton--sm',
  disabled,
}) {
  const [preguntando, setPreguntando] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  if (!preguntando) {
    return (
      <button type="button" className={className} onClick={() => setPreguntando(true)} disabled={disabled}>
        {children}
      </button>
    )
  }

  const ejecutar = async () => {
    setOcupado(true)
    try {
      await onConfirmar()
    } finally {
      setOcupado(false)
      setPreguntando(false)
    }
  }

  return (
    <span className="confirmar" role="group" aria-label={pregunta}>
      <span className="confirmar__pregunta">{pregunta}</span>
      <button type="button" className="boton boton--peligro boton--sm" onClick={ejecutar} disabled={ocupado} autoFocus>
        {ocupado ? 'Un momento…' : confirmar}
      </button>
      <button type="button" className="boton boton--fantasma boton--sm" onClick={() => setPreguntando(false)} disabled={ocupado}>
        No
      </button>
    </span>
  )
}
