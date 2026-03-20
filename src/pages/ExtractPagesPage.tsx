import { PageSpecificationTool } from '@/components/tools/PageSpecificationTool';

const ExtractPagesPage = () => {
  return (
    <PageSpecificationTool
      toolId="extract-pages"
      actionLabel="Extract Pages"
      actionVerb="Extract"
      description="Enter the pages you want to extract into a new PDF"
    />
  );
};

export default ExtractPagesPage;
