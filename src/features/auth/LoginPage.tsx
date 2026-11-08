import { useRef, useState } from "react"
import type { SubmitEvent } from "react"
import { Link, Navigate, useLocation } from "react-router-dom"
import type { To } from "react-router-dom"
import { ArrowRightIcon, LoaderCircleIcon, LockIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldGroup } from "@/components/ui/field"
import { ShopFooter } from "@/components/shop-footer"
import { ShopHeader } from "@/components/shop-header"
import { LoginBackground } from "@/features/auth/components/LoginBackground"
import { LoginInputField } from "@/features/auth/components/LoginInputField"
import { LoginNoticeDialog } from "@/features/auth/components/LoginNoticeDialog"
import { validate_login_credentials } from "@/lib/auth/auth"
import { useAuth } from "@/lib/auth/authContext"
import type { LoginCredentials, LoginResult } from "@/lib/auth/types"
import { is_record } from "@/lib/shared/utils"

type LoginNotice = {
  title: string
  message: string
}

const notice_titles: Record<Exclude<LoginResult["status"], "success">, string> = {
  invalid_credentials: "Datos incorrectos",
  invalid_role: "Usuario sin rol válido",
  invalid_account: "Cuenta con datos incorrectos",
  error: "No pudimos iniciar sesión",
}

/**
 * Obtiene la ruta a la que se vuelve después de iniciar sesión a partir de location.state.from.
 * Acepta una ruta interna en texto o una ubicación con pathname; ignora cualquier otro valor y la propia ruta /login.
 * @param state Estado de navegación recibido, sin validar.
 * @returns Ruta de origen, o el catálogo si no hay una ruta válida.
 */
function get_return_route(state: unknown): To {
  const from = is_record(state) ? state.from : undefined
  if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && from !== "/login") return from
  if (is_record(from) && typeof from.pathname === "string" && from.pathname.startsWith("/") && from.pathname !== "/login") {
    return {
      pathname: from.pathname,
      search: typeof from.search === "string" ? from.search : "",
      hash: typeof from.hash === "string" ? from.hash : "",
    }
  }
  return "/"
}

/**
 * Pantalla de inicio de sesión con usuario y contraseña.
 * Muestra los campos vacíos debajo de cada campo y los demás resultados en un diálogo.
 * Con una sesión iniciada redirige a la ruta de origen o al catálogo.
 * @returns Formulario de inicio de sesión, o la redirección si ya hay una sesión.
 */
export default function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const form_ref = useRef<HTMLFormElement>(null)
  const submitting = useRef(false)
  const [credentials, set_credentials] = useState<LoginCredentials>({ username: "", password: "" })
  const [errors, set_errors] = useState<Partial<Record<keyof LoginCredentials, string>>>({})
  const [is_submitting, set_is_submitting] = useState(false)
  const [notice, set_notice] = useState<LoginNotice | null>(null)

  /**
   * Actualiza un campo del formulario y limpia su error.
   * @param field Campo que cambia.
   * @param value Valor ingresado.
   * @returns No retorna ningún valor.
   */
  function change_field(field: keyof LoginCredentials, value: string): void {
    set_credentials((previous) => ({ ...previous, [field]: value }))
    set_errors((previous) => ({ ...previous, [field]: undefined }))
  }

  /**
   * Valida los campos vacíos e inicia la sesión mediante AuthContext.
   * Impide envíos repetidos, enfoca el primer campo con error y muestra en un diálogo los demás resultados.
   * Al iniciar sesión, la redirección ocurre al volver a renderizar con el usuario activo.
   * @param event Evento de envío del formulario.
   * @returns Promesa que termina al recibir el resultado del inicio de sesión.
   */
  async function submit_login(event: SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (submitting.current) return
    const validation_errors = validate_login_credentials(credentials)
    set_errors(validation_errors)
    if (Object.keys(validation_errors).length > 0) {
      window.requestAnimationFrame(() => {
        form_ref.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus()
      })
      return
    }

    submitting.current = true
    set_is_submitting(true)
    try {
      const result = await login(credentials)
      if (result.status !== "success") {
        set_notice({ title: notice_titles[result.status], message: result.message })
        set_credentials((previous) => ({ ...previous, password: "" }))
      }
    } finally {
      submitting.current = false
      set_is_submitting(false)
    }
  }

  /**
   * Cierra el aviso y devuelve el foco al campo de contraseña para reintentar.
   * @param open Indica si el diálogo debe permanecer abierto.
   * @returns No retorna ningún valor.
   */
  function change_notice_open(open: boolean): void {
    if (open) return
    set_notice(null)
    window.requestAnimationFrame(() => document.getElementById("login-password")?.focus())
  }

  if (user) return <Navigate to={get_return_route(location.state)} replace />

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ShopHeader />
      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
        <LoginBackground />
        <section aria-labelledby="login-title" className="w-full max-w-[28rem] rounded-[2rem] bg-card px-6 py-6 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.18)] ring-1 ring-foreground/5 sm:px-10 sm:py-8">
          <Link to="/" aria-label="Ir al catálogo" className="mx-auto block w-fit rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <img src="/PY3-COMERCIO/icono.svg" alt="Space Shop" className="h-20 w-auto object-contain sm:h-24 dark:invert" />
          </Link>
          <h1 id="login-title" className="mt-4 text-center text-3xl font-bold tracking-tight">Iniciar sesión</h1>
          <p id="login-description" className="mx-auto mt-2 max-w-xs text-center text-sm text-muted-foreground">
            Ingresa con tu usuario y contraseña para comprar con los mejores precios.
          </p>
          <form ref={form_ref} noValidate onSubmit={submit_login} aria-describedby="login-description" aria-busy={is_submitting} className="mt-6">
            <fieldset disabled={is_submitting} className="min-w-0">
              <legend className="sr-only">Credenciales</legend>
              <FieldGroup className="gap-5">
                <LoginInputField
                  id="login-username"
                  name="username"
                  label="Usuario"
                  icon={UserIcon}
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Ingresa tu usuario"
                  value={credentials.username}
                  error={errors.username}
                  onChange={(event) => change_field("username", event.currentTarget.value)}
                />
                <LoginInputField
                  id="login-password"
                  name="password"
                  label="Contraseña"
                  icon={LockIcon}
                  password
                  required
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={credentials.password}
                  error={errors.password}
                  onChange={(event) => change_field("password", event.currentTarget.value)}
                />
              </FieldGroup>
            </fieldset>
            <Button type="submit" disabled={is_submitting} size="lg" className="mt-6 h-12 w-full cursor-pointer rounded-xl text-base">
              {is_submitting && <LoaderCircleIcon aria-hidden="true" className="size-5 motion-safe:animate-spin" />}
              {is_submitting ? "Verificando…" : "Ingresar"}
              {!is_submitting && <ArrowRightIcon aria-hidden="true" className="size-5" />}
            </Button>
          </form>
        </section>
      </main>
      <ShopFooter compact />
      <LoginNoticeDialog
        open={notice !== null}
        title={notice?.title ?? ""}
        message={notice?.message ?? ""}
        on_open_change={change_notice_open}
      />
    </div>
  )
}
