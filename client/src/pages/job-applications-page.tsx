import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useParams, useLocation } from "wouter";
import { JobApplication, User, Skill, AvailabilitySlot, Message } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Briefcase, 
  Calendar,
  Clock, 
  Loader2, 
  MapPin, 
  Mail,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
  Globe,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

// Extended job application type with applicant details
type JobApplicationWithDetails = JobApplication & {
  applicant: User & {
    skills: Skill[];
    availability: AvailabilitySlot[];
  };
  job?: {
    id: number;
    title: string;
    employerId: number;
  };
  message?: string; // Cover letter/application message
  matchScore?: {
    overallScore: number;
    roleScore: number;
    skillsMatchPercentage: number;
    availabilityScore: number;
    skillsScore: number;
  };
}

export default function JobApplicationsPage() {
  const params = useParams();
  const jobId = params.jobId;
  const applicationId = params.id; // This is the application ID if coming from /applications/:id
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(applicationId ? parseInt(applicationId) : null);
  const [message, setMessage] = useState('');
  
  // Fetch single application if applicationId is provided
  const { data: singleApplication, isLoading: singleApplicationLoading } = useQuery<JobApplicationWithDetails>({
    queryKey: [`/api/applications/${applicationId}`],
    enabled: !!user && !!applicationId,
  });
  
  // Fetch applications for this job
  const { data: applications, isLoading: applicationsLoading, error } = useQuery<JobApplicationWithDetails[]>({
    queryKey: [`/api/job-applications/${jobId}`],
    enabled: !!user && !!jobId && !applicationId, // Only fetch if we don't have a single application ID
  });
  
  // Get the job associated with the application(s)
  const job = singleApplication?.job || 
              (applications && applications.length > 0 ? applications[0].job : null);
  
  // Normalize the single application data structure to match the applications array structure
  // The API returns 'jobseeker' for single application but 'applicant' for job applications
  let normalizedSingleApplication: JobApplicationWithDetails | undefined;
  
  if (singleApplication) {
    // Check if we have a jobseeker field (from /api/applications/:id)
    if ('jobseeker' in singleApplication) {
      normalizedSingleApplication = {
        ...singleApplication,
        // Create an applicant field that matches the expected structure
        applicant: (singleApplication as any).jobseeker
      };
    } else {
      normalizedSingleApplication = singleApplication;
    }
  }
  
  // Create a merged applications array that includes the normalized single application if available
  const mergedApplications = applicationId && normalizedSingleApplication 
    ? [normalizedSingleApplication] 
    : applications || [];
  
  // Fetch messages for the selected application
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedApplicationId}`],
    enabled: !!selectedApplicationId,
  });
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format day of week
  const formatDayOfWeek = (day: number): string => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[day];
  };
  
  // Format hour
  const formatHour = (hour: number): string => {
    const amPm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:00 ${amPm}`;
  };
  
  // Handle message send
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { applicationId: number; recipientId: number; content: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      // Refresh messages for this application
      if (selectedApplicationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedApplicationId}`] });
      }
      setMessage('');
    },
    onError: (error: any) => {
      console.error("Message send error:", error);
      
      // Try to extract error data
      let errorMessage = "Failed to send message";
      let subscriptionRequired = false;
      let jobId = null;
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check if there's response data with more detailed information
      try {
        if (error.response) {
          const errorData = error.response.data;
          if (errorData) {
            errorMessage = errorData.message || errorMessage;
            subscriptionRequired = !!errorData.subscriptionRequired;
            jobId = errorData.jobId;
          }
        }
      } catch (parseError) {
        console.error("Error parsing API error response:", parseError);
      }
      
      // Handle subscription required error
      if (subscriptionRequired && jobId) {
        navigate(`/subscription?jobId=${jobId}`);
        return;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  
  const handleSendMessage = () => {
    // Check if message is empty
    if (!message.trim()) {
      toast({
        title: "Message cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Check if an application is selected
    if (!selectedApplicationId) {
      toast({
        title: "Error",
        description: "No application selected",
        variant: "destructive"
      });
      return;
    }
    
    // Get application details
    const application = mergedApplications.find(app => app.id === selectedApplicationId);
    if (!application) {
      toast({
        title: "Error",
        description: "Application details not found",
        variant: "destructive"
      });
      return;
    }
    
    // Check if user is authenticated
    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to send messages",
        variant: "destructive"
      });
      return;
    }
    
    // Get necessary IDs from application
    const jobseekerId = application.jobseekerId;
    
    // Determine the employer ID - try multiple sources
    let employerId: number | undefined;
    
    // First try from application.job if it exists
    if (application.job && application.job.employerId) {
      employerId = application.job.employerId;
    } 
    // Then try from job state variable
    else if (job && job.employerId) {
      employerId = job.employerId;
    }
    
    // If we still don't have employer ID
    if (!employerId) {
      // Get the first application to check its job data
      const firstApp = mergedApplications && mergedApplications.length > 0 ? mergedApplications[0] : null;
      if (firstApp && firstApp.job && firstApp.job.employerId) {
        employerId = firstApp.job.employerId;
      }
    }
    
    // Last resort - if we're not the jobseeker, we must be the employer
    if (!employerId && user.id !== jobseekerId) {
      employerId = user.id;
    }
    
    // If we still couldn't determine the employer ID
    if (!employerId) {
      toast({
        title: "Error",
        description: "Could not determine employer ID for this application",
        variant: "destructive"
      });
      return;
    }
    
    // Now determine recipient ID based on user role
    let recipientId = 0;
    
    // If user is employer, send to jobseeker
    if (user.id === employerId) {
      recipientId = jobseekerId;
    } 
    // Otherwise, send to employer
    else {
      recipientId = employerId;
    }
    
    // Log the details for debugging
    console.log("Sending message from", user.id, "to recipient", recipientId, "for application", selectedApplicationId);
    console.log("JobseekerId:", jobseekerId, "EmployerId:", employerId);
    console.log("Message content:", message.substring(0, 50) + (message.length > 50 ? "..." : ""));
    
    // Final validation
    if (!recipientId) {
      toast({
        title: "Error",
        description: "Could not determine message recipient",
        variant: "destructive"
      });
      return;
    }
    
    // Execute mutation
    sendMessageMutation.mutate({
      applicationId: selectedApplicationId,
      recipientId,
      content: message
    });
  };
  
  // Handle application selection
  const handleSelectApplication = (appId: number) => {
    setSelectedApplicationId(appId);
  };
  
  // Handle subscription requirement error
  if (error) {
    // Check for different types of error responses
    const err = error as any;
    
    console.log("Job applications error:", err);
    console.log("Error response:", err.response?.data);
    
    const requiresUpgrade = 
      err.response?.data?.requiresUpgrade || 
      err.message?.includes("upgrade") || 
      err.message?.includes("subscription") ||
      (err.response?.status === 403 && 
       (err.response?.data?.message?.includes("upgrade") || 
        err.response?.data?.message?.includes("subscription")));
    
    if (requiresUpgrade) {
      return (
        <div className="bg-neutral-50 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <Link href="/my-jobs">
                  <Button variant="outline" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Jobs
                  </Button>
                </Link>
              </div>
              
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-16 w-16 mx-auto text-primary mb-6" />
                  <h2 className="text-2xl font-bold mb-4">Subscription Upgrade Required</h2>
                  <p className="text-neutral-600 max-w-lg mx-auto mb-8">
                    {err.response?.data?.message || 
                     "You need an active subscription to view applicant details and communicate with potential candidates."}
                  </p>
                  <Link href={`/subscription?jobId=${jobId}`}>
                    <Button size="lg">
                      Get Subscription
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }
  }
  
  if (applicationsLoading || singleApplicationLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <Link href="/my-jobs">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to My Jobs
              </Button>
            </Link>
            
            {job && (
              <div className="flex items-center">
                <Badge variant="outline" className="mr-2 text-lg">
                  {mergedApplications?.length || 0} {mergedApplications?.length === 1 ? 'Application' : 'Applications'}
                </Badge>
                <Badge className="bg-primary/80 hover:bg-primary px-3 py-1.5">{job.title}</Badge>
              </div>
            )}
          </div>
          
          {mergedApplications && mergedApplications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left column: Applicant list */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Applicants</CardTitle>
                    <CardDescription>
                      Review candidates who applied for this position
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      {mergedApplications.map((application) => (
                        <Card 
                          key={application.id} 
                          className={`cursor-pointer transition-all hover:shadow ${
                            selectedApplicationId === application.id ? 'border-primary ring-1 ring-primary' : ''
                          }`}
                          onClick={() => handleSelectApplication(application.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                                {application.applicant.fullName?.substring(0, 2) || "U"}
                              </div>
                              <div>
                                <h3 className="font-medium text-[15px]">{application.applicant.fullName}</h3>
                                <p className="text-sm text-neutral-500">
                                  {application.applicant.jobRoleId ? "Has job role" : "No role specified"}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-neutral-600 flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                              Applied on {formatDate(application.createdAt)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Right column: Applicant details */}
              <div className="md:col-span-2">
                {selectedApplicationId ? (
                  <div className="space-y-6">
                    {mergedApplications.filter(app => app.id === selectedApplicationId).map((application) => (
                      <div key={application.id}>
                        {/* Applicant header */}
                        <Card className="mb-6">
                          <CardHeader>
                            <div className="flex justify-between">
                              <div>
                                <CardTitle className="text-2xl">{application.applicant.fullName}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  {application.applicant.jobRoleId && (
                                    <>
                                      <Briefcase className="h-4 w-4" />
                                      <span>Role ID: {application.applicant.jobRoleId}</span>
                                      <span className="mx-1">•</span>
                                    </>
                                  )}
                                  {application.applicant.location && (
                                    <>
                                      <MapPin className="h-4 w-4" />
                                      <span>{application.applicant.location}</span>
                                      <span className="mx-1">•</span>
                                    </>
                                  )}
                                  <Globe className="h-4 w-4" />
                                  <span>{application.applicant.timeZone || "No timezone specified"}</span>
                                </CardDescription>
                              </div>
                              <Button variant="outline" className="gap-2">
                                <Mail className="h-4 w-4" />
                                {application.applicant.email}
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex flex-col items-center p-4 bg-neutral-50 rounded-md">
                                <h3 className="font-semibold text-neutral-500 mb-1">Profile Match</h3>
                                <div className="text-3xl font-bold text-primary mb-1">
                                  {application.matchScore?.overallScore || 0}%
                                </div>
                                <Progress value={application.matchScore?.overallScore || 0} className="w-full" />
                              </div>
                              <div className="flex flex-col items-center p-4 bg-neutral-50 rounded-md">
                                <h3 className="font-semibold text-neutral-500 mb-1">Role Match</h3>
                                <div className="text-3xl font-bold text-[#5BBFBA] mb-1">
                                  {Math.round((application.matchScore?.roleScore || 0) * 2)}%
                                </div>
                                <Progress value={(application.matchScore?.roleScore || 0) * 2} className="w-full bg-neutral-200" />
                              </div>
                              <div className="flex flex-col items-center p-4 bg-neutral-50 rounded-md">
                                <h3 className="font-semibold text-neutral-500 mb-1">Skills Match</h3>
                                <div className="text-3xl font-bold text-orange-500 mb-1">
                                  {application.matchScore?.skillsMatchPercentage || 0}%
                                </div>
                                <Progress value={application.matchScore?.skillsMatchPercentage || 0} className="w-full bg-neutral-200" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Applicant details tabs */}
                        <Tabs defaultValue="about">
                          <TabsList className="grid grid-cols-3 w-full mb-6">
                            <TabsTrigger value="about">Profile</TabsTrigger>
                            <TabsTrigger value="skills">Skills & Availability</TabsTrigger>
                            <TabsTrigger value="messages">Messages</TabsTrigger>
                          </TabsList>
                          
                          {/* About tab */}
                          <TabsContent value="about">
                            <Card>
                              <CardHeader>
                                <CardTitle>Application Details</CardTitle>
                                <CardDescription>
                                  Submitted on {formatDate(application.createdAt)}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="bg-neutral-50 p-4 rounded-md mb-6">
                                  <h3 className="font-medium mb-2">Cover Note</h3>
                                  <p className="text-neutral-600 whitespace-pre-wrap">
                                    {application.message || "No cover letter provided"}
                                  </p>
                                </div>
                                
                                <h3 className="font-medium mb-2">Profile Summary</h3>
                                <p className="text-neutral-600 mb-6">
                                  {application.applicant.bio ? 
                                    application.applicant.bio : 
                                    "No bio provided. Check LinkedIn profile for more details."}
                                </p>
                                
                                <div className="mb-6">
                                  <Card className="border border-blue-100 hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2 bg-blue-50">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#0A66C2]">
                                          <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
                                        </svg>
                                        LinkedIn Profile
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                      {application.applicant.linkedInProfile ? (
                                        <a 
                                          href={application.applicant.linkedInProfile.startsWith('http') ? 
                                            application.applicant.linkedInProfile : 
                                            `https://${application.applicant.linkedInProfile}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          View {application.applicant.fullName}'s LinkedIn Profile
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                                          </svg>
                                        </a>
                                      ) : (
                                        <p className="text-neutral-500 italic">LinkedIn profile not provided</p>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              </CardContent>
                            </Card>
                          </TabsContent>
                          
                          {/* Skills tab */}
                          <TabsContent value="skills">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Skills section */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Skills</CardTitle>
                                  <CardDescription>
                                    Candidate's skills and competencies
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {application.applicant.skills && application.applicant.skills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {application.applicant.skills.map((skill) => (
                                        <Badge key={skill.id} variant="secondary">
                                          {skill.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-neutral-500">No skills listed</p>
                                  )}
                                </CardContent>
                              </Card>
                              
                              {/* Availability section */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Availability</CardTitle>
                                  <CardDescription>
                                    Candidate's working hours
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {application.applicant.availability && application.applicant.availability.length > 0 ? (
                                    <div className="space-y-2">
                                      {application.applicant.availability.map((slot) => (
                                        <div 
                                          key={slot.id} 
                                          className="bg-primary/10 p-3 rounded-md flex justify-between items-center"
                                        >
                                          <div>
                                            <p className="font-medium text-[15px]">{formatDayOfWeek(slot.dayOfWeek)}</p>
                                            <p className="text-neutral-500">
                                              {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                                            </p>
                                          </div>
                                          <Badge variant="outline">
                                            {slot.timeZone}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-neutral-500">No availability specified</p>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </TabsContent>
                          
                          {/* Messages tab */}
                          <TabsContent value="messages">
                            <Card>
                              <CardHeader>
                                <CardTitle>Messages</CardTitle>
                                <CardDescription>
                                  Communicate with the candidate
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="bg-neutral-50 rounded-md h-64 p-4 mb-4 overflow-y-auto">
                                  {messagesLoading ? (
                                    <div className="flex justify-center items-center h-full">
                                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                                  ) : messages && messages.length > 0 ? (
                                    <div className="space-y-4">
                                      {messages.map((msg) => (
                                        <div 
                                          key={msg.id}
                                          className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                                        >
                                          <div 
                                            className={`max-w-[80%] rounded-lg p-3 ${
                                              msg.senderId === user?.id 
                                                ? 'bg-primary text-white' 
                                                : 'bg-white border border-neutral-200'
                                            }`}
                                          >
                                            <p className="text-sm mb-1 font-medium">
                                              {msg.senderId === user?.id 
                                                ? 'You' 
                                                : (msg.senderId === application.jobseekerId 
                                                    ? application.applicant.fullName || 'Applicant'
                                                    : 'Employer')}
                                            </p>
                                            <p>{msg.content}</p>
                                            <p className="text-xs mt-1 text-right opacity-80">
                                              {new Date(msg.createdAt).toLocaleTimeString()} 
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full">
                                      <MessageSquare className="h-12 w-12 text-neutral-300 mb-3" />
                                      <p className="text-neutral-500">No messages yet</p>
                                      <p className="text-neutral-400 text-sm">
                                        Start the conversation with this candidate
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                <form 
                                  className="flex gap-3"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                  }}
                                >
                                  <Textarea
                                    placeholder="Type your message here"
                                    className="flex-1"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                  />
                                  <Button 
                                    className="h-auto" 
                                    type="submit"
                                    disabled={!message.trim() || sendMessageMutation.isPending}
                                  >
                                    {sendMessageMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Send"
                                    )}
                                  </Button>
                                </form>
                              </CardContent>
                            </Card>
                          </TabsContent>
                        </Tabs>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="h-full flex items-center justify-center p-12">
                    <div className="text-center">
                      <UserIcon className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                      <h3 className="text-xl font-bold mb-2">Select an Applicant</h3>
                      <p className="text-neutral-500 max-w-md">
                        Choose an applicant from the list to view their details and communicate with them.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <UserIcon className="h-16 w-16 mx-auto text-neutral-300 mb-6" />
                <h2 className="text-2xl font-bold mb-4">No Applications Yet</h2>
                <p className="text-neutral-600 max-w-lg mx-auto mb-4">
                  Your job posting hasn't received any applications yet. Our matching algorithm is working to find qualified candidates that match your requirements.
                </p>
                <div className="bg-primary/10 p-4 rounded-md max-w-lg mx-auto mb-8">
                  <h3 className="font-medium text-primary mb-2">Tips to attract more candidates:</h3>
                  <ul className="text-left text-neutral-700 space-y-2">
                    <li>• Ensure your job title and description are clear and appealing</li>
                    <li>• Consider being more flexible with time zone requirements (30% of match score)</li>
                    <li>• Review the required skills to include related technologies</li>
                    <li>• Add more details about your company and work culture</li>
                  </ul>
                </div>
                <Link href="/my-jobs">
                  <Button size="lg">
                    Return to My Jobs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}