import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import { createElement, Fragment, ReactElement } from 'react';

// Custom remark plugins
interface KanbanData {
  columns: {
    id: string;
    title: string;
    items: string[];
  }[];
}

interface TodoData {
  items: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

export class MarkdownProcessor {
  private processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeReact, {
      createElement,
      Fragment,
      components: this.getComponents(),
    });

  // Process markdown content and return React element
  process(content: string): ReactElement {
    try {
      console.log('Processing markdown content:', content.substring(0, 100) + '...');
      const result = this.processor.processSync(content);
      console.log('Markdown processing successful');
      return result.result as ReactElement;
    } catch (error) {
      console.error('Error processing markdown:', error);
      console.error('Content that failed:', content);
      
      // Return a more helpful error message
      return createElement('div', {
        className: 'text-red-600 dark:text-red-400 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20',
      }, [
        createElement('h3', { key: 'title', className: 'font-semibold mb-2' }, 'Markdown Processing Error'),
        createElement('p', { key: 'message', className: 'text-sm mb-2' }, 'Failed to render markdown content. This might be due to:'),
        createElement('ul', { key: 'reasons', className: 'text-sm list-disc list-inside space-y-1' }, [
          createElement('li', { key: 'r1' }, 'Complex markdown structures'),
          createElement('li', { key: 'r2' }, 'Custom block types'),
          createElement('li', { key: 'r3' }, 'Plugin configuration issues')
        ]),
        createElement('details', { key: 'details', className: 'mt-2' }, [
          createElement('summary', { key: 'summary', className: 'cursor-pointer text-sm font-medium' }, 'Show raw content'),
          createElement('pre', { key: 'raw', className: 'mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto' }, content)
        ])
      ]);
    }
  }

  // Extract frontmatter from markdown
  extractFrontmatter(content: string): { frontmatter: Record<string, any>; content: string } {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      const [, yamlContent, markdownContent] = match;
      try {
        const frontmatter: Record<string, any> = {};
        yamlContent.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            frontmatter[key.trim()] = value.replace(/^["']|["']$/g, '');
          }
        });
        
        return { frontmatter, content: markdownContent };
      } catch (error) {
        console.error('Error parsing frontmatter:', error);
        return { frontmatter: {}, content };
      }
    }
    
    return { frontmatter: {}, content };
  }

  // Parse kanban data from markdown block
  parseKanbanData(content: string): KanbanData {
    const lines = content.split('\n').filter(line => line.trim());
    const columns: KanbanData['columns'] = [];
    let currentColumn: KanbanData['columns'][0] | null = null;

    for (const line of lines) {
      if (line.endsWith(':')) {
        // New column
        if (currentColumn) {
          columns.push(currentColumn);
        }
        const title = line.slice(0, -1).trim();
        currentColumn = {
          id: title.toLowerCase().replace(/\s+/g, '-'),
          title,
          items: [],
        };
      } else if (line.startsWith('-') && currentColumn) {
        // Item in current column
        const item = line.slice(1).trim();
        currentColumn.items.push(item);
      }
    }

    if (currentColumn) {
      columns.push(currentColumn);
    }

    return { columns };
  }

  // Parse todo data from markdown block
  parseTodoData(content: string): TodoData {
    const lines = content.split('\n').filter(line => line.trim());
    const items: TodoData['items'] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- [x]') || line.startsWith('- [ ]')) {
        const completed = line.startsWith('- [x]');
        const text = line.slice(5).trim();
        items.push({
          id: `todo_${i}`,
          text,
          completed,
        });
      }
    }

    return { items };
  }

  // Custom remark plugin for kanban blocks
  private remarkKanban() {
    return (tree: any) => {
      const nodes = tree.children;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === 'code' && node.lang === 'kanban') {
          const data = this.parseKanbanData(node.value);
          nodes[i] = {
            type: 'element',
            tagName: 'kanban-board',
            properties: {
              data: JSON.stringify(data),
            },
            children: [],
          };
        }
      }
    };
  }

  // Custom remark plugin for todo blocks
  private remarkTodo() {
    return (tree: any) => {
      const nodes = tree.children;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === 'code' && node.lang === 'todo') {
          const data = this.parseTodoData(node.value);
          nodes[i] = {
            type: 'element',
            tagName: 'todo-list',
            properties: {
              items: JSON.stringify(data),
            },
            children: [],
          };
        }
      }
    };
  }

  // Get React components mapping
  private getComponents() {
    return {
      // Custom elements - these will be provided by the presentation layer
      'kanban-board': ({ data, ...props }: any) => 
        createElement('div', { ...props, 'data-kanban': data }),
      'todo-list': ({ items, ...props }: any) => 
        createElement('div', { ...props, 'data-todo': items }),
        
      // Standard HTML elements with custom styling
      h1: ({ children, ...props }: any) =>
        createElement('h1', {
          className: 'text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6',
          ...props,
        }, children),
        
      h2: ({ children, ...props }: any) =>
        createElement('h2', {
          className: 'text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4',
          ...props,
        }, children),
        
      h3: ({ children, ...props }: any) =>
        createElement('h3', {
          className: 'text-xl font-medium text-gray-700 dark:text-gray-300 mb-3',
          ...props,
        }, children),
        
      p: ({ children, ...props }: any) =>
        createElement('p', {
          className: 'text-gray-700 dark:text-gray-300 mb-4 leading-relaxed',
          ...props,
        }, children),
        
      ul: ({ children, ...props }: any) =>
        createElement('ul', {
          className: 'list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1',
          ...props,
        }, children),
        
      ol: ({ children, ...props }: any) =>
        createElement('ol', {
          className: 'list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1',
          ...props,
        }, children),
        
      li: ({ children, ...props }: any) =>
        createElement('li', {
          className: 'ml-4',
          ...props,
        }, children),
        
      blockquote: ({ children, ...props }: any) =>
        createElement('blockquote', {
          className: 'border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4',
          ...props,
        }, children),
        
      code: ({ children, ...props }: any) =>
        createElement('code', {
          className: 'bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono',
          ...props,
        }, children),
        
      pre: ({ children, ...props }: any) =>
        createElement('pre', {
          className: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto mb-4',
          ...props,
        }, children),
        
      table: ({ children, ...props }: any) =>
        createElement('div', { className: 'overflow-x-auto mb-4' },
          createElement('table', {
            className: 'min-w-full border border-gray-200 dark:border-gray-700',
            ...props,
          }, children)
        ),
        
      thead: ({ children, ...props }: any) =>
        createElement('thead', {
          className: 'bg-gray-50 dark:bg-gray-800',
          ...props,
        }, children),
        
      tbody: ({ children, ...props }: any) =>
        createElement('tbody', {
          className: 'divide-y divide-gray-200 dark:divide-gray-700',
          ...props,
        }, children),
        
      tr: ({ children, ...props }: any) =>
        createElement('tr', props, children),
        
      th: ({ children, ...props }: any) =>
        createElement('th', {
          className: 'px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100',
          ...props,
        }, children),
        
      td: ({ children, ...props }: any) =>
        createElement('td', {
          className: 'px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
          ...props,
        }, children),
    };
  }
}