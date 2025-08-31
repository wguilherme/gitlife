import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import { createElement, Fragment } from 'react';
import { KanbanBoard } from '../components/KanbanBoard';
import { TodoList } from '../components/TodoList';
import { remarkKanban, remarkTodo } from '../plugins/kanban-plugin';

// Create unified processor
export const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm) // GitHub Flavored Markdown
  .use(remarkFrontmatter) // YAML frontmatter
  .use(remarkKanban) // Custom kanban blocks
  .use(remarkTodo) // Custom todo blocks
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeReact, {
    createElement,
    Fragment,
    components: {
      // Map custom elements to React components
      'kanban-board': KanbanBoard,
      'todo-list': TodoList,
      // Standard HTML elements with custom styling
      h1: ({ children, ...props }: any) => (
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3" {...props}>
          {children}
        </h3>
      ),
      p: ({ children, ...props }: any) => (
        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props}>
          {children}
        </p>
      ),
      ul: ({ children, ...props }: any) => (
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }: any) => (
        <li className="ml-4" {...props}>
          {children}
        </li>
      ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote className="border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props}>
          {children}
        </blockquote>
      ),
      code: ({ children, ...props }: any) => (
        <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-sm font-mono" {...props}>
          {children}
        </code>
      ),
      pre: ({ children, ...props }: any) => (
        <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto mb-4" {...props}>
          {children}
        </pre>
      ),
      table: ({ children, ...props }: any) => (
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-200 dark:border-gray-700" {...props}>
            {children}
          </table>
        </div>
      ),
      thead: ({ children, ...props }: any) => (
        <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
          {children}
        </thead>
      ),
      tbody: ({ children, ...props }: any) => (
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>
          {children}
        </tbody>
      ),
      tr: ({ children, ...props }: any) => (
        <tr {...props}>
          {children}
        </tr>
      ),
      th: ({ children, ...props }: any) => (
        <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100" {...props}>
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300" {...props}>
          {children}
        </td>
      ),
    },
  });

// Process markdown content and return React element
export function processMarkdown(content: string) {
  try {
    return markdownProcessor.processSync(content).result;
  } catch (error) {
    console.error('Error processing markdown:', error);
    return <div className="text-red-600">Error processing markdown content</div>;
  }
}

// Extract frontmatter from markdown
export function extractFrontmatter(content: string): { frontmatter: any; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (match) {
    const [, yamlContent, markdownContent] = match;
    try {
      // Simple YAML parsing (you might want to use a proper YAML parser)
      const frontmatter: any = {};
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