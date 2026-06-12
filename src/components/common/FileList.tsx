import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { FileUpload } from '@/types';
import { FileItem } from './FileItem';
import { cn } from '@/lib/utils';
import { AnimatePresence, AnimatedListItem } from '@/components/ui/animated';

interface FileListProps {
  files: FileUpload[];
  onRemove: (fileId: string) => void;
  onRetry?: (fileId: string) => void;
  onPause?: (fileId: string) => void;
  onResume?: (fileId: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showReorder?: boolean;
  /** Show 1-based position badges (e.g. merge order). */
  showOrdinals?: boolean;
  className?: string;
}

interface SortableFileItemProps {
  file: FileUpload;
  index: number;
  total: number;
  showOrdinals: boolean;
  onRemove: () => void;
  onRetry?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const SortableFileItem = ({
  file,
  index,
  total,
  showOrdinals,
  onRemove,
  onRetry,
  onPause,
  onResume,
  onReorder,
}: SortableFileItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'z-10 relative opacity-80')}>
      <FileItem
        file={file}
        index={index}
        onRemove={onRemove}
        onRetry={onRetry}
        onPause={onPause}
        onResume={onResume}
        showReorder={total > 1}
        showOrdinal={showOrdinals}
        onMoveUp={index > 0 ? () => onReorder(index, index - 1) : undefined}
        onMoveDown={index < total - 1 ? () => onReorder(index, index + 1) : undefined}
        dragHandle={
          <button
            type="button"
            className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing"
            aria-label={`Drag to reorder ${file.file.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        }
      />
    </div>
  );
};

export const FileList = ({
  files,
  onRemove,
  onRetry,
  onPause,
  onResume,
  onReorder,
  showReorder = false,
  showOrdinals = false,
  className,
}: FileListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (files.length === 0) return null;

  const sortable = showReorder && Boolean(onReorder);

  if (sortable && onReorder) {
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const fromIndex = files.findIndex((f) => f.id === active.id);
      const toIndex = files.findIndex((f) => f.id === over.id);
      if (fromIndex === -1 || toIndex === -1) return;
      onReorder(fromIndex, toIndex);
    };

    return (
      <div className={cn('space-y-2', className)}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            {files.map((file, index) => (
              <SortableFileItem
                key={file.id}
                file={file}
                index={index}
                total={files.length}
                showOrdinals={showOrdinals}
                onRemove={() => onRemove(file.id)}
                onRetry={onRetry ? () => onRetry(file.id) : undefined}
                onPause={onPause ? () => onPause(file.id) : undefined}
                onResume={onResume ? () => onResume(file.id) : undefined}
                onReorder={onReorder}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence>
        {files.map((file, index) => (
          <AnimatedListItem key={file.id} motionKey={file.id} layout>
            <FileItem
              file={file}
              index={index}
              onRemove={() => onRemove(file.id)}
              onRetry={onRetry ? () => onRetry(file.id) : undefined}
              onPause={onPause ? () => onPause(file.id) : undefined}
              onResume={onResume ? () => onResume(file.id) : undefined}
              showOrdinal={showOrdinals}
            />
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  );
};
