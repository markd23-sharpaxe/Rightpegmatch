import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, ArrowRight, Globe2, Clock, Users2 } from "lucide-react";
import { Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnonymousJobsSection() {
  // Get all jobs for anonymous users
  const { data: allJobs, isLoading, error } = useQuery<Job[]>({
    queryKey: ["/api/jobs/anonymous"],
  });
  
  const featuredJobs = allJobs?.slice(0, 3) || [];
  
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Explore Remote Opportunities Worldwide</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse through a selection of remote jobs available around the globe. 
            Create an account to unlock personalized job matching based on your skills and availability.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            Failed to load jobs. Please try again later.
          </div>
        ) : featuredJobs.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No jobs available at the moment. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {featuredJobs.map((job) => (
              <Card key={job.id} className="border shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold">{job.title}</CardTitle>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {job.jobType}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center mt-1">
                    {job.companyName || "Company Name Hidden"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <Globe2 className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{job.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{job.jobType}</span>
                    </div>
                    <div className="flex items-center">
                      <Users2 className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Role skills hidden</span>
                    </div>
                  </div>
                  <div className="mt-4 line-clamp-2 text-sm text-gray-600">
                    {job.description}
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Link href="/auth">
                    <Button variant="default" size="sm">
                      Sign in to apply
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-primary">
                    See role details
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-center">
          <Link href="/auth">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5">
              Sign Up to View All Remote Jobs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}