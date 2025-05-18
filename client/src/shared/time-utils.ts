/**
 * Time Zone Utilities for Standardizing Time Slots
 * 
 * This module handles time zone standardization and comparison,
 * ensuring that time slots can be compared accurately across different time zones.
 */

// Convert local time to UTC
export function localToUtc(hour: number, timeZoneOffset: number): number {
  const normalizedHour = (hour - timeZoneOffset) % 24;
  return normalizedHour < 0 ? normalizedHour + 24 : normalizedHour;
}

// Convert UTC time to local
export function utcToLocal(hour: number, timeZoneOffset: number): number {
  const normalizedHour = (hour + timeZoneOffset) % 24;
  return normalizedHour < 0 ? normalizedHour + 24 : normalizedHour;
}

// Check if two time ranges overlap
export function doTimeRangesOverlap(
  range1Start: number,
  range1End: number,
  range1TimeZone: string,
  range2Start: number,
  range2End: number,
  range2TimeZone: string
): boolean {
  // Parse time zone offsets
  const offset1 = parseTimeZoneOffset(range1TimeZone);
  const offset2 = parseTimeZoneOffset(range2TimeZone);
  
  // Convert both ranges to UTC for comparison
  const range1StartUtc = localToUtc(range1Start, offset1);
  const range1EndUtc = localToUtc(range1End, offset1);
  const range2StartUtc = localToUtc(range2Start, offset2);
  const range2EndUtc = localToUtc(range2End, offset2);
  
  // Handle day wrapping (e.g., 22:00-02:00)
  const range1Wraps = range1EndUtc < range1StartUtc;
  const range2Wraps = range2EndUtc < range2StartUtc;
  
  if (!range1Wraps && !range2Wraps) {
    // Normal case: neither range wraps
    return range1StartUtc < range2EndUtc && range2StartUtc < range1EndUtc;
  } else if (range1Wraps && !range2Wraps) {
    // Range 1 wraps (e.g., 22:00-02:00)
    return range2StartUtc < range1EndUtc || range2EndUtc > range1StartUtc;
  } else if (!range1Wraps && range2Wraps) {
    // Range 2 wraps (e.g., 22:00-02:00)
    return range1StartUtc < range2EndUtc || range1EndUtc > range2StartUtc;
  } else {
    // Both ranges wrap
    return true; // They must overlap somewhere
  }
}

// Parse a time zone string (like GMT+1, GMT-5) into an offset number
export function parseTimeZoneOffset(timeZone: string): number {
  // Default to GMT+0 if no time zone is specified
  if (!timeZone) return 0;
  
  // Parse a string like "GMT+2" or "GMT-5:30"
  try {
    const match = timeZone.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!match) return 0;
    
    let offset = parseInt(match[2], 10);
    
    // Add minutes if present
    if (match[3]) {
      offset += parseInt(match[3], 10) / 60;
    }
    
    // Apply sign
    return match[1] === '-' ? -offset : offset;
  } catch (e) {
    console.error("Error parsing time zone offset:", e);
    return 0;
  }
}

// Common time zones for selection
export function getCommonTimeZones(): { label: string, value: string }[] {
  return [
    { label: "GMT (Greenwich Mean Time)", value: "GMT+0" },
    { label: "UTC (Universal Coordinated Time)", value: "GMT+0" },
    { label: "BST (British Summer Time)", value: "GMT+1" },
    { label: "CET (Central European Time)", value: "GMT+1" },
    { label: "CEST (Central European Summer Time)", value: "GMT+2" },
    { label: "EET (Eastern European Time)", value: "GMT+2" },
    { label: "EEST (Eastern European Summer Time)", value: "GMT+3" },
    { label: "MSK (Moscow Time)", value: "GMT+3" },
    { label: "GST (Gulf Standard Time)", value: "GMT+4" },
    { label: "IST (Indian Standard Time)", value: "GMT+5:30" },
    { label: "CST (China Standard Time)", value: "GMT+8" },
    { label: "JST (Japan Standard Time)", value: "GMT+9" },
    { label: "AEST (Australian Eastern Standard Time)", value: "GMT+10" },
    { label: "NZST (New Zealand Standard Time)", value: "GMT+12" },
    { label: "HST (Hawaii Standard Time)", value: "GMT-10" },
    { label: "AKST (Alaska Standard Time)", value: "GMT-9" },
    { label: "PST (Pacific Standard Time)", value: "GMT-8" },
    { label: "PDT (Pacific Daylight Time)", value: "GMT-7" },
    { label: "MST (Mountain Standard Time)", value: "GMT-7" },
    { label: "MDT (Mountain Daylight Time)", value: "GMT-6" },
    { label: "CST (Central Standard Time)", value: "GMT-6" },
    { label: "CDT (Central Daylight Time)", value: "GMT-5" },
    { label: "EST (Eastern Standard Time)", value: "GMT-5" },
    { label: "EDT (Eastern Daylight Time)", value: "GMT-4" },
    { label: "AST (Atlantic Standard Time)", value: "GMT-4" },
    { label: "BRT (Brasilia Time)", value: "GMT-3" }
  ];
}

// Convert a time zone string to a readable name
export function timeZoneToReadableName(timeZone: string): string {
  const zones = getCommonTimeZones();
  const found = zones.find(zone => zone.value === timeZone);
  return found ? found.label : timeZone;
}