import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { OcrTool } from '@/components/tools/OcrTool';

const OcrPage = () => {
  const tool = TOOLS['ocr'];

  return (
    <ToolPageLayout tool={tool}>
      <OcrTool tool={tool} />
    </ToolPageLayout>
  );
};

export default OcrPage;
