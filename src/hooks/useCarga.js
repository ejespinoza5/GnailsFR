import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Carga datos de la API y expone { datos, cargando, error, recargar }.
 * Si cambian las dependencias, la respuesta vieja se descarta (no pisa a la nueva).
 */
export function useCarga(cargar, deps = []) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const turno = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ejecutar = useCallback(cargar, deps)

  const recargar = useCallback(
    async ({ silencioso = false } = {}) => {
      const mio = ++turno.current
      if (!silencioso) setEstado((e) => ({ ...e, cargando: true, error: null }))
      try {
        const datos = await ejecutar()
        if (mio === turno.current) setEstado({ datos, cargando: false, error: null })
      } catch (error) {
        if (mio === turno.current) setEstado((e) => ({ ...e, cargando: false, error }))
      }
    },
    [ejecutar],
  )

  useEffect(() => {
    recargar()
  }, [recargar])

  return { ...estado, recargar }
}

/** true si la pantalla es angosta (celular). */
export function useEsMovil(ancho = 760) {
  const consulta = `(max-width: ${ancho}px)`
  const [movil, setMovil] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const cambiar = () => setMovil(mq.matches)
    mq.addEventListener('change', cambiar)
    return () => mq.removeEventListener('change', cambiar)
  }, [consulta])
  return movil
}
