import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  useSortable,
  SortableContext as SortableProvider,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal } from 'lucide-react';
import { ReadingItemDTO } from '../../../application/dto/ReadingItemDTO';
import { useReadingItems, useUpdateProgress, useStartReading, useFinishReading } from '../../hooks/useReadingItems';
import { clsx } from 'clsx';

interface KanbanColumn {
  id: string;
  title: string;
  status: 'to-read' | 'reading' | 'done';
  items: ReadingItemDTO[];
}

interface KanbanBoardProps {
  data?: string; // JSON string from markdown
  className?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ data, className }) => {
  const { data: readingData, isLoading } = useReadingItems();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [columns, setColumns] = React.useState<KanbanColumn[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const startReading = useStartReading();
  const updateProgress = useUpdateProgress();
  const finishReading = useFinishReading();

  // Initialize columns with reading data
  React.useEffect(() => {
    if (readingData?.items) {
      const newColumns: KanbanColumn[] = [
        {
          id: 'to-read',
          title: 'To Read',
          status: 'to-read',
          items: readingData.items.filter(item => item.status === 'to-read'),
        },
        {
          id: 'reading',
          title: 'Reading',
          status: 'reading',
          items: readingData.items.filter(item => item.status === 'reading'),
        },
        {
          id: 'finished',
          title: 'Finished',
          status: 'done',
          items: readingData.items.filter(item => item.status === 'done'),
        },
      ];
      setColumns(newColumns);
    }
  }, [readingData]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeItemId = active.id as string;
    const overColumnId = over.id as string;

    // Find the item being moved
    const activeColumn = columns.find(col => 
      col.items.some(item => item.id === activeItemId)
    );
    const activeItem = activeColumn?.items.find(item => item.id === activeItemId);

    if (!activeItem || !activeColumn) {
      setActiveId(null);
      return;
    }

    // Handle status changes
    try {
      if (overColumnId === 'reading' && activeItem.status === 'to-read') {
        await startReading.mutateAsync(activeItemId);
      } else if (overColumnId === 'finished' && activeItem.status === 'reading') {
        await finishReading.mutateAsync({ 
          id: activeItemId, 
          data: { rating: 3 } // Default rating, can be improved
        });
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }

    setActiveId(null);
  };

  const activeItem = React.useMemo(() => {
    if (!activeId) return null;
    
    for (const column of columns) {
      const item = column.items.find(item => item.id === activeId);
      if (item) return item;
    }
    return null;
  }, [activeId, columns]);

  if (isLoading) {
    return (
      <div className={clsx('flex justify-center items-center h-64', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={clsx('w-full', className)}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          <SortableProvider items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
              />
            ))}
          </SortableProvider>
        </div>

        <DragOverlay>
          {activeItem && (
            <KanbanCard item={activeItem} isDragging />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

interface KanbanColumnProps {
  column: KanbanColumn;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column }) => {
  const {
    setNodeRef,
    listeners,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex flex-col w-80 bg-gray-50 dark:bg-gray-800 rounded-lg',
        isDragging && 'opacity-50'
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {column.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
            {column.items.length}
          </span>
          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-4 space-y-3 min-h-[200px]">
        <SortableProvider items={column.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {column.items.map((item) => (
            <KanbanCard key={item.id} item={item} />
          ))}
        </SortableProvider>
        
        {/* Add new item button */}
        <button className="w-full p-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center gap-2">
          <Plus size={16} />
          Add item
        </button>
      </div>
    </div>
  );
};

interface KanbanCardProps {
  item: ReadingItemDTO;
  isDragging?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        'p-4 rounded-lg border-l-4 cursor-grab shadow-sm hover:shadow-md transition-shadow',
        getPriorityColor(item.priority),
        (isDragging || isSortableDragging) && 'opacity-50 cursor-grabbing'
      )}
    >
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
          {item.title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          by {item.author}
        </p>
        
        {/* Progress bar for reading items */}
        {item.status === 'reading' && typeof item.progress === 'number' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{item.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-primary-500 h-1.5 rounded-full transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs text-gray-500">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Rating for finished items */}
        {item.status === 'done' && item.rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={clsx(
                  'text-xs',
                  i < item.rating! ? 'text-yellow-500' : 'text-gray-300'
                )}
              >
                ★
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};