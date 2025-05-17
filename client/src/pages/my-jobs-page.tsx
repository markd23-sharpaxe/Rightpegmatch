import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Job } from "@shared/schema";
import { Link } from "wouter";
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
  Building, 
  Calendar, 
  Clock, 
  Loader2, 
  MapPin, 
  Users,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type JobWithApplicationCount = Job & { applicationCount: number };

export default function MyJobsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch my jobs
  const { data: myJobs, isLoading: jobsLoading } = useQuery<JobWithApplicationCount[]>({
    queryKey: ["/api/my-jobs"],
    enabled: !!user, // Only run this query if user is logged in
  });

  if (jobsLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Check if the user has any jobs
  const hasJobs = myJobs && myJobs.length > 0;

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#5BBFBA]">My Job Listings</h1>
            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>

          <div className="flex justify-between items-center mb-6">
            <p className="text-neutral-600">
              {hasJobs 
                ? `You have ${myJobs?.length} active job ${myJobs?.length === 1 ? 'listing' : 'listings'}`
                : 'You have no active job listings'}
            </p>
            <Link href="/find-talent">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Post a New Job
              </Button>
            </Link>
          </div>

          {hasJobs ? (
            <div className="grid grid-cols-1 gap-6">
              {myJobs?.map((job) => (
                <Card key={job.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-primary">{job.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Building className="h-4 w-4 mr-1" />
                          {job.companyName}
                          <span className="mx-2">•</span>
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </CardDescription>
                      </div>
                      <div>
                        <Badge 
                          variant={job.applicationCount > 0 ? "default" : "secondary"}
                          className="flex items-center gap-1 text-sm"
                        >
                          <Users className="h-3 w-3" />
                          {job.applicationCount} {job.applicationCount === 1 ? 'Application' : 'Applications'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 text-neutral-500 mr-2" />
                        <span className="text-neutral-600">
                          <span className="font-medium">Type:</span> {job.jobType}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-neutral-500 mr-2" />
                        <span className="text-neutral-600">
                          <span className="font-medium">Hours:</span> {job.hoursPerWeek} hrs/week
                        </span>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="line-clamp-2 text-neutral-600 mb-4">
                      {job.description}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center text-neutral-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        Posted on {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                      <Link href={`/jobs/${job.id}/applications`}>
                        <Button size="sm">View Applications</Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 p-8">
              <div className="text-center">
                <Briefcase className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Job Listings Yet</h2>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  You haven't posted any jobs yet. Create your first job listing to find talented remote workers globally.
                </p>
                <Link href="/find-talent">
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}