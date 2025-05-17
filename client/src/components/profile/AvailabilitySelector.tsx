import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar, Clock, ChevronDown, ChevronUp, Globe } from "lucide-react";
import TimeZoneVisualizer from "./TimeZoneVisualizer";
import WorldMapTimeZoneVisualizer from "./WorldMapTimeZoneVisualizer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AvailabilitySelectorProps {
  selectedDays: number[];
  onDayToggle: (day: number) => void;
  startHour: number;
  endHour: number;
  onStartHourChange: (hour: number) => void;
  onEndHourChange: (hour: number) => void;
  timeZone: string;
  onTimeZoneChange: (timeZone: string) => void;
  showTimeZoneSelector?: boolean;
}

export default function AvailabilitySelector({
  selectedDays,
  onDayToggle,
  startHour,
  endHour,
  onStartHourChange,
  onEndHourChange,
  timeZone,
  onTimeZoneChange,
  showTimeZoneSelector = true,
}: AvailabilitySelectorProps) {
  const [showVisualizer, setShowVisualizer] = useState(true);
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  // Helper to format hours in 12-hour format
  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${period}`;
  };
  
  // Get a list of time zones organized by offset
  const getTimeZones = () => {
    // Get all time zones
    const allTimeZones = Intl.supportedValuesOf("timeZone");
    
    // Create a map to store time zones by offset
    const timeZonesByOffset = new Map<number, {name: string, label: string}[]>();
    
    // Process each time zone
    allTimeZones.forEach(tz => {
      try {
        // Get the time zone offset in minutes
        const offset = new Date().toLocaleString('en-US', {timeZone: tz, timeZoneName: 'short'})
          .split(' ').pop()?.replace(/[^-+0-9]/g, '');
          
        // Skip if we couldn't extract the offset
        if (!offset) return;
        
        // Convert offset to a number for sorting
        const offsetNum = parseInt(offset.replace(/[^0-9]/g, '')) * (offset.includes('-') ? -1 : 1);
        
        // Format the label with offset
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'long'
        });
        const tzParts = formatter.formatToParts(now).find(part => part.type === 'timeZoneName');
        const tzName = tzParts ? tzParts.value : tz;
        
        // Create the timezone label
        const label = `${tz.replace(/_/g, ' ')} (${tzName})`;
        
        // Add to the map, grouped by offset
        if (!timeZonesByOffset.has(offsetNum)) {
          timeZonesByOffset.set(offsetNum, []);
        }
        timeZonesByOffset.get(offsetNum)?.push({name: tz, label});
      } catch (e) {
        // Skip any problematic time zones
        console.warn(`Error processing time zone ${tz}:`, e);
      }
    });
    
    // Sort the offsets
    const sortedOffsets = Array.from(timeZonesByOffset.keys()).sort((a, b) => a - b);
    
    // Create the final sorted array
    const sortedTimeZones: {name: string, label: string}[] = [];
    
    // Special case: UTC at the top
    const utcTimeZones = timeZonesByOffset.get(0) || [];
    const utcTz = utcTimeZones.find(tz => tz.name === 'UTC');
    if (utcTz) {
      sortedTimeZones.push(utcTz);
    }
    
    // Add all other time zones
    sortedOffsets.forEach(offset => {
      const zones = timeZonesByOffset.get(offset) || [];
      
      // Sort zones within the same offset alphabetically
      zones.sort((a, b) => a.name.localeCompare(b.name));
      
      // Add to the final array, skipping UTC which was already added
      zones.forEach(tz => {
        if (offset === 0 && tz.name === 'UTC') return;
        sortedTimeZones.push(tz);
      });
    });
    
    return sortedTimeZones;
  };
  
  // Get the sorted, deduplicated time zones
  const timeZones = getTimeZones();
  
  return (
    <div className="space-y-6">
      {/* Time zone visualizer - always show at the top */}
      <Collapsible open={showVisualizer} onOpenChange={setShowVisualizer} className="bg-accent/20 rounded-lg p-4 border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Availability Visualization
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {showVisualizer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent className="mt-4">
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="mb-4 grid grid-cols-2">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Calendar View</span>
              </TabsTrigger>
              <TabsTrigger value="world-map" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>World Map</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              <TimeZoneVisualizer
                selectedDays={selectedDays}
                startHour={startHour}
                endHour={endHour}
                timeZone={timeZone}
              />
            </TabsContent>
            <TabsContent value="world-map">
              <WorldMapTimeZoneVisualizer
                selectedDays={selectedDays}
                startHour={startHour}
                endHour={endHour}
                timeZone={timeZone}
              />
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Day selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Days Available
        </Label>
        <div className="flex flex-wrap gap-2">
          {dayNames.map((day, index) => {
            const dayNumber = index + 1;
            const isSelected = selectedDays.includes(dayNumber);
            
            return (
              <Button
                key={dayNumber}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                className={isSelected ? "shadow-sm" : ""}
                onClick={() => onDayToggle(dayNumber)}
              >
                {day.substring(0, 3)}
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Hours selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Hours Available
        </Label>
        <div className="bg-background rounded-md p-4 border">
          <div className="space-y-6">
            <div className="flex justify-between text-sm">
              <span>{formatHour(startHour)}</span>
              <span>{formatHour(endHour)}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Select
                value={startHour.toString()}
                onValueChange={(value) => {
                  const newStart = parseInt(value);
                  onStartHourChange(newStart);
                  if (newStart >= endHour) {
                    onEndHourChange(Math.min(newStart + 1, 23));
                  }
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} disabled={i >= endHour}>
                      {formatHour(i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex-1">
                <Slider
                  min={0}
                  max={23}
                  step={1}
                  value={[startHour, endHour]}
                  onValueChange={(values) => {
                    if (values[0] !== startHour) {
                      onStartHourChange(values[0]);
                    }
                    if (values[1] !== endHour) {
                      onEndHourChange(values[1]);
                    }
                  }}
                  className="mt-2"
                />
              </div>
              
              <Select
                value={endHour.toString()}
                onValueChange={(value) => {
                  const newEnd = parseInt(value);
                  onEndHourChange(newEnd);
                  if (newEnd <= startHour) {
                    onStartHourChange(Math.max(newEnd - 1, 0));
                  }
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()} disabled={i <= startHour}>
                      {formatHour(i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Working {endHour - startHour} hours/day</span>
              <span>Total: {selectedDays.length * (endHour - startHour)} hours/week</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Time zone selection */}
      {showTimeZoneSelector && (
        <div className="space-y-3">
          <Label htmlFor="timezone">Time Zone</Label>
          <Select 
            value={timeZone} 
            onValueChange={onTimeZoneChange}
          >
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue placeholder="Select your time zone" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {timeZones.map((tz: { name: string, label: string }) => (
                <SelectItem key={tz.name} value={tz.name}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Your local time zone is automatically detected. Change it if needed.
          </p>
        </div>
      )}
    </div>
  );
}