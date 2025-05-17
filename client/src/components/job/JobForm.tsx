import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { InsertJob, Skill, JobRole, SalaryType, StartDateFlexibilityType } from "@shared/schema";
import { getCommonTimeZones } from "@shared/time-utils";
import { getLanguagesForAutocomplete } from "@shared/language-utils";
import { X } from "lucide-react";
import { AutocompleteInput, AutocompleteOption } from "@/components/ui/autocomplete-input";
import { MultiAutocomplete } from "@/components/ui/multi-autocomplete";
import SalaryInput from "@/components/ui/salary-input";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Briefcase, PlusCircle, Clock, CalendarDays, DollarSign } from "lucide-react";
import TimeZoneSelector from "@/components/job/TimeZoneSelector";
import AvailabilitySelector from "@/components/job/AvailabilitySelector";
import QualificationsSelector from "@/components/job/QualificationsSelector";

// Extend the base job schema with validation rules
const jobSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  jobRoleId: z.coerce.number().optional(), // Optional because we might use jobRoleName instead
  jobRoleName: z.string().optional(), // New field for autocomplete job role
  description: z.string().min(10, "Job description should be at least 10 characters long").max(2000, "Job description should not exceed 2000 characters"),
  hoursPerWeek: z.coerce.number().min(1, "Hours per week is required"),
  currency: z.string().min(1, "Currency is required"),
  requiredLanguages: z.string().min(1, "Required languages are required"),
  salaryAmount: z.string().min(1, "Salary amount is required"),
  salaryType: z.string().default("hourly"),
  hourlyRate: z.string().optional(), // Added for calculated hourly rate
  
  // Job term fields - use any type to avoid serialization issues
  startDate: z.any().optional().transform(val => val instanceof Date ? val : undefined),
  endDate: z.any().optional().transform(val => val instanceof Date ? val : undefined),
  startDateFlexibility: z.string().default("exact"), // exact, month, immediate
  isPermanent: z.boolean().default(false)
}).refine(data => data.jobRoleId || data.jobRoleName, {
  message: "Job role is required. Please select or enter a job role.",
  path: ["jobRoleName"]
}).refine(data => {
  // If permanent job, no need for end date
  if (data.isPermanent) return true;
  
  // If not permanent and no end date, that's an error
  if (!data.isPermanent && !data.endDate) return false;
  
  // If permanent is false and we have an end date, check that end date is after start date
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate);
  }
  
  return true;
}, {
  message: "End date is required for non-permanent roles and must be after start date",
  path: ["endDate"]
});

type JobFormValues = z.infer<typeof jobSchema>;

interface JobFormProps {
  skills: Skill[];
  onSuccess?: () => void;
}

export default function JobForm({ skills, onSuccess }: JobFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for skills with autocomplete
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]); 
  
  // State for languages
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  // State for qualifications
  const [requiredQualifications, setRequiredQualifications] = useState<string[]>([]);
  const [optionalQualifications, setOptionalQualifications] = useState<string[]>([]);
  
  // State for job role with autocomplete
  const [selectedJobRole, setSelectedJobRole] = useState<AutocompleteOption | null>(null);
  
  // States for required availability
  const [availabilitySlots, setAvailabilitySlots] = useState<{
    dayOfWeek: number;
    startHour: number;
    endHour: number;
    timeZone: string;
  }[]>([]); // Start with an empty array instead of a default value

  // State for current availability slot being edited
  const [currentSlot, setCurrentSlot] = useState({
    selectedDays: [1], // Monday
    startHour: "9",
    endHour: "17",
    timeZone: "GMT+0"
  });
  
  // Fetch job roles
  const { data: jobRoles, isLoading: jobRolesLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Handlers for job role autocomplete
  const handleJobRoleSelect = (option: AutocompleteOption) => {
    console.log("Selected job role:", option);
    
    // If it has an ID, it's an existing job role
    if (option.id) {
      console.log(`Setting existing job role ID: ${option.id}`);
      form.setValue("jobRoleId", option.id);
      form.setValue("jobRoleName", undefined);
    } else if (option.isNew) {
      // Otherwise it's a new job role name
      console.log(`Setting new job role name: ${option.name}`);
      form.setValue("jobRoleId", undefined);
      form.setValue("jobRoleName", option.name);
    }
    
    // Update the value displayed in the autocomplete
    setSelectedJobRole(option);
  };

  // Handler for skills autocomplete
  const handleSkillAdd = (skillName: string) => {
    // Add to custom skills array to be created
    setCustomSkills(prev => [...prev, skillName]);
  };
  
  // Handle adding required qualifications
  const handleRequiredQualificationAdd = (qualification: string) => {
    if (!requiredQualifications.includes(qualification)) {
      setRequiredQualifications(prev => [...prev, qualification]);
    }
  };
  
  // Handle removing required qualifications
  const handleRequiredQualificationRemove = (qualification: string) => {
    setRequiredQualifications(
      requiredQualifications.filter(q => q !== qualification)
    );
  };
  
  // Handle adding optional qualifications
  const handleOptionalQualificationAdd = (qualification: string) => {
    if (!optionalQualifications.includes(qualification)) {
      setOptionalQualifications(prev => [...prev, qualification]);
    }
  };
  
  // Handle removing optional qualifications
  const handleOptionalQualificationRemove = (qualification: string) => {
    setOptionalQualifications(
      optionalQualifications.filter(q => q !== qualification)
    );
  };

  // Set up form
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      companyName: "",
      jobRoleId: undefined,
      jobRoleName: undefined,
      description: "",
      hoursPerWeek: undefined,
      salaryAmount: "",
      currency: "USD",
      requiredLanguages: "",
      salaryType: "hourly",
      hourlyRate: "",
      
      // Default values for job term fields
      startDate: undefined,
      endDate: undefined,
      startDateFlexibility: "exact",
      isPermanent: false,
    },
  });
  
  // Create job mutation with a more flexible type to accommodate string dates
  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending job creation request with data:", JSON.stringify(data));
      try {
        const res = await apiRequest("POST", "/api/jobs", data);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server returned error:", res.status, errorText);
          throw new Error(`Server error: ${res.status} - ${errorText}`);
        }
        return await res.json();
      } catch (err) {
        console.error("Error in job creation request:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Job created successfully:", data);
      toast({
        title: "Job created",
        description: "Your job has been posted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      form.reset();
      setSelectedSkills([]);
      setSelectedLanguages([]);
      setSelectedJobRole(null);
      setAvailabilitySlots([{
        dayOfWeek: 1,
        startHour: 9,
        endHour: 17,
        timeZone: "GMT+0"
      }]);
      if (onSuccess) {
        // Ensure the onSuccess callback is called with a slight delay to allow state updates to complete
        setTimeout(() => {
          onSuccess();
        }, 100);
      }
    },
    onError: (error: Error) => {
      console.error("Job creation failed:", error);
      toast({
        title: "Failed to create job",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle skill toggle
  const handleSkillToggle = (skillId: number) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      } else {
        return [...prev, skillId];
      }
    });
  };
  
  // State for language input
  const [languageInput, setLanguageInput] = useState("");
  
  // Handle language toggle
  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => {
      if (prev.includes(language)) {
        return prev.filter(lang => lang !== language);
      } else {
        return [...prev, language];
      }
    });
  };

  // Handle day toggle for availability
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
    // Create slots for each selected day
    const newSlots = currentSlot.selectedDays.map(day => ({
      dayOfWeek: day,
      startHour: parseInt(currentSlot.startHour),
      endHour: parseInt(currentSlot.endHour),
      timeZone: currentSlot.timeZone
    }));

    setAvailabilitySlots([...availabilitySlots, ...newSlots]);

    // Reset current slot to default values
    setCurrentSlot({
      selectedDays: [1],
      startHour: "9",
      endHour: "17",
      timeZone: "GMT+0"
    });

    toast({
      title: "Availability added",
      description: `Added availability for ${newSlots.length} day(s)`,
    });
  };

  // Handle form submission
  const onSubmit = (values: JobFormValues) => {
    console.log("Form values:", values);
    console.log("Form errors:", form.formState.errors);
    
    if (Object.keys(form.formState.errors).length > 0) {
      console.error("Form has validation errors:", form.formState.errors);
      toast({
        title: "Form validation failed",
        description: "Please check the form for errors and try again",
        variant: "destructive",
      });
      return;
    }
    
    if (availabilitySlots.length === 0) {
      toast({
        title: "Missing availability",
        description: "Please add at least one availability slot",
        variant: "destructive",
      });
      return;
    }

    if (selectedSkills.length === 0 && customSkills.length === 0) {
      toast({
        title: "Missing skills",
        description: "Please select at least one required skill",
        variant: "destructive",
      });
      return;
    }

    if (selectedLanguages.length === 0) {
      toast({
        title: "Missing languages",
        description: "Please select at least one required language",
        variant: "destructive",
      });
      return;
    }

    if (!values.jobRoleId && !values.jobRoleName) {
      toast({
        title: "Missing job role",
        description: "Please select or add a job role",
        variant: "destructive",
      });
      return;
    }

    // Update the requiredLanguages field with the selected languages
    values.requiredLanguages = selectedLanguages.join(", ");
    
    // The job role handling is already done via form.setValue in the handleJobRoleSelect function
    // Log details for debugging
    console.log("Job role selected:", selectedJobRole);
    console.log("jobRoleId:", values.jobRoleId);
    console.log("jobRoleName:", values.jobRoleName);
    console.log("Selected skills:", selectedSkills);
    console.log("Custom skills:", customSkills);
    console.log("Availability slots:", availabilitySlots);

    // Explicitly format dates as ISO strings that can be correctly parsed by the server
    const jobData = {
      ...values,
      // Convert dates to ISO strings with explicit type conversion
      startDate: values.startDate ? values.startDate.toISOString() : undefined,
      endDate: values.endDate ? values.endDate.toISOString() : undefined,
      requiredSkills: selectedSkills,
      skills: customSkills, // Send custom skills to be created
      requiredAvailability: availabilitySlots,
      requiredQualifications: requiredQualifications,
      optionalQualifications: optionalQualifications,
    };

    console.log("Submitting job data with formatted dates:", JSON.stringify(jobData, null, 2));
    createJobMutation.mutate(jobData);
  };

  // Get day name for display
  const getDayName = (day: number): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day] || "";
  };

  // Remove an availability slot
  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(prev => prev.filter((_, i) => i !== index));
  };

  // Currency options for dropdown
  const currencies = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "AUD", label: "AUD ($)" },
  ];

  // Get languages from our utility function
  const languageOptions = getLanguagesForAutocomplete();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobRoleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Role</FormLabel>
                  <FormControl>
                    <AutocompleteInput
                      placeholder="Search job role or add new one..."
                      searchEndpoint="/api/search/job-roles"
                      value={selectedJobRole?.name || ""}
                      onChange={() => {}}
                      onSelect={handleJobRoleSelect}
                      disabled={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <textarea 
                      className="w-full min-h-[120px] p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="Describe the job responsibilities, requirements, and any other relevant details..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of the job to help candidates understand the role better.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hoursPerWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours per week</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      max="80" 
                      placeholder="40"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Salary Converter Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-primary" />
                Salary Information
              </h3>
              
              <SalaryInput 
                defaultAmount={form.getValues().salaryAmount || ""}
                defaultType={(form.getValues().salaryType as SalaryType) || "hourly"}
                defaultCurrency={form.getValues().currency || "USD"}
                onHourlyRateChange={(hourlyRate) => {
                  // Store the hourlyRate in form for submission to backend
                  form.setValue("hourlyRate", hourlyRate);
                  console.log("Hourly rate set in form:", hourlyRate);
                }}
                onSalaryTypeChange={(salaryType) => {
                  form.setValue("salaryType", salaryType);
                }}
                onSalaryAmountChange={(amount) => {
                  form.setValue("salaryAmount", amount);
                }}
                onCurrencyChange={(currency) => {
                  form.setValue("currency", currency);
                }}
              />
            </div>
            
            {/* Job Term Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-sm font-medium mb-3 flex items-center">
                <CalendarDays className="h-4 w-4 mr-1 text-primary" />
                Job Term Details
              </h3>
              
              <div className="space-y-4">
                {/* Start Date and Flexibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined;
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startDateFlexibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date Flexibility</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select flexibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="exact">Exact Date</SelectItem>
                            <SelectItem value="month">General Month</SelectItem>
                            <SelectItem value="immediate">Immediate/ASAP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How flexible are you with the start date?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Permanent Role Checkbox */}
                <FormField
                  control={form.control}
                  name="isPermanent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          This is a permanent position
                        </FormLabel>
                        <FormDescription>
                          Check this if the job has no fixed end date
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* End Date - only show if not permanent */}
                {!form.watch("isPermanent") && (
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : undefined;
                              field.onChange(date);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Required for fixed-term contracts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Required Languages</Label>
              
              {/* Selected languages display */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedLanguages.map(lang => (
                  <div 
                    key={lang} 
                    className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
                  >
                    <span className="text-sm">{lang}</span>
                    <button 
                      type="button" 
                      onClick={() => handleLanguageToggle(lang)}
                      className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Language autocomplete */}
              <div className="relative">
                <AutocompleteInput
                  placeholder="Select languages (e.g., English, Spanish)"
                  options={languageOptions}
                  value={languageInput}
                  onChange={setLanguageInput}
                  onSelect={(option) => {
                    if (option?.name && !selectedLanguages.includes(option.name)) {
                      setSelectedLanguages(prev => [...prev, option.name]);
                      setLanguageInput(""); // Clear input after selection
                    }
                  }}
                  allowCustomValue={true}
                  disabled={false}
                />
              </div>
              
              {selectedLanguages.length === 0 && (
                <p className="text-xs text-red-500">At least one language is required</p>
              )}
              
              {/* Hidden field to maintain form validation */}
              <FormField
                control={form.control}
                name="requiredLanguages"
                render={({ field }) => (
                  <input 
                    type="hidden" 
                    {...field}
                    value={selectedLanguages.join(", ")}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Required Skills</Label>
              
              {/* Selected skills display */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSkills.length > 0 && skills && skills.filter(s => selectedSkills.includes(s.id)).map(skill => (
                  <div 
                    key={skill.id} 
                    className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
                  >
                    <span className="text-sm">{skill.name}</span>
                    <button 
                      type="button" 
                      onClick={() => handleSkillToggle(skill.id)}
                      className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                
                {/* Custom skills display */}
                {customSkills.map(skillName => (
                  <div 
                    key={skillName} 
                    className="bg-primary/10 border border-primary/20 rounded-full px-3 py-1 flex items-center gap-1.5"
                  >
                    <span className="text-sm">{skillName}</span>
                    <button 
                      type="button" 
                      onClick={() => setCustomSkills(prev => prev.filter(s => s !== skillName))}
                      className="h-4 w-4 rounded-full bg-primary/20 hover:bg-primary/30 inline-flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Skills autocomplete */}
              <MultiAutocomplete
                searchEndpoint="/api/search/skills"
                placeholder="Type to search for skills or add new ones..."
                onItemSelect={(id, option) => {
                  if (id !== undefined) {
                    handleSkillToggle(id);
                  } else if (option?.isNew && option?.name) {
                    handleSkillAdd(option.name);
                  }
                }}
                selectedIds={selectedSkills}
                onItemRemove={(id) => handleSkillToggle(id)}
                disabled={false}
              />
              
              {selectedSkills.length === 0 && customSkills.length === 0 && (
                <p className="text-xs text-red-500">At least one skill is required</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Qualifications Section */}
        <div className="border p-4 rounded-md">
          <div className="mb-4">
            <h3 className="font-medium flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-primary" />
              Qualifications
            </h3>
            <p className="mt-2 text-sm text-neutral-600 max-w-2xl">
              Add essential qualifications candidates must have (required) and desirable qualifications that would be beneficial (optional). 
              Required qualifications are mandatory - candidates without these will not match. Optional qualifications can improve match score by up to 10%.
            </p>
          </div>
          
          <div className="grid gap-6">
            {/* Required Qualifications */}
            <div>
              <QualificationsSelector
                type="required"
                selectedQualifications={requiredQualifications}
                onQualificationAdd={handleRequiredQualificationAdd}
                onQualificationRemove={handleRequiredQualificationRemove}
              />
            </div>
            
            {/* Optional Qualifications */}
            <div>
              <QualificationsSelector
                type="optional"
                selectedQualifications={optionalQualifications}
                onQualificationAdd={handleOptionalQualificationAdd}
                onQualificationRemove={handleOptionalQualificationRemove}
              />
            </div>
          </div>
        </div>
        
        <div className="border p-4 rounded-md">
          <div className="mb-4">
            <h3 className="font-medium flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              Required Availability
            </h3>
            <p className="mt-2 text-sm text-neutral-600 max-w-2xl">
              Specify precise time slots when the worker must be available. For example, if you need them for meetings on Wednesday 10am-12pm GMT, add that specific slot. 
              The remaining work hours can be completed at any time that's convenient for the worker.
            </p>
          </div>
          
          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 mb-4 pl-4">
            <p className="text-sm text-amber-800 font-medium">
              Time Zone Matching: Workers in different time zones will be matched based on overlapping availability. The system automatically adjusts the required time slot to the worker's local time zone.
            </p>
          </div>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="col-span-2">
                <AvailabilitySelector 
                  selectedDays={currentSlot.selectedDays}
                  onDayToggle={handleDayToggle}
                  startHour={currentSlot.startHour}
                  endHour={currentSlot.endHour}
                  onStartHourChange={(h) => setCurrentSlot(prev => ({ ...prev, startHour: h }))}
                  onEndHourChange={(h) => setCurrentSlot(prev => ({ ...prev, endHour: h }))}
                  timeZone={currentSlot.timeZone}
                  onTimeZoneChange={(tz) => setCurrentSlot(prev => ({ ...prev, timeZone: tz }))}
                  showTimeZoneSelector={true}
                />
              </div>
              <div>
                <Button 
                  type="button" 
                  onClick={addAvailabilitySlot}
                  disabled={currentSlot.selectedDays.length === 0}
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Availability
                </Button>
              </div>
            </div>
            
            {availabilitySlots.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Required Availability Slots:</h4>
                <div className="space-y-2">
                  {availabilitySlots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded border">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-neutral-500 mr-2" />
                        <span>
                          {getDayName(slot.dayOfWeek)}, {slot.startHour}:00 - {slot.endHour}:00 ({slot.timeZone})
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeAvailabilitySlot(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          type="button" 
          className="w-full md:w-auto"
          disabled={createJobMutation.isPending}
          onClick={(e) => {
            e.preventDefault();
            console.log("Manual form submit triggered");
            const formValues = form.getValues();
            
            console.log("Form values:", formValues);
            
            // Validate required fields
            let hasError = false;
            
            if (!formValues.companyName) {
              toast({
                title: "Company name required",
                description: "Please enter a company name",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (!selectedJobRole) {
              toast({
                title: "Job role required",
                description: "Please select or add a job role",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (!formValues.description || formValues.description.length < 10) {
              toast({
                title: "Job description required",
                description: "Please provide a detailed job description (at least 10 characters)",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (!formValues.hoursPerWeek) {
              toast({
                title: "Hours per week required",
                description: "Please specify hours per week",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (!formValues.salaryAmount) {
              toast({
                title: "Salary amount required",
                description: "Please specify a salary amount",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (selectedSkills.length === 0 && customSkills.length === 0) {
              toast({
                title: "Skills required",
                description: "Please select at least one skill",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (selectedLanguages.length === 0) {
              toast({
                title: "Languages required",
                description: "Please select at least one language",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (availabilitySlots.length === 0) {
              toast({
                title: "Availability required",
                description: "Please add at least one availability slot",
                variant: "destructive",
              });
              hasError = true;
            }
            
            if (hasError) {
              return;
            }
            
            // Prepare the job data
            const jobData = {
              ...formValues,
              requiredLanguages: selectedLanguages.join(", "),
              requiredSkills: selectedSkills,
              skills: customSkills,
              requiredAvailability: availabilitySlots,
            };
            
            console.log("Submitting job data:", JSON.stringify(jobData, null, 2));
            createJobMutation.mutate(jobData);
          }}
        >
          {createJobMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Briefcase className="mr-2 h-4 w-4" />
              Post Job
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}