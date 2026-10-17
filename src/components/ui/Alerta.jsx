import { CircleAlert, CircleCheck, Info } from 'lucide-react'

const ICONOS = { error: CircleAlert, exito: CircleCheck, aviso: Info }

/** Mensaje en línea. tipo: 'error' | 'exito' | 'aviso' */
export default function Alerta({ tipo = 'error', children, accion }) {
  if (!children) return null
  const Icono = ICONOS[tipo]
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono size={18} strokeWidth={2} aria-hidden="true" className="alerta__icono" />
      <div className="alerta__texto">{children}</div>
      {accion}
    </div>
  )
}
