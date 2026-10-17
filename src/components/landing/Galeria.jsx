import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * Mosaico de trabajos (respeta la proporción de cada foto) y visor a pantalla completa.
 * El visor es un <dialog>: Esc lo cierra, el foco queda dentro y las flechas pasan de foto.
 */
export default function Galeria({ fotos }) {
  const [abierta, setAbierta] = useState(null)
  const dialogo = useRef(null)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (abierta !== null && !d.open) d.showModal()
    if (abierta === null && d.open) d.close()
  }, [abierta])

  const mover = (paso) => setAbierta((i) => (i + paso + fotos.length) % fotos.length)
  const foto = abierta !== null ? fotos[abierta] : null

  return (
    <>
      <ul className="mosaico">
        {fotos.map((f, i) => (
          <li key={f.id} className="mosaico__item" style={{ aspectRatio: `${f.ancho} / ${f.alto}` }}>
            <button type="button" className="mosaico__boton" onClick={() => setAbierta(i)} aria-label={`Ver foto${f.titulo ? `: ${f.titulo}` : ` ${i + 1}`}`}>
              <img src={f.miniatura} alt={f.titulo ?? ''} width={f.ancho} height={f.alto} loading="lazy" decoding="async" />
              {f.titulo && <span className="mosaico__titulo">{f.titulo}</span>}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogo}
        className="visor"
        aria-label="Foto ampliada"
        onClose={() => setAbierta(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') mover(1)
          if (e.key === 'ArrowLeft') mover(-1)
        }}
        onClick={(e) => e.target === e.currentTarget && setAbierta(null)}
      >
        {foto && (
          <figure className="visor__figura">
            <img src={foto.url} alt={foto.titulo ?? ''} width={foto.ancho} height={foto.alto} />
            <figcaption>
              <span>{foto.titulo}</span>
              <span className="visor__contador">
                {abierta + 1} / {fotos.length}
              </span>
            </figcaption>
          </figure>
        )}
        <button type="button" className="visor__boton visor__cerrar" onClick={() => setAbierta(null)} aria-label="Cerrar" autoFocus>
          <X size={22} aria-hidden="true" />
        </button>
        {fotos.length > 1 && (
          <>
            <button type="button" className="visor__boton visor__anterior" onClick={() => mover(-1)} aria-label="Foto anterior">
              <ChevronLeft size={26} aria-hidden="true" />
            </button>
            <button type="button" className="visor__boton visor__siguiente" onClick={() => mover(1)} aria-label="Foto siguiente">
              <ChevronRight size={26} aria-hidden="true" />
            </button>
          </>
        )}
      </dialog>
    </>
  )
}
