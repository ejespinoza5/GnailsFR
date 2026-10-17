/** Estado vacío que explica qué hacer a continuación. */
export default function Vacio({ icono: Icono, titulo, children, accion }) {
  return (
    <div className="vacio">
      {Icono && (
        <span className="vacio__icono" aria-hidden="true">
          <Icono size={26} strokeWidth={1.5} />
        </span>
      )}
      <h3 className="vacio__titulo">{titulo}</h3>
      {children && <p className="vacio__texto">{children}</p>}
      {accion}
    </div>
  )
}
