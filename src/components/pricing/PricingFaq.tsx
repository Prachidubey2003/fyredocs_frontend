import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RETENTION_SENTENCE } from './planContent';

const FAQ_ITEMS = [
  {
    id: 'guest',
    question: 'What does "guest" mean?',
    answer:
      'You can use every tool without creating an account. Guest jobs have smaller limits (file size and files per job), and your files are deleted as soon as processing finishes — nothing is kept on our servers afterwards.',
  },
  {
    id: 'retention',
    question: 'How does file retention work?',
    answer: `${RETENTION_SENTENCE} You can also delete your files manually at any time from your job history if you have an account.`,
  },
  {
    id: 'upgrade',
    question: 'How do I upgrade to Pro?',
    answer:
      'Create a free account first (or sign in), then choose Pro from your account. Upgrading raises your limits immediately — larger files, more files per job, and 30-day retention.',
  },
  {
    id: 'privacy',
    question: 'Is my data private?',
    answer:
      'Yes. Files are encrypted in transit over HTTPS, processed on our servers only to run the job you requested, and removed automatically when your plan’s retention window ends. We never read, share, or sell your documents.',
  },
] as const;

export function PricingFaq({ className }: { className?: string }) {
  return (
    <Accordion type="single" collapsible className={className}>
      {FAQ_ITEMS.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
