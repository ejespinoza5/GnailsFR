import { REGLAS } from '../utils/password'

export default function ReglasPassword({ password }) {
  return (
    <ul className="reglas" aria-label="Requisitos de la contraseña">
      {REGLAS.map((r) => {
        const ok = r.cumple(password)
        return (
          <li key={r.texto} className={ok ? 'reglas__ok' : undefined}>
            <span aria-hidden="true">{ok ? '✓' : '·'}</span>
            {r.texto}
            <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
          </li>
        )
      })}
    </ul>
  )
}
