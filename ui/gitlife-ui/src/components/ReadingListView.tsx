import React from 'react';
import { Eye, Edit3, Save, X } from 'lucide-react';
import { clsx } from 'clsx';
import { KanbanBoard } from './KanbanBoard';
import { MarkdownEditor } from './MarkdownEditor';
import { processMarkdown } from '../utils/markdown-processor';
import { useReadingItems } from '../hooks/useReading';

type ViewMode = 'kanban' | 'markdown';

interface ReadingListViewProps {
  className?: string;
}

// Default markdown template for reading list
const getDefaultMarkdown = () => `# My Reading List

## Currently Reading

\`\`\`kanban
To Read:
- Clean Code by Robert Martin
- The Pragmatic Programmer
- Design Patterns

Reading:
- Atomic Habits by James Clear
- Deep Work by Cal Newport

Finished:
- The Clean Coder by Robert Martin
- Refactoring by Martin Fowler
\`\`\`

## Reading Goals

\`\`\`todo
- [ ] Read 12 books this year
- [x] Setup reading tracking system
- [ ] Write book reviews
- [ ] Join a book club
\`\`\`

---

*Last updated: ${new Date().toLocaleDateString()}*
`;

export const ReadingListView: React.FC<ReadingListViewProps> = ({ className }) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('kanban');
  const [markdownContent, setMarkdownContent] = React.useState(getDefaultMarkdown());
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState('');

  const { data: readingData, isLoading } = useReadingItems();

  // Update markdown content based on reading data
  React.useEffect(() => {
    if (readingData?.items) {
      const toRead = readingData.items.filter(item => item.status === 'to-read');
      const reading = readingData.items.filter(item => item.status === 'reading');
      const finished = readingData.items.filter(item => item.status === 'finished');

      const dynamicMarkdown = `# My Reading List

## Current Status: ${readingData.count} books total

\`\`\`kanban
To Read (${toRead.length}):
${toRead.map(item => `- ${item.title} by ${item.author}`).join('\n')}

Reading (${reading.length}):
${reading.map(item => `- ${item.title} by ${item.author}${item.progress ? ` (${item.progress}%)` : ''}`).join('\n')}

Finished (${finished.length}):
${finished.map(item => `- ${item.title} by ${item.author}${item.rating ? ` ⭐${item.rating}/5` : ''}`).join('\n')}
\`\`\`

## Reading Goals

\`\`\`todo
- [ ] Read ${Math.max(12, readingData.count + 5)} books this year
- [x] Setup reading tracking system
- [ ] Write book reviews for finished books
- [ ] Maintain reading momentum
\`\`\`

---

*Last updated: ${new Date().toLocaleDateString()} • Total books: ${readingData.count}*
`;

      setMarkdownContent(dynamicMarkdown);
    }
  }, [readingData]);

  const handleEditStart = () => {
    setEditContent(markdownContent);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    setMarkdownContent(editContent);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent('');
    setIsEditing(false);
  };

  const renderContent = () => {
    if (viewMode === 'kanban') {
      return <KanbanBoard />;
    }

    if (isEditing) {
      return (
        <MarkdownEditor
          value={editContent}
          onChange={setEditContent}
          height="600px"
          placeholder="Edit your reading list markdown..."
        />
      );
    }

    return (
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {processMarkdown(markdownContent)}
      </div>
    );
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header with view controls */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Reading List
          </h1>
          {isLoading && (
            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Eye size={16} className="mr-1.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              className={clsx(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                viewMode === 'markdown'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <Edit3 size={16} className="mr-1.5" />
              Markdown
            </button>
          </div>

          {/* Edit Controls (only in markdown mode) */}
          {viewMode === 'markdown' && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleEditSave}
                    className="flex items-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEditStart}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[600px]">
        {renderContent()}
      </div>

      {/* Helper text */}
      <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        {viewMode === 'kanban' ? (
          <p>
            📋 Drag and drop items between columns to change their status. 
            Switch to Markdown view to see the underlying data structure.
          </p>
        ) : (
          <p>
            📝 This is your reading list in Markdown format. 
            Use <code>```kanban</code> blocks for boards and <code>```todo</code> for task lists.
          </p>
        )}
      </div>
    </div>
  );
};