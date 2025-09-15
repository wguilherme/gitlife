import React, { useState } from 'react';
import { Edit3, Save, X, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { MarkdownEditor } from '../components/markdown/MarkdownEditor';
import { MarkdownProcessor } from '../../infrastructure/markdown/MarkdownProcessor';
import { Sidebar } from '../components/layout/Sidebar';
import { GlobalSearch } from '../components/search/GlobalSearch';
import { useReadingItems } from '../hooks/useReadingItems';
import { useTheme } from '../providers/ThemeProvider';
import { useAppContext } from '../providers/AppProvider';

type ViewMode = 'kanban' | 'markdown';

export const ReadingListPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [markdownContent, setMarkdownContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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

### 📚 To Read (${toRead.length})
${toRead.length > 0 ? toRead.map(item => `- **${item.title}** by ${item.author}`).join('\n') : '_No items to read_'}

### 📖 Currently Reading (${reading.length})
${reading.length > 0 ? reading.map(item => `- **${item.title}** by ${item.author}${item.progress ? ` - ${item.progress}% complete` : ''}`).join('\n') : '_Not reading anything currently_'}

### ✅ Finished (${finished.length})
${finished.length > 0 ? finished.map(item => `- **${item.title}** by ${item.author}${item.rating ? ` - ⭐ ${item.rating}/5` : ''}`).join('\n') : '_No books finished yet_'}

## Reading Goals

- [ ] Read ${Math.max(12, readingData.count + 5)} books this year
- [x] Setup reading tracking system
- [ ] Write book reviews for finished books
- [ ] Maintain reading momentum

---

*Last updated: ${new Date().toLocaleDateString()} • Total books: ${readingData.count}*
`;

      setMarkdownContent(dynamicMarkdown);
    }
  }, [readingData]);

  // Global keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      // Escape to close search
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors flex">
      {/* Sidebar */}
      <Sidebar
        currentView={viewMode}
        onViewChange={setViewMode}
        onSearchOpen={() => setShowSearch(true)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 transition-all duration-200">
        <div className="min-h-screen bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
          {/* Content Header */}
          <header className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Menu size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Reading List
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
          </header>

          {/* Global error display */}
          {state.error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-red-800 dark:text-red-200">
                {state.error}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <main className="p-6">
            <div className="min-h-[calc(100vh-180px)]">
              {renderContent()}
            </div>

            {/* Helper text */}
            <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 mt-8">
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
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="w-64 h-full bg-white dark:bg-gray-900">
            <Sidebar
              currentView={viewMode}
              onViewChange={(view) => {
                setViewMode(view);
                setShowMobileSidebar(false);
              }}
              onSearchOpen={() => {
                setShowSearch(true);
                setShowMobileSidebar(false);
              }}
              isMobile={true}
            />
          </div>
          <div 
            className="absolute inset-0"
            onClick={() => setShowMobileSidebar(false)}
            style={{ left: '16rem' }} // 64 * 0.25rem = 16rem
          />
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </div>
  );
};