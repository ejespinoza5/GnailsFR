// Fechas como texto 'YYYY-MM-DD' y horas como 'HH:MM' (hora del salón), igual que la API.
// Se formatean en UTC para que el navegador no las corra de día.

const fmt = (opciones) => new Intl.DateTimeFormat('es', { timeZone: 'UTC', ...opciones })
const aDate = (f) => new Date(`${f}T00:00:00Z`)

const fDiaCorto = fmt({ weekday: 'short' })
const fDiaLargo = fmt({ weekday: 'long' })
const fMesCorto = fmt({ month: 'short' })
const fLarga = fmt({ weekday: 'long', day: 'numeric', month: 'long' })
const fConAnio = fmt({ day: 'numeric', month: 'long', year: 'numeric' })
const fDiaMes = fmt({ day: 'numeric', month: 'short' })

export function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sumarDias(fecha, dias) {
  const d = aDate(fecha)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** 0 = domingo … 6 = sábado */
export const diaSemana = (fecha) => aDate(fecha).getUTCDay()

/** Lunes de la semana de esa fecha. */
export const inicioSemana = (fecha) => sumarDias(fecha, -((diaSemana(fecha) + 6) % 7))

export const numeroDia = (fecha) => aDate(fecha).getUTCDate()
const sinPunto = (s) => s.replace('.', '')
export const diaCorto = (fecha) => sinPunto(fDiaCorto.format(aDate(fecha)))
export const diaLargo = (fecha) => fDiaLargo.format(aDate(fecha))
export const mesCorto = (fecha) => sinPunto(fMesCorto.format(aDate(fecha)))
/** "lunes, 19 de octubre" */
export const fechaLarga = (fecha) => fLarga.format(aDate(fecha))
/** "19 de octubre de 2026" */
export const fechaConAnio = (fecha) => fConAnio.format(aDate(fecha))
/** "19 oct" */
export const diaMes = (fecha) => sinPunto(fDiaMes.format(aDate(fecha)))

/** "Semana del 19 al 25 de octubre" */
export function rangoSemana(lunes) {
  const domingo = sumarDias(lunes, 6)
  const mismoMes = mesCorto(lunes) === mesCorto(domingo)
  return mismoMes
    ? `${numeroDia(lunes)} – ${numeroDia(domingo)} de ${fmt({ month: 'long' }).format(aDate(domingo))}`
    : `${diaMes(lunes)} – ${diaMes(domingo)}`
}

export const aMinutos = (hora) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}
export const aHora = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** '14:30' → '2:30 p. m.' */
export function horaBonita(hora) {
  const [h, m] = hora.split(':').map(Number)
  // Espacios que no se cortan (\u00a0): "9:30 a. m." nunca se parte en dos líneas.
  const sufijo = h < 12 ? 'a.\u00a0m.' : 'p.\u00a0m.'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}\u00a0${sufijo}`
}

/** '14:30' → '2:30' (para celdas pequeñas, con la parte del día como encabezado) */
export function horaCorta(hora) {
  const [h, m] = hora.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}`
}

export function parteDelDia(hora) {
  const h = Number(hora.slice(0, 2))
  if (h < 12) return 'Mañana'
  if (h < 18) return 'Tarde'
  return 'Noche'
}

/** 90 → '1 h 30 min' */
export function duracionBonita(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

const fPrecio = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const precioBonito = (precio) => (precio === null || precio === undefined ? null : `$${fPrecio.format(precio)}`)

/**
 * Precio como lo lee la clienta, según el tipo que eligió la dueña:
 *   fijo → "$18,50" · desde → "Desde $25,00" · rango → "$20,00 – $35,00" · sin precio → "Precio en el salón"
 * Sirve para servicios y para citas (ambos traen precio, precioTipo y precioMax).
 */
export function precioTexto({ precio, precioTipo = 'fijo', precioMax = null }, sinPrecio = 'Precio en el salón') {
  if (precio === null || precio === undefined) return sinPrecio
  if (precioTipo === 'desde') return `Desde ${precioBonito(precio)}`
  if (precioTipo === 'rango' && precioMax !== null) return `${precioBonito(precio)} – ${precioBonito(precioMax)}`
  return precioBonito(precio)
}

/** ¿El precio puede variar? (entonces se aclara que se confirma en el salón) */
export const precioVariable = (s) => s.precio !== null && s.precio !== undefined && (s.precioTipo === 'desde' || s.precioTipo === 'rango')

export const NOTA_PRECIO_VARIABLE = 'El precio final depende del diseño; te lo confirmamos antes de empezar.'

export const DIAS_SEMANA = [
  { valor: 1, corto: 'L', nombre: 'Lunes' },
  { valor: 2, corto: 'M', nombre: 'Martes' },
  { valor: 3, corto: 'X', nombre: 'Miércoles' },
  { valor: 4, corto: 'J', nombre: 'Jueves' },
  { valor: 5, corto: 'V', nombre: 'Viernes' },
  { valor: 6, corto: 'S', nombre: 'Sábado' },
  { valor: 0, corto: 'D', nombre: 'Domingo' },
]

const fMes = fmt({ month: 'long', year: 'numeric' })
/** "octubre de 2026" */
export const nombreMes = (fecha) => fMes.format(aDate(fecha))

/** Lunes con el que empieza la cuadrícula de 6 semanas del mes de esa fecha. */
export const inicioCuadriculaMes = (fecha) => inicioSemana(`${fecha.slice(0, 7)}-01`)
