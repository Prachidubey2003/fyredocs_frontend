import { TOOLS } from '@/config/tools';
import { ToolPageLayout } from '@/components/tools/ToolPageLayout';
import { AddPageNumbersTool } from '@/components/tools/AddPageNumbersTool';

const AddPageNumbersPage = () => {
  const tool = TOOLS['add-page-numbers'];

  return (
    <ToolPageLayout tool={tool}>
      <AddPageNumbersTool tool={tool} />
    </ToolPageLayout>
  );
};

export default AddPageNumbersPage;
