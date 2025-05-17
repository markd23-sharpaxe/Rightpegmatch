import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ExperienceLevel } from "../../../shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AutocompleteInput, AutocompleteOption } from "@/components/ui/autocomplete-input";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  UserCircle, 
  Book, 
  Briefcase, 
  Calendar, 
  Code, 
  Globe, 
  Laptop, 
  Languages as LanguagesIcon, 
  Linkedin, 
  PlusCircle, 
  CheckCircle2, 
  Settings,
  Search,
  XCircle,
  DollarSign
} from "lucide-react";

// Get timezone options organized by offset
const getTimeZones = () => {
  // Get all time zones
  const allTimeZones = Intl.supportedValuesOf("timeZone");
  
  // Create a map to store time zones by offset
  const timeZonesByOffset = new Map<number, {value: string, label: string}[]>();
  
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
      timeZonesByOffset.get(offsetNum)?.push({value: tz, label});
    } catch (e) {
      // Skip any problematic time zones
      console.warn(`Error processing time zone ${tz}:`, e);
    }
  });
  
  // Sort the offsets
  const sortedOffsets = Array.from(timeZonesByOffset.keys()).sort((a, b) => a - b);
  
  // Create the final sorted array
  const sortedTimeZones: {value: string, label: string}[] = [];
  
  // Special case: UTC at the top
  const utcTimeZones = timeZonesByOffset.get(0) || [];
  const utcTz = utcTimeZones.find(tz => tz.value === 'UTC');
  if (utcTz) {
    sortedTimeZones.push(utcTz);
  }
  
  // Add common time zones at the top for convenience
  const commonZones = [
    'Europe/London', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney', 'Europe/Paris', 
    'Europe/Berlin', 'Asia/Shanghai', 'Asia/Kolkata'
  ];
  
  commonZones.forEach(commonZone => {
    for (const [_, zones] of timeZonesByOffset.entries()) {
      const found = zones.find(tz => tz.value === commonZone);
      if (found && !sortedTimeZones.some(tz => tz.value === commonZone)) {
        sortedTimeZones.push(found);
      }
    }
  });
  
  // Add all other time zones
  sortedOffsets.forEach(offset => {
    const zones = timeZonesByOffset.get(offset) || [];
    
    // Sort zones within the same offset alphabetically
    zones.sort((a, b) => a.value.localeCompare(b.value));
    
    // Add to the final array, skipping zones already added
    zones.forEach(tz => {
      if (sortedTimeZones.some(item => item.value === tz.value)) return;
      sortedTimeZones.push(tz);
    });
  });
  
  return sortedTimeZones;
};

// Get the sorted, deduplicated time zones
const timezones = getTimeZones();

// List of all countries in the world
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", 
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", 
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", 
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", 
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", 
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", 
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", 
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", 
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", 
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", 
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", 
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", 
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", 
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", 
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", 
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// List of common world languages
const languages = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani", "Basque", "Belarusian", "Bengali", 
  "Bosnian", "Bulgarian", "Burmese", "Catalan", "Cebuano", "Chinese (Cantonese)", "Chinese (Mandarin)", "Corsican", "Croatian", 
  "Czech", "Danish", "Dutch", "English", "Esperanto", "Estonian", "Farsi", "Filipino", "Finnish", "French", 
  "Frisian", "Galician", "Georgian", "German", "Greek", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", 
  "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", 
  "Kannada", "Kazakh", "Khmer", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lithuanian", 
  "Luxembourgish", "Macedonian", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Mongolian", "Nepali", 
  "Norwegian", "Nyanja", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan", 
  "Scots Gaelic", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", 
  "Sundanese", "Swahili", "Swedish", "Tagalog", "Tajik", "Tamil", "Telugu", "Thai", "Turkish", "Ukrainian", 
  "Urdu", "Uzbek", "Vietnamese", "Welsh", "Xhosa", "Yiddish", "Yoruba", "Zulu"
];

// Form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  location: z.string().min(2, "Location must be at least 2 characters").max(100).optional().or(z.literal("")),
  timeZone: z.string().optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  languages: z.string().optional().or(z.literal("")),
  linkedInProfile: z.string().url().optional().or(z.literal("")),
  preferredHoursPerWeek: z.number().min(1).max(80).optional(),
  // Salary requirement fields
  minSalaryRequirement: z.number().min(0).optional(),
  maxSalaryRequirement: z.number().min(0).optional(),
  salaryCurrency: z.string().optional().or(z.literal("")),
  preferredSalaryType: z.string().optional().or(z.literal("")),
  // Job role and other fields will be handled separately
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Type definitions for job roles and skills
interface JobRole {
  id: number;
  name: string;
  category: string | null;
}

interface Skill {
  id: number;
  name: string;
  category: string | null;
}

interface UserJobRole {
  userId: number;
  jobRoleId: number;
  isPrimary: boolean;
  experienceLevel?: string | null;
  role: JobRole;
}

// Steps for the profile wizard
const STEPS = [
  { id: "personal", label: "Personal Info", icon: UserCircle },
  { id: "role", label: "Job Role", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Code },
  { id: "qualifications", label: "Qualifications", icon: Book },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "additional", label: "Additional", icon: Settings },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

export default function EditProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [selectedJobRole, setSelectedJobRole] = useState<number | null>(null);
  const [selectedJobRoles, setSelectedJobRoles] = useState<number[]>([]);
  const [primaryJobRole, setPrimaryJobRole] = useState<number | null>(null);
  const [jobRoleExperience, setJobRoleExperience] = useState<Record<number, string>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [refreshingMatches, setRefreshingMatches] = useState(false);
  
  // Availability state
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [dayTimeSlots, setDayTimeSlots] = useState<Record<number, { startHour: number; endHour: number }>>({});
  interface Qualification {
    id: number;
    name: string;
    category?: string | null;
    isNew?: boolean;
    newValue?: string;
  }
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [customQual, setCustomQual] = useState("");
  const [qualSuggestions, setQualSuggestions] = useState<Qualification[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Function to refresh job matches after profile updates
  const refreshJobMatches = async () => {
    try {
      setRefreshingMatches(true);
      const response = await fetch('/api/matches/refresh', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh matches');
      }
      
      // Notify user that matches have been refreshed
      toast({
        title: "Matches Updated",
        description: "Your job matches have been refreshed with your updated profile",
      });
      
    } catch (error: any) {
      toast({
        title: "Match Refresh Failed",
        description: error.message || "Could not refresh job matches",
        variant: "destructive",
      });
    } finally {
      setRefreshingMatches(false);
    }
  };
  
  // Create form with default values from user profile
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      location: user?.location || "",
      timeZone: user?.timeZone || "",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
      languages: user?.languages || "",
      linkedInProfile: user?.linkedInProfile || "",
      preferredHoursPerWeek: user?.preferredHoursPerWeek || undefined,
      // Salary requirements
      minSalaryRequirement: user?.minSalaryRequirement ? Number(user.minSalaryRequirement) : undefined,
      maxSalaryRequirement: user?.maxSalaryRequirement ? Number(user.maxSalaryRequirement) : undefined,
      salaryCurrency: user?.salaryCurrency || "USD",
      preferredSalaryType: user?.preferredSalaryType || "hourly",
    },
  });
  
  // Update form when user changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        location: user.location || "",
        timeZone: user.timeZone || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        languages: user.languages || "",
        linkedInProfile: user.linkedInProfile || "",
        preferredHoursPerWeek: user.preferredHoursPerWeek || undefined,
        // Salary requirements
        minSalaryRequirement: user.minSalaryRequirement ? Number(user.minSalaryRequirement) : undefined,
        maxSalaryRequirement: user.maxSalaryRequirement ? Number(user.maxSalaryRequirement) : undefined,
        salaryCurrency: user.salaryCurrency || "USD",
        preferredSalaryType: user.preferredSalaryType || "hourly",
      });
      
      // Set initial legacy job role if available
      if (user.jobRoleId) {
        setSelectedJobRole(user.jobRoleId);
      }
      
      // Initialize selected languages if they exist
      if (user.languages) {
        // Split by comma and trim spaces
        const languagesList = user.languages.split(',').map(lang => lang.trim()).filter(Boolean);
        setSelectedLanguages(languagesList);
      }
    }
  }, [user, form]);
  
  // Fetch job roles
  const { data: jobRoles = [], isLoading: jobRolesLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
    queryFn: async () => {
      const response = await fetch("/api/job-roles");
      if (!response.ok) {
        throw new Error("Failed to fetch job roles");
      }
      return response.json();
    },
  });
  
  // Fetch user job roles
  const { data: userJobRoles = [], isLoading: userJobRolesLoading } = useQuery<UserJobRole[]>({
    queryKey: ["/api/user/job-roles"],
    queryFn: async () => {
      const response = await fetch("/api/user/job-roles");
      if (!response.ok) {
        throw new Error("Failed to fetch user job roles");
      }
      return response.json();
    },
  });
  
  // Initialize selectedJobRoles, primaryJobRole, and experience levels based on userJobRoles
  useEffect(() => {
    if (userJobRoles && userJobRoles.length > 0) {
      // Extract job role IDs and set them in state
      const roleIds = userJobRoles.map(r => r.jobRoleId);
      setSelectedJobRoles(roleIds);
      
      // Find and set the primary role
      const primaryRole = userJobRoles.find(r => r.isPrimary);
      if (primaryRole) {
        setPrimaryJobRole(primaryRole.jobRoleId);
      } else if (roleIds.length > 0) {
        // If no role is marked as primary, use the first one
        setPrimaryJobRole(roleIds[0]);
      }
      
      // Set experience levels from loaded job roles
      const experienceLevels: Record<number, string> = {};
      userJobRoles.forEach(role => {
        if (role.experienceLevel) {
          experienceLevels[role.jobRoleId] = role.experienceLevel;
        }
      });
      setJobRoleExperience(experienceLevels);
    } else if (user?.jobRoleId) {
      // Fallback to legacy job role if no user job roles exist
      setSelectedJobRoles(user.jobRoleId ? [user.jobRoleId] : []);
      setPrimaryJobRole(user.jobRoleId);
    }
  }, [userJobRoles, user]);
  
  // Fetch user qualifications
  useEffect(() => {
    if (user?.id) {
      const fetchQualifications = async () => {
        try {
          const response = await fetch('/api/user/qualifications');
          
          if (response.ok) {
            const qualificationsData = await response.json();
            setQualifications(qualificationsData);
          }
        } catch (error) {
          console.error("Error fetching user qualifications:", error);
        }
      };
      
      fetchQualifications();
    }
  }, [user?.id]);
  
  // Define interface for availability slots
  interface AvailabilitySlot {
    id: number;
    userId: number;
    dayOfWeek: number;
    startHour: number;
    endHour: number;
    timeZone?: string;
  }
  
  // Fetch user availability with proper typing
  const { data: availabilitySlots = [], isLoading: availabilityLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["/api/profile/availability"],
    queryFn: async () => {
      const response = await fetch("/api/profile/availability");
      if (!response.ok) {
        throw new Error("Failed to fetch availability");
      }
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Process availability slots into day-based structure when data is loaded
  useEffect(() => {
    if (availabilitySlots && availabilitySlots.length > 0) {
      // Extract the available days
      const days = availabilitySlots.map((slot: AvailabilitySlot) => slot.dayOfWeek);
      setAvailableDays([...new Set(days)] as number[]); // Remove duplicates
      
      // Create time slots map by day
      const slotsMap: Record<number, { startHour: number; endHour: number }> = {};
      availabilitySlots.forEach((slot: AvailabilitySlot) => {
        slotsMap[slot.dayOfWeek] = {
          startHour: slot.startHour,
          endHour: slot.endHour
        };
      });
      setDayTimeSlots(slotsMap);
    }
  }, [availabilitySlots]);
  
  // Fetch skills
  const { data: allSkills = [], isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const response = await fetch("/api/skills");
      if (!response.ok) {
        throw new Error("Failed to fetch skills");
      }
      return response.json();
    },
  });
  
  // Fetch user skills
  const { data: userSkills = [], isLoading: userSkillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/user/skills"],
    queryFn: async () => {
      const response = await fetch("/api/user/skills");
      if (!response.ok) {
        throw new Error("Failed to fetch user skills");
      }
      return response.json();
    },
  });
  
  // Set initial selected skills when user skills are loaded
  useEffect(() => {
    if (userSkills.length > 0) {
      setSelectedSkills(userSkills.map(skill => skill.id));
    }
  }, [userSkills]);
  
  // Add click-away listener to close suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showSuggestions && 
        !target.closest('input') && 
        !target.closest('.autocomplete-suggestions')
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PATCH", `/api/user`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add job role mutation
  const addJobRoleMutation = useMutation({
    mutationFn: async ({ 
      jobRoleId, 
      isPrimary, 
      experienceLevel 
    }: { 
      jobRoleId: number, 
      isPrimary: boolean, 
      experienceLevel?: string | null 
    }) => {
      const response = await apiRequest("POST", `/api/profile/job-roles`, { 
        jobRoleId, 
        isPrimary, 
        experienceLevel 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add job role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/job-roles"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Job Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Remove job role mutation
  const removeJobRoleMutation = useMutation({
    mutationFn: async (jobRoleId: number) => {
      const response = await apiRequest("DELETE", `/api/profile/job-roles/${jobRoleId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove job role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/job-roles"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove Job Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set primary job role mutation
  const setPrimaryJobRoleMutation = useMutation({
    mutationFn: async ({
      jobRoleId,
      experienceLevel
    }: {
      jobRoleId: number,
      experienceLevel?: string | null
    }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/profile/job-roles/${jobRoleId}/primary`,
        { experienceLevel }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to set primary job role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/job-roles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Set Primary Job Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update job role experience mutation
  const updateRoleExperienceMutation = useMutation({
    mutationFn: async ({
      jobRoleId,
      experienceLevel
    }: {
      jobRoleId: number,
      experienceLevel: string | null
    }) => {
      const response = await apiRequest(
        "PATCH", 
        `/api/profile/job-roles/${jobRoleId}/experience`,
        { experienceLevel }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update experience level");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/job-roles"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Experience Level",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Legacy update job role mutation - keeping for backward compatibility
  const updateJobRoleMutation = useMutation({
    mutationFn: async (jobRoleId: number) => {
      const response = await apiRequest("PATCH", `/api/user`, { jobRoleId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update job role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/job-roles"] });
      
      toast({
        title: "Job Role Updated",
        description: "Your job role has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Job Role Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest("POST", `/api/profile/skills`, { skillId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async (skillName: string) => {
      console.log("Creating new skill:", skillName);
      try {
        const response = await apiRequest("POST", "/api/skills", { 
          name: skillName,
          addToProfile: true // Automatically add to user's profile
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response from server:", errorData);
          throw new Error(errorData.message || "Failed to create skill");
        }
        
        const result = await response.json();
        console.log("Skill created successfully:", result);
        return result;
      } catch (error) {
        console.error("Exception in createSkillMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Skill creation success - received data:", data);
      
      // Force refetch the skills lists
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills"] });
      
      // Update the selected skills with the new one
      setSelectedSkills(prev => [...prev, data.id]);
      
      toast({
        title: "Skill Added",
        description: `"${data.name}" has been added to your profile.`
      });
    },
    onError: (error: any) => {
      console.error("Skill creation failed:", error);
      toast({
        title: "Failed to Add Skill",
        description: error.message || "An error occurred while adding the skill.",
        variant: "destructive"
      });
    }
  });
  
  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest("DELETE", `/api/profile/skills/${skillId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove skill");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Remove Skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle submit for personal info
  const handlePersonalInfoSubmit = (data: ProfileFormValues) => {
    // Make sure languages field has the latest from selectedLanguages
    const updatedData = {
      ...data,
      languages: selectedLanguages.join(', ')
    };
    
    updateProfileMutation.mutate(updatedData, {
      onSuccess: () => {
        // Refresh job matches after updating profile
        refreshJobMatches();
        moveToNextStep();
      }
    });
  };
  
  // Handle job role selection
  const handleJobRoleSubmit = async () => {
    if (selectedJobRoles.length === 0) {
      toast({
        title: "Please Select Job Roles",
        description: "You need to select at least one job role to continue.",
        variant: "destructive",
      });
      return;
    }

    // Check if a primary role is selected
    if (!primaryJobRole && selectedJobRoles.length > 0) {
      // Auto-select the first role as primary if none is selected
      setPrimaryJobRole(selectedJobRoles[0]);
    }

    try {
      setIsLoading(true);
      
      // Get current user job roles
      const currentRoleIds = userJobRoles.map(role => role.jobRoleId);
      
      // Find roles to add (in selected but not in current)
      const rolesToAdd = selectedJobRoles.filter(id => !currentRoleIds.includes(id));
      
      // Find roles to remove (in current but not in selected)
      const rolesToRemove = currentRoleIds.filter(id => !selectedJobRoles.includes(id));
      
      // Add new roles
      for (const roleId of rolesToAdd) {
        const isPrimary = roleId === primaryJobRole;
        const experienceLevel = jobRoleExperience[roleId] || null;
        await addJobRoleMutation.mutateAsync({ 
          jobRoleId: roleId, 
          isPrimary,
          experienceLevel 
        });
      }
      
      // Remove unselected roles
      for (const roleId of rolesToRemove) {
        await removeJobRoleMutation.mutateAsync(roleId);
      }
      
      // Set the primary role if needed
      if (primaryJobRole && !rolesToAdd.includes(primaryJobRole)) {
        const experienceLevel = jobRoleExperience[primaryJobRole] || null;
        await setPrimaryJobRoleMutation.mutateAsync({
          jobRoleId: primaryJobRole,
          experienceLevel
        });
      }
      
      // Update experience levels for existing non-primary roles
      const existingNonPrimaryRoles = selectedJobRoles.filter(id => 
        currentRoleIds.includes(id) && id !== primaryJobRole && !rolesToAdd.includes(id)
      );
      
      for (const roleId of existingNonPrimaryRoles) {
        const experienceLevel = jobRoleExperience[roleId] || null;
        // Skip if the role doesn't have an experience level set
        if (experienceLevel) {
          await updateRoleExperienceMutation.mutateAsync({
            jobRoleId: roleId,
            experienceLevel
          });
        }
      }
      
      // Update the user's primary job role for backward compatibility
      if (primaryJobRole) {
        await updateJobRoleMutation.mutateAsync(primaryJobRole);
      }
      
      // Refresh job matches after updating job roles
      await refreshJobMatches();
      
      moveToNextStep();
    } catch (error: any) {
      console.error("Error updating job roles:", error);
      toast({
        title: "Error Updating Job Roles",
        description: "There was an error updating your job roles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle skill selection
  const handleSkillsSubmit = async () => {
    // Get current user skills
    const currentSkillIds = userSkills.map(skill => skill.id);
    
    // Find skills to add (in selected but not in current)
    const skillsToAdd = selectedSkills.filter(id => !currentSkillIds.includes(id));
    
    // Find skills to remove (in current but not in selected)
    const skillsToRemove = currentSkillIds.filter(id => !selectedSkills.includes(id));
    
    try {
      setIsLoading(true);
      
      // Add new skills
      for (const skillId of skillsToAdd) {
        await addSkillMutation.mutateAsync(skillId);
      }
      
      // Remove unselected skills
      for (const skillId of skillsToRemove) {
        await removeSkillMutation.mutateAsync(skillId);
      }
      
      // Refresh job matches after updating skills
      await refreshJobMatches();
      
      // Move to next step
      moveToNextStep();
    } catch (error: any) {
      console.error("Error updating skills:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle qualifications submission
  const handleQualificationsSubmit = async () => {
    try {
      setIsLoading(true);
      
      // No need to update qualifications list here since each one 
      // is individually added to the database when selected
      
      // Refresh job matches after updating qualifications
      await refreshJobMatches();
      
      // Move to next step
      moveToNextStep();
      
      toast({
        title: "Qualifications Updated",
        description: "Your qualifications have been successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating qualifications:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update qualifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle toggling day availability
  const handleDayToggle = (dayNumber: number) => {
    if (availableDays.includes(dayNumber)) {
      // Remove day from available days
      setAvailableDays(availableDays.filter(day => day !== dayNumber));
    } else {
      // Add day to available days with default time slot
      setAvailableDays([...availableDays, dayNumber]);
      // Set default time slot for this day if not already set
      if (!dayTimeSlots[dayNumber]) {
        setDayTimeSlots({
          ...dayTimeSlots,
          [dayNumber]: { startHour: 9, endHour: 17 }
        });
      }
    }
  };
  
  // Handle time slot changes
  const handleTimeSlotChange = (dayNumber: number, field: 'startHour' | 'endHour', value: number) => {
    const currentSlot = dayTimeSlots[dayNumber] || { startHour: 9, endHour: 17 };
    
    // Make sure end hour is always after start hour
    let newSlot = { ...currentSlot };
    if (field === 'startHour') {
      newSlot.startHour = value;
      if (value >= newSlot.endHour) {
        newSlot.endHour = Math.min(value + 1, 23);
      }
    } else {
      newSlot.endHour = value;
      if (value <= newSlot.startHour) {
        newSlot.startHour = Math.max(value - 1, 0);
      }
    }
    
    setDayTimeSlots({
      ...dayTimeSlots,
      [dayNumber]: newSlot
    });
  };
  
  // Save availability mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      // First clear existing availability
      await apiRequest("DELETE", "/api/user/availability", {});
      
      // Create availability slots for each available day
      const promises = availableDays.map(dayOfWeek => {
        const timeSlot = dayTimeSlots[dayOfWeek] || { startHour: 9, endHour: 17 };
        return apiRequest("POST", "/api/profile/availability", {
          dayOfWeek,
          startHour: timeSlot.startHour,
          endHour: timeSlot.endHour,
          timeZone: form.getValues("timeZone")
        });
      });
      
      await Promise.all(promises);
      return availableDays.length;
    },
    onSuccess: () => {
      toast({
        title: "Availability saved",
        description: "Your availability has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/availability"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save availability",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle availability submit
  const handleAvailabilitySubmit = (data: ProfileFormValues) => {
    // Get current user values and update only what we need
    const updatedData = {
      fullName: user?.fullName || "",
      email: user?.email || "",
      location: data.location,
      timeZone: data.timeZone,
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
      languages: selectedLanguages.join(', '),
      linkedInProfile: user?.linkedInProfile || "",
      preferredHoursPerWeek: data.preferredHoursPerWeek,
    };
    
    // First update profile data
    updateProfileMutation.mutate(updatedData, {
      onSuccess: () => {
        // Then save availability data
        saveAvailabilityMutation.mutate(undefined, {
          onSuccess: () => {
            // Refresh job matches after updating availability
            refreshJobMatches();
            moveToNextStep();
          }
        });
      }
    });
  };
  
  // Handle additional info submit
  const handleAdditionalInfoSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        // Refresh job matches after updating additional info
        refreshJobMatches();
        moveToNextStep();
      }
    });
  };
  
  // Complete profile editing
  const handleCompleteEdit = async () => {
    try {
      // Refresh job matches as a final step
      await refreshJobMatches();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated and job matches refreshed.",
      });
      
      navigate("/profile");
    } catch (error) {
      console.error("Error completing profile edit:", error);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated, but we couldn't refresh your job matches.",
        variant: "default",
      });
      navigate("/profile");
    }
  };
  
  // Move to the next step
  const moveToNextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Move to the previous step
  const moveToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle select/deselect skill
  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId) 
        : [...prev, skillId]
    );
  };
  
  // Handle adding qualification
  const handleQualificationAdd = (qualification: any) => {
    console.log("handleQualificationAdd called with:", qualification);
    
    // If it's a new qualification (from autocomplete)
    if (qualification.isNew) {
      const newQualification = {
        id: qualification.id || -Date.now(), // Use provided id or generate temporary negative ID 
        name: qualification.newValue || qualification.name,
      };
      
      console.log("Processing new qualification:", newQualification);
      
      // Check if we already have this qualification by name
      if (!qualifications.some(q => q.name.toLowerCase() === newQualification.name.toLowerCase())) {
        console.log("Adding new qualification to state:", newQualification);
        setQualifications(prev => [...prev, newQualification]);
        
        // Auto-refresh job matches after adding qualifications
        setTimeout(() => {
          refreshJobMatches().catch(console.error);
        }, 1000);
      }
    } else {
      // For existing qualifications from the database
      console.log("Processing existing qualification:", qualification);
      
      // Check if we already have this qualification by id
      if (!qualifications.some(q => q.id === qualification.id)) {
        console.log("Adding existing qualification to state:", qualification);
        setQualifications(prev => [...prev, qualification]);
        
        // Add qualification to user's profile in the database is now done in the
        // onItemSelect callback, so no need to duplicate that here
        
        // Auto-refresh job matches after adding qualifications
        setTimeout(() => {
          refreshJobMatches().catch(console.error);
        }, 1000);
      } else {
        console.log("Qualification already exists in state, skipping:", qualification);
      }
    }
  };
  
  // Function to fetch qualification suggestions as user types
  const fetchQualificationSuggestions = async (query: string) => {
    if (!query.trim()) {
      setQualSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/search/qualifications?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setQualSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error fetching qualification suggestions:", error);
    }
  };
  
  // Handle qualification selection from suggestions
  const handleQualificationSelect = (qualification: Qualification) => {
    setShowSuggestions(false);
    setCustomQual("");
    
    if (qualification.isNew && qualification.newValue) {
      // Create new qualification
      fetch('/api/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: qualification.newValue, 
          addToProfile: true 
        })
      })
      .then(res => res.json())
      .then(newQualification => {
        // Refresh qualification list
        fetch('/api/user/qualifications')
          .then(res => res.json())
          .then(quals => {
            setQualifications(quals);
            
            // Auto-refresh matches
            setTimeout(() => {
              refreshJobMatches().catch(console.error);
            }, 500);
          });
      });
    } else {
      // Add existing qualification
      fetch('/api/user/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qualificationId: qualification.id })
      })
      .then(res => {
        if (res.ok) {
          // Refresh qualification list
          fetch('/api/user/qualifications')
            .then(res => res.json())
            .then(quals => {
              setQualifications(quals);
              
              // Auto-refresh matches
              setTimeout(() => {
                refreshJobMatches().catch(console.error);
              }, 500);
            });
        }
      });
    }
  };
  
  // Handle removing qualification
  const handleQualificationRemove = (qualification: any) => {
    console.log("Removing qualification:", qualification);
    
    // Remove from UI state immediately for better UX
    setQualifications(
      qualifications.filter(q => q.id !== qualification.id)
    );
    
    // If this is a saved qualification (positive ID), remove from database
    if (qualification.id > 0) {
      fetch(`/api/user/qualifications/${qualification.id}`, {
        method: 'DELETE'
      })
      .then(() => {
        console.log("Qualification deleted from server, refreshing list");
        
        // Refresh the qualifications list from server to ensure UI is in sync
        fetch('/api/user/qualifications')
          .then(res => res.json())
          .then(quals => {
            console.log("Updated qualifications list after removal:", quals);
            setQualifications(quals);
          });
          
        // Auto-refresh job matches after removing qualifications
        setTimeout(() => {
          refreshJobMatches().catch(console.error);
        }, 1000);
      })
      .catch(err => {
        console.error('Error removing qualification from profile:', err);
      });
    }
  };
  
  // Handle adding a language
  const addLanguage = (language: string) => {
    if (!language || language.trim() === '') return;
    
    // Check if the language already exists in the list
    if (selectedLanguages.includes(language)) {
      toast({
        title: "Language Already Added",
        description: `"${language}" is already in your languages list.`
      });
      return;
    }
    
    // Add the language to the list
    setSelectedLanguages(prev => [...prev, language]);
    
    // Update the form value with comma-separated string
    const updatedLanguages = [...selectedLanguages, language].join(', ');
    form.setValue('languages', updatedLanguages, { shouldDirty: true });
    
    toast({
      title: "Language Added",
      description: `"${language}" has been added to your languages.`
    });
  };
  
  // Handle removing a language
  const removeLanguage = (language: string) => {
    // Remove the language from the list
    setSelectedLanguages(prev => prev.filter(lang => lang !== language));
    
    // Update the form value with comma-separated string
    const updatedLanguages = selectedLanguages.filter(lang => lang !== language).join(', ');
    form.setValue('languages', updatedLanguages, { shouldDirty: true });
  };
  
  // Handle adding a skill from autocomplete
  const handleAddSkill = async (skillId: number | undefined, option?: AutocompleteOption) => {
    console.log("handleAddSkill called with:", { skillId, option });
    
    // If we have a valid skillId and it's not already selected, add it
    if (skillId && !selectedSkills.includes(skillId)) {
      console.log("Adding existing skill with ID:", skillId);
      setSelectedSkills(prev => [...prev, skillId]);
      return;
    }
    
    // Check if this is a new skill that needs to be created
    if (option?.isNew && typeof option.name === 'string') {
      try {
        console.log("Creating new skill with name:", option.name);
        
        // Create the new skill with addToProfile flag
        await createSkillMutation.mutateAsync(option.name);
        
        // The skill will be added to selectedSkills in onSuccess callback
      } catch (error) {
        console.error("Error creating new skill:", error);
      }
    }
  };
  
  // Create job role mutation
  const createJobRoleMutation = useMutation({
    mutationFn: async (roleName: string) => {
      console.log("Creating job role:", roleName);
      try {
        const response = await apiRequest("POST", "/api/job-roles", { name: roleName, category: "Custom" });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error response from server:", errorData);
          throw new Error(errorData.message || "Failed to create job role");
        }
        
        const result = await response.json();
        console.log("Job role created successfully:", result);
        return result;
      } catch (error) {
        console.error("Exception in createJobRoleMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Job role creation success - received data:", data);
      
      // Force refetch the job roles to get the new role in the list
      queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
      queryClient.refetchQueries({ queryKey: ["/api/job-roles"] });
      
      toast({
        title: "Job Role Created",
        description: "New job role has been added to the database.",
      });
    },
    onError: (error) => {
      console.error("Job role creation error:", error);
      toast({
        title: "Failed to Create Job Role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle adding a job role
  const handleAddJobRole = async (jobRoleId: number | undefined, option?: AutocompleteOption) => {
    console.log("handleAddJobRole called with:", { jobRoleId, option });
    
    // Check if this is a new job role that needs to be created
    if (option?.isNew && typeof option.name === 'string') {
      try {
        setIsLoading(true);
        console.log("Creating new job role with name:", option.name);
        
        // Create the new job role
        const newRole = await createJobRoleMutation.mutateAsync(option.name);
        console.log("New role created:", newRole);
        
        // Wait a moment for the job roles to refresh
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Add the newly created role
        if (newRole && newRole.id) {
          console.log("Processing new role with ID:", newRole.id);
          
          // Don't add if already selected
          if (selectedJobRoles.includes(newRole.id)) {
            console.log("Role already in selected roles:", selectedJobRoles);
            toast({
              title: "Role Already Selected",
              description: "This job role is already in your profile.",
              variant: "default",
            });
            return;
          }
          
          console.log("Adding new job role to selected roles:", newRole);
          
          // Add to selected job roles
          setSelectedJobRoles(prev => {
            const newRoles = [...prev, newRole.id];
            console.log("Updated selected roles:", newRoles);
            return newRoles;
          });
          
          // If there's no primary role yet, set this one as primary
          if (primaryJobRole === null) {
            console.log("Setting as primary role:", newRole.id);
            setPrimaryJobRole(newRole.id);
          }
          
          // Force refresh job roles to ensure new role is in the list
          await queryClient.invalidateQueries({ queryKey: ["/api/job-roles"] });
          await queryClient.refetchQueries({ queryKey: ["/api/job-roles"] });
          
          // Show success message
          toast({
            title: "Job Role Added",
            description: `"${newRole.name}" has been added to your profile.`,
          });
        } else {
          console.error("Created role is missing ID:", newRole);
          toast({
            title: "Error Adding Role",
            description: "Could not add the new job role. The server returned an invalid response.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error creating new job role:", error);
        toast({
          title: "Error Adding Role",
          description: "Failed to create new job role. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // Handle normal selection (existing job role)
    if (jobRoleId === undefined) return;
    
    // Don't add if already selected
    if (selectedJobRoles.includes(jobRoleId)) {
      toast({
        title: "Role Already Selected",
        description: "This job role is already in your profile.",
        variant: "default",
      });
      return;
    }
    
    // Add to selected job roles
    setSelectedJobRoles(prev => [...prev, jobRoleId]);
    
    // If there's no primary role yet, set this one as primary
    if (primaryJobRole === null) {
      setPrimaryJobRole(jobRoleId);
    }
  };
  
  // Handle removing a job role
  const handleRemoveJobRole = (jobRoleId: number) => {
    setSelectedJobRoles(prev => prev.filter(id => id !== jobRoleId));
    
    // If we're removing the primary role, select a new one if available
    if (primaryJobRole === jobRoleId) {
      const remainingRoles = selectedJobRoles.filter(id => id !== jobRoleId);
      setPrimaryJobRole(remainingRoles.length > 0 ? remainingRoles[0] : null);
    }
    
    // Clear the experience level for this role
    setJobRoleExperience(prev => {
      const updated = { ...prev };
      delete updated[jobRoleId];
      return updated;
    });
  };
  
  // Handle setting primary job role
  const handleSetPrimaryJobRole = (jobRoleId: number) => {
    setPrimaryJobRole(jobRoleId);
    
    // No need to call the API here since we're batching our changes
    // The setPrimaryJobRoleMutation will be called in handleJobRoleSubmit
  };
  
  // Handle changing experience level for a job role
  const handleExperienceLevelChange = async (jobRoleId: number, level: string) => {
    // Update local state first for immediate UI feedback
    setJobRoleExperience(prev => ({
      ...prev,
      [jobRoleId]: level
    }));
    
    try {
      // If this is the primary role, use setPrimaryJobRoleMutation
      if (jobRoleId === primaryJobRole) {
        await setPrimaryJobRoleMutation.mutateAsync({
          jobRoleId,
          experienceLevel: level
        });
      } else {
        // For non-primary roles, use the updateRoleExperienceMutation
        await updateRoleExperienceMutation.mutateAsync({
          jobRoleId,
          experienceLevel: level
        });
      }
      
      // Refresh job matches after updating experience level
      await refreshJobMatches();
      
      toast({
        title: "Experience Level Updated",
        description: "Your job role experience level has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating experience level:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update experience level",
        variant: "destructive",
      });
    }
  };
  
  // Get initials for avatar
  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.username.substring(0, 2).toUpperCase() || "U";
  };
  
  // Redirect if not logged in
  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>
              You need to be logged in to edit your profile.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/auth")}>Log In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate("/profile")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto mb-6 edit-profile-progress">
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
        
        <div className="flex justify-between mt-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center cursor-pointer transition-all hover:text-primary hover:scale-105 ${
                  index === currentStep 
                    ? "text-primary scale-110" 
                    : index < currentStep 
                      ? "text-primary/70" 
                      : "text-muted-foreground"
                }`}
                onClick={() => {
                  // Allow jumping to any step directly
                  setCurrentStep(index);
                }}
                title={`Jump to ${step.label} section`}
              >
                <div className={`p-1.5 rounded-full ${
                  index === currentStep 
                    ? "bg-primary/10" 
                    : index < currentStep 
                      ? "bg-primary/5" 
                      : ""
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1 hidden md:block">{step.label}</span>
                {/* Mobile indicator for clickable */}
                {index !== currentStep && <div className="md:hidden h-1 w-1 bg-primary/50 rounded-full mt-1"></div>}
              </div>
            );
          })}
        </div>
      </div>
      
      <Card className="max-w-3xl mx-auto edit-profile-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 edit-profile-step-title">
            {STEPS[currentStep].icon && React.createElement(STEPS[currentStep].icon, { className: "h-5 w-5 text-primary" })}
            {STEPS[currentStep].label}
          </CardTitle>
          <CardDescription>
            {currentStep === 0 && "Update your basic profile information"}
            {currentStep === 1 && "Select your job roles and mark one as primary"}
            {currentStep === 2 && "Select skills that showcase your expertise"}
            {currentStep === 3 && "Add qualifications to strengthen your profile"}
            {currentStep === 4 && "Set your availability and working hours"}
            {currentStep === 5 && "Add additional information to your profile"}
            {currentStep === 6 && "Review your profile information"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Step 1: Personal Information */}
          {currentStep === 0 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePersonalInfoSubmit)} className="space-y-6 edit-profile-basic-info">
                {/* Avatar preview and upload */}
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-20 w-20 border-2 border-border">
                    <AvatarImage src={form.watch("avatarUrl") || undefined} alt={user.username} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="w-full">
                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture</FormLabel>
                          <FormControl>
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-col gap-1.5">
                                <input
                                  type="file"
                                  id="profile-image"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    // Validate file type and size
                                    if (!file.type.startsWith('image/')) {
                                      toast({
                                        title: "Invalid file type",
                                        description: "Please upload an image file",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    
                                    if (file.size > 5 * 1024 * 1024) { // 5MB limit
                                      toast({
                                        title: "File too large",
                                        description: "Image must be less than 5MB",
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    
                                    try {
                                      setUploadingImage(true);
                                      
                                      // Create form data for upload
                                      const formData = new FormData();
                                      formData.append('image', file);
                                      
                                      // Send to server
                                      const response = await fetch('/api/upload-image', {
                                        method: 'POST',
                                        body: formData,
                                        credentials: 'include'
                                      });
                                      
                                      if (!response.ok) {
                                        throw new Error('Failed to upload image');
                                      }
                                      
                                      const data = await response.json();
                                      field.onChange(data.imageUrl);
                                      
                                      toast({
                                        title: "Image uploaded",
                                        description: "Your profile picture has been updated",
                                      });
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                      toast({
                                        title: "Upload failed",
                                        description: error instanceof Error ? error.message : "Failed to upload image",
                                        variant: "destructive"
                                      });
                                    } finally {
                                      setUploadingImage(false);
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('profile-image')?.click()}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Upload Image
                                      </>
                                    )}
                                  </Button>
                                  {field.value && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => field.onChange('')}
                                    >
                                      <XCircle className="mr-1 h-4 w-4" />
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {field.value && (
                                <Input
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  disabled={uploadingImage}
                                  placeholder="Image URL"
                                  className="text-xs"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload a profile picture or enter an image URL
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is how you'll appear to employers and other users
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your email for communications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Languages */}
                  <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>Languages</FormLabel>
                        
                        {/* Language input */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              placeholder="Start typing a language..."
                              list="languages-list"
                              id="language-input"
                              onChange={(e) => {
                                // We'll keep this just for the input, but won't update the field value here
                              }}
                            />
                            <datalist id="languages-list">
                              {languages.map(language => (
                                <option key={language} value={language} />
                              ))}
                            </datalist>
                          </div>
                          <Button 
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('language-input') as HTMLInputElement;
                              if (input && input.value) {
                                addLanguage(input.value);
                                input.value = ''; // clear input after adding
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        
                        {/* Selected languages */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedLanguages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No languages selected yet</p>
                          ) : (
                            selectedLanguages.map(language => (
                              <Badge 
                                key={language} 
                                variant="secondary"
                                className="flex items-center gap-1.5 py-1.5"
                              >
                                <span>{language}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeLanguage(language)}
                                  className="h-4 w-4 p-0 ml-1"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))
                          )}
                        </div>
                        
                        {/* Hidden input to store comma-separated languages for form value */}
                        <Input 
                          type="hidden" 
                          {...field}
                        />
                        
                        <FormDescription>
                          Add languages you speak fluently
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                    className="flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save & Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}
          
          {/* Step 2: Job Roles */}
          {currentStep === 1 && (
            <div className="space-y-6 edit-profile-job-roles">
              <div className="space-y-4">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Your Selected Job Roles</h3>
                  <div className="p-4 border rounded-md bg-muted/30 min-h-[100px]">
                    {selectedJobRoles.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No job roles selected yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedJobRoles.map(roleId => {
                          const role = jobRoles.find(r => r.id === roleId);
                          const isPrimary = roleId === primaryJobRole;
                          
                          return role ? (
                            <div key={role.id} className="flex flex-col p-2 border rounded-md bg-card">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{role.name}</span>
                                  {isPrimary && (
                                    <Badge variant="secondary" className="ml-2">Primary</Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!isPrimary && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetPrimaryJobRole(role.id)}
                                      className="h-7 text-xs"
                                    >
                                      Set as Primary
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Experience Level Dropdown */}
                              <div className="mt-2 flex items-center">
                                <Label htmlFor={`experience-${role.id}`} className="text-xs mr-2 min-w-[80px]">
                                  Experience:
                                </Label>
                                <Select
                                  value={jobRoleExperience[role.id] || ""}
                                  onValueChange={(value) => handleExperienceLevelChange(role.id, value)}
                                >
                                  <SelectTrigger id={`experience-${role.id}`} className="h-7 text-xs">
                                    <SelectValue placeholder="Select experience level" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={ExperienceLevel.LessThanOneYear}>
                                      {ExperienceLevel.LessThanOneYear}
                                    </SelectItem>
                                    <SelectItem value={ExperienceLevel.TwoToFiveYears}>
                                      {ExperienceLevel.TwoToFiveYears}
                                    </SelectItem>
                                    <SelectItem value={ExperienceLevel.FiveToTenYears}>
                                      {ExperienceLevel.FiveToTenYears}
                                    </SelectItem>
                                    <SelectItem value={ExperienceLevel.TenPlusYears}>
                                      {ExperienceLevel.TenPlusYears}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {/* Remove Button */}
                              <div className="mt-2 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveJobRole(role.id)}
                                  className="h-7 w-7"
                                >
                                  <XCircle className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-2">Add Job Role</h3>
                  <div className="mb-4">
                    <MultiAutocomplete
                      placeholder="Search for job roles..."
                      searchEndpoint="/api/search/job-roles"
                      selectedIds={selectedJobRoles}
                      onItemSelect={handleAddJobRole}
                      onItemRemove={handleRemoveJobRole}
                      getItemDisplay={(role) => role.name}
                      isLoading={jobRolesLoading}
                      noResultsText="No job roles found. Try a different search term."
                      maxItems={5}
                    />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>You can select up to 5 job roles. Choose one as your primary role.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={moveToPreviousStep}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleJobRoleSubmit}
                  disabled={isLoading || selectedJobRoles.length === 0}
                  className="flex items-center gap-2 edit-profile-actions"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save & Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Skills */}
          {currentStep === 2 && (
            <div className="space-y-6 edit-profile-skills">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Add Skills</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Search and select skills relevant to your job roles. These skills will help match you with suitable job opportunities.
                </p>
                
                <div className="mb-4">
                  <MultiAutocomplete
                    placeholder="Search for skills..."
                    searchEndpoint="/api/search/skills"
                    selectedIds={selectedSkills}
                    onItemSelect={handleAddSkill}
                    onItemRemove={(skillId) => setSelectedSkills(prev => prev.filter(id => id !== skillId))}
                    getItemDisplay={(skill) => skill.name}
                    isLoading={skillsLoading || createSkillMutation.isPending}
                    noResultsText="No skills found. Type to add a new skill."
                  />
                </div>
                
                {/* Selected skills */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Selected Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No skills selected yet</p>
                    ) : (
                      selectedSkills.map(skillId => {
                        const skill = allSkills.find(s => s.id === skillId);
                        return skill ? (
                          <Badge 
                            key={skill.id} 
                            variant="secondary"
                            className="flex items-center gap-1.5 py-1.5"
                          >
                            <span>{skill.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleSkill(skill.id)}
                              className="h-4 w-4 p-0 ml-1"
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ) : null;
                      })
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={moveToPreviousStep}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleSkillsSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLoading ? "Saving..." : "Save & Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 4: Qualifications */}
          {currentStep === 3 && (
            <div className="space-y-6 edit-profile-qualifications">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Your Qualifications</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your professional qualifications, certifications, and academic degrees to strengthen your profile.
                </p>
                
                {/* User Qualifications */}
                <div className="mb-4">
                  <div className="space-y-2">
                    <Label>Your Qualifications</Label>
                    <p className="text-sm text-muted-foreground mb-2">Add your professional certifications, degrees, and other qualifications</p>
                    
                    {/* Selected qualifications display */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {qualifications.map(qual => (
                        <div 
                          key={qual.id} 
                          className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
                        >
                          <span className="text-sm">{qual.name}</span>
                          <button 
                            type="button" 
                            onClick={() => handleQualificationRemove(qual)}
                            className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      
                      {qualifications.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No qualifications added yet
                        </p>
                      )}
                    </div>
                    
                    {/* Qualifications combobox with autocomplete */}
                    <div className="mb-6">
                      <Label>Search or add qualifications</Label>
                      <div className="flex gap-2 mt-2 relative">
                        <Input 
                          type="text"
                          placeholder="Type a qualification name..."
                          value={customQual}
                          onChange={e => {
                            setCustomQual(e.target.value);
                            fetchQualificationSuggestions(e.target.value);
                          }}
                          onFocus={() => {
                            if (customQual.trim()) {
                              fetchQualificationSuggestions(customQual);
                            }
                          }}
                          className="flex-grow"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            // Don't proceed if the input is empty
                            if (!customQual.trim()) return;
                            
                            // Create a new qualification
                            fetch('/api/qualifications', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                name: customQual, 
                                addToProfile: true 
                              })
                            })
                            .then(res => res.json())
                            .then(newQualification => {
                              console.log("New qualification created:", newQualification);
                              
                              // Clear the input
                              setCustomQual('');
                              setShowSuggestions(false);
                              
                              // Refresh qualification list from server
                              fetch('/api/user/qualifications')
                                .then(res => res.json())
                                .then(quals => {
                                  console.log("Updated qualifications:", quals);
                                  setQualifications(quals);
                                  
                                  // Auto-refresh job matches
                                  setTimeout(() => {
                                    refreshJobMatches().catch(console.error);
                                  }, 500);
                                });
                            })
                            .catch(err => {
                              console.error('Error creating qualification:', err);
                            });
                          }}
                        >
                          Add
                        </Button>
                        
                        {/* Autocomplete suggestions dropdown */}
                        {showSuggestions && qualSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-md border border-slate-200 z-50 max-h-60 overflow-auto autocomplete-suggestions">
                            {qualSuggestions.map((qual) => (
                              <div
                                key={qual.id || `new-${qual.newValue}`}
                                className="px-3 py-2 cursor-pointer hover:bg-slate-100 text-sm flex items-center"
                                onClick={() => handleQualificationSelect(qual)}
                              >
                                {qual.isNew ? (
                                  <span className="flex items-center">
                                    <PlusCircle className="h-4 w-4 mr-2 text-primary" />
                                    Create: {qual.newValue}
                                  </span>
                                ) : (
                                  <span>{qual.name}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Quick add common qualifications */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {[
                          {id: 31, name: "PRINCE2"},
                          {id: 33, name: "PRINCE2 Agile"},
                          {id: 30, name: "PMP"},
                          {id: 3, name: "PhD"},
                          {id: 5, name: "MBA"},
                          {id: 40, name: "ITIL"},
                          {id: 62, name: "Facebook Blueprint"},
                          {id: 24, name: "AWS Certified"}
                        ].map(qual => (
                          <Button
                            key={qual.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              fetch('/api/user/qualifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ qualificationId: qual.id })
                              })
                              .then(res => {
                                if (res.ok) {
                                  // Refresh qualification list from server
                                  fetch('/api/user/qualifications')
                                    .then(res => res.json())
                                    .then(quals => {
                                      console.log("Updated qualifications:", quals);
                                      setQualifications(quals);
                                      
                                      // Auto-refresh job matches
                                      setTimeout(() => {
                                        refreshJobMatches().catch(console.error);
                                      }, 500);
                                    });
                                }
                              });
                            }}
                          >
                            {qual.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleQualificationsSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 5: Availability */}
          {currentStep === 4 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAvailabilitySubmit)} className="space-y-6 edit-profile-availability">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Country */}
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country You Are Based</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[200px]">
                            {countries.map(country => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Which country you're currently based in
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Timezone */}
                  <FormField
                    control={form.control}
                    name="timeZone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map(tz => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Your local timezone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Hours Available Per Week */}
                <FormField
                  control={form.control}
                  name="preferredHoursPerWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Available Per Week</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="40" 
                          min={1}
                          max={80}
                          onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        How many hours you're available to work per week
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Weekly Availability Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium">Hours Available to Work</h3>
                      <p className="text-sm text-muted-foreground">
                        Select the specific hours you're available to work each day in your local timezone
                      </p>
                      <div className="mt-2 p-3 bg-muted/50 rounded-md">
                        <p className="text-sm flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Your selected timezone is <span className="font-medium">{form.watch("timeZone") || "not set"}</span></span>
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Times will be normalized to match with employers in different timezones. For example, 9:00-10:00 in GMT is equivalent to 10:00-11:00 in GMT+1.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6 mt-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, index) => {
                      // Convert to 1-based day index (1=Monday through 7=Sunday)
                      const dayNumber = index + 1;
                      const isDayAvailable = availableDays.includes(dayNumber);
                      const timeSlot = dayTimeSlots[dayNumber] || { startHour: 9, endHour: 17 };
                      
                      // Format hours for display
                      const formatHour = (hour: number) => {
                        return hour.toString().padStart(2, '0') + ':00';
                      };
                      
                      return (
                        <div key={day} className={`border rounded-md p-4 ${isDayAvailable ? 'border-primary/50 bg-primary/5' : ''}`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-medium">{day}</h4>
                            <div className="flex items-center space-x-2">
                              <label className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`${day.toLowerCase()}-available`}
                                  checked={isDayAvailable}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      handleDayToggle(dayNumber);
                                    } else {
                                      handleDayToggle(dayNumber);
                                    }
                                  }}
                                />
                                <span className="text-sm">Available this day</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className={`flex flex-col space-y-4 ${isDayAvailable ? '' : 'opacity-50 pointer-events-none'}`}>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor={`${day.toLowerCase()}-start`} className="block text-sm mb-1">
                                  Start Time
                                </label>
                                <Select 
                                  value={formatHour(timeSlot.startHour)}
                                  onValueChange={(value) => {
                                    const hour = parseInt(value.split(':')[0]);
                                    handleTimeSlotChange(dayNumber, 'startHour', hour);
                                  }}
                                  disabled={!isDayAvailable}
                                >
                                  <SelectTrigger id={`${day.toLowerCase()}-start`}>
                                    <SelectValue placeholder="Select start time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const hour = i.toString().padStart(2, '0');
                                      return (
                                        <SelectItem 
                                          key={`${hour}:00`} 
                                          value={`${hour}:00`}
                                          disabled={i >= timeSlot.endHour}
                                        >
                                          {`${hour}:00`}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <label htmlFor={`${day.toLowerCase()}-end`} className="block text-sm mb-1">
                                  End Time
                                </label>
                                <Select 
                                  value={formatHour(timeSlot.endHour)}
                                  onValueChange={(value) => {
                                    const hour = parseInt(value.split(':')[0]);
                                    handleTimeSlotChange(dayNumber, 'endHour', hour);
                                  }}
                                  disabled={!isDayAvailable}
                                >
                                  <SelectTrigger id={`${day.toLowerCase()}-end`}>
                                    <SelectValue placeholder="Select end time" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => {
                                      const hour = i.toString().padStart(2, '0');
                                      return (
                                        <SelectItem 
                                          key={`${hour}:00`} 
                                          value={`${hour}:00`}
                                          disabled={i <= timeSlot.startHour}
                                        >
                                          {`${hour}:00`}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            {isDayAvailable && (
                              <div className="text-xs text-muted-foreground mt-2">
                                Working {timeSlot.endHour - timeSlot.startHour} hours on {day}
                                <span className="ml-1">({form.watch("timeZone") || "local timezone"})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={moveToPreviousStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save & Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}
          
          {/* Step 5: Additional Information */}
          {currentStep === 4 && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAdditionalInfoSubmit)} className="space-y-6 edit-profile-bio">
                {/* Bio/About */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself, your background, and your career goals" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of who you are professionally
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LinkedIn Profile */}
                  <FormField
                    control={form.control}
                    name="linkedInProfile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn Profile</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://linkedin.com/in/yourprofile" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Link to your LinkedIn profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Salary Requirements Section */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-medium mb-4 flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    Salary Requirements
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Minimum Salary */}
                    <FormField
                      control={form.control}
                      name="minSalaryRequirement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 50000"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum acceptable salary
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Maximum Salary */}
                    <FormField
                      control={form.control}
                      name="maxSalaryRequirement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 80000"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Target upper range
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Salary Currency */}
                    <FormField
                      control={form.control}
                      name="salaryCurrency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value || "USD"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="GBP">GBP (£)</SelectItem>
                              <SelectItem value="JPY">JPY (¥)</SelectItem>
                              <SelectItem value="CAD">CAD ($)</SelectItem>
                              <SelectItem value="AUD">AUD ($)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Preferred currency
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Salary Type */}
                    <FormField
                      control={form.control}
                      name="preferredSalaryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange}
                            value={field.value || "hourly"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Payment frequency
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={moveToPreviousStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save & Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}
          
          {/* Step 6: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{user.fullName}</h3>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      Job Roles
                    </h4>
                    <div className="space-y-1">
                      {userJobRoles.length > 0 ? (
                        userJobRoles.map(userRole => (
                          <div key={userRole.jobRoleId} className="flex items-center gap-1">
                            <span className="text-sm">{userRole.role.name}</span>
                            {userRole.isPrimary && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">Primary</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No job roles set</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Code className="h-4 w-4 text-muted-foreground" />
                      Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {userSkills.length > 0 ? (
                        userSkills.map(skill => (
                          <Badge key={skill.id} variant="outline" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No skills set</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Country & Timezone
                    </h4>
                    <p className="text-sm">
                      {user.location || "No country set"}
                      {user.timeZone && user.location && ", "}
                      {user.timeZone ? `${user.timeZone}` : ""}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Hours Available
                    </h4>
                    <p className="text-sm">
                      {user.preferredHoursPerWeek ? `${user.preferredHoursPerWeek} hours per week` : "No hours availability set"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      See detailed working hours in profile
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <LanguagesIcon className="h-4 w-4 text-muted-foreground" />
                      Languages
                    </h4>
                    <p className="text-sm">{user.languages || "No languages set"}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                      <Book className="h-4 w-4 text-muted-foreground" />
                      Bio
                    </h4>
                    <p className="text-sm line-clamp-4">{user.bio || "No bio set"}</p>
                  </div>
                  
                  {user.linkedInProfile && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        LinkedIn
                      </h4>
                      <a 
                        href={user.linkedInProfile} 
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={moveToPreviousStep}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                <Button 
                  onClick={handleCompleteEdit}
                  className="flex items-center gap-2"
                >
                  Complete
                  <CheckCircle2 className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}