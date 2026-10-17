/** Etiqueta + control + ayuda + error, con los ids enlazados. */
export default function CampoForm({ id, etiqueta, opcional, error, ayuda, children }) {
  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      <label htmlFor={id}>
        {etiqueta} {opcional && <span className="opcional">(opcional)</span>}
      </label>
      {children}
      {ayuda && <p className="campo__ayuda">{ayuda}</p>}
      {error && (
        <p className="campo__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
