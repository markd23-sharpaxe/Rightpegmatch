import { Link } from "wouter";
import { 
  Clock, 
  Globe, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  CheckCircle2, 
  MapPin, 
  ChevronRight,
  Star,
  AlertCircle
} from "lucide-react";
import { Job, Skill, JobRole, JobMatchScore } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  
  // Get all skills to display required skills
  const { data: allSkills } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Get job role data
  const { data: jobRoles } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Get current job role
  const jobRole = jobRoles?.find(role => role.id === job.jobRoleId);
  
  // Get user skills for display purposes
  const { data: userSkills = [] } = useQuery<any[]>({
    queryKey: ["/api/user/skills"],
    enabled: !!user,
  });
  
  // Get match scores from the API or calculate them locally
  const matchScore = useMemo(() => {
    // If we have server-calculated match score, use it
    if (job.matchScore) {
      return {
        overallScore: Math.round(job.matchScore.overallScore),
        roleScore: job.matchScore.roleScore,
        roleMatch: job.matchScore.roleScore > 0,
        availabilityScore: job.matchScore.availabilityScore,
        hasAvailabilityMatch: job.matchScore.availabilityScore > 0,
        skillsScore: job.matchScore.skillsScore,
        skillMatchPercent: job.matchScore.skillsMatchPercentage,
      };
    }
    
    // If we don't have pre-calculated match scores, display nothing
    return {
      overallScore: 0,
      roleScore: 0,
      roleMatch: false,
      availabilityScore: 0,
      hasAvailabilityMatch: false,
      skillsScore: 0,
      skillMatchPercent: 0,
    };
  }, [job.matchScore]);
  
  // Filter skills that are required for this job
  const jobSkills = allSkills?.filter(skill => 
    job.requiredSkills && job.requiredSkills.includes(skill.id)
  ) || [];
  
  // Format job type for display
  const jobTypeDisplay = job.jobType === "full-time" ? "Full-time" : 
                        job.jobType === "part-time" ? "Part-time" : 
                        job.jobType === "contract" ? "Contract" : job.jobType;
  
  // Format hours per week
  const hoursDisplay = job.hoursPerWeek ? 
    `${job.hoursPerWeek} hrs/week` : 
    (job.minHoursPerWeek && job.maxHoursPerWeek) ? 
    `${job.minHoursPerWeek}-${job.maxHoursPerWeek} hrs/week` : 
    "Flexible hours";
  
  // Calculate days since posting
  const daysSincePosted = Math.ceil((new Date().getTime() - new Date(job.createdAt).getTime()) / (1000 * 3600 * 24));
  const timeAgo = daysSincePosted === 0 ? "Today" : 
                 daysSincePosted === 1 ? "Yesterday" : 
                 `${daysSincePosted} days ago`;
  
  // Determine match score color
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-gray-400";
  };
  
  // Format number for display with + sign if positive
  const formatNumber = (num: number) => num > 0 ? `+${num}` : num;
  
  return (
    <div className="bg-white rounded-lg border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
      {/* New tag if posted today */}
      {daysSincePosted === 0 && (
        <div className="absolute top-0 right-0">
          <div className="bg-primary text-white text-xs font-bold px-3 py-1 uppercase tracking-wider">
            New
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-5">
          <div>
            <h3 className="font-semibold text-xl mb-2 text-gray-900 group-hover:text-primary transition-colors duration-200">
              <Link href={`/jobs/${job.id}`} className="hover:underline">
                {job.title}
              </Link>
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600">
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1.5 text-primary/70" />
                <span>{job.companyName}</span>
              </div>
              {job.location && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1.5 text-primary/70" />
                  <span>{job.location}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 text-sm">
              {jobTypeDisplay}
            </Badge>
            {jobRole && (
              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 text-sm">
                {jobRole.name}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Match Score Section - Only visible when logged in */}
        {user && job.matchScore && job.matchScore.overallScore > 0 && (
          <div className="mb-6 border rounded-lg border-gray-200 p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-medium text-gray-900">Match Score</h4>
                
                {/* Indicate whether we're using the fallback algorithm or AI */}
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
              <Badge 
                className={`text-white px-2.5 py-0.5 ${getMatchScoreColor(matchScore.overallScore)}`}
              >
                {matchScore.overallScore >= 80 ? "Excellent" :
                  matchScore.overallScore >= 60 ? "Good" :
                  matchScore.overallScore >= 40 ? "Fair" : "Basic"} Match
              </Badge>
            </div>
            
            <div className="space-y-3">
              {/* Job title compatibility - Primary factor */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600 font-semibold">Role Compatibility</span>
                  <span className="text-xs font-medium">
                    {matchScore.roleScore >= 70 ? "Strong match" : 
                     matchScore.roleScore >= 40 ? "Good match" : 
                     matchScore.roleScore > 0 ? "Partial match" : "Limited match"}
                  </span>
                </div>
                <Progress value={matchScore.roleScore} className="h-2 bg-gray-200" 
                  indicatorColor={
                    matchScore.roleScore >= 70 ? "bg-green-500" : 
                    matchScore.roleScore >= 40 ? "bg-amber-500" : 
                    matchScore.roleScore > 0 ? "bg-amber-400" : "bg-gray-400"
                  } />
              </div>
              
              {/* Availability match with percentage tiers */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Availability Match</span>
                  <span className="text-xs font-medium">
                    {matchScore.availabilityScore >= 70 ? "Strong match (80-100%)" : 
                     matchScore.availabilityScore >= 50 ? "Good match (60-80%)" : 
                     matchScore.availabilityScore > 0 ? "Partial match (50-60%)" : "Limited match (<50%)"}
                  </span>
                </div>
                <Progress value={matchScore.availabilityScore} className="h-1.5 bg-gray-200" 
                  indicatorColor={
                    matchScore.availabilityScore >= 70 ? "bg-green-500" : 
                    matchScore.availabilityScore >= 50 ? "bg-amber-500" : 
                    matchScore.availabilityScore > 0 ? "bg-amber-400" : "bg-gray-400"
                  } />
              </div>
              
              {/* Salary within 25% range */}
              {job.matchScore.matchDetails?.aiCompensationMatch !== undefined && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Salary Compatibility</span>
                    <span className="text-xs font-medium">
                      {job.matchScore.matchDetails.aiCompensationMatch >= 75 ? "Perfect match" :
                       job.matchScore.matchDetails.aiCompensationMatch >= 50 ? "Within expected range" :
                       job.matchScore.matchDetails.aiCompensationMatch > 0 ? "Partially matches" : "Outside range"}
                    </span>
                  </div>
                  <Progress 
                    value={job.matchScore.matchDetails.aiCompensationMatch} 
                    className="h-1.5 bg-gray-200"
                    indicatorColor={
                      job.matchScore.matchDetails.aiCompensationMatch >= 75 ? "bg-green-500" : 
                      job.matchScore.matchDetails.aiCompensationMatch >= 50 ? "bg-amber-500" : 
                      "bg-gray-400"
                    } 
                  />
                </div>
              )}
              
              {/* Skills assessment */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Skills Match</span>
                  <span className="text-xs font-medium">
                    {matchScore.skillMatchPercent >= 70 ? "Strong match" : 
                     matchScore.skillMatchPercent >= 40 ? "Good match" : 
                     matchScore.skillMatchPercent >= 20 ? "Partial match" : "Limited match"}
                  </span>
                </div>
                <Progress value={matchScore.skillMatchPercent} className="h-1.5 bg-gray-200"
                  indicatorColor={
                    matchScore.skillMatchPercent >= 70 ? "bg-green-500" : 
                    matchScore.skillMatchPercent >= 40 ? "bg-amber-500" : 
                    matchScore.skillMatchPercent >= 20 ? "bg-amber-400" : "bg-gray-400"
                  } />
              </div>
            </div>
          </div>
        )}
        
        {/* Job Description Section */}
        {job.description && (
          <div className="mb-5">
            <p className="text-gray-700 text-sm">
              {job.description.length > 150 
                ? `${job.description.substring(0, 150).trim()}...` 
                : job.description}
            </p>
          </div>
        )}
        
        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {jobSkills.slice(0, 5).map(skill => (
              <Badge 
                key={skill.id} 
                variant="secondary" 
                className="rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 font-normal"
              >
                {skill.name}
              </Badge>
            ))}
            {jobSkills.length > 5 && (
              <Badge 
                variant="secondary" 
                className="rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 font-normal"
              >
                +{jobSkills.length - 5} more
              </Badge>
            )}
          </div>
        </div>
        
        {/* Job metadata has been intentionally removed as it's now part of the match score display */}
        
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-center pt-3 border-t border-gray-100">
          <div className="w-full sm:w-auto text-center sm:text-left">
            <span className="text-sm text-gray-500 flex items-center justify-center sm:justify-start">
              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
              Posted {timeAgo}
            </span>
          </div>
          <Button 
            asChild
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 transition-colors"
          >
            <Link href={`/jobs/${job.id}`}>
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
