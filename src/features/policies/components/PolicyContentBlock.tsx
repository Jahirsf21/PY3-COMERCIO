import type { PolicyBlock } from "@/lib/policies/types"

export function PolicyContentBlock({ block }: { block: PolicyBlock }) {
  if (typeof block === "string") return <p>{block}</p>

  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul"

    return (
      <List className={block.ordered ? "list-decimal space-y-2 pl-5" : "list-disc space-y-2 pl-5"}>
        {block.items.map((item) => (
          <li key={typeof item === "string" ? item : item.label} className="marker:text-foreground/60">
            {typeof item === "string" ? item : <><strong className="font-medium text-foreground">{item.label}</strong> {item.text}</>}
          </li>
        ))}
      </List>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-input">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Costos de envío según el subtotal de la orden</caption>
        <thead className="border-b border-input bg-muted/60 text-foreground">
          <tr>
            {block.headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-medium">{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row[0]} className="not-last:border-b not-last:border-input">
              {row.map((cell, index) => <td key={index} className="px-4 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
