import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { resenaService } from '../../services/sitio.service'
import { useCarga } from '../../hooks/useCarga'
import { Estrellas, SelectorEstrellas } from '../ui/Estrellas'
import Alerta from '../ui/Alerta'
import BotonConfirmar from '../ui/BotonConfirmar'
import { useAvisos } from '../ui/Avisos'

/** En «Mis turnos»: la clienta que ya fue atendida deja o edita su opinión. */
export default function MiOpinion() {
  const { datos, recargar } = useCarga(() => resenaService.mia(), [])
  const [editando, setEditando] = useState(false)

  if (!datos?.puedeOpinar) return null
  const { resena } = datos

  if (resena && !editando) {
    return (
      <section className="mi-opinion" aria-labelledby="t-opinion">
        <div className="mi-opinion__cabecera">
          <h2 id="t-opinion">Tu opinión</h2>
          <button type="button" className="boton boton--fantasma boton--sm" onClick={() => setEditando(true)}>
            <Pencil size={15} aria-hidden="true" /> Editar
          </button>
        </div>
        <Estrellas valor={resena.calificacion} tamano={18} />
        {resena.comentario && <p className="mi-opinion__texto">«{resena.comentario}»</p>}
        <p className="nota-suave">
          {resena.visible ? `Se muestra en la página como ${resena.nombrePublico}.` : 'El salón la ocultó de la página.'}
        </p>
        {resena.respuesta && (
          <div className="mi-opinion__respuesta">
            <strong>Respuesta de Geovys Nails</strong>
            <p>{resena.respuesta}</p>
          </div>
        )}
      </section>
    )
  }

  return <FormOpinion resena={resena} onListo={async () => { setEditando(false); await recargar({ silencioso: true }) }} onCancelar={resena ? () => setEditando(false) : null} />
}

function FormOpinion({ resena, onListo, onCancelar }) {
  const [calificacion, setCalificacion] = useState(resena?.calificacion ?? 0)
  const [comentario, setComentario] = useState(resena?.comentario ?? '')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const avisar = useAvisos()

  const enviar = async (e) => {
    e.preventDefault()
    if (!calificacion) return setErrores({ calificacion: 'Elige de 1 a 5 estrellas' })
    setEnviando(true)
    setErrores({})
    try {
      await resenaService.guardar({ calificacion, comentario: comentario.trim() || null })
      avisar(resena ? 'Opinión actualizada' : '¡Gracias por tu opinión!')
      await onListo()
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
      setEnviando(false)
    }
  }

  return (
    <section className="mi-opinion mi-opinion--form" aria-labelledby="t-opinion">
      <h2 id="t-opinion">{resena ? 'Edita tu opinión' : '¿Cómo te fue en tu cita?'}</h2>
      <p className="nota-suave">Tu opinión ayuda a otras clientas. Se publica con tu nombre y la inicial de tu apellido.</p>
      <form className="formulario" onSubmit={enviar} noValidate>
        <SelectorEstrellas valor={calificacion} onCambiar={setCalificacion} error={errores.calificacion} />
        <div className="campo">
          <label htmlFor="op-com">
            Cuéntanos más <span className="opcional">(opcional)</span>
          </label>
          <textarea id="op-com" className="control" rows={3} maxLength={600} placeholder="¿Qué te gustó? ¿Qué podemos mejorar?" value={comentario} onChange={(e) => setComentario(e.target.value)} />
          {errores.comentario && <p className="campo__error">{errores.comentario}</p>}
        </div>
        <Alerta>{errores.general}</Alerta>
        <div className="formulario__acciones">
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Publicando…' : resena ? 'Guardar cambios' : 'Publicar opinión'}
          </button>
          {onCancelar && (
            <button type="button" className="boton boton--fantasma" onClick={onCancelar} disabled={enviando}>
              Cancelar
            </button>
          )}
          {resena && (
            <BotonConfirmar
              className="boton boton--fantasma-peligro"
              pregunta="¿Borrar tu opinión?"
              confirmar="Borrar"
              onConfirmar={async () => {
                await resenaService.eliminar()
                avisar('Opinión borrada')
                await onListo()
              }}
            >
              Borrar
            </BotonConfirmar>
          )}
        </div>
      </form>
    </section>
  )
}
