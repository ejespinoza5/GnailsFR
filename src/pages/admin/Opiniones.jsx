import { useState } from 'react'
import { Eye, EyeOff, MessageSquareQuote } from 'lucide-react'
import { sitioAdminService } from '../../services/sitio.service'
import { useCarga } from '../../hooks/useCarga'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import { Estrellas } from '../../components/ui/Estrellas'
import { useAvisos } from '../../components/ui/Avisos'

const fFecha = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Opiniones() {
  const { datos, cargando, error, recargar } = useCarga(() => sitioAdminService.resenas(), [])
  const [lista, setLista] = useState(null)
  const resenas = lista ?? datos?.resenas ?? []
  const visibles = resenas.filter((r) => r.visible)
  const promedio = visibles.length ? visibles.reduce((t, r) => t + r.calificacion, 0) / visibles.length : 0

  const reemplazar = (nueva) => setLista(resenas.map((r) => (r.id === nueva.id ? nueva : r)))

  return (
    <div className="pagina-admin">
      <Encabezado titulo="Opiniones">
        Lo que opinan tus clientas. Solo puede opinar quien tuvo una cita completada. Puedes responder u ocultar una opinión de la página.
      </Encabezado>

      {cargando && !datos ? (
        <Loader mensaje="Cargando opiniones…" />
      ) : error && !datos ? (
        <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>{error.message}</Alerta>
      ) : resenas.length === 0 ? (
        <Vacio icono={MessageSquareQuote} titulo="Aún no hay opiniones">
          Cuando marques una cita como completada, la clienta podrá dejar su opinión desde «Mis turnos».
        </Vacio>
      ) : (
        <>
          <p className="resumen-opiniones">
            <span className="resumen-opiniones__numero">{promedio.toFixed(1).replace('.', ',')}</span>
            <Estrellas valor={promedio} tamano={20} />
            <span>
              {visibles.length} visible{visibles.length === 1 ? '' : 's'} en la página · {resenas.length - visibles.length} oculta
              {resenas.length - visibles.length === 1 ? '' : 's'}
            </span>
          </p>
          <ul className="lista-opiniones">
            {resenas.map((r) => (
              <OpinionAdmin key={r.id} resena={r} onCambio={reemplazar} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function OpinionAdmin({ resena, onCambio }) {
  const [respuesta, setRespuesta] = useState(resena.respuesta ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const avisar = useAvisos()

  const guardar = async (cambios, mensaje) => {
    setGuardando(true)
    setError('')
    try {
      const { resena: r } = await sitioAdminService.moderar(resena.id, { visible: resena.visible, respuesta: resena.respuesta, ...cambios })
      onCambio(r)
      avisar(mensaje)
    } catch (err) {
      setError(err.campos?.respuesta ?? err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <li className={`opinion-admin${resena.visible ? '' : ' opinion-admin--oculta'}`}>
      <div className="opinion-admin__cabecera">
        <Estrellas valor={resena.calificacion} tamano={17} />
        <span className="opinion-admin__quien">
          <strong>{resena.cliente.nombre}</strong> · {resena.cliente.email}
        </span>
        <span className="opinion-admin__fecha">{fFecha.format(new Date(resena.creadoEn))}</span>
        <button
          type="button"
          className={`boton boton--sm ${resena.visible ? 'boton--secundario' : 'boton--fantasma'}`}
          disabled={guardando}
          onClick={() => guardar({ visible: !resena.visible }, resena.visible ? 'Opinión oculta de la página' : 'Opinión visible en la página')}
        >
          {resena.visible ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
          {resena.visible ? 'Visible' : 'Oculta'}
        </button>
      </div>
      {resena.comentario ? <p className="opinion-admin__texto">«{resena.comentario}»</p> : <p className="nota-suave">Sin comentario, solo calificación.</p>}

      <form
        className="opinion-admin__respuesta"
        onSubmit={(e) => {
          e.preventDefault()
          guardar({ respuesta: respuesta.trim() || null }, respuesta.trim() ? 'Respuesta publicada' : 'Respuesta eliminada')
        }}
      >
        <label htmlFor={`rs-${resena.id}`} className="sr-only">
          Tu respuesta a {resena.cliente.nombre}
        </label>
        <textarea
          id={`rs-${resena.id}`}
          className="control"
          rows={2}
          maxLength={600}
          placeholder="Responder (se mostrará bajo la opinión en la página)"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
        />
        <button type="submit" className="boton boton--secundario boton--sm" disabled={guardando || respuesta.trim() === (resena.respuesta ?? '')}>
          {resena.respuesta ? 'Actualizar respuesta' : 'Responder'}
        </button>
      </form>
      {error && <p className="campo__error">{error}</p>}
    </li>
  )
}
