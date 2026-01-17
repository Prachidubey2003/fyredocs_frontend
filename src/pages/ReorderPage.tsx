import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { ReorderTool } from '@/components/tools/ReorderTool';

const ReorderPage = () => {
  const tool = TOOLS['reorder'];

  return (
    <ToolPageLayout tool={tool}>
      <ReorderTool tool={tool} />
    </ToolPageLayout>
  );
};

export default ReorderPage;
