import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { EditSelection } from "@/features/admin/components/ProductEditor"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AdminCatalogOffer, AdminCatalogVariant } from "@/lib/catalog/types"
import { format_price } from "@/lib/shared/utils"

/**
 * Identifica la variante sin confundirla con otros colores del producto.
 * @param props Variante y formato del título.
 * @returns Nombre, imagen y SKU de la variante.
 */
function VariantIdentity({ variant, with_heading = false }: { variant: AdminCatalogVariant; with_heading?: boolean }) {
  const Title = with_heading ? "h3" : "span"
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img src={variant.image.url} alt="" loading="lazy" decoding="async" className="size-12 shrink-0 rounded-lg border bg-muted object-contain" />
      <div className="min-w-0 space-y-0.5 wrap-anywhere">
        <Title className="block text-sm leading-snug font-semibold">{variant.title}</Title>
        <p className="text-xs text-muted-foreground">{variant.brand} · {variant.color}</p>
        <p className="font-mono text-xs text-muted-foreground">SKU {variant.sku}</p>
      </div>
    </div>
  )
}

/**
 * Presenta el precio y las reglas de compra o indica que el canal no vende el SKU.
 * @param props Oferta del canal.
 * @returns Precio unitario, descuento vigente y reglas de cantidad.
 */
function ChannelOffer({ offer, edit }: { offer: AdminCatalogOffer | null; edit: () => void }) {
  if (offer === null) {
    return (
      <span className="inline-block rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
        No se vende
      </span>
    )
  }
  const { price, unit_price, discount_percentage, currency, conditions } = offer
  return (
    <>
      <p className="text-sm font-semibold tabular-nums">
        <span className="sr-only">Precio unitario: </span>
        {format_price(unit_price, currency)}
      </p>
      {discount_percentage !== null && discount_percentage > 0 && (
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-xs tabular-nums">
          <del className="text-muted-foreground"><span className="sr-only">Precio base: </span>{format_price(price, currency)}</del>
          <span className="font-medium text-emerald-700 dark:text-emerald-400">−{discount_percentage.toLocaleString("es-CR")} %</span>
        </p>
      )}
      <dl className="mt-2 grid max-w-52 grid-cols-3 gap-1.5 text-xs tabular-nums">
        <div>
          <dt className="text-muted-foreground" aria-label="Mínimo">Mín.</dt>
          <dd className="font-medium">{conditions.min_order_quantity.toLocaleString("es-CR")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground" aria-label="Máximo">Máx.</dt>
          <dd className="font-medium">{conditions.max_order_quantity.toLocaleString("es-CR")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Paso</dt>
          <dd className="font-medium">{conditions.step_quantity.toLocaleString("es-CR")}</dd>
        </div>
      </dl>
      <Button variant="outline" size="sm" className="mt-2" onClick={edit}>Editar</Button>
    </>
  )
}

/**
 * Compara las ofertas de cada SKU en una tabla o en tarjetas según el ancho disponible.
 * @param props Variantes de la página actual.
 * @returns Comparación de precios y condiciones B2C y B2B.
 */
export function AdminCatalogTable({ variants, on_edit }: { variants: AdminCatalogVariant[]; on_edit: (selection: EditSelection) => void }) {
  /** Abre solo la oferta existente del canal. @param variant Variante. @param channel Canal. @returns Sin valor. */
  function edit(variant: AdminCatalogVariant, channel: "b2c" | "b2b") {
    const offer = variant.offers[channel]
    if (offer) on_edit({ sku: variant.sku, channel, offer: { price: offer.price, ...offer.conditions } })
  }
  return (
    <>
      <div className="hidden lg:block">
        <Table className="table-fixed">
          <TableCaption className="sr-only">Precios y condiciones de compra por variante</TableCaption>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead scope="col" className="w-2/5 pl-5">Variante</TableHead>
              <TableHead scope="col" className="w-[30%] border-l px-4">B2C</TableHead>
              <TableHead scope="col" className="w-[30%] border-l px-4">B2B</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.sku}>
                <th scope="row" className="px-5 py-3 text-left font-normal">
                  <VariantIdentity variant={variant} />
                </th>
                <TableCell className="border-l px-4 py-3 align-top wrap-anywhere whitespace-normal">
                  <ChannelOffer offer={variant.offers.b2c} edit={() => edit(variant, "b2c")} />
                </TableCell>
                <TableCell className="border-l px-4 py-3 align-top wrap-anywhere whitespace-normal">
                  <ChannelOffer offer={variant.offers.b2b} edit={() => edit(variant, "b2b")} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul aria-label="Variantes del catálogo" className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:hidden">
        {variants.map((variant) => (
          <li key={variant.sku} className="min-w-0">
            <Card size="sm" className="h-full gap-3">
              <CardContent className="space-y-3">
                <VariantIdentity variant={variant} with_heading />
                <div className="grid grid-cols-2 divide-x rounded-lg border bg-muted/35">
                  <div className="min-w-0 space-y-1 p-2 wrap-anywhere sm:p-3">
                    <h4 className="text-xs font-semibold tracking-wide text-muted-foreground">B2C</h4>
                    <ChannelOffer offer={variant.offers.b2c} edit={() => edit(variant, "b2c")} />
                  </div>
                  <div className="min-w-0 space-y-1 p-2 wrap-anywhere sm:p-3">
                    <h4 className="text-xs font-semibold tracking-wide text-muted-foreground">B2B</h4>
                    <ChannelOffer offer={variant.offers.b2b} edit={() => edit(variant, "b2b")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
