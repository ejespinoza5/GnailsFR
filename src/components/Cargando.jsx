import Loader from './loader/Loader'

/** Pantalla completa mientras se comprueba la sesión o se abre una sección. */
export default function Cargando({ mensaje }) {
  return <Loader variante="pantalla" mensaje={mensaje} />
}
