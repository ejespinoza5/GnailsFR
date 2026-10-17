export default function Marca({ grande = false }) {
  return (
    <div className={`marca${grande ? ' marca--grande' : ''}`}>
      <span className="marca__nombre">Geovys Nails</span>
      <span className="marca__linea" />
      <span className="marca__autora">Geovanna Espinoza</span>
    </div>
  )
}
