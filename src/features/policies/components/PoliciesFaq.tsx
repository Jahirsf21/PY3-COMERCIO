import { CircleHelpIcon, MessageCircleQuestionIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { faq_section } from "@/lib/policies/policies"

export function PoliciesFaq() {
  return (
    <section aria-labelledby={faq_section.id} className="overflow-hidden rounded-2xl border border-input bg-card">
      <header className="flex items-center gap-3 border-b border-input bg-muted/30 p-5 sm:px-6">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-input bg-background">
          <CircleHelpIcon aria-hidden="true" className="size-5" />
        </span>
        <h2 id={faq_section.id} className="text-lg font-semibold sm:text-xl">{faq_section.title}</h2>
      </header>
      <Accordion multiple hiddenUntilFound className="px-5 py-2 sm:px-6">
        {faq_section.questions.map(({ question, answer }) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger className="cursor-pointer items-start gap-3 py-4 leading-6">
              <MessageCircleQuestionIcon aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">{question}</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 leading-7 text-muted-foreground">{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
