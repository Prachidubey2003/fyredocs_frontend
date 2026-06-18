import { Link } from 'react-router-dom';
import { Combine, FileDown, FileUp, Minimize2, ScanText, Wand2, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuickAction {
  label: string;
  hint: string;
  to: string;
  icon: LucideIcon;
}

const ACTIONS: QuickAction[] = [
  { label: 'Merge PDF', hint: 'Combine files', to: '/merge-pdf', icon: Combine },
  { label: 'Compress', hint: 'Shrink size', to: '/compress-pdf', icon: Minimize2 },
  { label: 'PDF → Word', hint: 'Convert out', to: '/pdf-to-word', icon: FileDown },
  { label: 'Convert to PDF', hint: 'Office → PDF', to: '/word-to-pdf', icon: FileUp },
  { label: 'OCR', hint: 'Make searchable', to: '/ocr-pdf', icon: ScanText },
  { label: 'All tools', hint: 'Browse', to: '/all-tools', icon: Wand2 },
];

/** Prominent, low-friction entry points to the most common tasks. */
export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {ACTIONS.map((a) => (
        <Link key={a.label} to={a.to} className="block">
          <Card className="group flex h-full flex-col items-start gap-2 p-3 transition-colors hover:border-primary/40 hover:bg-muted/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <a.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-medium leading-tight">{a.label}</span>
            <span className="text-caption text-muted-foreground">{a.hint}</span>
          </Card>
        </Link>
      ))}
    </div>
  );
}
