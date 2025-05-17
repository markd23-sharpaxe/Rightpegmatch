import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add a utility function to safely handle clicks inside dropdown menus and other UI elements
// where we want to prevent default link behavior in specific contexts
export function safeClickHandler(handler?: (e: React.MouseEvent) => void) {
  return (e: React.MouseEvent) => {
    // Prevent default action and propagation
    e.preventDefault();
    e.stopPropagation();
    
    // Call the handler if provided
    if (handler) {
      handler(e);
    }
  };
}

// Format currency to USD
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Get initials from a name
export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

// Get a list of common timezones for dropdown selection
export function getTimezones() {
  return [
    { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    { value: "GMT", label: "GMT (Greenwich Mean Time)" },
    { value: "America/New_York", label: "EST/EDT - New York (UTC-5/UTC-4)" },
    { value: "America/Chicago", label: "CST/CDT - Chicago (UTC-6/UTC-5)" },
    { value: "America/Denver", label: "MST/MDT - Denver (UTC-7/UTC-6)" },
    { value: "America/Los_Angeles", label: "PST/PDT - Los Angeles (UTC-8/UTC-7)" },
    { value: "America/Anchorage", label: "AKST/AKDT - Anchorage (UTC-9/UTC-8)" },
    { value: "Pacific/Honolulu", label: "HST - Honolulu (UTC-10)" },
    { value: "Europe/London", label: "GMT/BST - London (UTC+0/UTC+1)" },
    { value: "Europe/Paris", label: "CET/CEST - Paris, Berlin, Rome (UTC+1/UTC+2)" },
    { value: "Europe/Athens", label: "EET/EEST - Athens, Helsinki (UTC+2/UTC+3)" },
    { value: "Asia/Dubai", label: "GST - Dubai (UTC+4)" },
    { value: "Asia/Kolkata", label: "IST - Mumbai, New Delhi (UTC+5:30)" },
    { value: "Asia/Shanghai", label: "CST - Beijing, Shanghai (UTC+8)" },
    { value: "Asia/Tokyo", label: "JST - Tokyo (UTC+9)" },
    { value: "Australia/Sydney", label: "AEST/AEDT - Sydney (UTC+10/UTC+11)" },
    { value: "Pacific/Auckland", label: "NZST/NZDT - Auckland (UTC+12/UTC+13)" },
  ];
}
