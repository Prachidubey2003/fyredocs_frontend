import { TOOLS } from '@/config/tools';
import { ToolId } from '@/types';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ToolWorkbench } from '@/components/tools/workbench/ToolWorkbench';

interface ToolPageProps {
  toolId: ToolId;
}

/** Generic page for every registry tool — layout + workbench, nothing else. */
const ToolPage = ({ toolId }: ToolPageProps) => {
  const tool = TOOLS[toolId];
  if (!tool) return null;

  return (
    <ToolPageLayout tool={tool}>
      <ToolWorkbench key={tool.id} tool={tool} />
    </ToolPageLayout>
  );
};

export default ToolPage;
