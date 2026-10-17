import { useEffect } from 'react'

/**
 * Fondo del cajón lateral (editores de servicios y profesionales): oscurece la
 * página, cierra con clic afuera o con Esc y evita que la página de atrás se desplace.
 */
export default function FondoCajon({ onCerrar }) {
  useEffect(() => {
    const escape = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', escape)
    const escritorio = window.matchMedia('(min-width: 761px)').matches
    if (escritorio) document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', escape)
      document.body.style.overflow = ''
    }
  }, [onCerrar])

  return <button type="button" className="cajon-fondo" aria-label="Cerrar editor" tabIndex={-1} onClick={onCerrar} />
}
