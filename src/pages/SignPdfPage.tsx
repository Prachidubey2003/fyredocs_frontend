import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { SignPdfTool } from '@/components/tools/SignPdfTool';

const SignPdfPage = () => {
  const tool = TOOLS['sign-pdf'];

  return (
    <ToolPageLayout tool={tool}>
      <SignPdfTool tool={tool} />
    </ToolPageLayout>
  );
};

export default SignPdfPage;
