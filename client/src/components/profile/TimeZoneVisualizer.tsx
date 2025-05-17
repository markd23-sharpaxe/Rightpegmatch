import { useState, useEffect, useMemo } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeZoneVisualizerProps {
  selectedDays: number[];
  startHour: number;
  endHour: number;
  timeZone: string;
  className?: string;
}

export default function TimeZoneVisualizer({
  selectedDays,
  startHour,
  endHour,
  timeZone,
  className,
}: TimeZoneVisualizerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Update current time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get the current day of week (1-7, Monday is 1)
  const getCurrentDayOfWeek = () => {
    const day = currentTime.getDay();
    return day === 0 ? 7 : day; // Convert Sunday (0) to 7
  };
  
  // Get the current hour in the selected timezone
  const getCurrentHour = () => {
    try {
      return new Date(currentTime.toLocaleString('en-US', { timeZone })).getHours();
    } catch (e) {
      return currentTime.getHours();
    }
  };
  
  const currentDayOfWeek = getCurrentDayOfWeek();
  const currentHour = getCurrentHour();

  // Format local time in the selected timezone
  const formattedLocalTime = useMemo(() => {
    try {
      return new Date(currentTime.toLocaleString('en-US', { timeZone })).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone
      });
    } catch (e) {
      return currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, [currentTime, timeZone]);

  return (
    <div className={cn("space-y-4 timezone-visualizer-container", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Your Availability Visualization</h3>
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-1 text-primary" />
          <span>Local time: {formattedLocalTime}</span>
        </div>
      </div>
      
      <div className="bg-background border rounded-lg p-4 overflow-hidden availability-grid">
        <div className="grid grid-cols-8 gap-1">
          {/* Time labels column */}
          <div className="col-span-1">
            <div className="h-8" /> {/* Empty space for day labels */}
            {Array.from({ length: 24 }).map((_, hour) => (
              <div 
                key={hour} 
                className="h-8 text-xs flex items-center justify-end pr-2 text-muted-foreground"
              >
                {hour === 0 ? "12am" : hour === 12 ? "12pm" : hour > 12 ? `${hour-12}pm` : `${hour}am`}
              </div>
            ))}
          </div>
          
          {/* Days columns */}
          {dayNames.map((day, index) => {
            const dayNumber = index + 1;
            const isSelected = selectedDays.includes(dayNumber);
            const isCurrentDay = dayNumber === currentDayOfWeek;
            
            return (
              <div key={day} className="col-span-1">
                {/* Day header */}
                <div 
                  className={cn(
                    "h-8 text-xs font-medium flex items-center justify-center rounded-t-md",
                    isSelected 
                      ? isCurrentDay 
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/80 text-primary-foreground" 
                      : isCurrentDay
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {day.substring(0, 3)}
                </div>
                
                {/* Hours */}
                {Array.from({ length: 24 }).map((_, hour) => {
                  const isAvailableHour = isSelected && hour >= startHour && hour < endHour;
                  const isCurrentHour = isCurrentDay && hour === currentHour;
                  
                  return (
                    <div
                      key={hour}
                      className={cn(
                        "h-8 text-center rounded-sm border-t border-border/30",
                        isAvailableHour 
                          ? isCurrentHour
                            ? "bg-primary/90 text-primary-foreground"
                            : "bg-primary/20 text-primary-foreground" 
                          : isCurrentHour
                            ? "bg-accent/50"
                            : "bg-background"
                      )}
                    >
                      {isCurrentHour && (
                        <div className="h-full flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 bg-primary/20 rounded-sm" />
          <span>Your available hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span>Current time</span>
        </div>
      </div>
    </div>
  );
}