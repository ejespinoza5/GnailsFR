import { useState } from 'react'
import { Bell, CalendarClock, Megaphone, Send, Users } from 'lucide-react'
import { campanasService } from '../../services/notificaciones.service'
import { useCarga } from '../../hooks/useCarga'
import { hoyISO } from '../../utils/fechas'
import Encabezado from '../../components/layout/Encabezado'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import CampoForm from '../../components/ui/CampoForm'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import { useAvisos } from '../../components/ui/Avisos'

const fFecha = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const ESTADOS = { programada: 'Programada', enviando: 'Enviando', enviada: 'Enviada', cancelada: 'Cancelada' }
const PANTALLAS = [
  ['', 'Página principal'],
  ['/reservar', 'Reservar'],
  ['/mis-turnos', 'Mis turnos'],
]

/** Promociones y avisos a las clientas: se envían al momento o se programan. */
export default function Notificaciones() {
  const { datos, cargando, error, recargar } = useCarga(() => campanasService.listar(), [])

  return (
    <div className="pagina-admin notificaciones-admin">
      <Encabezado titulo="Promociones">
        Envía un aviso a tus clientas al celular y a su campanita: una promoción, una fecha especial o una novedad. Solo les llega a quienes aceptan
        promociones.
      </Encabezado>

      {cargando && !datos ? (
        <Loader mensaje="Cargando…" />
      ) : error && !datos ? (
        <Alerta>{error.message}</Alerta>
      ) : (
        <div className="notificaciones-admin__cuerpo">
          <NuevaCampana audiencia={datos.audiencia} onCreada={() => recargar({ silencioso: true })} />
          <Historial campanas={datos.campanas} onCambio={() => recargar({ silencioso: true })} />
        </div>
      )}
    </div>
  )
}

function NuevaCampana({ audiencia, onCreada }) {
  const [form, setForm] = useState({ titulo: '', cuerpo: '', url: '/reservar', envio: 'ahora', fecha: hoyISO(), hora: '10:00' })
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const avisar = useAvisos()

  const cambiar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined, general: undefined }))
  }

  const enviar = async () => {
    setEnviando(true)
    setErrores({})
    try {
      const { campana } = await campanasService.crear({
        titulo: form.titulo,
        cuerpo: form.cuerpo,
        url: form.url || null,
        envio: form.envio,
        fecha: form.envio === 'programar' ? form.fecha : null,
        hora: form.envio === 'programar' ? form.hora : null,
      })
      avisar(form.envio === 'ahora' ? `Promoción enviada a ${campana.destinatarios ?? audiencia.clientas} clientas` : 'Promoción programada')
      setForm((f) => ({ ...f, titulo: '', cuerpo: '' }))
      await onCreada()
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
    } finally {
      setEnviando(false)
    }
  }

  const valida = form.titulo.trim().length >= 3 && form.cuerpo.trim().length >= 3

  return (
    <section className="seccion nueva-campana" aria-labelledby="t-nueva">
      <h2 id="t-nueva" className="seccion__titulo">
        Nuevo aviso
      </h2>
      <p className="audiencia">
        <Users size={16} aria-hidden="true" /> Llegará a <strong>{audiencia.clientas}</strong> clientas
        {audiencia.conPush > 0 && <> · {audiencia.conPush} con notificaciones en el celular</>}
      </p>

      <div className="nueva-campana__grid">
        <div className="formulario">
          <CampoForm id="cp-titulo" etiqueta="Título" error={errores.titulo} ayuda={`${80 - form.titulo.length} caracteres disponibles`}>
            <input id="cp-titulo" className="control" maxLength={80} placeholder="20 % en semipermanente esta semana" value={form.titulo} onChange={(e) => cambiar('titulo', e.target.value)} />
          </CampoForm>
          <CampoForm id="cp-cuerpo" etiqueta="Mensaje" error={errores.cuerpo} ayuda={`${240 - form.cuerpo.length} caracteres disponibles`}>
            <textarea
              id="cp-cuerpo"
              className="control"
              rows={3}
              maxLength={240}
              placeholder="Reserva de lunes a jueves y aprovecha el descuento. ¡Cupos limitados!"
              value={form.cuerpo}
              onChange={(e) => cambiar('cuerpo', e.target.value)}
            />
          </CampoForm>
          <CampoForm id="cp-url" etiqueta="Al tocarla abre" error={errores.url}>
            <select id="cp-url" className="control" value={form.url} onChange={(e) => cambiar('url', e.target.value)}>
              {PANTALLAS.map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </select>
          </CampoForm>

          <fieldset className="grupo-campos">
            <legend>¿Cuándo?</legend>
            <div className="segmentos segmentos--compacto" role="tablist" aria-label="Cuándo enviar">
              <button type="button" role="tab" aria-selected={form.envio === 'ahora'} className="segmento" onClick={() => cambiar('envio', 'ahora')}>
                <Send size={15} aria-hidden="true" /> Ahora
              </button>
              <button type="button" role="tab" aria-selected={form.envio === 'programar'} className="segmento" onClick={() => cambiar('envio', 'programar')}>
                <CalendarClock size={15} aria-hidden="true" /> Programar
              </button>
            </div>
            {form.envio === 'programar' && (
              <div className="fila-campos">
                <CampoForm id="cp-fecha" etiqueta="Fecha" error={errores.fecha}>
                  <input id="cp-fecha" type="date" className="control" min={hoyISO()} value={form.fecha} onChange={(e) => cambiar('fecha', e.target.value)} />
                </CampoForm>
                <CampoForm id="cp-hora" etiqueta="Hora" error={errores.hora}>
                  <input id="cp-hora" type="time" className="control" value={form.hora} onChange={(e) => cambiar('hora', e.target.value)} />
                </CampoForm>
              </div>
            )}
          </fieldset>

          <Alerta>{errores.general}</Alerta>
          <div className="formulario__acciones">
            {form.envio === 'ahora' ? (
              <BotonConfirmar className="boton" pregunta={`¿Enviar ahora a ${audiencia.clientas} clientas?`} confirmar="Sí, enviar" onConfirmar={enviar} disabled={!valida || enviando}>
                <Send size={16} aria-hidden="true" /> Enviar ahora
              </BotonConfirmar>
            ) : (
              <button type="button" className="boton" onClick={enviar} disabled={!valida || enviando}>
                <CalendarClock size={16} aria-hidden="true" /> {enviando ? 'Programando…' : 'Programar envío'}
              </button>
            )}
          </div>
        </div>

        {/* Vista previa: así se ve en la pantalla bloqueada del celular */}
        <div className="vista-push" aria-label="Vista previa en el celular">
          <div className="vista-push__telefono">
            <span className="vista-push__hora">9:41</span>
            <div className="vista-push__aviso">
              <img src="/iconos/icono-192.png" alt="" width="38" height="38" />
              <div>
                <span className="vista-push__app">GEOVYS NAILS · ahora</span>
                <strong>{form.titulo || 'Título del aviso'}</strong>
                <span>{form.cuerpo || 'Aquí va el mensaje que verán tus clientas.'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Historial({ campanas, onCambio }) {
  const avisar = useAvisos()
  if (!campanas.length) {
    return (
      <Vacio icono={Megaphone} titulo="Aún no enviaste promociones">
        Lo que envíes o programes aparecerá aquí.
      </Vacio>
    )
  }
  return (
    <section className="seccion" aria-labelledby="t-hist">
      <h2 id="t-hist" className="seccion__titulo">
        Enviadas y programadas
      </h2>
      <ul className="lista-campanas">
        {campanas.map((c) => (
          <li key={c.id} className={`campana campana--${c.estado}`}>
            <span className="campana__icono" aria-hidden="true">
              {c.estado === 'programada' ? <CalendarClock size={17} /> : <Bell size={17} />}
            </span>
            <div className="campana__texto">
              <strong>{c.titulo}</strong>
              <span>{c.cuerpo}</span>
              <small>
                {ESTADOS[c.estado]} · {fFecha.format(new Date(c.estado === 'enviada' ? c.enviadaEn : c.programadaPara))}
                {c.estado === 'enviada' && ` · ${c.destinatarios} clientas`}
              </small>
            </div>
            {c.estado === 'programada' && (
              <BotonConfirmar
                className="boton boton--fantasma-peligro boton--sm"
                pregunta="¿Cancelar el envío?"
                confirmar="Cancelar envío"
                onConfirmar={async () => {
                  await campanasService.cancelar(c.id)
                  avisar('Envío cancelado')
                  await onCambio()
                }}
              >
                Cancelar
              </BotonConfirmar>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
