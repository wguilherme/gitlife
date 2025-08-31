import React, { useState } from 'react';
import { Eye, Edit3, Save, X, Settings, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { MarkdownEditor } from '../components/markdown/MarkdownEditor';
import { MarkdownProcessor } from '../../infrastructure/markdown/MarkdownProcessor';
import { useReadingItems } from '../hooks/useReadingItems';
import { useTheme } from '../providers/ThemeProvider';
import { useAppContext } from '../providers/AppProvider';

type ViewMode = 'kanban' | 'markdown';

export const ReadingListPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const { data: readingData, isLoading, error } = useReadingItems();
  const { isDark } = useTheme();
  const { state } = useAppContext();
  const markdownProcessor = new MarkdownProcessor();

  // Generate markdown content from API data
  React.useEffect(() => {
    if (readingData?.items) {
      const { items } = readingData;
      const toRead = items.filter(item => item.status === 'to-read');
      const reading = items.filter(item => item.status === 'reading');
      const finished = items.filter(item => item.status === 'done');

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
          theme={isDark ? 'dark' : 'light'}
          height="600px"
          placeholder="Edit your reading list markdown..."
        />
      );
    }

    return (
      <div className="prose prose-gray dark:prose-invert max-w-none">
        {markdownProcessor.process(markdownContent)}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">
            ⚠️ Error loading reading list
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Make sure the GitLife server is running on localhost:8080
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="container mx-auto px-6 py-8">
        {/* Global error display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="text-red-800 dark:text-red-200">
              {state.error}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Header with view controls */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                GitLife Reading List
              </h1>
              {(isLoading || state.isLoading) && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
              )}
              {state.vaultStatus === 'syncing' && (
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                  Syncing...
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Statistics Button */}
              <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <BarChart3 size={16} />
                Stats
              </button>

              {/* Settings Button */}
              <button className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <Settings size={16} />
                Settings
              </button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <Eye size={16} />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('markdown')}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                    viewMode === 'markdown'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <Edit3 size={16} />
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
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditStart}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
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
                Use <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">```kanban</code> blocks for boards and <code className="bg-gray-100 dark:bg-gray-800 rounded px-1">```todo</code> for task lists.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};