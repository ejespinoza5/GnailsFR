import { useRef, useState } from 'react'
import { Camera, KeyRound, MonitorSmartphone, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/auth.service'
import { passwordValida } from '../utils/password'
import Encabezado from '../components/layout/Encabezado'
import Avatar from '../components/ui/Avatar'
import Alerta from '../components/ui/Alerta'
import CampoForm from '../components/ui/CampoForm'
import Campo from '../components/Campo'
import ReglasPassword from '../components/ReglasPassword'
import BotonConfirmar from '../components/ui/BotonConfirmar'
import Loader from '../components/loader/Loader'
import { useAvisos } from '../components/ui/Avisos'
import PreferenciasNotificaciones from '../components/notificaciones/PreferenciasNotificaciones'

const MAX_FOTO = 5 * 1024 * 1024

export default function Cuenta() {
  const { usuario } = useAuth()
  return (
    <div className="pagina-estrecha cuenta">
      <Encabezado titulo="Mi cuenta">Tu foto, tus datos y la seguridad de tu acceso.</Encabezado>
      <div className="cuenta__secciones">
        <Perfil key={usuario.id} />
        <PreferenciasNotificaciones esClienta={usuario.rol === 'cliente'} />
        {usuario.tienePassword ? <CambiarPassword /> : <CuentaGoogle />}
        <Sesiones />
      </div>
    </div>
  )
}

function Perfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const [form, setForm] = useState({ nombre: usuario.nombre, telefono: usuario.telefono ?? '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [errorFoto, setErrorFoto] = useState('')
  const archivo = useRef(null)
  const avisar = useAvisos()

  const sinCambios = form.nombre.trim() === usuario.nombre && (form.telefono.trim() || null) === (usuario.telefono ?? null)

  const elegirFoto = async (e) => {
    const foto = e.target.files?.[0]
    e.target.value = '' // permite volver a elegir el mismo archivo
    if (!foto) return
    setErrorFoto('')
    if (!foto.type.startsWith('image/')) return setErrorFoto('Elige una imagen (JPG, PNG o WebP).')
    if (foto.size > MAX_FOTO) return setErrorFoto('La foto pesa más de 5 MB. Elige una más liviana.')

    setSubiendo(true)
    try {
      const { usuario: u } = await authService.subirFoto(foto)
      actualizarUsuario(u)
      avisar('Foto actualizada')
    } catch (err) {
      setErrorFoto(err.campos?.foto ?? err.message)
    } finally {
      setSubiendo(false)
    }
  }

  const quitarFoto = async () => {
    try {
      const { usuario: u } = await authService.quitarFoto()
      actualizarUsuario(u)
      avisar('Foto eliminada')
    } catch (err) {
      setErrorFoto(err.message)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    try {
      const { usuario: u } = await authService.actualizarPerfil({ nombre: form.nombre, telefono: form.telefono || null })
      actualizarUsuario(u)
      setForm({ nombre: u.nombre, telefono: u.telefono ?? '' })
      avisar('Datos guardados')
    } catch (err) {
      setErrores({ general: err.message, ...(err.campos ?? {}) })
    } finally {
      setGuardando(false)
    }
  }

  // Las fotos subidas tienen URL propia (/api/avatares/…); las de Google son externas.
  const fotoPropia = usuario.avatarUrl?.startsWith('/api/avatares/')

  return (
    <section className="seccion" aria-labelledby="t-perfil">
      <h2 id="t-perfil" className="seccion__titulo">Tus datos</h2>

      <div className="foto-perfil">
        <div className="foto-perfil__imagen">
          <Avatar nombre={usuario.nombre} url={usuario.avatarUrl} tamano={88} />
          {subiendo && (
            <span className="foto-perfil__cargando">
              <Loader mensaje="" />
            </span>
          )}
        </div>
        <div className="foto-perfil__acciones">
          <input ref={archivo} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden onChange={elegirFoto} />
          <button type="button" className="boton boton--secundario boton--sm" onClick={() => archivo.current.click()} disabled={subiendo}>
            <Camera size={16} aria-hidden="true" /> {usuario.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {fotoPropia && (
            <BotonConfirmar className="boton boton--fantasma-peligro boton--sm" pregunta="¿Quitar la foto?" confirmar="Quitar" onConfirmar={quitarFoto} disabled={subiendo}>
              <Trash2 size={15} aria-hidden="true" /> Quitar
            </BotonConfirmar>
          )}
          <p className="campo__ayuda">JPG, PNG o WebP de hasta 5 MB. La recortamos en cuadrado y la optimizamos.</p>
        </div>
      </div>
      <Alerta>{errorFoto}</Alerta>

      <form className="formulario" onSubmit={guardar} noValidate>
        <CampoForm id="cu-nombre" etiqueta="Nombre" error={errores.nombre}>
          <input id="cu-nombre" className="control" autoComplete="name" maxLength={100} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </CampoForm>
        <CampoForm id="cu-tel" etiqueta="Teléfono o WhatsApp" opcional error={errores.telefono} ayuda="Solo lo usa el salón para avisarte cambios en tus citas.">
          <input id="cu-tel" className="control" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="+593 99 123 4567" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </CampoForm>
        <CampoForm id="cu-email" etiqueta="Correo electrónico" ayuda="Es tu usuario para entrar; no se puede cambiar desde aquí.">
          <input id="cu-email" className="control" value={usuario.email} readOnly disabled />
        </CampoForm>
        <Alerta>{errores.general}</Alerta>
        <div className="formulario__acciones">
          <button type="submit" className="boton" disabled={guardando || sinCambios}>
            {guardando ? 'Guardando…' : 'Guardar datos'}
          </button>
        </div>
      </form>
    </section>
  )
}

function CambiarPassword() {
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const avisar = useAvisos()

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((er) => ({ ...er, [name]: undefined, general: undefined }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    const nuevos = {}
    if (!form.actual) nuevos.actual = 'Escribe tu contraseña actual'
    if (!passwordValida(form.nueva)) nuevos.nueva = 'La contraseña no cumple todos los requisitos'
    if (form.confirmar !== form.nueva) nuevos.confirmar = 'Las contraseñas no coinciden'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setGuardando(true)
    try {
      const { mensaje } = await authService.cambiarPassword(form.actual, form.nueva)
      setForm({ actual: '', nueva: '', confirmar: '' })
      avisar(mensaje)
    } catch (err) {
      setErrores({ general: err.campos ? undefined : err.message, ...(err.campos ?? {}) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="seccion" aria-labelledby="t-pass">
      <h2 id="t-pass" className="seccion__titulo">Contraseña</h2>
      <p className="seccion__texto">Al cambiarla cerramos tu sesión en los demás dispositivos y te avisamos por correo.</p>
      <form className="formulario" onSubmit={guardar} noValidate>
        <Campo etiqueta="Contraseña actual" tipo="password" name="actual" autoComplete="current-password" maxLength={128} value={form.actual} onChange={cambiar} error={errores.actual} />
        <Campo
          etiqueta="Nueva contraseña"
          tipo="password"
          name="nueva"
          autoComplete="new-password"
          maxLength={128}
          value={form.nueva}
          onChange={cambiar}
          error={errores.nueva}
          ayuda={form.nueva && <ReglasPassword password={form.nueva} />}
        />
        <Campo etiqueta="Repite la nueva contraseña" tipo="password" name="confirmar" autoComplete="new-password" maxLength={128} value={form.confirmar} onChange={cambiar} error={errores.confirmar} />
        <Alerta>{errores.general}</Alerta>
        <div className="formulario__acciones">
          <button type="submit" className="boton" disabled={guardando}>
            <KeyRound size={16} aria-hidden="true" /> {guardando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  )
}

function CuentaGoogle() {
  return (
    <section className="seccion" aria-labelledby="t-pass">
      <h2 id="t-pass" className="seccion__titulo">Contraseña</h2>
      <p className="seccion__texto">
        Tu cuenta entra con <strong>Google</strong>, así que no tiene contraseña propia. La seguridad de tu acceso la cuida tu cuenta de Google.
      </p>
    </section>
  )
}

function Sesiones() {
  const { logoutTodas } = useAuth()
  const [saliendo, setSaliendo] = useState(false)
  return (
    <section className="seccion" aria-labelledby="t-sesiones">
      <h2 id="t-sesiones" className="seccion__titulo">Sesiones</h2>
      <p className="seccion__texto">¿Entraste desde un celular o computadora que no es tuyo? Cierra la sesión en todos lados.</p>
      <BotonConfirmar
        className="boton boton--secundario"
        pregunta="¿Cerrar en todos tus dispositivos?"
        confirmar="Sí, cerrar"
        onConfirmar={async () => {
          setSaliendo(true)
          await logoutTodas()
        }}
      >
        <MonitorSmartphone size={17} aria-hidden="true" /> Cerrar sesión en todos mis dispositivos
      </BotonConfirmar>
      {saliendo && <Loader variante="superpuesto" mensaje="Cerrando sesión…" />}
    </section>
  )
}
