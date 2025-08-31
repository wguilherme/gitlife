import { visit } from 'unist-util-visit';
import { Node } from 'unist';

export interface KanbanData {
  columns: Array<{
    title: string;
    items: string[];
  }>;
}

// Parse kanban markdown format
export function parseKanbanData(content: string): KanbanData {
  const columns: KanbanData['columns'] = [];
  const lines = content.split('\n');
  let currentColumn: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Column header (ends with :)
    if (trimmed.endsWith(':') && !trimmed.startsWith('-')) {
      if (currentColumn) {
        columns.push(currentColumn);
      }
      currentColumn = {
        title: trimmed.slice(0, -1),
        items: [],
      };
    }
    // List item
    else if (trimmed.startsWith('-') && currentColumn) {
      const item = trimmed.slice(1).trim();
      if (item) {
        currentColumn.items.push(item);
      }
    }
  }

  // Add last column
  if (currentColumn) {
    columns.push(currentColumn);
  }

  return { columns };
}

// Remark plugin for kanban blocks
export function remarkKanban() {
  return (tree: Node) => {
    visit(tree, 'code', (node: any) => {
      if (node.lang === 'kanban') {
        const data = parseKanbanData(node.value);
        
        // Transform to custom element
        node.type = 'element';
        node.tagName = 'kanban-board';
        node.properties = { 
          data: JSON.stringify(data),
          className: 'kanban-block'
        };
        delete node.lang;
        delete node.value;
      }
    });
  };
}

// Remark plugin for todo blocks  
export function remarkTodo() {
  return (tree: Node) => {
    visit(tree, 'code', (node: any) => {
      if (node.lang === 'todo') {
        const items = parseTodoItems(node.value);
        
        // Transform to custom element
        node.type = 'element';
        node.tagName = 'todo-list';
        node.properties = { 
          items: JSON.stringify(items),
          className: 'todo-block'
        };
        delete node.lang;
        delete node.value;
      }
    });
  };
}

function parseTodoItems(content: string) {
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const trimmed = line.trim();
      const isCompleted = trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]');
      const isPending = trimmed.startsWith('- [ ]');
      
      if (isCompleted || isPending) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          text: trimmed.slice(5).trim(),
          completed: isCompleted,
        };
      }
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        text: trimmed.startsWith('- ') ? trimmed.slice(2) : trimmed,
        completed: false,
      };
    });
}