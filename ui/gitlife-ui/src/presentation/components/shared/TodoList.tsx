import React from 'react';
import { Check, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  items?: string; // JSON string from markdown
  className?: string;
}

export const TodoList: React.FC<TodoListProps> = ({ items, className }) => {
  const [todoItems, setTodoItems] = React.useState<TodoItem[]>([]);

  React.useEffect(() => {
    if (items) {
      try {
        const parsed = JSON.parse(items);
        setTodoItems(parsed);
      } catch (error) {
        console.error('Error parsing todo items:', error);
        setTodoItems([]);
      }
    }
  }, [items]);

  const toggleItem = (id: string) => {
    setTodoItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {todoItems.map((item) => (
        <div
          key={item.id}
          className={clsx(
            'flex items-start gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group',
            item.completed && 'opacity-60'
          )}
          onClick={() => toggleItem(item.id)}
        >
          <div className="flex-shrink-0 mt-0.5">
            {item.completed ? (
              <Check
                size={18}
                className="text-green-600 dark:text-green-400"
              />
            ) : (
              <Square
                size={18}
                className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              />
            )}
          </div>
          <span
            className={clsx(
              'text-gray-700 dark:text-gray-300 leading-relaxed',
              item.completed && 'line-through text-gray-500 dark:text-gray-500'
            )}
          >
            {item.text}
          </span>
        </div>
      ))}

      {todoItems.length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-center py-4 italic">
          No todo items found
        </div>
      )}
    </div>
  );
};