import { useEffect, useState } from 'react'

/** Minutos desde la medianoche; se actualiza cada 30 s (para la línea de "ahora"). */
export function useMinutoActual() {
  const calcular = () => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }
  const [min, setMin] = useState(calcular)
  useEffect(() => {
    const id = setInterval(() => setMin(calcular()), 30_000)
    return () => clearInterval(id)
  }, [])
  return min
}
