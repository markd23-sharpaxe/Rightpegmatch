import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Info, Check, Plus, Clock, Globe, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimeZoneMarker {
  id: string;
  top: string;
  left: string;
  color: string;
  label: string;
  offsetHours: number;
}

interface TimeZoneOverlap {
  region: string;
  overlap: string;
  percentage: number;
  offsetDescription: string;
}

export default function TimeZoneToolSection() {
  const [timeZone, setTimeZone] = useState("GMT-8");
  const [startTime, setStartTime] = useState("9:00");
  const [startPeriod, setStartPeriod] = useState("AM");
  const [endTime, setEndTime] = useState("5:00");
  const [endPeriod, setEndPeriod] = useState("PM");
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]); // Monday to Friday
  
  // Extract offset hours from timezone string
  const getOffsetHours = (tz: string): number => {
    const match = tz.match(/GMT([+-]\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  
  const userOffsetHours = getOffsetHours(timeZone);
  
  // Update your location marker when timezone changes
  const timeZoneMarkers: TimeZoneMarker[] = useMemo(() => [
    { 
      id: "your-location", 
      top: "40%", 
      left: `${Math.min(Math.max((userOffsetHours + 12) * 5 + 10, 10), 90)}%`, 
      color: "#FFA500", 
      label: `${timeZone} (Your location)`,
      offsetHours: userOffsetHours
    },
    { id: "gmt-8", top: "30%", left: "15%", color: "#5BBFBA", label: "GMT-8 (PST)", offsetHours: -8 },
    { id: "gmt-5", top: "35%", left: "25%", color: "#5BBFBA", label: "GMT-5 (EST)", offsetHours: -5 },
    { id: "gmt", top: "45%", left: "40%", color: "#5BBFBA", label: "GMT (London)", offsetHours: 0 },
    { id: "gmt+1", top: "40%", left: "45%", color: "#5BBFBA", label: "GMT+1 (Paris)", offsetHours: 1 },
    { id: "gmt+8", top: "50%", left: "75%", color: "#5BBFBA", label: "GMT+8 (Singapore)", offsetHours: 8 },
    { id: "gmt+9", top: "35%", left: "80%", color: "#5BBFBA", label: "GMT+9 (Tokyo)", offsetHours: 9 },
  ], [timeZone, userOffsetHours]);
  
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  // Parse time string to hours (0-23)
  const parseTimeToHours = (time: string, period: string): number => {
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr);
    
    // Convert 12-hour format to 24-hour
    if (period === 'PM' && hour < 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return hour;
  };
  
  // Calculate user's working hours in their local timezone (24-hour format)
  const userStartHour = parseTimeToHours(startTime, startPeriod);
  const userEndHour = parseTimeToHours(endTime, endPeriod);
  
  // Calculate overlaps with other regions based on user's timezone and working hours
  const calculateOverlaps = (): TimeZoneOverlap[] => {
    // User's working range in their local timezone, converted to hours (0-23)
    const userWorkHours = Array.from(
      { length: (userEndHour - userStartHour + 24) % 24 || 24 },
      (_, i) => (userStartHour + i) % 24
    );
    
    const totalUserWorkHours = userWorkHours.length;
    
    return [
      { region: "North America (PST)", offsetHours: -8 },
      { region: "North America (EST)", offsetHours: -5 },
      { region: "Western Europe", offsetHours: 1 },
      { region: "India", offsetHours: 5.5 },
      { region: "East Asia (China/Singapore)", offsetHours: 8 },
      { region: "Japan/Korea", offsetHours: 9 },
      { region: "Australia (Sydney)", offsetHours: 10 },
    ].map(region => {
      // Calculate the time difference between user's timezone and the region
      const hourDifference = region.offsetHours - userOffsetHours;
      
      // Convert the user's working hours to the region's timezone
      const userWorkHoursInRegionTZ = userWorkHours.map(h => 
        (h - hourDifference + 24) % 24
      );
      
      // Standard business hours in any timezone (9 AM to 5 PM)
      const standardBusinessHours = Array.from({ length: 8 }, (_, i) => i + 9);
      
      // Find the intersection (overlap) between user's hours and standard business hours
      const overlapHours = userWorkHoursInRegionTZ.filter(h => 
        standardBusinessHours.includes(h)
      );
      
      const overlapPercentage = Math.round((overlapHours.length / 8) * 100);
      
      let overlapDescription = "No overlap";
      if (overlapPercentage === 100) {
        overlapDescription = "Full overlap";
      } else if (overlapPercentage >= 75) {
        overlapDescription = "Excellent overlap";
      } else if (overlapPercentage >= 50) {
        overlapDescription = "Good overlap";
      } else if (overlapPercentage >= 25) {
        overlapDescription = "Partial overlap";
      } else if (overlapPercentage > 0) {
        overlapDescription = "Minimal overlap";
      }
      
      // Create a human-readable time difference description
      let offsetDescription = "Same timezone";
      if (hourDifference > 0) {
        offsetDescription = `${hourDifference} hour${hourDifference !== 1 ? 's' : ''} ahead of you`;
      } else if (hourDifference < 0) {
        offsetDescription = `${Math.abs(hourDifference)} hour${Math.abs(hourDifference) !== 1 ? 's' : ''} behind you`;
      }
      
      return {
        region: region.region,
        overlap: overlapDescription,
        percentage: overlapPercentage,
        offsetDescription
      };
    });
  };
  
  const regionOverlaps = useMemo(calculateOverlaps, [
    timeZone, userOffsetHours, userStartHour, userEndHour
  ]);
  
  const toggleDay = (index: number) => {
    if (selectedDays.includes(index)) {
      setSelectedDays(selectedDays.filter(day => day !== index));
    } else {
      setSelectedDays([...selectedDays, index]);
    }
  };
  
  // Additional time options
  const hourOptions = [
    "1:00", "2:00", "3:00", "4:00", "5:00", "6:00", 
    "7:00", "8:00", "9:00", "10:00", "11:00", "12:00"
  ];
  
  // Handle complete time changes
  const handleStartTimeChange = (newTime: string) => {
    setStartTime(newTime);
  };
  
  const handleEndTimeChange = (newTime: string) => {
    setEndTime(newTime);
  };
  
  const handleStartPeriodChange = (period: string) => {
    setStartPeriod(period);
  };
  
  const handleEndPeriodChange = (period: string) => {
    setEndPeriod(period);
  };
  
  // Helper function to get color class based on overlap percentage
  const getOverlapColorClass = (percentage: number): string => {
    if (percentage >= 75) return "text-green-400";
    if (percentage >= 50) return "text-emerald-400";
    if (percentage >= 25) return "text-amber-400";
    if (percentage > 0) return "text-orange-400";
    return "text-gray-400";
  };
  
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="font-bold text-3xl md:text-4xl mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">
          Find the Perfect Time Zone Match
        </h2>
        <p className="text-gray-300 text-center max-w-3xl mx-auto mb-12 text-lg">
          Our intelligent time zone matching tool helps you find work compatible with your schedule
        </p>
        
        <div className="bg-gray-800 rounded-lg p-6 md:p-8 max-w-5xl mx-auto shadow-lg border border-gray-700">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-full">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium text-xl">Availability Time Matcher</h3>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <Info className="h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm bg-gray-900 text-gray-200 border-gray-700">
                    <p>This tool shows how your availability overlaps with business hours around the world. We use this data to match you with compatible jobs based on time zone compatibility.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Time Zone</label>
                  <Select value={timeZone} onValueChange={setTimeZone}>
                    <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:ring-primary">
                      <SelectValue placeholder="Select time zone" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="GMT-12">GMT-12 (Baker Island)</SelectItem>
                      <SelectItem value="GMT-10">GMT-10 (Hawaii)</SelectItem>
                      <SelectItem value="GMT-8">GMT-8 (Pacific Time)</SelectItem>
                      <SelectItem value="GMT-7">GMT-7 (Mountain Time)</SelectItem>
                      <SelectItem value="GMT-6">GMT-6 (Central Time)</SelectItem>
                      <SelectItem value="GMT-5">GMT-5 (Eastern Time)</SelectItem>
                      <SelectItem value="GMT-4">GMT-4 (Atlantic Time)</SelectItem>
                      <SelectItem value="GMT-3">GMT-3 (Buenos Aires)</SelectItem>
                      <SelectItem value="GMT">GMT (London)</SelectItem>
                      <SelectItem value="GMT+1">GMT+1 (Central Europe)</SelectItem>
                      <SelectItem value="GMT+2">GMT+2 (Eastern Europe)</SelectItem>
                      <SelectItem value="GMT+3">GMT+3 (Moscow)</SelectItem>
                      <SelectItem value="GMT+4">GMT+4 (Dubai)</SelectItem>
                      <SelectItem value="GMT+5.5">GMT+5.5 (India)</SelectItem>
                      <SelectItem value="GMT+7">GMT+7 (Bangkok)</SelectItem>
                      <SelectItem value="GMT+8">GMT+8 (Singapore/China)</SelectItem>
                      <SelectItem value="GMT+9">GMT+9 (Japan/Korea)</SelectItem>
                      <SelectItem value="GMT+10">GMT+10 (Sydney)</SelectItem>
                      <SelectItem value="GMT+12">GMT+12 (New Zealand)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Available Working Hours</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm text-gray-400">Start Time</span>
                      <div className="flex gap-2">
                        <Select value={startTime} onValueChange={handleStartTimeChange}>
                          <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            {hourOptions.map(hour => (
                              <SelectItem key={`start-${hour}`} value={hour}>{hour}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={startPeriod} onValueChange={handleStartPeriodChange}>
                          <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-sm text-gray-400">End Time</span>
                      <div className="flex gap-2">
                        <Select value={endTime} onValueChange={handleEndTimeChange}>
                          <SelectTrigger className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            {hourOptions.map(hour => (
                              <SelectItem key={`end-${hour}`} value={hour}>{hour}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select value={endPeriod} onValueChange={handleEndPeriodChange}>
                          <SelectTrigger className="w-20 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 focus:ring-primary">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Available Days</label>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {daysOfWeek.map((day, index) => (
                    <div key={`day-label-${index}`} className="font-medium text-gray-400">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mt-2">
                  {daysOfWeek.map((day, index) => (
                    <div 
                      key={`day-slot-${index}`}
                      className={`availability-slot border rounded p-2 text-center cursor-pointer transition-all ${
                        selectedDays.includes(index) 
                          ? 'border-primary bg-primary/20 text-white' 
                          : 'border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                      onClick={() => toggleDay(index)}
                    >
                      {selectedDays.includes(index) ? (
                        <Check className="h-5 w-5 mx-auto text-primary" />
                      ) : (
                        <Plus className="h-5 w-5 mx-auto opacity-50" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-2.5 rounded bg-gray-700/50 border border-gray-600 text-sm text-gray-300">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong className="font-medium">Note:</strong> Your job match score is significantly based on time zone compatibility. 
                      Add all your available working hours for the best matching results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 rounded-lg bg-gray-900 border border-gray-700">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-primary/20 rounded-full">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-lg font-medium">Global Time Zone Compatibility</h4>
            </div>
            
            <div className="relative h-32 mb-6 bg-gray-800 rounded-lg overflow-hidden p-3 border border-gray-700">
              {/* World map visualization with time zones */}
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-gray-700"></div>
              </div>
              
              {/* Time labels */}
              <div className="absolute top-1 left-0 w-full flex justify-between px-5 text-xs text-gray-500">
                <span>GMT-12</span>
                <span>GMT-6</span>
                <span>GMT</span>
                <span>GMT+6</span>
                <span>GMT+12</span>
              </div>
              
              {/* Time Zone markers */}
              {timeZoneMarkers.map(marker => (
                <TooltipProvider key={marker.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-help"
                        style={{ 
                          top: marker.top, 
                          left: marker.left, 
                          backgroundColor: marker.color,
                          boxShadow: marker.id === "your-location" ? "0 0 0 2px rgba(255,255,255,0.5)" : "none",
                          zIndex: marker.id === "your-location" ? 10 : 5
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-900 text-gray-200 border-gray-700">
                      <p><strong>{marker.label}</strong></p>
                      {marker.id === "your-location" && (
                        <p className="text-xs text-gray-400">Your working hours: {startTime} {startPeriod} - {endTime} {endPeriod}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              
              {/* Working hours overlay */}
              <div 
                className="absolute h-full bg-primary/20 border-l border-r border-primary/30"
                style={{
                  // Position overlay based on user's start and end hours
                  left: `${Math.min(Math.max((userOffsetHours + userStartHour + 12) * 2.1 + 10, 0), 100)}%`,
                  width: `${Math.min(Math.max(((userEndHour - userStartHour + 24) % 24) * 2.1, 0), 100)}%`,
                  top: '0',
                  zIndex: 2
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-5">
              {regionOverlaps.map((region, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getOverlapColorClass(region.percentage)}`} />
                      <span className="font-medium">{region.region}</span>
                    </div>
                    <div className="text-xs text-gray-400 ml-4 mt-1">{region.offsetDescription}</div>
                  </div>
                  <div className={`text-sm font-medium ${getOverlapColorClass(region.percentage)}`}>
                    {region.overlap} ({region.percentage}%)
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-gray-800 rounded-md border border-gray-700">
              <div className="flex gap-3 items-start">
                <div className="mt-0.5">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">Time Zone Matching Tips</p>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Our algorithm matches you with jobs that have significant time zone overlap</li>
                    <li>• You'll see higher match scores when your availability aligns with job requirements</li>
                    <li>• Flexible schedules improve your chances of matching with more opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
