import { LogOutIcon, XIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth/authContext"
import { get_role_label } from "@/lib/auth/auth"
import type { User } from "@/lib/auth/types"
import { cn } from "@/lib/shared/utils"

type ActiveUserInfoProps = {
  user: User
  className?: string
}

/**
 * Obtiene las iniciales de un nombre completo para mostrarlas en el avatar.
 * @param full_name Nombre completo del usuario.
 * @returns Hasta dos iniciales en mayúscula.
 */
function get_initials(full_name: string): string {
  return full_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase("es-CR"))
    .join("")
}

/**
 * Botón circular con las iniciales del usuario activo.
 * Al presionarlo despliega un panel lateral con el nombre completo y el tipo de usuario (B2C, B2B o ADMIN)
 * y el tipo de cliente; para un usuario B2B agrega la empresa. Incluye el botón para cerrar sesión.
 * @param props Propiedades del componente.
 * @param props.user Usuario con sesión iniciada.
 * @param props.className Clases adicionales para el botón.
 * @returns Botón del usuario activo con su panel lateral de información.
 */
export function ActiveUserInfo({ user, className }: ActiveUserInfoProps) {
  const { logout } = useAuth()
  const initials = get_initials(user.full_name)

  /**
   * Cierra la sesión del usuario activo y confirma la acción con un aviso.
   * El panel desaparece junto con el botón del usuario, porque el encabezado deja de tener usuario activo.
   * @returns No retorna ningún valor.
   */
  function handle_logout(): void {
    logout()
    toast.add({ title: "Sesión cerrada", description: "Vuelve a iniciar sesión para usar tu carrito.", type: "success" })
  }

  return (
    <Sheet>
      <SheetTrigger
        aria-label={`Información de la cuenta de ${user.full_name}`}
        className={cn(
          "shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:ring-3 data-popup-open:ring-ring/50",
          className,
        )}
      >
        <Avatar size="lg">
          <AvatarFallback aria-hidden="true" className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="max-h-dvh gap-0 overflow-hidden p-0 data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:sm:max-w-md motion-reduce:transition-none"
      >
        <SheetHeader className="shrink-0 border-b border-input pr-14">
          <SheetTitle>Mi cuenta</SheetTitle>
        </SheetHeader>
        <SheetClose
          aria-label="Cerrar información de la cuenta"
          render={<Button type="button" variant="ghost" size="icon" className="absolute top-3 right-3 cursor-pointer" />}
        >
          <XIcon aria-hidden="true" />
        </SheetClose>
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <div className="flex items-start gap-3 p-4">
            <Avatar size="lg">
              <AvatarFallback aria-hidden="true" className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <h2 className="break-words text-base font-semibold">{user.full_name}</h2>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant="outline" className="shrink-0 font-semibold text-foreground">
                  <span className="sr-only">Tipo de usuario: </span>
                  {user.role}
                </Badge>
                <span className="min-w-0 break-words">
                  <span className="sr-only">Tipo de cliente: </span>
                  {get_role_label(user.role)}
                  {user.company && <><span aria-hidden="true"> · </span><span className="sr-only">, empresa: </span>{user.company.name}</>}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="shrink-0 border-t border-input pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" onClick={handle_logout} className="h-10 w-full cursor-pointer gap-2">
            <LogOutIcon aria-hidden="true" className="size-4" />
            Cerrar sesión
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
