import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { JobBasicInfoStep } from "./steps/JobBasicInfoStep";
import { JobSkillSelectionStep } from "./steps/JobSkillSelectionStep";
import { JobDetailsStep } from "./steps/JobDetailsStep";
import { JobAvailabilityStep } from "./steps/JobAvailabilityStep";
import { JobReviewStep } from "./steps/JobReviewStep";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define posting steps
export enum JobPostingStep {
  BASIC_INFO = 0,
  SKILL_SELECTION = 1,
  DETAILS = 2,
  AVAILABILITY = 3,
  REVIEW = 4,
  COMPLETED = 5,
}

// State interface for job posting
export interface JobPostingState {
  currentStep: JobPostingStep;
  basicInfo: {
    companyName: string;
    title: string;
    jobRoleId: number | null;
  };
  requiredSkills: number[];
  jobDetails: {
    description: string;
    enhancedDescription: string;
    hoursPerWeek: number;
    hourlyRate: string;
    currency: string;
    requiredLanguages: string[];
  };
  availability: {
    dayOfWeek: number;
    startHour: number;
    endHour: number;
    timeZone: string;
  }[];
  completed: boolean;
}

// Default state
const defaultState: JobPostingState = {
  currentStep: JobPostingStep.BASIC_INFO,
  basicInfo: {
    companyName: "",
    title: "",
    jobRoleId: null,
  },
  requiredSkills: [],
  jobDetails: {
    description: "",
    enhancedDescription: "",
    hoursPerWeek: 40,
    hourlyRate: "",
    currency: "USD",
    requiredLanguages: [],
  },
  availability: [],
  completed: false,
};

interface JobPostingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JobPostingFlow({ isOpen, onClose, onSuccess }: JobPostingFlowProps) {
  // State for job posting
  const [state, setState] = useState<JobPostingState>(defaultState);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // No longer using a mutation here, we're handling it in the JobReviewStep directly
  
  // Handle closing the flow
  const handleClose = () => {
    onClose();
  };
  
  // Handle moving to the next step
  const handleNext = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1 as JobPostingStep,
    }));
  };
  
  // Handle moving to the previous step
  const handlePrevious = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1 as JobPostingStep,
    }));
  };
  
  // Handle completing the flow - this is now being handled by JobReviewStep directly
  const handleComplete = () => {
    console.log("Job was successfully posted, updating UI");
    
    // Set completed state
    setState(prev => ({
      ...prev,
      currentStep: JobPostingStep.COMPLETED,
      completed: true
    }));
    
    // Notify parent component if needed
    if (onSuccess) onSuccess();
  };
  
  // Handle updating basic info
  const handleBasicInfoUpdate = (basicInfo: JobPostingState['basicInfo']) => {
    setState(prev => ({
      ...prev,
      basicInfo,
    }));
  };
  
  // Handle adding/removing skills
  const handleSkillToggle = (skillId: number) => {
    setState(prev => {
      const skills = prev.requiredSkills.includes(skillId) 
        ? prev.requiredSkills.filter(id => id !== skillId)
        : [...prev.requiredSkills, skillId];
      
      return {
        ...prev,
        requiredSkills: skills,
      };
    });
  };
  
  // Handle updating job details
  const handleDetailsUpdate = (details: Partial<JobPostingState['jobDetails']>) => {
    setState(prev => ({
      ...prev,
      jobDetails: {
        ...prev.jobDetails,
        ...details,
      },
    }));
  };
  
  // Handle updating availability
  const handleAvailabilityUpdate = (availability: JobPostingState['availability']) => {
    setState(prev => ({
      ...prev,
      availability,
    }));
  };
  
  // Get step title
  const getStepTitle = (step: JobPostingStep): string => {
    switch (step) {
      case JobPostingStep.BASIC_INFO:
        return "Basic Information";
      case JobPostingStep.SKILL_SELECTION:
        return "Required Skills";
      case JobPostingStep.DETAILS:
        return "Job Details";
      case JobPostingStep.AVAILABILITY:
        return "Required Availability";
      case JobPostingStep.REVIEW:
        return "Review & Post";
      case JobPostingStep.COMPLETED:
        return "Job Posted";
      default:
        return "Unknown Step";
    }
  };
  
  // Render current step content
  const renderStepContent = () => {
    switch (state.currentStep) {
      case JobPostingStep.BASIC_INFO:
        return (
          <JobBasicInfoStep 
            basicInfo={state.basicInfo} 
            onUpdate={handleBasicInfoUpdate} 
            onContinue={handleNext}
          />
        );
        
      case JobPostingStep.SKILL_SELECTION:
        return (
          <JobSkillSelectionStep 
            jobRoleId={state.basicInfo.jobRoleId}
            selectedSkills={state.requiredSkills} 
            onSkillToggle={handleSkillToggle}
            onContinue={handleNext}
          />
        );
        
      case JobPostingStep.DETAILS:
        return (
          <JobDetailsStep 
            jobDetails={state.jobDetails}
            jobTitle={state.basicInfo.title}
            companyName={state.basicInfo.companyName}
            onUpdate={handleDetailsUpdate}
            onContinue={handleNext}
          />
        );
        
      case JobPostingStep.AVAILABILITY:
        return (
          <JobAvailabilityStep 
            availability={state.availability}
            onUpdate={handleAvailabilityUpdate}
            onContinue={handleNext}
          />
        );
        
      case JobPostingStep.REVIEW:
        return (
          <JobReviewStep 
            jobData={state}
            onComplete={handleComplete}
            isPending={false} // No longer using the mutation here
          />
        );
        
      case JobPostingStep.COMPLETED:
      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold">Job Posted Successfully!</h2>
            <p className="text-muted-foreground mt-2">
              Your job has been posted and will be visible to potential applicants.
            </p>
            <Button onClick={handleClose} className="mt-6">
              Close
            </Button>
          </div>
        );
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = 
    (state.currentStep / (Object.keys(JobPostingStep).length / 2 - 1)) * 100;
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[600px] md:max-w-[800px] p-0" 
        aria-describedby="job-posting-description">
        <DialogTitle className="sr-only">
          {getStepTitle(state.currentStep)}
        </DialogTitle>
        <DialogDescription id="job-posting-description" className="sr-only">
          Create a new job posting
        </DialogDescription>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium">
              {state.currentStep + 1}
            </div>
            <h2 className="font-bold text-lg">
              {getStepTitle(state.currentStep)}
            </h2>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress bar */}
        <div 
          className="h-1 bg-primary/10"
          style={{ position: 'relative' }}
        >
          <div
            className="h-1 bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {renderStepContent()}
        </div>
        
        {/* Navigation buttons */}
        {state.currentStep !== JobPostingStep.BASIC_INFO && 
         state.currentStep !== JobPostingStep.REVIEW && 
         state.currentStep !== JobPostingStep.COMPLETED && (
          <div className="flex justify-between items-center border-t p-4">
            <Button 
              variant="outline" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrevious();
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Step {state.currentStep + 1} of {Object.keys(JobPostingStep).length / 2 - 1}
            </div>
            
            <Button 
              variant="default" 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}