import { useState } from 'react';
import { ToolCard } from '@/components/home/ToolCard';
import { toolCategories } from '@/config/toolCategories';
import { getAllTools } from '@/config/tools';

const allTools = getAllTools();
const toolByRoute = new Map(allTools.map((t) => [t.route, t]));

const AllToolsPage = () => {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    undefined
  );

  const categoriesToShow = activeCategory
    ? toolCategories.filter((c) => c.title === activeCategory)
    : toolCategories;

  return (
    <>
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
          {toolCategories.map((category) => (
            <button
              key={category.title}
              onClick={() => setActiveCategory(category.title)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category.title
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {category.title}
            </button>
          ))}
        </div>

        {categoriesToShow.map((category) => {
          const tools = category.tools
            .map((t) => toolByRoute.get(t.href))
            .filter(Boolean);
          if (tools.length === 0) return null;
          return (
            <div key={category.title} className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-primary">
                {category.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {tools.map((tool) => (
                  <ToolCard key={tool!.id} tool={tool!} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AllToolsPage;
