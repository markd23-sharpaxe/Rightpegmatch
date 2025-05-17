import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Info } from "lucide-react";
import TimeZoneSelector from "./TimeZoneSelector";
import { parseTimeZoneOffset, utcToLocal } from "@shared/time-utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AvailabilitySelectorProps {
  selectedDays: number[];
  onDayToggle: (day: number) => void;
  startHour: string;
  endHour: string;
  onStartHourChange: (hour: string) => void;
  onEndHourChange: (hour: string) => void;
  timeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
  showTimeZoneSelector?: boolean;
}

export default function AvailabilitySelector({
  selectedDays,
  onDayToggle,
  startHour,
  endHour,
  onStartHourChange,
  onEndHourChange,
  timeZone = "GMT+0",
  onTimeZoneChange,
  showTimeZoneSelector = false
}: AvailabilitySelectorProps) {
  const daysOfWeek = [
    { value: 0, label: "Mon" },
    { value: 1, label: "Tue" },
    { value: 2, label: "Wed" },
    { value: 3, label: "Thu" },
    { value: 4, label: "Fri" },
    { value: 5, label: "Sat" },
    { value: 6, label: "Sun" },
  ];
  
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return {
      value: hour.toString(),
      label: `${hour12}:00 ${amPm}`
    };
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Set Your Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Available Days</Label>
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`
                  flex items-center justify-center h-10 rounded-md text-sm font-medium transition-colors
                  ${selectedDays.includes(day.value)
                    ? 'bg-[#5BBFBA] text-white'
                    : 'border border-neutral-200 hover:bg-neutral-100'}
                `}
                onClick={() => onDayToggle(day.value)}
              >
                {day.label}
                {selectedDays.includes(day.value) && (
                  <Check className="ml-1 h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {showTimeZoneSelector && onTimeZoneChange && (
          <div className="mb-4">
            <TimeZoneSelector 
              value={timeZone} 
              onChange={onTimeZoneChange} 
              label="Time Zone for Availability"
            />
            
            <div className="mt-2 flex items-center text-sm text-neutral-500">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0">
                      <Info className="h-4 w-4 mr-1" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Your availability will be standardized to match jobs in different time zones. For example, 
                    10am-12pm in GMT is equivalent to 12pm-2pm in GMT+2.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>Times are displayed in your local time zone</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Start Time</Label>
              <span className="text-xs text-neutral-500">{timeZone}</span>
            </div>
            <Select value={startHour} onValueChange={onStartHourChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={`start-${hour.value}`} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>End Time</Label>
              <span className="text-xs text-neutral-500">{timeZone}</span>
            </div>
            <Select value={endHour} onValueChange={onEndHourChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={`end-${hour.value}`} value={hour.value}>
                    {hour.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
