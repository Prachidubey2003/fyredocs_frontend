import { PageSpecificationTool } from '@/components/tools/PageSpecificationTool';

const RemovePagesPage = () => {
  return (
    <PageSpecificationTool
      toolId="remove-pages"
      actionLabel="Remove Pages"
      actionVerb="Remove"
      description="Enter the pages you want to remove from this PDF"
    />
  );
};

export default RemovePagesPage;
