import { File, FileSpreadsheet, FileText, FileType2, Image as ImageIcon, Presentation, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconSpec {
  icon: LucideIcon;
  className: string;
}

function specFor(fileType?: string): IconSpec {
  const t = (fileType ?? '').toLowerCase().replace(/^\./, '');
  if (['pdf'].includes(t)) return { icon: FileType2, className: 'text-destructive' };
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(t)) return { icon: FileText, className: 'text-info' };
  if (['xls', 'xlsx', 'ods', 'csv'].includes(t)) return { icon: FileSpreadsheet, className: 'text-success' };
  if (['ppt', 'pptx', 'odp'].includes(t)) return { icon: Presentation, className: 'text-warning' };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'bmp'].includes(t)) return { icon: ImageIcon, className: 'text-primary' };
  return { icon: File, className: 'text-muted-foreground' };
}

export function FileTypeIcon({ fileType, className }: { fileType?: string; className?: string }) {
  const { icon: Icon, className: tone } = specFor(fileType);
  return <Icon className={cn('h-5 w-5', tone, className)} aria-hidden />;
}
