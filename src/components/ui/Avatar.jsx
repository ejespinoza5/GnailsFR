import { useState } from 'react'

/** Foto de la persona o su inicial sobre un círculo de la marca (también si la foto no carga). */
export default function Avatar({ nombre = '', url, tamano = 36 }) {
  const [fallo, setFallo] = useState(null)
  const estilo = { width: tamano, height: tamano, fontSize: tamano * 0.44 }
  if (url && fallo !== url) {
    return <img src={url} alt="" referrerPolicy="no-referrer" className="avatar" style={estilo} onError={() => setFallo(url)} />
  }
  return (
    <span className="avatar avatar--inicial" style={estilo} aria-hidden="true">
      {nombre.trim()[0] ?? '?'}
    </span>
  )
}
