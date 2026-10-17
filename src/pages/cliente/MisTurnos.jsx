import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarHeart, Clock, UserRound } from 'lucide-react'
import { reservasService } from '../../services/reservas.service'
import { useCarga } from '../../hooks/useCarga'
import { diaCorto, horaBonita, mesCorto, numeroDia, precioTexto } from '../../utils/fechas'
import Loader from '../../components/loader/Loader'
import Alerta from '../../components/ui/Alerta'
import Vacio from '../../components/ui/Vacio'
import EstadoCita from '../../components/ui/EstadoCita'
import BotonConfirmar from '../../components/ui/BotonConfirmar'
import { useAvisos } from '../../components/ui/Avisos'
import MiOpinion from '../../components/reserva/MiOpinion'

export default function MisTurnos() {
  const { datos, cargando, error, recargar } = useCarga(() => reservasService.misCitas(), [])
  const [vista, setVista] = useState('proximas')
  const avisar = useAvisos()

  if (cargando && !datos) return <Loader variante="bloque" mensaje="Cargando tus turnos…" />
  if (error && !datos)
    return (
      <div className="pagina-estrecha">
        <Alerta accion={<button type="button" className="boton boton--secundario boton--sm" onClick={() => recargar()}>Reintentar</button>}>
          {error.message}
        </Alerta>
      </div>
    )

  const proximas = datos.citas
    .filter((c) => c.estado === 'confirmada' && !c.pasada)
    .sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio))
  const historial = datos.citas.filter((c) => !(c.estado === 'confirmada' && !c.pasada))
  const lista = vista === 'proximas' ? proximas : historial

  const cancelar = async (cita) => {
    try {
      await reservasService.cancelar(cita.id)
      avisar('Tu cita fue cancelada')
      await recargar({ silencioso: true })
    } catch (err) {
      avisar(err.message, 'error')
    }
  }

  return (
    <div className="pagina-estrecha">
      <header className="reservar__cabecera reservar__cabecera--fila">
        <div>
          <h1>Mis turnos</h1>
          <p>Puedes cancelar una cita hasta {datos.horasCancelacion} horas antes.</p>
        </div>
        <Link to="/reservar" className="boton boton--sm">
          Nueva reserva
        </Link>
      </header>

      <MiOpinion />

      <div className="segmentos" role="tablist" aria-label="Turnos">
        <button type="button" role="tab" aria-selected={vista === 'proximas'} className="segmento" onClick={() => setVista('proximas')}>
          Próximos <span className="contador">{proximas.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={vista === 'historial'} className="segmento" onClick={() => setVista('historial')}>
          Historial <span className="contador">{historial.length}</span>
        </button>
      </div>

      {vista === 'proximas' && proximas.length > 0 && datos.mensajeReserva && (
        <p className="mensaje-reserva" role="note">
          <Clock size={18} aria-hidden="true" /> {datos.mensajeReserva}
        </p>
      )}

      {lista.length === 0 ? (
        vista === 'proximas' ? (
          <Vacio
            icono={CalendarHeart}
            titulo="No tienes turnos próximos"
            accion={<Link to="/reservar" className="boton">Reservar una cita</Link>}
          >
            Cuando reserves, tu cita aparecerá aquí con todos sus detalles.
          </Vacio>
        ) : (
          <Vacio icono={Clock} titulo="Tu historial está vacío">
            Aquí verás tus citas pasadas y canceladas.
          </Vacio>
        )
      ) : (
        <ul className="lista-citas" role="tabpanel">
          {lista.map((c) => (
            <li key={c.id} className={`cita-fila cita-fila--${c.estado}`}>
              <div className="cita-fila__fecha" aria-hidden="true">
                <span className="cita-fila__dia">{diaCorto(c.fecha)}</span>
                <span className="cita-fila__numero">{numeroDia(c.fecha)}</span>
                <span className="cita-fila__mes">{mesCorto(c.fecha)}</span>
              </div>
              <div className="cita-fila__info">
                <h3>{c.servicio.nombre}</h3>
                <p className="cita-fila__linea">
                  <span className="sr-only">{c.fecha}, </span>
                  <Clock size={14} aria-hidden="true" /> {horaBonita(c.horaInicio)} – {horaBonita(c.horaFin)}
                </p>
                <p className="cita-fila__linea">
                  <UserRound size={14} aria-hidden="true" /> {c.profesional.nombre}
                  {c.precio !== null && <span className="cita-fila__precio">{precioTexto(c)}</span>}
                </p>
                {c.notas && <p className="cita-fila__nota">«{c.notas}»</p>}
              </div>
              <div className="cita-fila__acciones">
                <EstadoCita estado={c.estado} />
                {c.estado === 'cancelada' && c.canceladaPor === 'admin' && <small className="nota-suave">Cancelada por el salón</small>}
                {c.cancelable && (
                  <BotonConfirmar pregunta="¿Cancelar esta cita?" confirmar="Sí, cancelar" onConfirmar={() => cancelar(c)}>
                    Cancelar
                  </BotonConfirmar>
                )}
                {c.estado === 'confirmada' && !c.cancelable && !c.pasada && (
                  <small className="nota-suave">Para cambios, comunícate con el salón</small>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
