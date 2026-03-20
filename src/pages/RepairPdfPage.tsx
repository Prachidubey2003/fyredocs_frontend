import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { RepairPdfTool } from '@/components/tools/RepairPdfTool';

const RepairPdfPage = () => {
  const tool = TOOLS['repair-pdf'];

  return (
    <ToolPageLayout tool={tool}>
      <RepairPdfTool tool={tool} />
    </ToolPageLayout>
  );
};

export default RepairPdfPage;
