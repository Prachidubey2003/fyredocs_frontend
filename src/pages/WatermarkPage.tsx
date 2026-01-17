import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { WatermarkTool } from '@/components/tools/WatermarkTool';

const WatermarkPage = () => {
  const tool = TOOLS['watermark'];

  return (
    <ToolPageLayout tool={tool}>
      <WatermarkTool tool={tool} />
    </ToolPageLayout>
  );
};

export default WatermarkPage;
