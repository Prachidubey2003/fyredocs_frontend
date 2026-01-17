import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { PasswordProtectTool } from '@/components/tools/PasswordProtectTool';

const ProtectPage = () => {
  const tool = TOOLS['password-protect'];

  return (
    <ToolPageLayout tool={tool}>
      <PasswordProtectTool tool={tool} />
    </ToolPageLayout>
  );
};

export default ProtectPage;
