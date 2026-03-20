import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { UnlockTool } from '@/components/tools/UnlockTool';

const UnlockPage = () => {
  const tool = TOOLS['unlock-pdf'];

  return (
    <ToolPageLayout tool={tool}>
      <UnlockTool tool={tool} />
    </ToolPageLayout>
  );
};

export default UnlockPage;
