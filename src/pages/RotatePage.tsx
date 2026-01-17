import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { RotateTool } from '@/components/tools/RotateTool';

const RotatePage = () => {
  const tool = TOOLS['rotate'];

  return (
    <ToolPageLayout tool={tool}>
      <RotateTool tool={tool} />
    </ToolPageLayout>
  );
};

export default RotatePage;
