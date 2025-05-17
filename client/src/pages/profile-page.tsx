import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Briefcase, MapPin, Globe, Calendar, MessageSquare, 
  Settings, LogOut, ChevronRight, AlertCircle, BarChart2, ArrowRight, Clock,
  PlusCircle, CheckCircle2, Edit
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
// Importing components with relative paths to avoid import issues
import ProfileInfo from "../components/profile/ProfileInfo";
import JobDashboard from "../components/profile/JobDashboard";
import MessagesPanel from "../components/profile/MessagesPanel";

// Separate component for job roles section to avoid React hooks issues
function JobRolesSection({ user }: { user: any }) {
  // Always declare all hooks at the top level to prevent React hooks errors
  const { data: jobRoles = [], isLoading: jobRolesLoading } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/user/job-roles"],
    enabled: !!user
  });

  // Always declare this hook, regardless of conditions
  const { data: primaryRole, isLoading: primaryRoleLoading } = useQuery<{id: number, name: string}>({
    queryKey: ["/api/job-roles", user?.jobRoleId],
    enabled: !!user && !!user.jobRoleId
  });
  
  // Now use the hooks data for conditional rendering
  if (jobRolesLoading || primaryRoleLoading) {
    return <span className="text-xs italic text-muted-foreground">Loading role...</span>;
  }
  
  // If we have a primary role and no other roles, show just the primary role
  if (primaryRole && (jobRoles.length === 0 || (user && user.jobRoleId))) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        {primaryRole.name}
      </Badge>
    );
  }
  
  // Show list of roles if available
  return jobRoles.length > 0 ? (
    <div className="flex flex-wrap gap-1.5">
      {jobRoles.slice(0, 3).map(role => (
        <Badge key={role.id} variant="secondary">
          {role.name}
        </Badge>
      ))}
      {jobRoles.length > 3 && (
        <Badge variant="outline">+{jobRoles.length - 3} more</Badge>
      )}
    </div>
  ) : (
    <span className="text-xs italic text-muted-foreground">No roles added</span>
  );
}

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  
  // Fetch unread direct messages count
  const { data: unreadMessagesData } = useQuery<{ count: number }>({
    queryKey: ["/api/direct-messages/unread-count"],
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Get initials for avatar - declare before any return statements
  const getInitials = () => {
    if (!user) return ""; // Guard clause for when user is null
    
    if (user.fullName) {
      return user.fullName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };
  
  // Handle logout - declare before any return statements
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // User not logged in or loading
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Profile Not Available</CardTitle>
            <CardDescription>
              You need to log in to view your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <a href="/auth">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Job interface
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

  // Fetch jobs matching user's profile
  const { data: matchedJobs, isLoading: matchedJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/matches/jobs"],
    enabled: !!user,
  });

  // Calculate profile completion percentage
  const profileCompletionItems = [
    { name: "Full Name", completed: !!user.fullName },
    { name: "Location", completed: !!user.location },
    { name: "Email", completed: !!user.email },
    { name: "Bio", completed: !!user.bio },
    { name: "Job Role", completed: !!user.jobRoleId },
    { name: "Languages", completed: !!user.languages },
    { name: "Time Zone", completed: !!user.timeZone },
    { name: "Skills", completed: false } // We'll update this later when we check skills
  ];
  
  // Fetch user skills to determine completion
  const { data: userSkills = [] } = useQuery<any[]>({
    queryKey: ["/api/user/skills"],
    enabled: !!user
  });
  
  // Update skills completion status
  if (userSkills.length > 0) {
    profileCompletionItems[7].completed = true;
  }
  
  const completedItems = profileCompletionItems.filter(item => item.completed).length;
  const profileCompletionPercentage = Math.round((completedItems / profileCompletionItems.length) * 100);
  const isProfileComplete = profileCompletionPercentage === 100;
  
  return (
    <div className="container py-8">
      {/* Profile header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6 md:items-center mb-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
            <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">
              {user.fullName || user.username}
            </h1>
            
            <div className="flex flex-wrap gap-3 mb-3">
              {/* Job Roles Badge - will show either fetched job roles or the primary job role */}
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="outline" className="flex items-center gap-1 text-primary bg-primary/5">
                  <Briefcase className="h-3 w-3" />
                  Roles
                </Badge>
                
                {/* Job roles section */}
                <JobRolesSection user={user} />
              </div>
              
              {user.location && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </Badge>
              )}
              
              {user.timeZone && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {user.timeZone.replace(/_/g, " ")}
                </Badge>
              )}
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </Badge>
            </div>
            
            {user.bio && (
              <p className="text-muted-foreground max-w-2xl">
                {user.bio}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <a href="/profile/edit">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </a>
            </Button>
            
            <Button variant="ghost" onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        {/* Profile Completion Card */}
        <Card className="mb-6 border-primary/10 profile-completion-card">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <User className="mr-2 h-5 w-5 text-primary" />
                Profile Completion
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/profile/edit" className="flex items-center gap-1.5">
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile
                </a>
              </Button>
            </div>
            <CardDescription>
              {isProfileComplete 
                ? "Your profile is complete. You're ready to be matched with great opportunities!"
                : "Complete your profile to improve your job matches and visibility to employers."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {completedItems} of {profileCompletionItems.length} complete
                </span>
                <span className="text-sm font-medium text-primary">
                  {profileCompletionPercentage}%
                </span>
              </div>
              
              <Progress 
                value={profileCompletionPercentage} 
                className="h-2" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                {profileCompletionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <PlusCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={item.completed ? "text-sm" : "text-sm text-muted-foreground"}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Matched Jobs Section */}
        {matchedJobsLoading ? (
          <div className="mb-6 mt-6 profile-matches-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                <Skeleton className="h-8 w-48" />
              </h2>
              <Skeleton className="h-10 w-28" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-3/4" />
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
          </div>
        ) : matchedJobs && matchedJobs.length > 0 ? (
          <div className="mb-6 mt-6 profile-matches-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center">
                <BarChart2 className="h-6 w-6 mr-2 text-primary" />
                Job Matches for You
              </h2>
              <Button variant="outline" asChild>
                <a href="/job-listings" className="flex items-center">
                  View All Jobs <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedJobs.slice(0, 4).map((job) => (
                <Card key={job.id} className="border-2 border-primary/20 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge variant="default" className="bg-primary/80">Match</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span>{job.company}</span>
                        <span className="mx-1">•</span>
                        <span>{job.location}</span>
                        {job.salary && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{job.salary}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Button variant="default" size="sm" asChild>
                          <a href={`/jobs/${job.id}`}>
                            View Details
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {matchedJobs.length > 4 && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" asChild>
                  <a href="/job-listings?tab=recommended">
                    View {matchedJobs.length - 4} More Matches
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : null}
        
        <Separator />
      </div>
      
      {/* Main content tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden md:inline">Job Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2 relative">
            <div className="relative">
              <MessageSquare className="h-4 w-4" />
              {(unreadMessagesData?.count || 0) > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <span className="hidden md:inline">Messages</span>
            {unreadMessagesData?.count ? (
              <Badge variant="destructive" className="ml-1 text-xs h-4 px-1 hidden md:flex">
                {unreadMessagesData?.count}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <ProfileInfo user={user} />
        </TabsContent>
        
        <TabsContent value="jobs">
          <JobDashboard user={user} />
        </TabsContent>
        
        <TabsContent value="messages">
          <MessagesPanel user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}