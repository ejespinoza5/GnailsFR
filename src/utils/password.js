// Mismas reglas que valida el backend (server/src/utils/validaciones.js).
// El backend es quien manda: esto solo guía a la clienta mientras escribe.
export const REGLAS = [
  { texto: 'Mínimo 8 caracteres', cumple: (p) => p.length >= 8 },
  { texto: 'Una letra mayúscula', cumple: (p) => /[A-Z]/.test(p) },
  { texto: 'Una letra minúscula', cumple: (p) => /[a-z]/.test(p) },
  { texto: 'Un número', cumple: (p) => /[0-9]/.test(p) },
  { texto: 'Un símbolo (! @ # $ % …)', cumple: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { texto: 'Sin espacios', cumple: (p) => p.length > 0 && !/\s/.test(p) },
]

export const passwordValida = (p) => p.length <= 128 && REGLAS.every((r) => r.cumple(p))
