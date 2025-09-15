import { useState, useMemo } from 'react';
import { ReadingItemDTO } from '../../application/dto/ReadingItemDTO';
import { useReadingItems } from './useReadingItems';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'reading-item';
  data: ReadingItemDTO;
  score: number;
}

export const useGlobalSearch = (query: string) => {
  const { data: readingData } = useReadingItems();
  
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || !readingData?.items) {
      return [];
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    const items = readingData.items;

    const searchResults: SearchResult[] = items.map(item => {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const authorLower = item.author.toLowerCase();
      const tagsLower = item.tags.join(' ').toLowerCase();
      const reviewLower = (item.review || '').toLowerCase();

      searchTerms.forEach(term => {
        // Exact title match gets highest score
        if (titleLower.includes(term)) {
          score += titleLower.startsWith(term) ? 10 : 5;
        }
        
        // Author match
        if (authorLower.includes(term)) {
          score += authorLower.startsWith(term) ? 8 : 4;
        }
        
        // Tag match
        if (tagsLower.includes(term)) {
          score += 3;
        }
        
        // Review/notes match
        if (reviewLower.includes(term)) {
          score += 2;
        }
        
        // Type match
        if (item.type.toLowerCase().includes(term)) {
          score += 2;
        }
      });

      return {
        id: item.id,
        title: item.title,
        subtitle: `by ${item.author} • ${item.type} • ${item.status.replace('-', ' ')}`,
        type: 'reading-item' as const,
        data: item,
        score
      };
    });

    // Filter out items with no matches and sort by score
    return searchResults
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Limit to top 10 results
  }, [query, readingData]);

  return {
    results,
    isLoading: !readingData,
    isEmpty: results.length === 0 && query.trim().length > 0
  };
};

export const useSearchHistory = () => {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = (query: string) => {
    if (!query.trim()) return;
    
    setHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, 5); // Keep last 5 searches
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addToHistory,
    clearHistory
  };
};