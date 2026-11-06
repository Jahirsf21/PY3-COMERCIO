import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
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
 * Al presionarlo despliega un cuadro con el nombre completo y, como subtítulo, el tipo de usuario (B2C, B2B o ADMIN)
 * y el tipo de cliente; para un usuario B2B agrega la empresa.
 * @param props Propiedades del componente.
 * @param props.user Usuario con sesión iniciada.
 * @param props.className Clases adicionales para el botón.
 * @returns Botón del usuario activo con su cuadro de información.
 */
export function ActiveUserInfo({ user, className }: ActiveUserInfoProps) {
  const initials = get_initials(user.full_name)

  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Información de la cuenta de ${user.full_name}`}
        className={cn(
          "shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:ring-3 data-popup-open:ring-ring/50",
          className,
        )}
      >
        <Avatar size="lg">
          <AvatarFallback aria-hidden="true" className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="max-w-[calc(100vw-2rem)] p-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback aria-hidden="true" className="bg-primary font-semibold text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <PopoverHeader className="min-w-0">
            <PopoverTitle className="truncate text-base font-semibold">{user.full_name}</PopoverTitle>
            <PopoverDescription className="flex min-w-0 items-center gap-1.5 text-xs">
              <Badge variant="outline" className="shrink-0 font-semibold text-foreground">
                <span className="sr-only">Tipo de usuario: </span>
                {user.role}
              </Badge>
              <span className="truncate">
                <span className="sr-only">Tipo de cliente: </span>
                {get_role_label(user.role)}
                {user.company && <><span aria-hidden="true"> · </span><span className="sr-only">, empresa: </span>{user.company.name}</>}
              </span>
            </PopoverDescription>
          </PopoverHeader>
        </div>
      </PopoverContent>
    </Popover>
  )
}
