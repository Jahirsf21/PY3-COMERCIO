import { useId, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  BookOpenIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  FileTextIcon,
  ListTreeIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
  TruckIcon,
  type LucideIcon,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { policies_index } from "@/lib/policies/policies"
import { cn } from "@/lib/shared/utils"

const policy_icons: Record<string, LucideIcon> = {
  "terminos-y-condiciones": FileTextIcon,
  "politica-de-devoluciones": RefreshCcwIcon,
  "politica-de-envios": TruckIcon,
  "politica-de-privacidad": ShieldCheckIcon,
  "preguntas-frecuentes": CircleHelpIcon,
}

const index_link_class = "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"

type PoliciesNavigationProps = {
  active_id: string
  expanded_section_id: string | null
  onSectionOpenChange: (section_id: string, open: boolean) => void
  onNavigate?: () => void
}

function PoliciesNavigation({ active_id, expanded_section_id, onSectionOpenChange, onNavigate }: PoliciesNavigationProps) {
  const navigation_id = useId()

  return (
    <nav aria-label="Índice de políticas y ayuda">
      <SidebarContent className="overflow-visible">
        <SidebarGroup className="p-3">
          <Link
            to="/politicas-y-ayuda"
            onClick={onNavigate}
            aria-current={active_id === "" ? "location" : undefined}
            className={cn(index_link_class, "mb-3 border border-input bg-background", active_id === "" ? "text-foreground" : "text-muted-foreground")}
          >
            <BookOpenIcon aria-hidden="true" className="size-4 shrink-0" />
            Toda la información
          </Link>
          <SidebarMenu className="gap-3">
            {policies_index.map((section) => {
              const Icon = policy_icons[section.id]
              const in_section = active_id === section.id || section.subsections.some((item) => item.id === active_id)
              const has_subsections = section.subsections.length > 0
              const is_open = expanded_section_id === section.id
              const panel_id = `${navigation_id}-${section.id}`

              return (
                <SidebarMenuItem key={section.id}>
                  <Collapsible
                    open={is_open}
                    onOpenChange={(open) => onSectionOpenChange(section.id, open)}
                  >
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/politicas-y-ayuda#${section.id}`}
                        onClick={(event) => {
                          if (has_subsections && active_id === section.id && event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                            event.preventDefault()
                            onSectionOpenChange(section.id, !is_open)
                            return
                          }
                          onNavigate?.()
                        }}
                        aria-current={active_id === section.id ? "location" : undefined}
                        aria-expanded={has_subsections ? is_open : undefined}
                        aria-controls={has_subsections && is_open ? panel_id : undefined}
                        className={cn(index_link_class, "min-w-0 flex-1", in_section ? "bg-sidebar-accent text-foreground" : "text-muted-foreground")}
                      >
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                        {section.title}
                      </Link>
                      {has_subsections && (
                        <CollapsibleTrigger
                          aria-label={`${is_open ? "Contraer" : "Expandir"} ${section.title}`}
                          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronDownIcon aria-hidden="true" className={cn("size-4 transition-transform motion-reduce:transition-none", is_open && "rotate-180")} />
                        </CollapsibleTrigger>
                      )}
                    </div>
                    {has_subsections && (
                      <CollapsibleContent id={panel_id}>
                        <SidebarMenuSub className="mt-1 mr-0 ml-5 gap-0">
                          {section.subsections.map((subsection) => (
                            <SidebarMenuSubItem key={subsection.id}>
                              <SidebarMenuSubButton
                                render={<Link to={`/politicas-y-ayuda#${subsection.id}`} />}
                                onClick={onNavigate}
                                size="sm"
                                isActive={active_id === subsection.id}
                                aria-current={active_id === subsection.id ? "location" : undefined}
                                className="h-auto min-h-9 py-2 leading-relaxed text-muted-foreground"
                              >
                                {subsection.title}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </nav>
  )
}

export function PoliciesSidebar({ active_id }: { active_id: string }) {
  const [mobile_open, set_mobile_open] = useState(false)
  const { key: navigation_key } = useLocation()
  const [expansion, set_expansion] = useState<{ navigation_key: string; section_id: string | null } | null>(null)
  const active_section_id = policies_index.find((section) => (
    section.subsections.length > 0 && (section.id === active_id || section.subsections.some((item) => item.id === active_id))
  ))?.id ?? null
  const expanded_section_id = expansion?.navigation_key === navigation_key ? expansion.section_id : active_section_id

  function change_section_open(section_id: string, open: boolean) {
    set_expansion({ navigation_key, section_id: open ? section_id : null })
  }

  return (
    <aside className="sticky top-0 z-30 min-w-0 bg-background py-2 lg:top-6 lg:py-0">
      <div className="hidden overflow-hidden rounded-2xl border border-input bg-sidebar lg:block">
        <h2 className="flex items-center gap-2 border-b border-input px-5 py-4 text-sm font-semibold">
          <ListTreeIcon aria-hidden="true" className="size-4" />
          Índice de contenidos
        </h2>
        <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto">
          <PoliciesNavigation active_id={active_id} expanded_section_id={expanded_section_id} onSectionOpenChange={change_section_open} />
        </div>
      </div>
      <Collapsible open={mobile_open} onOpenChange={set_mobile_open} className="rounded-xl border border-input bg-sidebar lg:hidden">
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ListTreeIcon aria-hidden="true" className="size-4" />
          Índice de contenidos
          <ChevronDownIcon aria-hidden="true" className={cn("ml-auto size-4 transition-transform motion-reduce:transition-none", mobile_open && "rotate-180")} />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-input">
          <div className="max-h-[65dvh] overflow-y-auto">
            <PoliciesNavigation active_id={active_id} expanded_section_id={expanded_section_id} onSectionOpenChange={change_section_open} onNavigate={() => set_mobile_open(false)} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  )
}
