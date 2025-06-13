import { useState, useRef } from 'react';
import type { Trip } from '@/utils/constants';
import { TIMELINE_START, TIMELINE_END } from '@/utils/constants';

type DragType = 'move' | 'resize-start' | 'resize-end' | null;

export const useInteractions = (trips: Trip[], setTrips: (trips: Trip[]) => void) => {
  const [draggedTrip, setDraggedTrip] = useState<Trip | null>(null);
  const [dragType, setDragType] = useState<DragType>(null);
  const [dragStartPos, setDragStartPos] = useState<number | null>(null);
  const [dragStartDate, setDragStartDate] = useState<Date | { start: Date; end: Date } | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  const handleTimelineDragStart = (e: React.MouseEvent, trip: Trip, type: DragType) => {
    e.stopPropagation();
    setDraggedTrip(trip);
    setDragType(type);
    setDragStartPos(e.clientX);
    
    if (type === 'resize-start') {
      setDragStartDate(new Date(trip.startDate));
    } else if (type === 'resize-end') {
      setDragStartDate(new Date(trip.endDate));
    } else {
      // For moving the whole trip
      setDragStartDate({
        start: new Date(trip.startDate),
        end: new Date(trip.endDate)
      });
    }
  };

  const handleTimelineDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!draggedTrip || !timelineRef.current || dragStartPos === null || !dragStartDate) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartPos;
    
    // Calculate the time scale - how many pixels per day
    const timelineStart = new Date(TIMELINE_START);
    const timelineEnd = new Date(TIMELINE_END);
    const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const pixelsPerDay = rect.width / totalDays;
    
    const daysDelta = Math.round(deltaX / pixelsPerDay);
    
    if (Math.abs(daysDelta) === 0) return; // No change
    
    let newStartDate: Date, newEndDate: Date;
    const trip = trips.find(t => t.id === draggedTrip.id);
    if (!trip) return;
    
    if (dragType === 'move') {
      // Move the whole trip
      if ('start' in dragStartDate && 'end' in dragStartDate) {
        newStartDate = new Date(dragStartDate.start);
        newStartDate.setDate(newStartDate.getDate() + daysDelta);
        
        newEndDate = new Date(dragStartDate.end);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
      } else {
        return;
      }
    } else if (dragType === 'resize-start') {
      // Resize from the start
      if (dragStartDate instanceof Date) {
        newStartDate = new Date(dragStartDate);
        newStartDate.setDate(newStartDate.getDate() + daysDelta);
        
        // Don't allow start date to go past end date
        const endDate = new Date(trip.endDate);
        if (newStartDate > endDate) {
          newStartDate = new Date(endDate);
        }
        
        newEndDate = new Date(trip.endDate);
      } else {
        return;
      }
    } else if (dragType === 'resize-end') {
      // Resize from the end
      if (dragStartDate instanceof Date) {
        newEndDate = new Date(dragStartDate);
        newEndDate.setDate(newEndDate.getDate() + daysDelta);
        
        // Don't allow end date to go before start date
        const startDate = new Date(trip.startDate);
        if (newEndDate < startDate) {
          newEndDate = new Date(startDate);
        }
        
        newStartDate = new Date(trip.startDate);
      } else {
        return;
      }
    } else {
      return;
    }
    
    // Format dates
    const formattedStartDate = newStartDate.toISOString().split('T')[0];
    const formattedEndDate = newEndDate.toISOString().split('T')[0];
    
    // Update the trip
    const updatedTrips = trips.map(t => {
      if (t.id === draggedTrip.id) {
        return {
          ...t,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        };
      }
      return t;
    });
    
    setTrips(updatedTrips);
  };

  const handleTimelineDragEnd = () => {
    setDraggedTrip(null);
    setDragType(null);
    setDragStartPos(null);
    setDragStartDate(null);
  };

  return {
    draggedTrip,
    dragType,
    timelineRef,
    handleTimelineDragStart,
    handleTimelineDrag,
    handleTimelineDragEnd,
  };
}; 