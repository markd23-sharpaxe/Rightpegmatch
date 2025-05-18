/**
 * Utility functions for working with time zones and formatting time data
 */

// Complete list of time zones with offset values for dropdown selection
export const timeZones = [
  { id: 'Etc/GMT+12', name: '(UTC-12:00) International Date Line West', offset: -12 },
  { id: 'Pacific/Midway', name: '(UTC-11:00) Midway Island, Samoa', offset: -11 },
  { id: 'Pacific/Honolulu', name: '(UTC-10:00) Hawaii', offset: -10 },
  { id: 'America/Anchorage', name: '(UTC-09:00) Alaska', offset: -9 },
  { id: 'America/Los_Angeles', name: '(UTC-08:00) Pacific Time (US & Canada)', offset: -8 },
  { id: 'America/Denver', name: '(UTC-07:00) Mountain Time (US & Canada)', offset: -7 },
  { id: 'America/Chicago', name: '(UTC-06:00) Central Time (US & Canada)', offset: -6 },
  { id: 'America/New_York', name: '(UTC-05:00) Eastern Time (US & Canada)', offset: -5 },
  { id: 'America/Halifax', name: '(UTC-04:00) Atlantic Time (Canada)', offset: -4 },
  { id: 'America/Argentina/Buenos_Aires', name: '(UTC-03:00) Buenos Aires, Georgetown', offset: -3 },
  { id: 'Atlantic/South_Georgia', name: '(UTC-02:00) Mid-Atlantic', offset: -2 },
  { id: 'Atlantic/Azores', name: '(UTC-01:00) Azores', offset: -1 },
  { id: 'Europe/London', name: '(UTC+00:00) London, Lisbon, Dublin', offset: 0 },
  { id: 'Europe/Paris', name: '(UTC+01:00) Amsterdam, Berlin, Rome, Paris', offset: 1 },
  { id: 'Europe/Helsinki', name: '(UTC+02:00) Helsinki, Kiev, Athens', offset: 2 },
  { id: 'Europe/Moscow', name: '(UTC+03:00) Moscow, St. Petersburg', offset: 3 },
  { id: 'Asia/Dubai', name: '(UTC+04:00) Abu Dhabi, Dubai', offset: 4 },
  { id: 'Asia/Karachi', name: '(UTC+05:00) Islamabad, Karachi', offset: 5 },
  { id: 'Asia/Dhaka', name: '(UTC+06:00) Dhaka, Bangladesh', offset: 6 },
  { id: 'Asia/Bangkok', name: '(UTC+07:00) Bangkok, Jakarta', offset: 7 },
  { id: 'Asia/Hong_Kong', name: '(UTC+08:00) Hong Kong, Singapore, Beijing', offset: 8 },
  { id: 'Asia/Tokyo', name: '(UTC+09:00) Tokyo, Seoul, Osaka', offset: 9 },
  { id: 'Australia/Sydney', name: '(UTC+10:00) Sydney, Melbourne, Brisbane', offset: 10 },
  { id: 'Pacific/Noumea', name: '(UTC+11:00) Noumea, Solomon Islands', offset: 11 },
  { id: 'Pacific/Auckland', name: '(UTC+12:00) Auckland, Wellington', offset: 12 },
];

/**
 * Formats UTC hour to display in the specified format with AM/PM
 * @param hour - Hour in 24-hour format (0-23)
 * @param use12Hour - Whether to use 12-hour format (true) or 24-hour format (false)
 * @returns Formatted time string
 */
export function formatHour(hour: number, use12Hour: boolean = true): string {
  if (hour < 0 || hour > 23) {
    return 'Invalid hour';
  }

  if (use12Hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHour}:00 ${period}`;
  } else {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}

/**
 * Convert local hour to a different time zone
 * @param hour - Hour in local time (0-23)
 * @param localTimeZone - Local time zone ID
 * @param targetTimeZone - Target time zone ID to convert to
 * @returns Hour in target time zone
 */
export function convertHourToTimeZone(
  hour: number, 
  localTimeZone: string, 
  targetTimeZone: string
): number {
  const localTz = timeZones.find(tz => tz.id === localTimeZone);
  const targetTz = timeZones.find(tz => tz.id === targetTimeZone);
  
  if (!localTz || !targetTz) {
    return hour; // Return original if time zones not found
  }

  // Calculate hour in target time zone
  const hourDiff = targetTz.offset - localTz.offset;
  let newHour = (hour + hourDiff) % 24;
  
  // Handle negative hours
  if (newHour < 0) {
    newHour += 24;
  }
  
  return newHour;
}

/**
 * Get user-friendly name for a time zone
 * @param timeZoneId - Time zone ID (e.g., 'America/New_York')
 * @returns User-friendly name of the time zone
 */
export function getTimeZoneName(timeZoneId: string): string {
  const tz = timeZones.find(tz => tz.id === timeZoneId);
  return tz ? tz.name : timeZoneId;
}

/**
 * Format a time range between two hours
 * @param startHour - Start hour (0-23)
 * @param endHour - End hour (0-23)
 * @param use12Hour - Whether to use 12-hour format
 * @returns Formatted time range string (e.g., "9:00 AM - 5:00 PM")
 */
export function formatTimeRange(
  startHour: number, 
  endHour: number, 
  use12Hour: boolean = true
): string {
  return `${formatHour(startHour, use12Hour)} - ${formatHour(endHour, use12Hour)}`;
}

/**
 * Get the day name from a numeric day of week
 * @param day - Day of week (0-6, where 0 is Sunday)
 * @returns Name of the day
 */
export function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day % 7];
}

/**
 * Calculate overlap percentage between two time ranges
 * @param range1Start - Start hour of first range (0-23)
 * @param range1End - End hour of first range (0-23)
 * @param range2Start - Start hour of second range (0-23)
 * @param range2End - End hour of second range (0-23)
 * @returns Overlap percentage (0-100)
 */
export function calculateTimeOverlap(
  range1Start: number,
  range1End: number,
  range2Start: number,
  range2End: number
): number {
  // Handle cases where end is less than start (overnight periods)
  const range1Length = range1End <= range1Start ? (range1End + 24) - range1Start : range1End - range1Start;
  const range2Length = range2End <= range2Start ? (range2End + 24) - range2Start : range2End - range2Start;
  
  // Normalize range2 to be within the same day as range1
  let normalizedRange2Start = range2Start;
  let normalizedRange2End = range2End;
  
  if (range2End <= range2Start) {
    normalizedRange2End += 24;
  }
  
  // Calculate overlap
  const overlapStart = Math.max(range1Start, normalizedRange2Start);
  const overlapEnd = Math.min(range1End <= range1Start ? range1End + 24 : range1End, normalizedRange2End);
  
  const overlapLength = Math.max(0, overlapEnd - overlapStart);
  
  // Calculate percentage based on the shorter of the two ranges
  const shorterRangeLength = Math.min(range1Length, range2Length);
  
  return shorterRangeLength > 0 ? (overlapLength / shorterRangeLength) * 100 : 0;
}