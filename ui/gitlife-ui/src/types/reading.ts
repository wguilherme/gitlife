export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  type: 'book' | 'article' | 'paper' | 'blog';
  status: 'to-read' | 'reading' | 'finished';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  progress?: number;
  current_page?: number;
  total_pages?: number;
  rating?: number;
  url?: string;
  notes?: string;
  review?: string;
  added: string;
  started?: string;
  finished?: string;
}

export interface ReadingStats {
  total: number;
  to_read: number;
  reading: number;
  finished: number;
}

export interface AddItemRequest {
  title: string;
  author: string;
  type: string;
  priority?: string;
  tags?: string[];
  url?: string;
}

export interface UpdateProgressRequest {
  percentage: number;
  current_page?: number;
}

export interface FinishItemRequest {
  rating: number;
  review?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  items: ReadingItem[];
}

export interface VaultStatus {
  exists: boolean;
  vault_path: string;
  vault_repo: string;
  status: 'ready' | 'not_initialized';
}