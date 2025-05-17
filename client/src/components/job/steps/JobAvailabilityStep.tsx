import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Globe, Clock, Calendar, ArrowRight, Check, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface JobAvailabilityStepProps {
  availability: {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
    timeZone: string;
  }[];
  onUpdate: (availability: JobAvailabilityStepProps['availability']) => void;
  onContinue: () => void;
}

export function JobAvailabilityStep({ availability, onUpdate, onContinue }: JobAvailabilityStepProps) {
  const { toast } = useToast();
  
  // State for current availability slot being edited
  const [currentSlot, setCurrentSlot] = useState({
    selectedDays: [1], // Monday
    startHour: 9,
    endHour: 17,
    timeZone: "GMT"
  });
  
  // Day options
  const days = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];
  
  // Time options
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? "12 AM" : i === 12 ? "12 PM" : i < 12 ? `${i} AM` : `${i - 12} PM`
  }));
  
  // Time zone options
  const timeZones = [
    { value: "GMT", label: "GMT+0 (London, Lisbon)" },
    { value: "EST", label: "GMT-5 (New York, Toronto)" },
    { value: "PST", label: "GMT-8 (Los Angeles, Seattle)" },
    { value: "CET", label: "GMT+1 (Berlin, Paris, Rome)" },
    { value: "IST", label: "GMT+5:30 (New Delhi, Mumbai)" },
    { value: "JST", label: "GMT+9 (Tokyo, Seoul)" },
    { value: "AEST", label: "GMT+10 (Sydney, Melbourne)" },
  ];
  
  // Handle day toggle
  const handleDayToggle = (day: number) => {
    setCurrentSlot(prev => {
      if (prev.selectedDays.includes(day)) {
        return {
          ...prev,
          selectedDays: prev.selectedDays.filter(d => d !== day)
        };
      } else {
        return {
          ...prev,
          selectedDays: [...prev.selectedDays, day]
        };
      }
    });
  };
  
  // Add current availability slot to the list
  const addAvailabilitySlot = () => {
    if (currentSlot.selectedDays.length === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select at least one day for availability.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentSlot.startHour >= currentSlot.endHour) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    
    // Create slots for each selected day
    const newSlots = currentSlot.selectedDays.map(day => ({
      dayOfWeek: day,
      startHour: currentSlot.startHour,
      endHour: currentSlot.endHour,
      timeZone: currentSlot.timeZone
    }));
    
    const updatedAvailability = [...availability, ...newSlots];
    onUpdate(updatedAvailability);
    
    // Reset current slot days selection
    setCurrentSlot(prev => ({
      ...prev,
      selectedDays: [1],
    }));
    
    toast({
      title: "Availability Added",
      description: `Added availability for ${newSlots.length} day(s)`,
    });
  };
  
  // Remove an availability slot
  const removeAvailabilitySlot = (index: number) => {
    const updatedAvailability = [...availability];
    updatedAvailability.splice(index, 1);
    onUpdate(updatedAvailability);
  };
  
  // Handle continuing to next step
  const handleContinue = () => {
    if (availability.length === 0) {
      toast({
        title: "Required Availability",
        description: "Please add at least one availability slot.",
        variant: "destructive",
      });
      return;
    }
    
    onContinue();
  };
  
  // Get day name for display
  const getDayName = (day: number): string => {
    return days.find(d => d.value === day)?.label || "";
  };
  
  // Format hour for display
  const formatHour = (hour: number): string => {
    return hours.find(h => h.value === hour)?.label || "";
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Required Availability</h2>
        <p className="text-muted-foreground max-w-md mx-auto mt-2">
          Set when workers need to be available for this job
        </p>
      </div>
      
      <div className="bg-slate-50 rounded-lg p-6 space-y-6 border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Calendar className="h-4 w-4" />
                <CardTitle className="text-sm">Select Days</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Choose which days candidates must be available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 gap-2">
                {days.map(day => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={currentSlot.selectedDays.includes(day.value) ? "default" : "outline"}
                    className="justify-start h-8 px-2"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    <Check 
                      className={`h-3.5 w-3.5 mr-2 ${currentSlot.selectedDays.includes(day.value) ? "opacity-100" : "opacity-0"}`}
                    />
                    {day.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Clock className="h-4 w-4" />
                <CardTitle className="text-sm">Set Hours</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Define the required working hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Start Time</label>
                  <Select
                    value={currentSlot.startHour.toString()}
                    onValueChange={(value) => setCurrentSlot(prev => ({ ...prev, startHour: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(hour => (
                        <SelectItem key={`start-${hour.value}`} value={hour.value.toString()}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium">End Time</label>
                  <Select
                    value={currentSlot.endHour.toString()}
                    onValueChange={(value) => setCurrentSlot(prev => ({ ...prev, endHour: parseInt(value) }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map(hour => (
                        <SelectItem key={`end-${hour.value}`} value={hour.value.toString()}>
                          {hour.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Globe className="h-4 w-4" />
                <CardTitle className="text-sm">Time Zone</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Specify the time zone for this availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={currentSlot.timeZone}
                onValueChange={(value) => setCurrentSlot(prev => ({ ...prev, timeZone: value }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select time zone" />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
        
        <Button
          type="button"
          onClick={addAvailabilitySlot}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add Availability Slot
        </Button>
        
        <div className="flex items-center gap-4 pt-4 border-t">
          <div className="flex-1">
            <h3 className="text-sm font-medium">Your Current Selection:</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              {currentSlot.selectedDays.length} days selected, {formatHour(currentSlot.startHour)} - {formatHour(currentSlot.endHour)} ({currentSlot.timeZone})
            </p>
          </div>
          
          <ArrowRight className="text-muted-foreground" />
          
          <div className="text-right flex-1">
            <h3 className="text-sm font-medium">Workers must be available during:</h3>
            <p className="text-sm text-muted-foreground">
              {currentSlot.selectedDays.length} × {currentSlot.endHour - currentSlot.startHour} hours per week
            </p>
          </div>
        </div>
      </div>
      
      {/* Added Availability Slots Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Availability Slots ({availability.length})</CardTitle>
          <CardDescription>
            Workers must be available during these times to qualify for this job
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availability.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {availability.map((slot, index) => (
                <div key={index} className="bg-slate-50 border rounded-md p-3 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="font-medium bg-white">
                      {getDayName(slot.dayOfWeek)}
                    </Badge>
                    <button
                      onClick={() => removeAvailabilitySlot(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <span className="sr-only">Remove</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                        <path d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L7.5 6.79289L2.85355 2.14645C2.65829 1.95118 2.34171 1.95118 2.14645 2.14645C1.95118 2.34171 1.95118 2.65829 2.14645 2.85355L6.79289 7.5L2.14645 12.1464C1.95118 12.3417 1.95118 12.6583 2.14645 12.8536C2.34171 13.0488 2.65829 13.0488 2.85355 12.8536L7.5 8.20711L12.1464 12.8536C12.3417 13.0488 12.6583 13.0488 12.8536 12.8536C13.0488 12.6583 13.0488 12.3417 12.8536 12.1464L8.20711 7.5L12.8536 2.85355Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatHour(slot.startHour)} - {formatHour(slot.endHour)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{slot.timeZone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-md bg-slate-50">
              <p className="text-muted-foreground">No availability slots added yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add at least one slot to continue
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex gap-3">
        <Globe className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-amber-800">Why Time Zones Matter</h4>
          <p className="text-sm text-amber-700">
            Setting required availability helps match with candidates whose working hours overlap with your team's schedule, ensuring effective collaboration across time zones.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}