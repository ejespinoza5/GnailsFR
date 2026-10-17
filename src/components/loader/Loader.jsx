import { useId } from 'react'
import './Loader.css'

/**
 * Loader de la marca: la "G" dorada con la gota que cae (logo/logos sin fondo/Loader G.html).
 *
 * variante:
 *  - "pantalla":    ocupa toda la pantalla (arranque de la app, cambio de sección).
 *  - "superpuesto": cubre la pantalla actual con un velo (login, guardar, confirmar).
 *  - "bloque":      dentro de una sección mientras cargan sus datos.
 */
export default function Loader({ variante = 'bloque', mensaje = 'Cargando…' }) {
  return (
    <div className={`loader loader--${variante}`} role="status" aria-live="polite">
      <LogoAnimado />
      <p className="loader__mensaje">{mensaje}</p>
    </div>
  )
}

function LogoAnimado() {
  // Ids únicos: puede haber varios loaders a la vez y los degradados SVG no deben chocar.
  const id = useId().replace(/:/g, '')
  const oro = `oro-${id}`
  const gota = `gota-${id}`

  return (
    <svg className="loader__svg" viewBox="160 300 450 920" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={oro} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A3802F" />
          <stop offset="45%" stopColor="#C9A35A" />
          <stop offset="68%" stopColor="#B8945A" />
          <stop offset="100%" stopColor="#CFA87D" />
        </linearGradient>
        <linearGradient id={gota} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C9A35A" />
          <stop offset="100%" stopColor="#8A6A2E" />
        </linearGradient>
      </defs>

      <g transform="translate(0 1376) scale(0.1 -0.1)" fill={`url(#${oro})`}>
        <path d="M4100 10304 c-163 -15 -448 -82 -593 -140 -335 -132 -609 -315 -857 -570 -586 -603 -865 -1522 -705 -2319 50 -247 156 -497 289 -679 90 -124 263 -293 376 -368 153 -101 344 -185 495 -217 214 -46 334 -85 415 -136 124 -78 200 -226 200 -387 l0 -68 128 0 127 0 2 90 c3 164 61 296 191 432 101 105 209 180 362 249 228 105 510 259 542 297 8 9 23 64 32 122 45 269 147 815 170 907 42 171 88 238 214 312 75 44 143 67 232 77 l60 7 0 53 0 54 -870 0 -870 0 0 -55 c0 -50 2 -55 23 -55 53 0 214 -41 275 -70 112 -52 166 -119 178 -222 6 -54 -20 -240 -70 -493 -13 -66 -31 -160 -41 -210 -68 -372 -71 -380 -143 -447 -161 -149 -425 -217 -663 -172 -148 28 -266 84 -361 172 -179 167 -289 437 -329 810 -7 73 -10 192 -6 335 26 990 455 1933 1018 2236 154 83 274 112 464 113 186 1 297 -29 401 -108 50 -38 88 -119 88 -184 0 -65 -15 -97 -94 -200 -83 -108 -109 -167 -125 -282 -10 -66 18 -184 56 -242 78 -116 235 -177 400 -155 263 37 429 224 480 538 29 185 -30 402 -155 568 -113 149 -310 276 -537 343 -168 50 -252 61 -509 64 -135 2 -265 2 -290 0z" />
      </g>

      <g className="loader__gota">
        <g transform="translate(0 1376) scale(0.1 -0.1)" fill={`url(#${gota})`}>
          <path d="M3720 5481 c0 -82 -25 -214 -61 -327 -19 -61 -100 -234 -223 -477 -246 -489 -286 -603 -286 -822 0 -163 30 -270 112 -402 145 -231 464 -360 728 -294 218 54 385 182 474 363 55 111 76 205 76 338 0 192 -50 348 -214 670 -237 465 -256 506 -286 595 -38 116 -57 209 -66 323 l-7 92 -123 0 -124 0 0 -59z m-286 -1291 c-32 -151 -9 -352 53 -458 37 -64 110 -135 169 -165 89 -45 115 -101 72 -151 -47 -55 -132 -31 -228 64 -162 157 -197 443 -88 708 17 40 32 72 33 70 2 -2 -3 -32 -11 -68z" />
        </g>
      </g>

      <ellipse className="loader__onda" cx="384" cy="1060" rx="46" ry="14" fill="none" stroke="#B8945A" strokeWidth="4" />
    </svg>
  )
}
