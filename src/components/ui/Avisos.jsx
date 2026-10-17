import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CircleCheck, CircleAlert, X } from 'lucide-react'

const AvisosContext = createContext(() => {})

/** Avisos breves que aparecen abajo ("Servicio guardado"). Se leen con lector de pantalla. */
export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const siguiente = useRef(0)

  const quitar = useCallback((id) => setAvisos((a) => a.filter((x) => x.id !== id)), [])

  const avisar = useCallback(
    (texto, tipo = 'exito') => {
      const id = ++siguiente.current
      setAvisos((a) => [...a.slice(-2), { id, texto, tipo }])
      setTimeout(() => quitar(id), 4500)
    },
    [quitar],
  )

  const valor = useMemo(() => avisar, [avisar])

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso aviso--${a.tipo}`}>
            {a.tipo === 'error' ? <CircleAlert size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
            <span>{a.texto}</span>
            <button type="button" className="aviso__cerrar" onClick={() => quitar(a.id)} aria-label="Cerrar aviso">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAvisos = () => useContext(AvisosContext)
