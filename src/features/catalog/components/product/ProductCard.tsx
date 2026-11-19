import { Link } from "react-router-dom"
import { StarIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProductHit } from "@/lib/catalog/types"
import { ProductImagePreview } from "@/features/catalog/components/product/ProductImagePreview"
import { AddToCartDialog } from "@/features/catalog/components/product/AddToCartDialog"
import { format_price } from "@/lib/shared/utils"
import { get_product_unit_price } from "@/lib/cart/cart"
import { product_path } from "@/lib/navigation/routes"

export function ProductCard({ hit }: { hit: ProductHit }) {
  return (
    <Card className="min-w-0 gap-2 rounded-2xl pt-3 [--card-spacing:--spacing(2)] sm:pt-3 sm:[--card-spacing:--spacing(3)]">
      <CardContent>
        <ProductImagePreview image={hit.image} title={hit.title} />
      </CardContent>
      <CardHeader className="gap-2">
        <CardDescription className="text-xs font-semibold tracking-widest uppercase">{hit.brand}</CardDescription>
        <CardTitle className="text-sm font-semibold sm:text-base">
          <h2>{hit.title}</h2>
        </CardTitle>
        {hit.categories.length > 0 && (
          <CardDescription className="text-xs">
            {hit.categories[0] + " · " + hit.categories[1] }
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-2">
        <p
          className="flex items-center gap-1 text-sm font-medium"
          aria-label={`Calificación: ${hit.rating} de 5`}
        >
          <StarIcon
            aria-hidden="true"
            className="size-4 fill-amber-400 text-amber-500"
          />
          {hit.rating}
        </p>
        <p className="font-heading text-base font-bold sm:text-lg">
          {format_price(get_product_unit_price(hit), hit.currency)}
        </p>
        {hit.on_discount && hit.discount && (
          <p className="text-xs text-muted-foreground">
            <span className="line-through">{format_price(hit.price, hit.currency)}</span> · {hit.discount.percentage}% de descuento
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto flex-col gap-2">
        <AddToCartDialog hit={hit} />
        <Link
          to={product_path(hit.product_id, { variante: hit.sku })}
          className="inline-flex min-h-9 w-full items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver detalles
        </Link>
      </CardFooter>
    </Card>
  );
}
