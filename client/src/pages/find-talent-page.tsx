import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Job, User as BaseUser, Skill, JobRole, UserSubscription } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { safeClickHandler } from "@/lib/utils";
import JobForm from "@/components/job/JobForm";
import { 
  Search, 
  Clock, 
  Globe, 
  Briefcase, 
  User as UserIcon, 
  Plus, 
  Loader2,
  ShieldAlert,
  CreditCard,
  MessageCircle,
  Send,
  X,
  DollarSign,
  CalendarDays
} from "lucide-react";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import SalaryInput from "@/components/ui/salary-input";
import AvailabilitySelector from "@/components/job/AvailabilitySelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Extended User type that includes runtime properties we need
interface User extends Omit<BaseUser, 'preferredHoursPerWeek'> {
  skills?: number[];
  hoursPerWeek?: number;
  preferredHoursPerWeek?: number | null;
}

export default function FindTalentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Fetch user subscription
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription | null>({
    queryKey: ['/api/my-subscription'],
    enabled: !!user,
  });
  
  // Check if user has a recruiter subscription
  const hasRecruiterSubscription = userSubscription?.planId === 3; // Assuming ID 3 is the recruiter plan
  const [activeTab, setActiveTab] = useState("talents");
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilters, setSkillFilters] = useState<number[]>([]);
  const [jobRoleFilter, setJobRoleFilter] = useState<number | null>(null);
  const [jobRoleInputValue, setJobRoleInputValue] = useState<string>("");
  const [showJobRoleDropdown, setShowJobRoleDropdown] = useState<boolean>(false);
  const [languageFilter, setLanguageFilter] = useState("");
  const [salaryMinFilter, setSalaryMinFilter] = useState<number | null>(null);
  const [salaryMaxFilter, setSalaryMaxFilter] = useState<number | null>(null);
  const [hoursPerWeekFilter, setHoursPerWeekFilter] = useState<number | null>(null);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<User | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [jobDialog, setJobDialog] = useState(false);
  const [viewingJobId, setViewingJobId] = useState<number | null>(null);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  
  // Availability time slots filter
  type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  type TimeSlot = { start: string; end: string; };
  type AvailabilityFilter = { [key in DayOfWeek]?: TimeSlot[] };
  
  // Old availability filter structure (keeping for compatibility)
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>({});
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  
  // New availability filter structure (matching job form)
  const [availabilitySlots, setAvailabilitySlots] = useState<{
    dayOfWeek: number;
    startHour: number;
    endHour: number;
    timeZone: string;
  }[]>([]);
  
  // State for current availability slot being edited
  const [currentSlot, setCurrentSlot] = useState({
    selectedDays: [1], // Monday
    startHour: "9",
    endHour: "17",
    timeZone: "GMT+0"
  });
  
  // Salary type and currency for filters
  const [salaryType, setSalaryType] = useState<string>("hourly");
  const [currency, setCurrency] = useState<string>("USD");
  
  // Language selection state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState<string>("");
  
  // User filtering function to centralize all filtering logic
  const filterUser = (user: User): boolean => {
    // Skip current user if it's the logged in user
    if (user?.id && user.id === user?.id) return false;
    
    // Apply job role filter if selected
    if (jobRoleFilter && user.jobRoleId !== jobRoleFilter) return false;
    
    // Apply language filter if selected
    if (languageFilter && languageFilter !== "any") {
      // Handle languages stored as string if they are
      const userLanguages = typeof user.languages === 'string' 
        ? user.languages.split(',').map(l => l.trim())
        : [];
      
      if (!userLanguages.includes(languageFilter)) return false;
    }
    
    // Apply text search if provided
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const usernameMatch = user.username?.toLowerCase().includes(query);
      const nameMatch = user.fullName?.toLowerCase().includes(query);
      const locationMatch = user.location?.toLowerCase().includes(query);
      
      if (!usernameMatch && !nameMatch && !locationMatch) return false;
    }
    
    // Apply skill filters if any are selected
    if (skillFilters.length > 0) {
      // Get user skills from userSkills relationship
      const userSkillIds = user.skills || [];
      
      if (userSkillIds.length === 0) return false;
      
      // Check if user has at least one of the selected skills
      const hasMatchingSkill = skillFilters.some(skillId => 
        userSkillIds.includes(skillId)
      );
      
      if (!hasMatchingSkill) return false;
    }
    
    // Apply salary/rate filters if set
    if (salaryMinFilter && user.minSalaryRequirement && 
        Number(user.minSalaryRequirement) < salaryMinFilter) return false;
    
    if (salaryMaxFilter && user.maxSalaryRequirement && 
        Number(user.maxSalaryRequirement) > salaryMaxFilter) return false;
    
    // Apply hours per week filter if set
    if (hoursPerWeekFilter && user.preferredHoursPerWeek && 
        user.preferredHoursPerWeek < hoursPerWeekFilter) return false;
    
    return true;
  };
  
  // Fetch all skills
  const { data: allSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Fetch all job roles
  const { data: jobRoles } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Fetch all users for talent pool
  const { data: allUsers, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!hasRecruiterSubscription,
  });
  
  // Fetch matching workers for job
  const { 
    data: matchingWorkers, 
    isLoading: workersLoading,
    error: workersError,
    isError: isWorkersError,
    refetch: refetchWorkers
  } = useQuery<User[]>({
    queryKey: ["/api/matches/workers", viewingJobId],
    enabled: !!viewingJobId,
    retry: false
  });
  
  // Handle errors from worker query in useEffect to avoid render loops
  useEffect(() => {
    if (isWorkersError && workersError) {
      // Check if it's a subscription required error
      const error = workersError as any;
      if (error.status === 403 && error.data?.code === "SUBSCRIPTION_REQUIRED" && !subscriptionDialog) {
        setSubscriptionError(error.data.detail || "You need a Recruiter subscription to search for candidates");
        setSubscriptionDialog(true);
      } else if (!subscriptionDialog) {
        // Only show toast if not showing subscription dialog
        toast({
          title: "Error",
          description: error.message || "Failed to load matching workers",
          variant: "destructive"
        });
      }
    }
  }, [isWorkersError, workersError, subscriptionDialog, toast]);
  
  // Fetch employer's jobs
  const { data: myJobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  // Filter workers for job
  const handleViewCandidates = (jobId: number) => {
    setViewingJobId(jobId);
    setActiveTab("candidates");
    // Reset any previous subscription errors
    setSubscriptionError(null);
  };
  
  // Get user's initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle day selection toggle for availability
  const handleDayToggle = (day: number) => {
    setCurrentSlot(prev => {
      if (prev.selectedDays.includes(day)) {
        return { ...prev, selectedDays: prev.selectedDays.filter(d => d !== day) };
      } else {
        return { ...prev, selectedDays: [...prev.selectedDays, day] };
      }
    });
  };
  
  // Get day name from day number
  const getDayName = (dayNumber: number): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayNumber % 7];
  };
  
  // Add availability slot from current settings
  const handleAddAvailabilitySlot = () => {
    // Add a slot for each selected day
    currentSlot.selectedDays.forEach(day => {
      setAvailabilitySlots(prev => [
        ...prev, 
        {
          dayOfWeek: day,
          startHour: parseInt(currentSlot.startHour),
          endHour: parseInt(currentSlot.endHour),
          timeZone: currentSlot.timeZone
        }
      ]);
    });
    
    // Reset selected days
    setCurrentSlot(prev => ({ ...prev, selectedDays: [1] }));
  };
  
  // Remove availability slot
  const handleRemoveAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle language toggle for language selection
  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages((prev: string[]) => {
      if (prev.includes(language)) {
        return prev.filter((lang: string) => lang !== language);
      } else {
        return [...prev, language];
      }
    });
  };
  
  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero section for employers */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-white text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Remote Talent</h1>
            <p className="text-lg mb-8 text-white/90">
              Connect with skilled professionals who match your time zone requirements and project needs.
            </p>
            
            <Button 
              size="lg" 
              type="button"
              onClick={safeClickHandler(() => setJobDialog(true))}
              className="bg-white text-primary hover:bg-white/90"
            >
              <Plus className="mr-2 h-5 w-5" />
              Post a New Job
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="talents">Available Talent</TabsTrigger>
            <TabsTrigger value="myjobs">My Job Postings</TabsTrigger>
            <TabsTrigger value="candidates">View Candidates</TabsTrigger>
          </TabsList>
          
          {/* Available Talent Tab */}
          <TabsContent value="talents">
            {/* Subscription warning banner */}
            {!hasRecruiterSubscription && !subscriptionLoading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-sm text-yellow-800 flex gap-2 items-center">
                  <ShieldAlert className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Talent search requires a Recruiter subscription.
                    <Link href="/subscription?plan=recruiter" className="ml-1 text-primary underline">
                      Upgrade now
                    </Link>
                  </span>
                </p>
              </div>
            )}
          
            {/* Filter section at the top - Matching job posting form structure */}
            <Card className="mb-6">
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Filter Talent</CardTitle>
                <CardDescription>
                  Use the same criteria as job posting to find matching talent
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-6">
                  {/* Professional Requirements Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium flex items-center">
                      <Briefcase className="mr-2 h-5 w-5 text-primary" />
                      Professional Requirements
                    </h3>
                    
                    {/* General Search */}
                    <div className="space-y-2">
                      <Label>General Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                        <Input
                          placeholder="Search by name, location, etc."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          disabled={!hasRecruiterSubscription}
                        />
                      </div>
                    </div>
                    
                    {/* Job Role Selection with Autocomplete */}
                    <div className="space-y-2">
                      <Label>Job Role</Label>
                      <div className="relative">
                        <Input
                          placeholder="Search job roles"
                          className="w-full"
                          value={jobRoleInputValue}
                          onChange={(e) => {
                            setJobRoleInputValue(e.target.value);
                            
                            // Show dropdown when typing
                            setShowJobRoleDropdown(true);
                            
                            // Clear the selection if input is empty
                            if (!e.target.value) {
                              setJobRoleFilter(null);
                            }
                          }}
                          onFocus={() => setShowJobRoleDropdown(true)}
                          onBlur={() => {
                            // Small delay to allow click on options
                            setTimeout(() => setShowJobRoleDropdown(false), 200);
                            
                            // If we have a job role filter selected, update input to match
                            if (jobRoleFilter) {
                              const selectedRole = jobRoles?.find(r => r.id === jobRoleFilter);
                              if (selectedRole) {
                                setJobRoleInputValue(selectedRole.name);
                              }
                            }
                          }}
                          disabled={!hasRecruiterSubscription}
                        />
                        
                        {/* Only show dropdown when input is focused or typing */}
                        {jobRoles && jobRoles.length > 0 && hasRecruiterSubscription && showJobRoleDropdown && (
                          <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                            <div 
                              className="p-2 hover:bg-accent cursor-pointer"
                              onClick={() => {
                                setJobRoleFilter(null);
                                setJobRoleInputValue("");
                                setShowJobRoleDropdown(false);
                              }}
                            >
                              Any job role
                            </div>
                            {jobRoles
                              .filter(role => {
                                // Filter by input text
                                return !jobRoleInputValue || 
                                  role.name.toLowerCase().includes(jobRoleInputValue.toLowerCase());
                              })
                              .map(role => (
                                <div 
                                  key={role.id}
                                  className={`p-2 hover:bg-accent cursor-pointer ${jobRoleFilter === role.id ? 'bg-accent' : ''}`}
                                  onClick={() => {
                                    setJobRoleFilter(role.id);
                                    setJobRoleInputValue(role.name);
                                    setShowJobRoleDropdown(false);
                                  }}
                                >
                                  {jobRoleInputValue && role.name.toLowerCase().includes(jobRoleInputValue.toLowerCase()) ? (
                                    <>
                                      {role.name.substring(0, role.name.toLowerCase().indexOf(jobRoleInputValue.toLowerCase()))}
                                      <span className="font-semibold text-primary">
                                        {role.name.substring(
                                          role.name.toLowerCase().indexOf(jobRoleInputValue.toLowerCase()),
                                          role.name.toLowerCase().indexOf(jobRoleInputValue.toLowerCase()) + jobRoleInputValue.length
                                        )}
                                      </span>
                                      {role.name.substring(
                                        role.name.toLowerCase().indexOf(jobRoleInputValue.toLowerCase()) + jobRoleInputValue.length
                                      )}
                                    </>
                                  ) : (
                                    role.name
                                  )}
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Skill Requirements */}
                    <div className="space-y-2">
                      <Label>Required Skills</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {skillFilters.length > 0 ? (
                          allSkills?.filter(skill => skillFilters.includes(skill.id)).map(skill => (
                            <div key={skill.id} className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5">
                              <span className="text-sm">{skill.name}</span>
                              <button 
                                type="button"
                                onClick={() => setSkillFilters(prev => prev.filter(id => id !== skill.id))}
                                className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                                disabled={!hasRecruiterSubscription}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No skills selected</div>
                        )}
                      </div>
                      
                      {/* Skills Selection */}
                      <Select 
                        value=""
                        onValueChange={(v) => {
                          const id = parseInt(v);
                          if (!isNaN(id) && !skillFilters.includes(id)) {
                            setSkillFilters([...skillFilters, id]);
                          }
                        }}
                        disabled={!hasRecruiterSubscription}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select skills" />
                        </SelectTrigger>
                        <SelectContent>
                          {allSkills?.filter(skill => !skillFilters.includes(skill.id)).map(skill => (
                            <SelectItem key={skill.id} value={skill.id.toString()}>
                              {skill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Language Requirements */}
                    <div className="space-y-2">
                      <Label>Required Languages</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedLanguages.map(language => (
                          <div key={language} className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5">
                            <span className="text-sm">{language}</span>
                            <button 
                              type="button" 
                              onClick={() => handleLanguageToggle(language)}
                              className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                              disabled={!hasRecruiterSubscription}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {selectedLanguages.length === 0 && (
                          <div className="text-sm text-muted-foreground">No languages selected</div>
                        )}
                      </div>
                      
                      <div className="relative">
                        <Input
                          placeholder="Type a language and press Enter"
                          value={languageInput}
                          onChange={(e) => setLanguageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && languageInput.trim()) {
                              e.preventDefault();
                              handleLanguageToggle(languageInput.trim());
                              setLanguageInput('');
                            }
                          }}
                          disabled={!hasRecruiterSubscription}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Schedule Requirements Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-primary" />
                      Schedule Requirements
                    </h3>
                    
                    {/* Hours Per Week */}
                    <div className="space-y-2">
                      <Label>Minimum Hours Per Week</Label>
                      <Input 
                        type="number" 
                        placeholder="Hours" 
                        value={hoursPerWeekFilter || ""}
                        onChange={(e) => setHoursPerWeekFilter(e.target.value ? parseInt(e.target.value) : null)}
                        disabled={!hasRecruiterSubscription}
                      />
                    </div>
                    
                    {/* Availability Requirements */}
                    <div className="space-y-2">
                      <Label>Required Availability</Label>
                      <div className="border-l-4 border-amber-400 bg-amber-50 p-3 mb-4 pl-4">
                        <p className="text-sm text-amber-800 font-medium">
                          Specify time slots when the candidate must be available. This matches candidates based on their availability settings.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {[0, 1, 2, 3, 4, 5, 6].map(day => (
                            <button
                              key={day}
                              type="button"
                              className={`p-2 rounded-md text-center text-sm ${
                                currentSlot.selectedDays.includes(day)
                                  ? "bg-primary text-white"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              onClick={() => handleDayToggle(day)}
                              disabled={!hasRecruiterSubscription}
                            >
                              {getDayName(day).substring(0, 3)}
                            </button>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Start Hour</Label>
                            <Select
                              value={currentSlot.startHour}
                              onValueChange={(value) => 
                                setCurrentSlot(prev => ({ ...prev, startHour: value }))
                              }
                              disabled={!hasRecruiterSubscription}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Start" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i}:00
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>End Hour</Label>
                            <Select
                              value={currentSlot.endHour}
                              onValueChange={(value) => 
                                setCurrentSlot(prev => ({ ...prev, endHour: value }))
                              }
                              disabled={!hasRecruiterSubscription}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="End" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i}:00
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Time Zone</Label>
                            <Select
                              value={currentSlot.timeZone}
                              onValueChange={(value) => 
                                setCurrentSlot(prev => ({ ...prev, timeZone: value }))
                              }
                              disabled={!hasRecruiterSubscription}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="GMT-8">GMT-8 (PST)</SelectItem>
                                <SelectItem value="GMT-5">GMT-5 (EST)</SelectItem>
                                <SelectItem value="GMT+0">GMT+0 (UTC)</SelectItem>
                                <SelectItem value="GMT+1">GMT+1 (CET)</SelectItem>
                                <SelectItem value="GMT+2">GMT+2 (EET)</SelectItem>
                                <SelectItem value="GMT+5:30">GMT+5:30 (IST)</SelectItem>
                                <SelectItem value="GMT+8">GMT+8 (CST)</SelectItem>
                                <SelectItem value="GMT+9">GMT+9 (JST)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        type="button"
                        onClick={handleAddAvailabilitySlot}
                        disabled={!hasRecruiterSubscription || currentSlot.selectedDays.length === 0}
                        className="mt-2"
                      >
                        Add Time Slot
                      </Button>
                      
                      {/* Display selected availability slots */}
                      <div className="grid gap-2 mt-4">
                        {availabilitySlots.map((slot, index) => (
                          <div 
                            key={index}
                            className="bg-accent/50 p-3 rounded-md flex justify-between items-center"
                          >
                            <span>
                              {getDayName(slot.dayOfWeek)}, {slot.startHour}:00 - {slot.endHour}:00 {slot.timeZone}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAvailabilitySlot(index)}
                              disabled={!hasRecruiterSubscription}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {availabilitySlots.length === 0 && (
                          <div className="text-sm text-muted-foreground">No availability slots added</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Compensation Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-primary" />
                      Compensation Requirements
                    </h3>
                    
                    {/* Salary Range */}
                    <div className="space-y-2">
                      <Label>Salary Range</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Minimum</Label>
                          <Input
                            type="number"
                            placeholder="Min salary"
                            value={salaryMinFilter?.toString() || ""}
                            onChange={(e) => setSalaryMinFilter(e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!hasRecruiterSubscription}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Maximum</Label>
                          <Input
                            type="number"
                            placeholder="Max salary"
                            value={salaryMaxFilter?.toString() || ""}
                            onChange={(e) => setSalaryMaxFilter(e.target.value ? parseFloat(e.target.value) : null)}
                            disabled={!hasRecruiterSubscription}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Salary Type */}
                    <div className="space-y-2">
                      <Label>Salary Type</Label>
                      <Select 
                        value={salaryType} 
                        onValueChange={setSalaryType}
                        disabled={!hasRecruiterSubscription}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Currency */}
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select 
                        value={currency} 
                        onValueChange={setCurrency}
                        disabled={!hasRecruiterSubscription}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Reset all filters
                    setSkillFilters([]);
                    setSelectedLanguages([]);
                    setJobRoleFilter(null);
                    setJobRoleInputValue("");
                    setSalaryMinFilter(null);
                    setSalaryMaxFilter(null);
                    setHoursPerWeekFilter(null);
                    setAvailabilitySlots([]);
                    setSalaryType("hourly");
                    setCurrency("USD");
                    setSearchQuery("");
                  }}
                  disabled={!hasRecruiterSubscription}
                >
                  Reset Filters
                </Button>
                
                <Button 
                  type="button"
                  onClick={safeClickHandler(() => {
                    // Apply filters and show a toast with the results
                    toast({
                      title: "Filters Applied",
                      description: `Found ${allUsers?.filter(filterUser).length || 0} matching candidates`,
                    });
                  })}
                  disabled={!hasRecruiterSubscription}
                >
                  Apply Filters
                </Button>
              </CardFooter>
            </Card>
            
            {/* Talent cards */}
            <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Available Talent Pool
                  </h2>
                  <Select defaultValue="relevance">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most Relevant</SelectItem>
                      <SelectItem value="recent">Recently Active</SelectItem>
                      <SelectItem value="experience">Most Experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Real talent cards from API */}
                <div className="space-y-4">
                  {usersLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                  ) : allUsers && allUsers.length > 0 ? (
                    <>
                      {/* Filter users using our centralized filter function */}
                      {allUsers
                        .filter(filterUser)
                        .map((user) => (
                          <Card key={user.id} className="overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex flex-col md:flex-row gap-4">
                                <Avatar className="h-16 w-16">
                                  {user.avatarUrl ? (
                                    <AvatarImage src={user.avatarUrl} alt={user.username || "User"} />
                                  ) : null}
                                  <AvatarFallback className="text-lg bg-primary text-white">
                                    {getInitials(user.fullName || user.username || "User")}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1">
                                  <div className="flex flex-col md:flex-row justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-lg">{user.fullName || user.username}</h3>
                                      <p className="text-neutral-500">
                                        {jobRoles?.find(role => role.id === user.jobRoleId)?.name || "Professional"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 md:mt-0">
                                      {user.location && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Globe className="h-3 w-3" />
                                          {user.location}
                                        </Badge>
                                      )}
                                      {user.hoursPerWeek && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {user.hoursPerWeek} hrs/week
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {/* Show user skills if available */}
                                    {allSkills && user.skills && user.skills.map(skillId => {
                                      const skill = allSkills.find(s => s.id === skillId);
                                      return skill ? (
                                        <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                                      ) : null;
                                    })}
                                    
                                    {/* If no skills, show placeholder message */}
                                    {(!user.skills || user.skills.length === 0) && (
                                      <span className="text-sm text-neutral-500">No skills listed</span>
                                    )}
                                  </div>
                                  
                                  <p className="text-neutral-600 mb-4">
                                    {user.bio || `${user.fullName || user.username} is available for remote work. View profile for more details.`}
                                  </p>
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={safeClickHandler(() => navigate(`/profile/${user.id}`))}
                                    >
                                      View Profile
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      disabled={!hasRecruiterSubscription}
                                      onClick={safeClickHandler(() => {
                                        setMessageRecipient(user);
                                        setMessageDialog(true);
                                      })}
                                      className="flex items-center gap-1"
                                    >
                                      <MessageCircle className="h-4 w-4" />
                                      Message
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto mb-4 bg-neutral-100 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-neutral-500" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No Talent Found</h3>
                      <p className="text-neutral-500 max-w-md mx-auto">
                        {!hasRecruiterSubscription 
                          ? "You need a Recruiter subscription to view available talent."
                          : "No professionals match your current filters. Try adjusting your search criteria."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
          </TabsContent>
          
          {/* My Job Postings Tab */}
          <TabsContent value="myjobs">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-semibold">My Job Postings</h2>
              <Button 
                type="button"
                onClick={safeClickHandler(() => setJobDialog(true))}
              >
                <Plus className="mr-2 h-4 w-4" />
                Post a New Job
              </Button>
            </div>
            
            {jobsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : myJobs && myJobs.length > 0 ? (
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <Card key={job.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              <p className="text-neutral-500 flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.companyName}
                              </p>
                            </div>
                            {job.jobType && <Badge>{job.jobType}</Badge>}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 my-3">
                            <div className="flex items-center gap-1 text-sm text-neutral-600">
                              <Clock className="h-4 w-4" />
                              {job.hoursPerWeek 
                                ? `${job.hoursPerWeek} hrs/week` 
                                : 'Flexible hours'}
                            </div>
                            {job.timeZoneOverlap && (
                              <div className="flex items-center gap-1 text-sm text-neutral-600">
                                <Globe className="h-4 w-4" />
                                {job.timeZoneOverlap}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {allSkills?.filter(skill => 
                              job.requiredSkills && job.requiredSkills.includes(skill.id)
                            ).map((skill) => (
                              <Badge key={skill.id} variant="outline">
                                {skill.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-row lg:flex-col gap-2 justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={safeClickHandler(() => handleViewCandidates(job.id))}
                          >
                            <UserIcon className="mr-2 h-4 w-4" />
                            View Candidates
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 bg-neutral-100 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-neutral-500" />
                  </div>
                  <CardTitle className="mb-2">No Job Postings Yet</CardTitle>
                  <CardDescription className="mb-6">
                    You haven't created any job postings yet. Create your first job to start finding talent.
                  </CardDescription>
                  <Button 
                    type="button"
                    onClick={safeClickHandler(() => setJobDialog(true))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Post a New Job
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Candidates Tab */}
          <TabsContent value="candidates">
            {viewingJobId ? (
              <>
                <div className="mb-6">
                  <Button 
                    variant="outline" 
                    onClick={safeClickHandler(() => setActiveTab("myjobs"))}
                    className="mb-4"
                  >
                    Back to My Jobs
                  </Button>
                  <h2 className="text-xl font-semibold">
                    Candidates for {myJobs?.find(j => j.id === viewingJobId)?.title}
                  </h2>
                </div>
                
                {workersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                ) : isWorkersError ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="mx-auto mb-4 bg-amber-100 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-amber-500" />
                      </div>
                      <CardTitle className="mb-2">Subscription Required</CardTitle>
                      <CardDescription className="mb-6">
                        You need a Recruiter subscription plan to search for and view candidates.
                        This premium feature helps you find the perfect talent for your job openings.
                      </CardDescription>
                      <Button 
                        type="button"
                        onClick={safeClickHandler(() => setSubscriptionDialog(true))}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        View Subscription Options
                      </Button>
                    </CardContent>
                  </Card>
                ) : (matchingWorkers && matchingWorkers.length > 0) ? (
                  <div className="space-y-4">
                    {(matchingWorkers as User[]).map((worker: User) => (
                      <Card key={worker.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={worker.avatarUrl || ""} alt="Profile" />
                              <AvatarFallback className="text-lg bg-primary text-white">
                                {getInitials(worker.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{worker.fullName}</h3>
                                  <p className="text-neutral-500">
                                    {worker.jobRoleId && jobRoles 
                                      ? jobRoles.find(role => role.id === worker.jobRoleId)?.name || "Freelancer"
                                      : "Freelancer"}
                                  </p>
                                </div>
                                {worker.timeZone && (
                                  <Badge variant="outline" className="flex items-center gap-1 mt-2 md:mt-0">
                                    <Globe className="h-3 w-3" />
                                    {worker.timeZone}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-neutral-600 mb-4">
                                {worker.bio || "This user has not added a bio yet."}
                              </p>
                              
                              <div className="flex gap-2">
                                <Button onClick={safeClickHandler(() => {})}>View Full Profile</Button>
                                <Button 
                                  variant="outline" 
                                  disabled={!hasRecruiterSubscription}
                                  onClick={safeClickHandler(() => {
                                    setMessageRecipient(worker);
                                    setMessageDialog(true);
                                  })}
                                  className="flex items-center gap-1"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  Message
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="mx-auto mb-4 bg-neutral-100 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-neutral-500" />
                      </div>
                      <CardTitle className="mb-2">No Matching Candidates</CardTitle>
                      <CardDescription className="mb-6">
                        We couldn't find any candidates that match the requirements for this job.
                      </CardDescription>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mx-auto mb-4 bg-neutral-100 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-neutral-500" />
                  </div>
                  <CardTitle className="mb-2">Select a Job First</CardTitle>
                  <CardDescription className="mb-6">
                    Select a job from "My Job Postings" to view matching candidates.
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    onClick={safeClickHandler(() => setActiveTab("myjobs"))}
                  >
                    Go to My Jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Job posting dialog */}
      <Dialog 
        open={jobDialog} 
        onOpenChange={(open) => {
          // Use preventDefault and stopPropagation during the onOpenChange event
          const event = window.event as Event;
          if (event) {
            event.preventDefault?.();
            event.stopPropagation?.();
          }
          setJobDialog(open);
        }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post a New Job</DialogTitle>
            <DialogDescription>
              Fill out the details below to create a new job posting.
            </DialogDescription>
          </DialogHeader>
          
          {allSkills && (
            <div className="py-4">
              <JobForm 
                skills={allSkills} 
                onSuccess={() => {
                  setJobDialog(false);
                  toast({
                    title: "Job created",
                    description: "Your job has been posted successfully",
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Subscription dialog */}
      <Dialog open={subscriptionDialog} onOpenChange={setSubscriptionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upgrade to Recruiter Plan</DialogTitle>
            <DialogDescription>
              Access premium features to find the perfect talent for your remote jobs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {subscriptionError && (
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-amber-800 mb-4">
                <div className="flex items-start">
                  <ShieldAlert className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <p>{subscriptionError}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Plan */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-neutral-50">
                  <CardTitle className="text-xl">Basic</CardTitle>
                  <div className="text-3xl font-bold mt-2">£9.99</div>
                  <div className="text-xs text-neutral-500">One-time fee</div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <div className="mr-2 text-green-500">✓</div>
                      <span>View applications for one job posting</span>
                    </li>
                    <li className="flex items-start text-neutral-500">
                      <div className="mr-2">✗</div>
                      <span>View applications across all jobs</span>
                    </li>
                    <li className="flex items-start text-neutral-500">
                      <div className="mr-2">✗</div>
                      <span>Search for talent in database</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => {
                    setSubscriptionDialog(false);
                    // Navigate to subscription page with query param
                    window.location.href = "/subscription?plan=basic";
                  }}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
              
              {/* Standard Plan */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-neutral-50">
                  <CardTitle className="text-xl">Standard</CardTitle>
                  <div className="text-3xl font-bold mt-2">£29.99</div>
                  <div className="text-xs text-neutral-500">per month</div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <div className="mr-2 text-green-500">✓</div>
                      <span>View applications for one job posting</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 text-green-500">✓</div>
                      <span>View applications across all jobs</span>
                    </li>
                    <li className="flex items-start text-neutral-500">
                      <div className="mr-2">✗</div>
                      <span>Search for talent in database</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => {
                    setSubscriptionDialog(false);
                    window.location.href = "/subscription?plan=standard";
                  }}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
              
              {/* Recruiter Plan */}
              <Card className="overflow-hidden border-primary">
                <CardHeader className="bg-primary text-white">
                  <CardTitle className="text-xl">Recruiter</CardTitle>
                  <div className="text-3xl font-bold mt-2">£199.99</div>
                  <div className="text-xs text-white/80">per month</div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start">
                      <div className="mr-2 text-green-500">✓</div>
                      <span>View applications for one job posting</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 text-green-500">✓</div>
                      <span>View applications across all jobs</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 text-green-500">✓</div>
                      <span>Search for talent in database</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => {
                    setSubscriptionDialog(false);
                    window.location.href = "/subscription?plan=recruiter";
                  }}>
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscriptionDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message dialog */}
      <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Message {messageRecipient?.username || "Candidate"}
            </DialogTitle>
            <DialogDescription>
              Send a direct message to this candidate about a potential job opportunity.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-white">
                  {messageRecipient?.username ? getInitials(messageRecipient.username) : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{messageRecipient?.username || "Candidate"}</p>
                <p className="text-sm text-muted-foreground">{messageRecipient?.email || ""}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Your message</label>
              <Textarea 
                placeholder="Write your message here..."
                className="min-h-[120px]"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={safeClickHandler(() => setMessageDialog(false))}
            >
              Cancel
            </Button>
            <Button 
              onClick={safeClickHandler(() => {
                // In a real implementation, this would send the message via API
                toast({
                  title: "Message Sent",
                  description: `Your message has been sent to ${messageRecipient?.username}.`,
                });
                setMessageDialog(false);
                setMessageContent("");
              })}
              disabled={!messageContent.trim() || !hasRecruiterSubscription}
              className="gap-1"
            >
              <Send className="h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Availability Hours Dialog */}
      <Dialog open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Set Availability Hours</DialogTitle>
            <DialogDescription>
              Select specific time slots when you need talent to be available.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Day selector */}
            <div>
              <label className="text-sm font-medium block mb-2">Select Day</label>
              <Select value={selectedDay} onValueChange={(value: DayOfWeek) => setSelectedDay(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Time range selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">Start Time</label>
                <Input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">End Time</label>
                <Input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={() => {
                // Add the time slot to the selected day
                const currentSlots = availabilityFilter[selectedDay] || [];
                setAvailabilityFilter({
                  ...availabilityFilter,
                  [selectedDay]: [
                    ...currentSlots, 
                    { start: startTime, end: endTime }
                  ]
                });
              }}
              type="button"
              className="w-full"
            >
              Add Time Slot
            </Button>
            
            {/* Display selected time slots */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Selected Availability Slots:</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(availabilityFilter).map(([day, slots]) => (
                  <div key={day} className="border p-2 rounded-md">
                    <div className="font-semibold capitalize mb-1">{day}</div>
                    <div className="space-y-1">
                      {slots.map((slot, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{slot.start} - {slot.end}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updatedSlots = [...slots];
                              updatedSlots.splice(index, 1);
                              setAvailabilityFilter({
                                ...availabilityFilter,
                                [day]: updatedSlots
                              });
                              
                              // Clean up if no slots left for this day
                              if (updatedSlots.length === 0) {
                                const newFilter = {...availabilityFilter};
                                delete newFilter[day as DayOfWeek];
                                setAvailabilityFilter(newFilter);
                              }
                            }}
                            className="h-6 w-6"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(availabilityFilter).length === 0 && (
                  <div className="text-sm text-muted-foreground py-2">
                    No availability requirements set yet. Add time slots above.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="destructive"
              type="button"
              onClick={() => {
                setAvailabilityFilter({});
              }}
              className="mr-auto"
            >
              Clear All
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setAdvancedFiltersOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              // Here would be logic to apply the filter
              setAdvancedFiltersOpen(false);
            }}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}