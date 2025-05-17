import { forwardRef } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCommonTimeZones } from "@shared/time-utils";

interface TimeZoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const timeZones = getCommonTimeZones();

const TimeZoneSelector = forwardRef<HTMLButtonElement, TimeZoneSelectorProps>(
  ({ value, onChange, label = "Time Zone" }, ref) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger ref={ref}>
            <SelectValue placeholder="Select time zone" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {timeZones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);

TimeZoneSelector.displayName = "TimeZoneSelector";

export default TimeZoneSelector;