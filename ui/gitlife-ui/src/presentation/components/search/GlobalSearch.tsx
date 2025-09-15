import React, { useState, useRef, useEffect } from 'react';
import { Search, Book, Clock, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useGlobalSearch, useSearchHistory } from '../../hooks/useGlobalSearch';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { results, isLoading, isEmpty } = useGlobalSearch(query);
  const { history, addToHistory, clearHistory } = useSearchHistory();

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            Math.min(prev + 1, (query ? results.length : history.length) - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            if (query && results[selectedIndex]) {
              handleSelectResult(results[selectedIndex].data.id);
            } else if (!query && history[selectedIndex]) {
              setQuery(history[selectedIndex]);
              setSelectedIndex(-1);
            }
          } else if (query.trim()) {
            addToHistory(query);
            onClose();
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, query, results, history, addToHistory, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleSelectResult = (itemId: string) => {
    addToHistory(query);
    // TODO: Navigate to specific item or highlight in kanban
    console.log('Selected item:', itemId);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to-read': return 'text-gray-500';
      case 'reading': return 'text-blue-500';
      case 'done': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reading': return '📖';
      case 'done': return '✅';
      default: return '📚';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="text-gray-400" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reading list, notes, and more..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && query && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Searching...</p>
            </div>
          )}

          {/* Search Results */}
          {query && !isLoading && (
            <>
              {results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result.data.id)}
                      className={clsx(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3',
                        selectedIndex === index && 'bg-primary-50 dark:bg-primary-900/30'
                      )}
                    >
                      <div className="text-2xl">
                        {getStatusIcon(result.data.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {result.subtitle}
                        </div>
                        {result.data.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {result.data.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={clsx('text-sm', getStatusColor(result.data.status))}>
                        {result.data.status.replace('-', ' ')}
                      </div>
                      <ArrowRight className="text-gray-400" size={16} />
                    </button>
                  ))}
                </div>
              ) : isEmpty ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-2">🔍</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No results found for "{query}"
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Try searching for titles, authors, or tags
                  </p>
                </div>
              ) : null}
            </>
          )}

          {/* Search History */}
          {!query && history.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Recent Searches
              </div>
              {history.map((item, index) => (
                <button
                  key={item}
                  onClick={() => setQuery(item)}
                  className={clsx(
                    'w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3',
                    selectedIndex === index && 'bg-primary-50 dark:bg-primary-900/30'
                  )}
                >
                  <Clock className="text-gray-400" size={16} />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </button>
              ))}
              <button
                onClick={clearHistory}
                className="w-full px-4 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear search history
              </button>
            </div>
          )}

          {/* Empty State */}
          {!query && history.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">🔍</div>
              <p className="text-gray-500 dark:text-gray-400">
                Start typing to search your reading list
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Search through titles, authors, tags, and reviews
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↵</kbd>
              to select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
};