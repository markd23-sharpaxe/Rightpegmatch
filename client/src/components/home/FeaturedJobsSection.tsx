import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { Job } from "@shared/schema";
import JobCard from "@/components/job/JobCard";
import { useAuth } from "@/hooks/use-auth";

export default function FeaturedJobsSection() {
  const { user } = useAuth();
  
  // For logged-in users, use the matching jobs API
  const { data: matchingJobs, isLoading: matchingLoading } = useQuery<Job[]>({
    queryKey: ["/api/matches/jobs"],
    enabled: !!user,
  });
  
  // For non-logged-in users or as fallback, get all jobs
  const { data: allJobs, isLoading: allJobsLoading, error } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });
  
  const isLoading = user ? matchingLoading : allJobsLoading;
  const jobs = user ? matchingJobs : allJobs;
  const featuredJobs = jobs?.slice(0, 3) || [];
  
  return (
    <section className="py-12 bg-neutral-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-inter font-semibold text-2xl">
              {user ? 'Jobs Matched For You' : 'Featured Remote Jobs'}
            </h2>
            {user && (
              <p className="text-sm text-neutral-600 mt-1 flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-amber-500" />
                Personalized based on your role, availability, and skills
              </p>
            )}
          </div>
          <Link 
            href={user ? "/matches/jobs" : "/jobs"} 
            className="text-primary hover:text-primary-dark font-medium flex items-center"
          >
            {user ? 'See all matches' : 'View all jobs'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
