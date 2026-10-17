import { useState } from 'react'
import { Star } from 'lucide-react'

/** Muestra una calificación de 1 a 5 (admite medias en el promedio). */
export function Estrellas({ valor, tamano = 16, className = '' }) {
  return (
    <span className={`estrellas ${className}`} role="img" aria-label={`${String(valor).replace('.', ',')} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const relleno = Math.max(0, Math.min(1, valor - (n - 1)))
        return (
          <span key={n} className="estrellas__una" style={{ width: tamano, height: tamano }}>
            <Star size={tamano} className="estrellas__fondo" aria-hidden="true" />
            <span className="estrellas__relleno" style={{ width: `${relleno * 100}%` }}>
              <Star size={tamano} aria-hidden="true" />
            </span>
          </span>
        )
      })}
    </span>
  )
}

const TEXTOS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', '¡Excelente!']

/** Para elegir de 1 a 5 estrellas (grupo de radio accesible con teclado). */
export function SelectorEstrellas({ valor, onCambiar, error }) {
  const [sobre, setSobre] = useState(0)
  const mostrado = sobre || valor

  const teclado = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onCambiar(Math.min(5, (valor || 0) + 1))
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onCambiar(Math.max(1, (valor || 1) - 1))
  }

  return (
    <div className="selector-estrellas">
      <div role="radiogroup" aria-label="Calificación" className="selector-estrellas__grupo" onMouseLeave={() => setSobre(0)} onKeyDown={teclado}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={valor === n}
            aria-label={`${n} estrella${n === 1 ? '' : 's'}: ${TEXTOS[n]}`}
            tabIndex={valor ? (valor === n ? 0 : -1) : n === 1 ? 0 : -1}
            className={`selector-estrellas__boton${n <= mostrado ? ' selector-estrellas__boton--on' : ''}`}
            onMouseEnter={() => setSobre(n)}
            onClick={() => onCambiar(n)}
          >
            <Star size={30} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ))}
      </div>
      <span className="selector-estrellas__texto" aria-hidden="true">
        {TEXTOS[mostrado] || 'Toca una estrella'}
      </span>
      {error && <p className="campo__error">{error}</p>}
    </div>
  )
}
