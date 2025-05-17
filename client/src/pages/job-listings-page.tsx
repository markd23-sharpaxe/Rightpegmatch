import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Job } from "@shared/schema";
import { 
  User, 
  Clock, 
  Briefcase, 
  Loader2, 
  X, 
  ArrowUpDown, 
  Globe, 
  CheckCircle2,
  Award,
  BarChart2,
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import JobCard from "@/components/job/JobCard";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function JobListingsPage() {
  // URL parsing and navigation
  const [, navigate] = useLocation();
  
  // Get auth context
  const { user, isLoading: authLoading } = useAuth();
  
  // Get toast
  const { toast } = useToast();
  
  // State for sort options
  const [sortBy, setSortBy] = useState("relevant");
  
  // Define interface for the new response format
  interface JobMatchesResponse {
    matches: Job[];
    matchCount: number;
    executionTimeMs: number;
    fromCache: boolean;
  }
  
  // Fetch matching jobs based on user profile with new response format
  const { data: matchResponse, isLoading, error } = useQuery<JobMatchesResponse>({
    queryKey: ["/api/matches/jobs"],
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Mutation for refreshing matches
  const { mutate: refreshMatches, isPending: isRefreshing } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/matches/refresh', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh matches');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ["/api/matches/jobs"] });
      
      // Show success toast
      toast({
        title: "Matches Refreshed",
        description: "Your job matches have been updated with the latest results",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Could not refresh matches",
        variant: "destructive",
      });
    }
  });
  
  // Filter out jobs created by the current user
  const jobs = matchResponse?.matches?.filter(job => job.employerId !== user?.id) || [];
  
  // Sort jobs based on the selected sorting option
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else { // relevant (default)
      const scoreA = a.matchScore?.overallScore || 0;
      const scoreB = b.matchScore?.overallScore || 0;
      return scoreB - scoreA;
    }
  });
  
  // If user is not logged in, redirect to auth page
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-primary/90 to-primary py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Your Matched Remote Jobs</h1>
            <p className="text-white/80 mb-6 max-w-2xl text-lg">
              Personalized job opportunities based on your skills, job role, and time zone availability
            </p>
            <div className="flex items-center gap-3 text-white/90 mb-2">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Award className="h-4 w-4 text-amber-200" />
                <span className="text-sm font-medium">Job Role Match</span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <Clock className="h-4 w-4 text-amber-200" />
                <span className="text-sm font-medium">Availability Match</span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-amber-200" />
                <span className="text-sm font-medium">Skills Match</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col gap-8">
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Your Job Matches
                  </CardTitle>
                  <CardDescription>
                    Jobs tailored to your profile based on our matching algorithm
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>Sort:</span>
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] border-gray-200 h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevant">Best Match</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-xl font-medium text-gray-800">Finding Your Job Matches</h3>
                  <p className="text-gray-500 mt-2">
                    Analyzing your profile to find the perfect opportunities...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-red-100 p-4 mb-4">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Failed to Load Jobs</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    There was an error loading your job matches. Please try again or check your connection.
                  </p>
                  <Button 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/matches/jobs"] });
                    }}
                    className="bg-primary hover:bg-primary/90 transition-colors"
                  >
                    Retry
                  </Button>
                </div>
              ) : sortedJobs.length > 0 ? (
                <div>
                  {/* Performance metrics */}
                  {matchResponse && (
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>Loaded in {matchResponse.executionTimeMs}ms</span>
                      </div>
                      {matchResponse.fromCache ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>From cache</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Award className="h-4 w-4" />
                          <span>Fresh AI results</span>
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="ml-auto"
                        disabled={isRefreshing}
                        onClick={() => refreshMatches()}
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Matches
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6">
                    {sortedJobs.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 mb-2">No Job Matches Found</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    We couldn't find any jobs matching your profile. Try updating your skills, job roles or availability settings to see more opportunities.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => refreshMatches()}
                      variant="outline"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Matches
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={() => navigate("/profile/edit")}
                      className="bg-primary hover:bg-primary/90 transition-colors"
                    >
                      Update Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Job Matching Tips */}
          <Card className="border-0 shadow-sm bg-primary/5">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Job Matching Tips</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-start gap-2">
                      <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Job role is the most important matching factor - make sure your profile accurately reflects your primary role</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Time zone availability is crucial for matching - adjust your profile's availability to align with job requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Globe className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Remote work requires excellent communication skills - highlight these in applications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>For best results, update your skills and job role in your profile to improve matches</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}