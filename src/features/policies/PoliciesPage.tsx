import { useLayoutEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowLeftIcon, BookOpenCheckIcon, CalendarDaysIcon, ChevronRightIcon, LayoutListIcon } from "lucide-react"
import { ShopHeader } from "@/components/shop-header"
import { PoliciesFaq } from "@/features/policies/components/PoliciesFaq"
import { PoliciesSidebar } from "@/features/policies/components/PoliciesSidebar"
import { PolicySectionCard } from "@/features/policies/components/PolicySectionCard"
import { get_policy_selection, policies_document, policy_sections } from "@/lib/policies/policies"

export default function PoliciesPage() {
  const { hash, key: navigation_key } = useLocation()
  const selection = get_policy_selection(hash.slice(1))
  const active_id = selection.id
  const visible_sections = selection.type === "all" ? policy_sections : "section" in selection ? [selection.section] : []

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [navigation_key])

  return (
    <div className="min-h-dvh bg-background">
      <ShopHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-6">
        <header className="mb-6">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:size-14">
              <BookOpenCheckIcon aria-hidden="true" className="size-6 sm:size-7" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Políticas y Ayuda</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <CalendarDaysIcon aria-hidden="true" className="size-3.5 shrink-0" />
              <span>Última actualización: <time dateTime={policies_document.updated_at}>{policies_document.updated_label}</time></span>
            </p>
            <span className="rounded-full border border-input bg-background px-2.5 py-1">Versión {policies_document.version}</span>
          </div>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8">
          <PoliciesSidebar active_id={active_id} />
          <div data-slot="policies-content" className="min-w-0 space-y-5">
            {selection.type !== "all" && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                  <LayoutListIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p role="status" className="leading-6">
                    {selection.type === "subsection" && (
                      <>
                        <Link to={`/politicas-y-ayuda#${selection.section.id}`} className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{selection.section.title}</Link>
                        <ChevronRightIcon aria-hidden="true" className="mx-1 inline size-3.5" />
                      </>
                    )}
                    {selection.title}
                  </p>
                </div>
                <Link to="/politicas-y-ayuda" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
                  Ver todo
                </Link>
              </div>
            )}
            {visible_sections.map((section) => (
              <PolicySectionCard key={section.id} section={section} subsection={selection.type === "subsection" ? selection.subsection : undefined} />
            ))}
            {(selection.type === "all" || selection.type === "faq") && <PoliciesFaq />}
          </div>
        </div>
      </main>
    </div>
  )
}
