import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { EditPdfTool } from '@/components/tools/EditPdfTool';

const EditPdfPage = () => {
  const tool = TOOLS['edit-pdf'];

  return (
    <ToolPageLayout tool={tool}>
      <EditPdfTool tool={tool} />
    </ToolPageLayout>
  );
};

export default EditPdfPage;
