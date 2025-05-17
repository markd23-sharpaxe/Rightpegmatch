import { useState, useEffect, useMemo } from 'react';
import { Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WorldMapTimeZoneVisualizerProps {
  selectedDays: number[];
  startHour: number;
  endHour: number;
  timeZone: string;
  className?: string;
}

// List of major time zones for visualization
interface TimeZoneInfo {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  gmtOffset: number;
  color: string;
}

const majorTimeZones: TimeZoneInfo[] = [
  { id: "gmt-8", name: "Los Angeles (PST)", longitude: -118.2437, latitude: 34.0522, gmtOffset: -8, color: "#4338ca" },
  { id: "gmt-5", name: "New York (EST)", longitude: -74.0060, latitude: 40.7128, gmtOffset: -5, color: "#6366f1" }, 
  { id: "gmt+0", name: "London (GMT)", longitude: -0.1278, latitude: 51.5074, gmtOffset: 0, color: "#8b5cf6" },
  { id: "gmt+1", name: "Paris (CET)", longitude: 2.3522, latitude: 48.8566, gmtOffset: 1, color: "#a855f7" },
  { id: "gmt+5.5", name: "Mumbai (IST)", longitude: 72.8777, latitude: 19.0760, gmtOffset: 5.5, color: "#d946ef" },
  { id: "gmt+8", name: "Singapore (SGT)", longitude: 103.8198, latitude: 1.3521, gmtOffset: 8, color: "#ec4899" },
  { id: "gmt+9", name: "Tokyo (JST)", longitude: 139.6917, latitude: 35.6762, gmtOffset: 9, color: "#f43f5e" },
];

export default function WorldMapTimeZoneVisualizer({
  selectedDays,
  startHour,
  endHour,
  timeZone,
  className
}: WorldMapTimeZoneVisualizerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWorkingHours, setShowWorkingHours] = useState(true);
  const [showCurrentTime, setShowCurrentTime] = useState(true);
  
  // Update current time every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get the current hour in the selected timezone
  const getCurrentHour = () => {
    try {
      return new Date(currentTime.toLocaleString('en-US', { timeZone })).getHours();
    } catch (e) {
      return currentTime.getHours();
    }
  };
  
  // Get the current day of week (1-7, Monday is 1)
  const getCurrentDayOfWeek = () => {
    const day = currentTime.getDay();
    return day === 0 ? 7 : day; // Convert Sunday (0) to 7
  };
  
  const currentDayOfWeek = getCurrentDayOfWeek();
  const currentHour = getCurrentHour();
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Get user's timezone offset
  const getUserTimezoneOffset = () => {
    try {
      // Create a date in the user's timezone and get its offset
      const date = new Date();
      const options = { timeZone, timeZoneName: 'short' } as Intl.DateTimeFormatOptions;
      const tzString = date.toLocaleString('en-US', options).split(' ').pop();
      
      // Parse GMT offset from timezone string (e.g., GMT-0700 -> -7)
      const match = tzString?.match(/GMT([+-])(\d{2})(\d{2})/);
      if (match) {
        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10) / 60;
        return sign * (hours + minutes);
      }
      
      // Fallback to system timezone offset
      return -date.getTimezoneOffset() / 60;
    } catch (e) {
      // Return system timezone offset as fallback
      return -new Date().getTimezoneOffset() / 60;
    }
  };
  
  const userTimezoneOffset = getUserTimezoneOffset();
  
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
  
  // Add a marker for the user's timezone
  const userTimeZone: TimeZoneInfo = {
    id: "user-timezone",
    name: `Your Location (${timeZone})`,
    // Position based on GMT offset (longitude: each timezone is roughly 15 degrees)
    longitude: userTimezoneOffset * 15,
    latitude: 0, // Position on the equator by default
    gmtOffset: userTimezoneOffset,
    color: "#7C3AED" // Primary color
  };
  
  // Combine major timezones with user timezone
  const allTimeZones = [...majorTimeZones, userTimeZone];
  
  // Calculate current hour in each timezone
  const timeZonesWithLocalTime = allTimeZones.map(tz => {
    const tzOffset = tz.gmtOffset;
    const userOffset = userTimezoneOffset;
    const hourDifference = tzOffset - userOffset;
    
    // Calculate local hour based on user's current hour and the timezone offset difference
    const localHour = (currentHour + hourDifference + 24) % 24;
    
    // Check if the current time is within working hours for this timezone
    const isWorkingHour = selectedDays.includes(currentDayOfWeek) && 
                         localHour >= startHour && 
                         localHour < endHour;
    
    return {
      ...tz,
      localHour,
      isWorkingHour,
      formattedLocalTime: `${localHour === 0 ? '12' : localHour > 12 ? localHour - 12 : localHour}${localHour >= 12 ? 'PM' : 'AM'}`
    };
  });
  
  return (
    <div className={cn("space-y-4 world-map-visualizer", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Global Time Zone Map</h3>
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-1 text-primary" />
          <span>Your local time: {formattedLocalTime}</span>
        </div>
      </div>
      
      <div className="flex space-x-2 mb-2">
        <Button 
          size="sm" 
          variant={showWorkingHours ? "default" : "outline"} 
          onClick={() => setShowWorkingHours(!showWorkingHours)}
        >
          {showWorkingHours ? "Hide" : "Show"} Working Hours
        </Button>
        <Button 
          size="sm" 
          variant={showCurrentTime ? "default" : "outline"} 
          onClick={() => setShowCurrentTime(!showCurrentTime)}
        >
          {showCurrentTime ? "Hide" : "Show"} Current Time
        </Button>
      </div>
      
      <div className="border rounded-lg p-4 bg-background overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {timeZonesWithLocalTime.map((tz) => (
            <Card 
              key={tz.id} 
              className={cn(
                "p-3 relative overflow-hidden", 
                tz.id === "user-timezone" && "border-primary border-2",
                tz.isWorkingHour && showWorkingHours && "bg-primary/10"
              )}
            >
              <div className="absolute top-0 right-0 w-2 h-2 m-2 rounded-full" 
                style={{ backgroundColor: tz.color }}
              />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{tz.name}</h4>
                  {showCurrentTime && (
                    <span className="text-lg font-bold">{tz.formattedLocalTime}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  GMT{tz.gmtOffset >= 0 ? '+' : ''}{tz.gmtOffset}
                </div>
                {tz.id === "user-timezone" && (
                  <div className="text-xs text-primary font-medium mt-1">
                    Your working hours: {startHour === 0 ? '12AM' : startHour < 12 ? `${startHour}AM` : startHour === 12 ? '12PM' : `${startHour-12}PM`} - {endHour === 0 ? '12AM' : endHour < 12 ? `${endHour}AM` : endHour === 12 ? '12PM' : `${endHour-12}PM`}
                  </div>
                )}
                {tz.isWorkingHour && showWorkingHours && (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Within your working hours
                  </div>
                )}
                {!tz.isWorkingHour && showWorkingHours && selectedDays.includes(currentDayOfWeek) && (
                  <div className="text-xs text-red-500 font-medium">
                    ✕ Outside your working hours
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span>Your location</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span>Colored indicators show different time zones</span>
        </div>
      </div>
    </div>
  );
}