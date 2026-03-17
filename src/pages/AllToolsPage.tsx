import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ToolGrid } from '@/components/home/ToolGrid';
import { TOOL_CATEGORIES } from '@/config/tools';
import { ToolCategory } from '@/types';

const AllToolsPage = () => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | undefined>(undefined);

  return (
    <Layout>
      <div className="container py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">All PDF Tools</h1>
          <p className="text-muted-foreground text-lg">
            Everything you need to work with PDFs — free, fast, and secure.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => setActiveCategory(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All
          </button>
          {Object.entries(TOOL_CATEGORIES).map(([key, { name }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key as ToolCategory)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <ToolGrid category={activeCategory} />
      </div>
    </Layout>
  );
};

export default AllToolsPage;
