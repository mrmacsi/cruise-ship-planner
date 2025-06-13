import type { Trip } from '@/utils/constants';
import { TIMELINE_START, TIMELINE_END } from '@/utils/constants';
import { calculateDays, sortTrips } from '@/utils/dateUtils';

interface VisualizationProps {
  trips: Trip[];
  draggedTrip: Trip | null;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onTimelineDragStart: (e: React.MouseEvent, trip: Trip, type: 'move' | 'resize-start' | 'resize-end') => void;
  onTimelineDrag: (e: React.MouseEvent) => void;
  onTimelineDragEnd: () => void;
}

export default function Visualization({ 
  trips, 
  draggedTrip, 
  timelineRef,
  onTimelineDragStart,
  onTimelineDrag,
  onTimelineDragEnd 
}: VisualizationProps) {
  return (
    <div className="bg-white p-4 rounded shadow-sm mb-6">
      <h3 className="font-semibold mb-2">Timeline Visualization</h3>
      <p className="text-xs mb-2">Drag trips to move them. Drag edges to resize. Changes sync with the table above.</p>
      <div 
        ref={timelineRef}
        className="relative h-64 border border-gray-300 rounded p-2 overflow-x-auto"
        onMouseMove={onTimelineDrag}
        onMouseUp={onTimelineDragEnd}
        onMouseLeave={onTimelineDragEnd}
      >
        {/* Month markers */}
        <div className="absolute top-0 left-0 right-0 h-6 flex text-xs">
          {Array.from({ length: 24 }).map((_, i) => {
            const date = new Date(TIMELINE_START);
            date.setMonth(date.getMonth() + i);
            return (
              <div 
                key={i} 
                className="flex-1 border-l border-gray-300 pl-1"
              >
                {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            );
          })}
        </div>
        
        {/* Trips as blocks */}
        <div className="absolute top-8 left-0 right-0 bottom-0">
          {sortTrips(trips).map((trip, index) => {
            // Calculate position
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const timelineStart = new Date(TIMELINE_START);
            const timelineEnd = new Date(TIMELINE_END);
            const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
            
            const startOffset = (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
            const tripDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
            
            const left = (startOffset / totalDays) * 100;
            const width = (tripDays / totalDays) * 100;
            
            return (
              <div 
                key={trip.id}
                className={`absolute ${trip.color} rounded px-2 overflow-hidden cursor-move shadow-sm hover:shadow transition-shadow`}
                style={{ 
                  left: `${left}%`, 
                  width: `${width}%`, 
                  top: `${(index % 4) * 20}%`, 
                  height: '20%',
                  zIndex: draggedTrip && draggedTrip.id === trip.id ? 20 : 10 
                }}
                onMouseDown={(e) => onTimelineDragStart(e, trip, 'move')}
              >
                <div className="flex justify-between items-center h-full">
                  <span className="text-white text-xs truncate">{trip.location}</span>
                  <span className="text-white text-xs">
                    {calculateDays(trip.startDate, trip.endDate)}d
                  </span>
                </div>
                
                {/* Drag handles */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-2 bg-black bg-opacity-20 cursor-w-resize hover:bg-opacity-40"
                  onMouseDown={(e) => onTimelineDragStart(e, trip, 'resize-start')}
                ></div>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 bg-black bg-opacity-20 cursor-e-resize hover:bg-opacity-40"
                  onMouseDown={(e) => onTimelineDragStart(e, trip, 'resize-end')}
                ></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 