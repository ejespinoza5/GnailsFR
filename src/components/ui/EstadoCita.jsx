const ETIQUETAS = {
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
  no_asistio: 'No asistió',
}

export default function EstadoCita({ estado }) {
  return <span className={`estado estado--${estado}`}>{ETIQUETAS[estado] ?? estado}</span>
}
