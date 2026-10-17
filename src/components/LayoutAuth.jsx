import Marca from './Marca'

export default function LayoutAuth({ titulo, subtitulo, children, pie }) {
  return (
    <div className="auth">
      <aside className="auth__panel" aria-hidden="true">
        <div className="auth__panel-contenido">
          <Marca grande />
          <p className="auth__lema">Tu momento, tus manos, tu estilo.</p>
        </div>
      </aside>

      <main className="auth__principal">
        <div className="auth__tarjeta">
          <div className="auth__marca-movil">
            <Marca />
          </div>
          <h1>{titulo}</h1>
          {subtitulo && <p className="auth__subtitulo">{subtitulo}</p>}
          {children}
        </div>
        {pie && <p className="auth__pie">{pie}</p>}
      </main>
    </div>
  )
}
