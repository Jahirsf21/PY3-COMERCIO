import { FileTextIcon, RefreshCcwIcon, ShieldCheckIcon, TruckIcon, type LucideIcon } from "lucide-react"
import { PolicyContentBlock } from "@/features/policies/components/PolicyContentBlock"
import type { PolicySection, PolicySubsection } from "@/lib/policies/types"

const policy_icons: Record<string, LucideIcon> = {
  "terminos-y-condiciones": FileTextIcon,
  "politica-de-devoluciones": RefreshCcwIcon,
  "politica-de-envios": TruckIcon,
  "politica-de-privacidad": ShieldCheckIcon,
}

export function PolicySectionCard({ section, subsection }: { section: PolicySection; subsection?: PolicySubsection }) {
  const Icon = policy_icons[section.id]
  const heading_id = subsection?.id ?? section.id

  return (
    <section aria-labelledby={heading_id} className="overflow-hidden rounded-2xl border border-input bg-card">
      <header className="flex items-center gap-3 border-b border-input bg-muted/30 p-5 sm:px-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          {subsection && <p className="mb-1 text-xs text-muted-foreground">{section.title}</p>}
          <h2 id={heading_id} className="text-lg font-semibold sm:text-xl">{subsection?.title ?? section.title}</h2>
        </div>
      </header>
      <div className="space-y-8 p-5 sm:p-6">
        {subsection ? (
          <div className="space-y-3 text-sm leading-7 text-muted-foreground">
            {subsection.blocks.map((block, index) => <PolicyContentBlock key={index} block={block} />)}
          </div>
        ) : section.subsections.map((item) => (
          <section key={item.id} aria-labelledby={item.id}>
            <h3 id={item.id} className="text-base font-semibold">{item.title}</h3>
            <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
              {item.blocks.map((block, index) => <PolicyContentBlock key={index} block={block} />)}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
