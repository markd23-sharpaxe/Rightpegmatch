import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Job, Skill, User, JobRole, JobApplication } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Clock, 
  Globe, 
  DollarSign, 
  Briefcase, 
  MapPin, 
  Calendar,
  CalendarDays,
  Share2,
  Bookmark,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Helper function to get day name from day of week number
function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek];
}

// Helper function to format hour with AM/PM
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// Helper function to convert time zone offset to name
function formatTimeZone(timeZone: string): string {
  return timeZone;
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [applicationMessage, setApplicationMessage] = useState("");
  
  // Fetch job details
  const { data: job, isLoading: jobLoading, error: jobError } = useQuery<Job>({
    queryKey: [`/api/jobs/${id}`],
  });
  
  // Fetch skills
  const { data: skills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Fetch job roles
  const { data: jobRoles = [] } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Get job skills
  const jobSkills = skills?.filter(skill => 
    job?.requiredSkills && job.requiredSkills.includes(skill.id)
  ) || [];
  
  // Check if user already applied
  const { data: applicationData, isLoading: applicationsLoading } = useQuery<{ applied: JobApplication[]; received: JobApplication[] }>({
    queryKey: ["/api/applications"],
    enabled: !!user // All users are potential jobseekers
  });
  
  // Extract the applied applications array
  const appliedApplications = applicationData?.applied || [];
  
  // Check if user has already applied for this job
  const hasApplied = appliedApplications.some((app: JobApplication) => app.jobId === parseInt(id || "0"));
  
  // Application mutation
  const applyMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      const res = await apiRequest("POST", `/api/jobs/${id}/apply`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application submitted",
        description: "Your application has been successfully submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setApplicationMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Application failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle application submit
  const handleApply = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // In our unified user model, all users can apply for jobs
    // No need to check user type anymore
    
    applyMutation.mutate({ message: applicationMessage });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  if (jobLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (jobError || !job) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-medium mb-2">Job Not Found</h3>
            <p className="text-neutral-500 text-center">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => navigate("/job-listings")}
              className="mt-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job Matches
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <Button
          variant="outline"
          className="mb-6 group hover:border-primary/50 transition-colors"
          onClick={() => navigate("/job-listings")}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="group-hover:text-primary transition-colors">Back to Job Matches</span>
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">{job.title}</CardTitle>
                    <CardDescription className="text-base flex items-center text-gray-600">
                      <Briefcase className="h-4 w-4 mr-1.5 text-gray-400" />
                      {job.companyName}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap sm:flex-col gap-2 sm:items-end">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 text-sm">
                      {job.jobType === 'full-time' ? 'Full-Time' : 
                       job.jobType === 'part-time' ? 'Part-Time' : 
                       job.jobType === 'contract' ? 'Contract' : 
                       job.jobType}
                    </Badge>
                    {job.jobRoleId && jobRoles.find((role: JobRole) => role.id === job.jobRoleId) && (
                      <Badge className="flex items-center gap-1 bg-primary/90 text-white hover:bg-primary px-3 py-1 text-sm">
                        <Briefcase className="h-3 w-3" />
                        {jobRoles.find((role: JobRole) => role.id === job.jobRoleId)?.name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-5">
                  {jobSkills.map(skill => (
                    <Badge key={skill.id} variant="secondary" className="rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8 py-6">
                {/* Job Description */}
                {job.description && (
                  <div className="bg-white rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Job Description</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                    </div>
                  </div>
                )}
                
                {/* Match Score Information */}
                {user && job.matchScore && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-lg font-medium mb-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-800">Your Match Score</span>
                        
                        {/* Display if using AI or fallback matching */}
                        {job.matchScore.matchDetails?.aiMatchExplanation ? (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-300 text-blue-600">
                            AI Match
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 border-orange-300 text-orange-600">
                            Fallback Match
                          </Badge>
                        )}
                      </div>
                      <Badge className={`text-white font-medium px-3 py-1 ${
                        job.matchScore.overallScore >= 80 ? 'bg-green-500 hover:bg-green-600' :
                        job.matchScore.overallScore >= 60 ? 'bg-amber-500 hover:bg-amber-600' :
                        job.matchScore.overallScore >= 40 ? 'bg-amber-400 hover:bg-amber-500' :
                        'bg-gray-500 hover:bg-gray-600'
                      }`}>
                        {job.matchScore.overallScore >= 80 ? "Excellent" :
                         job.matchScore.overallScore >= 60 ? "Good" :
                         job.matchScore.overallScore >= 40 ? "Fair" : "Basic"} Match
                      </Badge>
                    </h3>
                    
                    {job.matchScore.matchDetails?.aiMatchExplanation && (
                      <p className="text-sm text-gray-600 mb-5 mt-1 border-b border-gray-200 pb-4">
                        {job.matchScore.matchDetails.aiMatchExplanation}
                      </p>
                    )}
                    
                    <div className="space-y-5">
                      {/* Role compatibility - Primary factor */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            1. Role Compatibility
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {job.matchScore.roleScore >= 70 ? "Strong match" : 
                             job.matchScore.roleScore >= 40 ? "Good match" : 
                             job.matchScore.roleScore > 0 ? "Partial match" : "Limited match"}
                          </span>
                        </div>
                        <Progress value={job.matchScore.roleScore} className="h-2.5 bg-gray-200" 
                          indicatorColor={
                            job.matchScore.roleScore >= 70 ? "bg-green-500" : 
                            job.matchScore.roleScore >= 40 ? "bg-amber-500" : 
                            job.matchScore.roleScore > 0 ? "bg-amber-400" : "bg-gray-400"
                          } />
                        <p className="text-xs text-gray-500 mt-2">
                          {job.matchScore.roleScore >= 70 ? 
                            "Your job experience strongly aligns with this position's requirements" : 
                            job.matchScore.roleScore >= 40 ?
                            "Your job experience aligns well with this position" :
                            job.matchScore.roleScore > 0 ?
                            "You have some relevant job experience for this position" :
                            "Consider highlighting transferable skills from your background"}
                        </p>
                      </div>
                      
                      {/* Availability match with percentage tiers */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            2. Availability Match
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {job.matchScore.availabilityScore >= 70 ? "Strong match (80-100%)" : 
                             job.matchScore.availabilityScore >= 50 ? "Good match (60-80%)" : 
                             job.matchScore.availabilityScore > 0 ? "Partial match (50-60%)" : "Limited match (<50%)"}
                          </span>
                        </div>
                        <Progress value={job.matchScore.availabilityScore} className="h-2 bg-gray-200" 
                           indicatorColor={
                             job.matchScore.availabilityScore >= 70 ? "bg-green-500" : 
                             job.matchScore.availabilityScore >= 50 ? "bg-amber-500" : 
                             job.matchScore.availabilityScore > 0 ? "bg-amber-400" : "bg-gray-400"
                           } />
                        <p className="text-xs text-gray-500 mt-2">
                          {job.matchScore.availabilityScore >= 70 ? 
                            "Your availability has excellent overlap with this position's requirements" : 
                            job.matchScore.availabilityScore >= 50 ?
                            "Your availability has good overlap with the required time slots" :
                            job.matchScore.availabilityScore > 0 ?
                            "Your availability partially meets the required time slots" :
                            "Consider if you can adjust your schedule to better meet requirements"}
                        </p>
                      </div>
                      
                      {/* Salary within 25% range */}
                      {job.matchScore.matchDetails?.aiCompensationMatch !== undefined && (
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              3. Salary Compatibility
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {job.matchScore.matchDetails.aiCompensationMatch >= 75 ? "Perfect match" :
                               job.matchScore.matchDetails.aiCompensationMatch >= 50 ? "Within expected range" :
                               job.matchScore.matchDetails.aiCompensationMatch > 0 ? "Partially matches" : "Outside range"}
                            </span>
                          </div>
                          <Progress 
                            value={job.matchScore.matchDetails.aiCompensationMatch} 
                            className="h-2 bg-gray-200"
                            indicatorColor={
                              job.matchScore.matchDetails.aiCompensationMatch >= 75 ? "bg-green-500" : 
                              job.matchScore.matchDetails.aiCompensationMatch >= 50 ? "bg-amber-500" : 
                              "bg-gray-400"
                            } 
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            {job.matchScore.matchDetails.aiCompensationMatch >= 75 ? 
                              "The offered salary aligns perfectly with your requirements" : 
                              job.matchScore.matchDetails.aiCompensationMatch >= 50 ? 
                              "The salary is within your expected compensation range" : 
                              job.matchScore.matchDetails.aiCompensationMatch > 0 ?
                              "The salary partially meets your compensation requirements" :
                              "There's a significant gap between your requirements and the offered salary"}
                          </p>
                        </div>
                      )}
                      
                      {/* Skills assessment */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            4. Skills Match
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {job.matchScore.skillsMatchPercentage >= 70 ? "Strong match" : 
                             job.matchScore.skillsMatchPercentage >= 40 ? "Good match" : 
                             job.matchScore.skillsMatchPercentage >= 20 ? "Partial match" : "Limited match"}
                          </span>
                        </div>
                        <Progress 
                          value={job.matchScore.skillsMatchPercentage} 
                          className="h-2 bg-gray-200" 
                          indicatorColor={
                            job.matchScore.skillsMatchPercentage >= 70 ? "bg-green-500" : 
                            job.matchScore.skillsMatchPercentage >= 40 ? "bg-amber-500" : 
                            job.matchScore.skillsMatchPercentage >= 20 ? "bg-amber-400" : "bg-gray-400"
                          }
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          {job.matchScore.skillsMatchPercentage >= 70 ? 
                            "You have most of the skills needed for this position" : 
                            job.matchScore.skillsMatchPercentage >= 40 ? 
                            "You have many of the required skills" : 
                            job.matchScore.skillsMatchPercentage >= 20 ?
                            "You have some of the required skills" :
                            "Consider highlighting your transferable skills"}
                        </p>
                      </div>
                      
                      {/* Strengths and Gaps */}
                      {job.matchScore.matchDetails?.aiStrengths && job.matchScore.matchDetails.aiStrengths.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Your Key Strengths</h4>
                          <ul className="space-y-1">
                            {job.matchScore.matchDetails.aiStrengths.map((strength, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {job.matchScore.matchDetails?.aiGaps && job.matchScore.matchDetails.aiGaps.length > 0 && (
                        <div className="pt-2">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">Areas for Growth</h4>
                          <ul className="space-y-1">
                            {job.matchScore.matchDetails.aiGaps.map((gap, index) => (
                              <li key={index} className="text-sm text-gray-700 flex items-start">
                                <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Hours per week</p>
                      <p className="font-medium text-gray-900">
                        {job.hoursPerWeek ? `${job.hoursPerWeek} hrs/week` : 
                          (job.minHoursPerWeek && job.maxHoursPerWeek) 
                            ? `${job.minHoursPerWeek}-${job.maxHoursPerWeek} hrs/week` 
                            : 'Flexible'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Globe className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Time zone overlap</p>
                      <p className="font-medium text-gray-900">{job.timeZoneOverlap || 'Flexible'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Compensation</p>
                      <p className="font-medium text-gray-900">
                        {job.hourlyRate ? `${job.hourlyRate} ${job.currency}/hr` : ''}
                        {(job.minSalary || job.maxSalary) && (
                          <span className="ml-1">
                            {job.minSalary && job.maxSalary 
                              ? `${job.minSalary.toLocaleString()}-${job.maxSalary.toLocaleString()} ${job.currency}`
                              : job.minSalary 
                                ? `From ${job.minSalary.toLocaleString()} ${job.currency}` 
                                : `Up to ${job.maxSalary?.toLocaleString()} ${job.currency}`
                            }
                            {job.salaryType && ` (${job.salaryType === 'hourly' ? 'hourly' : job.salaryType === 'monthly' ? 'monthly' : 'annual'})`}
                          </span>
                        )}
                        {(!job.hourlyRate && !job.minSalary && !job.maxSalary) && 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p className="font-medium text-gray-900">{job.location || 'Remote'}</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-200" />
                
                {job.requiredAvailability && job.requiredAvailability.length > 0 && (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarDays className="h-5 w-5 text-primary flex-shrink-0" />
                        <h3 className="text-xl font-semibold text-gray-900">Required Availability</h3>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-5">
                        <p className="text-sm text-blue-700 flex flex-col gap-2">
                          <span className="font-medium">Important Note:</span> 
                          <span>This job requires you to be available during the specific time slots shown below.</span>
                          <span>The remaining {job.hoursPerWeek} hours per week can be completed at your convenience.</span>
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {job.requiredAvailability.map((slot, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <Badge className="font-medium bg-primary/10 text-primary hover:bg-primary/20">
                                {getDayName(slot.dayOfWeek)}
                              </Badge>
                              <div className="text-xs text-gray-500">
                                {slot.timeZone}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-800">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator className="bg-gray-200 mb-6" />
                  </>
                )}
                
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Job Description</h3>
                  <div className="prose prose-gray max-w-none leading-relaxed">
                    <p className="whitespace-pre-line text-gray-700">{job.description}</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 pb-6 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Posted on <span className="font-medium">{formatDate(job.createdAt.toString())}</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            {user && (
              <Card className="border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-4 border-b border-gray-100">
                  <CardTitle className="text-xl text-gray-900">Apply for this position</CardTitle>
                  <CardDescription>
                    Our intelligent matching system indicates you're an {job.matchScore && 
                      (job.matchScore.overallScore >= 80 ? "excellent" :
                       job.matchScore.overallScore >= 60 ? "good" :
                       job.matchScore.overallScore >= 40 ? "fair" : "basic")} match for this role based on your skills, 
                       experience, and availability.
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-6">
                  {hasApplied ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <div className="bg-green-50 text-green-600 p-3 rounded-full">
                        <CheckCircle className="h-8 w-8" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
                        <p className="text-gray-600 max-w-md">
                          The employer will review your profile and contact you if you're a good match. 
                          You can track the status of all your applications in the "My Applications" section.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Your Application Message</label>
                        <Textarea
                          placeholder="Write your cover letter here. Include: 
1. Your specific experience with the required skills
2. Why you're interested in this position
3. Your availability in the required time zones (this is crucial for remote collaboration)
4. Examples of relevant work or achievements"
                          rows={6}
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          className="resize-y focus:border-primary focus:ring-primary"
                        />
                        <p className="text-xs text-gray-500">
                          A well-written application significantly increases your chances of getting hired. 
                          Employers look for candidates who address their specific requirements and demonstrate clear communication.
                        </p>
                      </div>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 transition-colors py-2.5"
                        onClick={handleApply}
                        disabled={applyMutation.isPending || !applicationMessage.trim()}
                      >
                        {applyMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg text-gray-900">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 py-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{job.companyName}</h3>
                    <p className="text-sm text-gray-500">{job.location || 'Remote'}</p>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full border-primary/50 text-primary hover:bg-primary/5"
                    onClick={() => window.open(job.companyName ? `https://www.google.com/search?q=${encodeURIComponent(job.companyName)}` : '#')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Company
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-lg text-gray-900">Time Zone Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 py-6">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{job.timeZoneOverlap || 'Flexible hours'}</p>
                    <p className="text-sm text-gray-500 mt-1">Required availability</p>
                  </div>
                </div>
                
                {job.requiredAvailability && job.requiredAvailability.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 mb-2">Specific Required Time Slots:</p>
                    <div className="space-y-2">
                      {job.requiredAvailability.slice(0, 2).map((slot, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded-md border border-gray-100 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {getDayName(slot.dayOfWeek)}, {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                          </span>
                        </div>
                      ))}
                      {job.requiredAvailability.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{job.requiredAvailability.length - 2} more time slots
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {job.timeZoneRequirements && (
                  <div className="text-sm bg-gray-50 p-4 rounded-md border border-gray-100 mt-3">
                    <p className="font-medium mb-2 text-gray-900">Additional requirements:</p>
                    <p className="text-gray-700">{job.timeZoneRequirements}</p>
                  </div>
                )}
                
                <div className="bg-primary/10 p-4 rounded-md border border-primary/20">
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>
                      <strong>Important:</strong> Time zone compatibility is crucial for this position. 
                      Please confirm you can work during the required hours before applying.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {!user && (
              <Card className="border-0 shadow-md overflow-hidden bg-primary/5">
                <CardContent className="py-8">
                  <div className="text-center space-y-5">
                    <div className="bg-primary/10 p-3 rounded-full inline-flex">
                      <Briefcase className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Want to apply for this job?</h3>
                      <p className="text-gray-600">Create an account to apply for this and thousands of other remote jobs.</p>
                    </div>
                    <Button 
                      onClick={() => navigate("/auth")}
                      className="bg-primary hover:bg-primary/90 transition-colors py-2.5 px-5"
                    >
                      Sign Up Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
