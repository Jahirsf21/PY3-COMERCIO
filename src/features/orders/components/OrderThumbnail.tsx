import { useState } from "react"
import { PackageIcon } from "lucide-react"
import type { ProductImage } from "@/lib/catalog/types"
import { cn } from "@/lib/shared/utils"

type OrderThumbnailProps = {
  image: ProductImage | null
  items_count: number
  size?: "sm" | "md"
  className?: string
}

/**
 * Miniatura del primer producto de un pedido, con «+N» si trae más productos.
 * @param props Imagen del primer producto, cantidad de líneas y tamaño.
 * @returns Imagen del producto o un ícono de paquete si falta o no carga.
 */
export function OrderThumbnail({ image, items_count, size = "md", className }: OrderThumbnailProps) {
  const [failed_url, set_failed_url] = useState<string | null>(null)
  const show_image = image !== null && failed_url !== image.url
  const more = items_count - 1

  return (
    <div className={cn("relative shrink-0 rounded-xl bg-muted", size === "sm" ? "size-12" : "size-16 sm:size-20", className)}>
      {show_image ? (
        <img
          src={image.url}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          onError={() => set_failed_url(image.url)}
          className="size-full rounded-xl object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-muted-foreground">
          <PackageIcon aria-hidden="true" className={size === "sm" ? "size-5" : "size-7"} />
        </span>
      )}
      {more > 0 && (
        <span className="absolute -right-1.5 -bottom-1.5 flex h-5 min-w-6 items-center justify-center rounded-sm border-2 border-card bg-foreground px-1 text-[11px] font-bold text-background">
          +{more}
          <span className="sr-only"> {more === 1 ? "producto más" : "productos más"}</span>
        </span>
      )}
    </div>
  )
}
