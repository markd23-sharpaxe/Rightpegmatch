import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Job, JobMatchScore, Skill } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import useEmblaCarousel from "embla-carousel-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Briefcase, Building, Clock, DollarSign, Globe, MapPin, ThumbsDown, ThumbsUp, ArrowLeft, ArrowRight } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function JobRecommendationCarousel() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedJobs, setLikedJobs] = useState<number[]>([]);
  const [dislikedJobs, setDislikedJobs] = useState<number[]>([]);
  
  // Use Embla carousel directly - moved to top level to ensure hooks are always called
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false
  });
  
  // Custom carousel navigation functions
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Define a type for jobs with skills
  type JobWithSkills = Job & {
    skills?: Array<Skill>;
  };

  // Fetch matching jobs for the current user
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery<{matches: JobWithSkills[]}>({
    queryKey: ["/api/matches/jobs"],
    queryFn: getQueryFn({ on401: "throw" }), 
    enabled: !!user,
  });
  
  // Safely extract the matches array, ensuring it's an array even if data is undefined
  const recommendedJobs = data?.matches || [];

  // Filter out liked and disliked jobs
  const pendingJobs = recommendedJobs.filter(
    job => !likedJobs.includes(job.id) && !dislikedJobs.includes(job.id)
  );

  // Handle like job action
  const handleLikeJob = (jobId: number) => {
    setLikedJobs([...likedJobs, jobId]);
    // Here you could add an API call to save the preference
    if (currentIndex < pendingJobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle dislike job action
  const handleDislikeJob = (jobId: number) => {
    setDislikedJobs([...dislikedJobs, jobId]);
    // Here you could add an API call to save the preference
    if (currentIndex < pendingJobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Format salary range for display
  const formatSalary = (hourlyRate: string | null) => {
    if (!hourlyRate) return "Negotiable";
    
    return `$${hourlyRate}/hr`;
  };

  // When the API is ready, sync the current index
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    
    // Set initial index when API is available
    emblaApi.scrollTo(currentIndex);
    
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, currentIndex]);

  // Update scroll buttons state
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  // If user is not logged in, show a prompt to log in
  if (!user) {
    return (
      <div className="rounded-lg bg-white shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">Get Personalized Job Recommendations</h3>
        <p className="text-gray-600 mb-6">
          Log in to see personalized job recommendations based on your skills, 
          experience, and availability.
        </p>
        <Link href="/auth">
          <Button>Sign In to View Recommendations</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <p className="text-gray-600">Finding your perfect matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-white shadow-md p-8 text-center text-red-600">
        <p>Error loading recommendations. Please try again later.</p>
      </div>
    );
  }

  if (pendingJobs.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow-md p-8 text-center">
        <h3 className="text-xl font-semibold mb-4">No More Recommendations</h3>
        <p className="text-gray-600 mb-6">
          We've run out of job recommendations for you. Check back soon or update your profile 
          to get more personalized matches.
        </p>
        <Link href="/profile">
          <Button>Update Your Profile</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-md mx-auto">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {pendingJobs.map((job, index) => (
              <div 
                key={job.id} 
                className="min-w-0 shrink-0 grow-0 basis-full pl-4 first:pl-0"
                role="group"
                aria-roledescription="slide"
              >
                <Card className="shadow-lg border-none overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold">{job.title}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Building className="h-4 w-4 mr-1" />
                          {job.companyName}
                        </CardDescription>
                      </div>
                      {job.matchScore && (
                        <div className="w-14 h-14">
                          <CircularProgressbar
                            value={job.matchScore.overallScore}
                            text={`${job.matchScore.overallScore}%`}
                            styles={buildStyles({
                              textSize: '28px',
                              pathColor: `rgba(62, 152, 199, ${job.matchScore.overallScore / 100})`,
                              textColor: '#333',
                              trailColor: '#d6d6d6',
                            })}
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Location</p>
                          <p className="text-gray-600">{job.location || "Remote"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Hours</p>
                          <p className="text-gray-600">{job.hoursPerWeek || "Flexible"} hrs/week</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Rate</p>
                          <p className="text-gray-600">{formatSalary(job.hourlyRate)}</p>
                        </div>
                      </div>
                      
                      {job.skills && job.skills.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-1.5">Required Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.skills.slice(0, 4).map((skill: any, i: number) => (
                              <Badge key={i} variant="outline" className="bg-gray-100">
                                {skill.name}
                              </Badge>
                            ))}
                            {job.skills.length > 4 && (
                              <Badge variant="outline" className="bg-gray-100">
                                +{job.skills.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2 p-4 pt-0">
                    <Button 
                      onClick={() => handleDislikeJob(job.id)} 
                      variant="outline" 
                      className="flex-1 text-gray-600 hover:bg-red-50 hover:text-red-600 border-gray-200"
                    >
                      <ThumbsDown className="mr-2 h-5 w-5" /> Skip
                    </Button>
                    <Link href={`/jobs/${job.id}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        <Briefcase className="mr-2 h-5 w-5" /> View
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleLikeJob(job.id)} 
                      variant="outline" 
                      className="flex-1 text-gray-600 hover:bg-green-50 hover:text-green-600 border-gray-200"
                    >
                      <ThumbsUp className="mr-2 h-5 w-5" /> Save
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="icon"
            className="relative left-0 translate-x-0 h-8 w-8 rounded-full"
            disabled={!canScrollPrev}
            onClick={scrollPrev}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Previous slide</span>
          </Button>
          <div className="text-sm text-muted-foreground">
            {pendingJobs.length > 0 && 
              `${currentIndex + 1} of ${pendingJobs.length}`
            }
          </div>
          <Button
            variant="outline"
            size="icon"
            className="relative right-0 translate-x-0 h-8 w-8 rounded-full"
            disabled={!canScrollNext}
            onClick={scrollNext}
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Next slide</span>
          </Button>
        </div>
      </div>
    </div>
  );
}