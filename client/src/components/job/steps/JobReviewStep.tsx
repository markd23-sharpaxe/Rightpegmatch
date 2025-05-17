import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Check, 
  Loader2,
} from "lucide-react";
import { JobPostingState } from "../JobPostingFlow";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobReviewStepProps {
  jobData: JobPostingState;
  onComplete: (e?: React.MouseEvent) => void;
  isPending: boolean;
}

export function JobReviewStep({ jobData, onComplete, isPending: parentIsPending }: JobReviewStepProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create our own mutation directly here, bypassing the parent
  const createJobMutation = useMutation({
    mutationFn: async () => {
      const formattedData = {
        companyName: jobData.basicInfo.companyName,
        title: jobData.basicInfo.title,
        jobRoleId: jobData.basicInfo.jobRoleId,
        requiredSkills: jobData.requiredSkills,
        description: jobData.jobDetails.enhancedDescription || jobData.jobDetails.description,
        hoursPerWeek: jobData.jobDetails.hoursPerWeek,
        hourlyRate: jobData.jobDetails.hourlyRate,
        currency: jobData.jobDetails.currency,
        requiredLanguages: Array.isArray(jobData.jobDetails.requiredLanguages) 
          ? jobData.jobDetails.requiredLanguages.join(", ") 
          : jobData.jobDetails.requiredLanguages,
        requiredAvailability: jobData.availability,
      };
      
      console.log("Starting direct API request with data:", formattedData);
      
      try {
        const res = await apiRequest("POST", "/api/jobs", formattedData);
        console.log("API response received:", res.status);
        
        // Clone the response so we can read it multiple times if needed
        const resClone = res.clone();
        
        // Check for non-OK status
        if (!res.ok) {
          // Try to get error details from response
          try {
            const errorData = await resClone.json();
            console.error("API error response:", errorData);
            throw new Error(errorData.message || `Server error: ${res.status}`);
          } catch (parseError) {
            // If can't parse JSON, use text or status
            const errorText = await resClone.text();
            console.error("API error text:", errorText);
            throw new Error(errorText || `Server error: ${res.status}`);
          }
        }
        
        // Success path
        const data = await res.json();
        console.log("API response data:", data);
        return data;
      } catch (err) {
        console.error("API request failed:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Direct mutation succeeded with data:", data);
      toast({
        title: "Job Posted",
        description: "Your job has been posted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      onComplete(); // Call parent's onComplete to handle UI state
    },
    onError: (error: Error) => {
      console.error("Direct mutation failed with error:", error);
      toast({
        title: "Failed to post job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isPending = parentIsPending || createJobMutation.isPending;

  const handleSubmitJob = (e: React.MouseEvent) => {
    console.log("Direct submit button clicked");
    e.preventDefault();
    e.stopPropagation();
    
    // Check individual fields and create specific error messages
    const validationErrors = [];
    
    if (!jobData.basicInfo.companyName) {
      validationErrors.push("Company name is required");
    }
    
    if (!jobData.basicInfo.title) {
      validationErrors.push("Job title is required");
    }
    
    if (!jobData.basicInfo.jobRoleId) {
      validationErrors.push("Job role is required");
    }
    
    if (jobData.requiredSkills.length === 0) {
      validationErrors.push("At least one required skill must be selected");
    }
    
    if (!jobData.jobDetails.description && !jobData.jobDetails.enhancedDescription) {
      validationErrors.push("Job description is required");
    }
    
    if (jobData.availability.length === 0) {
      validationErrors.push("At least one availability slot is required");
    }
    
    if (validationErrors.length === 0) {
      // Submit the job directly here instead of through parent
      console.log("All validation passed, submitting job directly");
      createJobMutation.mutate();
    } else {
      console.log("Validation failed:", validationErrors);
      toast({
        title: "Missing Information",
        description: validationErrors[0], // Show first error as the main message
        variant: "destructive",
      });
      
      // Also log all errors to console
      validationErrors.forEach(error => console.error(`Validation error: ${error}`));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Review & Post Job</h2>
      
      <div className="bg-primary/10 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Job Overview</h3>
        <p>Company: {jobData.basicInfo.companyName}</p>
        <p>Title: {jobData.basicInfo.title}</p>
        <p>Skills: {jobData.requiredSkills.length} selected</p>
        <p>Hours per week: {jobData.jobDetails.hoursPerWeek}</p>
        <p>Pay rate: {jobData.jobDetails.currency} {jobData.jobDetails.hourlyRate}/hr</p>
        <p>Availability slots: {jobData.availability.length}</p>
      </div>
      
      <div className="flex justify-center mt-4">
        <button 
          onClick={handleSubmitJob}
          disabled={isPending}
          className="py-2 px-4 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90"
          type="button"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 inline animate-spin" />
              Posting Job...
            </>
          ) : "Post Job Now"}
        </button>
      </div>
    </div>
  );
}