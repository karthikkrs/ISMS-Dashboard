'use client'

import { useDragLayer } from 'react-dnd'
import { Badge } from '../ui/badge'

// Define the control object shape we expect in the drag item
interface DraggedControl {
  id: string
  reference: string
  description: string
  domain?: string | null
}

export function ControlDragLayer() {
  // Use react-dnd's useDragLayer hook to capture drag state
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as { control: DraggedControl },
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }))

  // Do not render anything if not dragging or no offset
  if (!isDragging || !currentOffset || !item?.control) {
    return null
  }

  // Get control data from drag item
  const { reference, description, domain } = item.control

  // Apply transform based on current offset
  const transform = `translate(${currentOffset.x}px, ${currentOffset.y}px)`

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: 0,
        top: 0,
        width: 'auto',
        transform,
      }}
    >
      {/* Render a clean preview of the control card */}
      <div 
        className="p-3 mb-2 border rounded bg-white shadow-md w-[300px]"
        style={{ opacity: 0.8 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{reference}</span>
          {domain && (
            <Badge variant="secondary" className="text-xs">{domain}</Badge>
          )}
        </div>
        <p className="text-xs text-gray-600 truncate">{description}</p>
      </div>
    </div>
  )
}
