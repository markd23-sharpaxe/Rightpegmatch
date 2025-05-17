import { User as UserType } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, PlusCircle, Clock, HandHelping, BarChart2,
  ArrowRight, BriefcaseBusiness, FileSearch, CheckCircle2,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface JobDashboardProps {
  user: UserType;
}

// Job interfaces (these would typically come from the schema)
interface Job {
  id: number;
  title: string;
  description: string;
  location: string;
  salary: string | null;
  company: string;
  jobRoleId: number;
  status: string;
  createdAt: string;
  employerId: number;
}

interface JobApplication {
  id: number;
  jobId: number;
  jobseekerId: number;
  status: string;
  coverLetter: string | null;
  createdAt: string;
  job?: Job;
}

export default function JobDashboard({ user }: JobDashboardProps) {
  // Fetch jobs posted by the user
  const { 
    data: postedJobs, 
    isLoading: postedJobsLoading 
  } = useQuery<Job[]>({
    queryKey: ["/api/employer/jobs"],
    enabled: !!user,
  });
  
  // Fetch job applications submitted by the user
  const { 
    data: jobApplications, 
    isLoading: applicationsLoading 
  } = useQuery<JobApplication[]>({
    queryKey: ["/api/jobseeker/applications"],
    enabled: !!user,
  });
  
  // Fetch jobs matching user's profile
  const {
    data: matchedJobs,
    isLoading: matchedJobsLoading
  } = useQuery<Job[]>({
    queryKey: ["/api/matches/jobs"],
    enabled: !!user,
  });
  
  // Function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1" />
            Open
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1" />
            Closed
          </Badge>
        );
      case 'applied':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1" />
            Applied
          </Badge>
        );
      case 'interview':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mr-1" />
            Interview
          </Badge>
        );
      case 'offered':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" />
            Offered
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
            <XCircle className="h-3 w-3 mr-1 text-red-500" />
            Rejected
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            Accepted
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Posted Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BriefcaseBusiness className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">
                {postedJobsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  postedJobs?.length || 0
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Job Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileSearch className="h-5 w-5 text-primary mr-2" />
              <span className="text-2xl font-bold">
                {applicationsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  jobApplications?.length || 0
                )}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={30} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>30% interview rate</span>
                <span>10 total applications</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Job Listings & Applications */}
      <Tabs defaultValue="posted">
        <TabsList className="mb-4">
          <TabsTrigger value="posted" className="flex items-center gap-1.5">
            <Building className="h-4 w-4" />
            <span>Posted Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex items-center gap-1.5">
            <HandHelping className="h-4 w-4" />
            <span>Applications</span>
          </TabsTrigger>
          <TabsTrigger value="recommended" className="flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4" />
            <span>Recommended</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Posted Jobs Tab */}
        <TabsContent value="posted">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Jobs You've Posted</CardTitle>
                  <CardDescription>
                    Manage your job postings and view applicants
                  </CardDescription>
                </div>
                
                <Button className="flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Post New Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {postedJobsLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : postedJobs && postedJobs.length > 0 ? (
                <div className="space-y-4">
                  {postedJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">{job.title}</h3>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              {job.salary && (
                                <>
                                  <span>•</span>
                                  <span>{job.salary}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getStatusBadge(job.status)}
                            
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/jobs/${job.id}/applications`}>
                                View Applicants
                              </a>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>
                            Posted on {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">No jobs posted yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start finding talent by posting a job. It only takes a few minutes to create a job posting.
                  </p>
                  <Button>
                    Post Your First Job
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Applications Tab */}
        <TabsContent value="applied">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Job Applications</CardTitle>
                  <CardDescription>
                    Track the status of jobs you've applied to
                  </CardDescription>
                </div>
                
                <Button variant="outline" asChild>
                  <a href="/job-listings" className="flex items-center gap-1">
                    <FileSearch className="h-4 w-4" />
                    Browse Jobs
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : jobApplications && jobApplications.length > 0 ? (
                <div className="space-y-4">
                  {jobApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold">
                              {application.job?.title || "Job Title"}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>{application.job?.company || "Company"}</span>
                              <span>•</span>
                              <span>{application.job?.location || "Location"}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getStatusBadge(application.status)}
                            
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/jobs/${application.jobId}`}>
                                View Job Details
                              </a>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>
                            Applied on {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HandHelping className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">No applications yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You haven't applied to any jobs yet. Browse available job listings to find opportunities that match your skills.
                  </p>
                  <Button asChild>
                    <a href="/job-listings">
                      Browse Available Jobs <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recommended Tab */}
        <TabsContent value="recommended">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Matched Jobs for You</CardTitle>
                  <CardDescription>
                    Jobs matching your profile based on role, skills, and availability
                  </CardDescription>
                </div>
                
                <Button variant="outline" asChild>
                  <a href="/job-listings" className="flex items-center gap-1">
                    <FileSearch className="h-4 w-4" />
                    View All Jobs
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {matchedJobsLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <div className="flex gap-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : matchedJobs && matchedJobs.length > 0 ? (
                <div className="space-y-4">
                  {matchedJobs.map((job) => (
                    <Card key={job.id} className="border-2 border-primary/20 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{job.title}</h3>
                              <Badge variant="default" className="bg-primary/80">Match</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              {job.salary && (
                                <>
                                  <span>•</span>
                                  <span>{job.salary}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getStatusBadge(job.status)}
                            
                            <Button variant="default" size="sm" asChild>
                              <a href={`/jobs/${job.id}`}>
                                View Details
                              </a>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>
                            Posted on {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">No matches found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Complete your profile with more skills and job roles to get better job matches based on your experience and preferences.
                  </p>
                  <Button asChild>
                    <a href="/profile/edit">
                      Update Your Profile
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}