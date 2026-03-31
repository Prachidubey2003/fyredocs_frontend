import type { DocSection } from '@/config/docs';
import { Lightbulb } from 'lucide-react';

interface DocsContentProps {
  sections: DocSection[];
}

const SectionParagraph = ({ content }: { content: string }) => (
  <p className="text-muted-foreground leading-relaxed">{content}</p>
);

const SectionSteps = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-muted-foreground">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
          {i + 1}
        </span>
        <span className="leading-relaxed">{item}</span>
      </li>
    ))}
  </ul>
);

const SectionTable = ({ tableData }: { tableData: { headers: string[]; rows: string[][] } }) => (
  <div className="overflow-x-auto rounded-lg border">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b bg-muted/50">
          {tableData.headers.map((header, i) => (
            <th key={i} className="px-4 py-2.5 text-left font-semibold text-foreground">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableData.rows.map((row, i) => (
          <tr key={i} className="border-b last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-2.5 text-muted-foreground">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SectionTip = ({ content }: { content: string }) => (
  <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
    <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
    <p className="text-sm text-foreground leading-relaxed">{content}</p>
  </div>
);

export const DocsContent = ({ sections }: DocsContentProps) => {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <div key={index}>
          {section.heading && (
            <h2 className="text-lg font-semibold mb-3">{section.heading}</h2>
          )}
          {section.type === 'paragraph' && <SectionParagraph content={section.content} />}
          {section.type === 'steps' && section.items && <SectionSteps items={section.items} />}
          {section.type === 'table' && section.tableData && <SectionTable tableData={section.tableData} />}
          {section.type === 'tip' && <SectionTip content={section.content} />}
          {section.type === 'formats' && section.content && <SectionParagraph content={section.content} />}
        </div>
      ))}
    </div>
  );
};
