/** Título de cada pantalla con su descripción y acciones a la derecha. */
export default function Encabezado({ titulo, children, acciones }) {
  return (
    <header className="encabezado">
      <div>
        <h1 className="encabezado__titulo">{titulo}</h1>
        {children && <p className="encabezado__texto">{children}</p>}
      </div>
      {acciones && <div className="encabezado__acciones">{acciones}</div>}
    </header>
  )
}
