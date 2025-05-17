import * as React from "react";
import { User as UserType } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, Briefcase, Code, Languages, Award, 
  Linkedin, Calendar, Globe, X, PlusCircle, ChevronDown, ChevronUp, Edit
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TimeZoneVisualizer from "./TimeZoneVisualizer";
import WorldMapTimeZoneVisualizer from "./WorldMapTimeZoneVisualizer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileInfoProps {
  user: UserType;
}

interface Skill {
  id: number;
  name: string;
  category: string | null;
}

interface Qualification {
  id: number;
  name: string;
  category?: string | null;
}

interface AvailabilitySlot {
  id: number;
  userId: number;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  timeZone: string;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAvailabilityVisualizer, setShowAvailabilityVisualizer] = React.useState(true);
  
  // Fetch user skills
  const { data: skills, isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/user/skills"],
    enabled: !!user,
  });
  
  // Fetch user qualifications
  const { data: qualifications = [], isLoading: qualificationsLoading } = useQuery<Qualification[]>({
    queryKey: ["/api/user/qualifications"],
    enabled: !!user,
  });
  
  // Fetch user availability slots
  const { data: availabilitySlots = [], isLoading: availabilityLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["/api/profile/availability"],
    enabled: !!user && !!user.timeZone,
  });
  
  // Process the availability slots to extract unique days and hours
  const availabilityData = React.useMemo(() => {
    if (!availabilitySlots.length) return { days: [], startHour: 9, endHour: 17 };
    
    // Extract all days
    const days = [...new Set(availabilitySlots.map(slot => slot.dayOfWeek))];
    
    // Get the common start and end hour (in case they vary by day)
    const startHours = availabilitySlots.map(slot => slot.startHour);
    const endHours = availabilitySlots.map(slot => slot.endHour);
    
    return {
      days,
      startHour: Math.min(...startHours),
      endHour: Math.max(...endHours),
    };
  }, [availabilitySlots]);
  
  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest("DELETE", `/api/profile/skills/${skillId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills"] });
      toast({
        title: "Skill removed",
        description: "Skill has been removed from your profile",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle skill removal
  const handleRemoveSkill = (skillId: number, skillName: string) => {
    if (confirm(`Are you sure you want to remove the "${skillName}" skill from your profile?`)) {
      removeSkillMutation.mutate(skillId);
    }
  };
  
  // Remove qualification mutation
  const removeQualificationMutation = useMutation({
    mutationFn: async (qualificationId: number) => {
      const response = await apiRequest("DELETE", `/api/user/qualifications/${qualificationId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/qualifications"] });
      toast({
        title: "Qualification removed",
        description: "Qualification has been removed from your profile",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove qualification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle qualification removal
  const handleRemoveQualification = (qualificationId: number, qualificationName: string) => {
    if (confirm(`Are you sure you want to remove the "${qualificationName}" qualification from your profile?`)) {
      removeQualificationMutation.mutate(qualificationId);
    }
  };
  
  // Define job role type
  interface JobRole {
    id: number;
    name: string;
    category: string | null;
  }
  
  // Fetch all job roles for reference
  const { data: allJobRoles, isLoading: allJobRolesLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Define UserJobRole interface
  interface UserJobRole {
    userId: number;
    jobRoleId: number;
    isPrimary: boolean;
  }

  // Fetch user job roles from the many-to-many table
  const { data: userJobRolesData, isLoading: jobRolesLoading } = useQuery<UserJobRole[]>({
    queryKey: ["/api/user/job-roles"],
    enabled: !!user,
  });
  
  // Define extended UserJobRole with role details
  interface UserJobRoleWithDetails extends UserJobRole {
    role?: JobRole;
  }
  
  // Process the user job roles to include full role details
  const userJobRoles = React.useMemo<UserJobRoleWithDetails[]>(() => {
    if (!userJobRolesData || !allJobRoles) return [];
    
    return userJobRolesData.map((userRole: UserJobRole) => {
      const roleDetails = allJobRoles.find(r => r.id === userRole.jobRoleId);
      return {
        ...userRole,
        role: roleDetails
      };
    });
  }, [userJobRolesData, allJobRoles]);
  
  // Fetch the job role directly if user has the legacy jobRoleId set
  const { data: directJobRole, isLoading: directJobRoleLoading } = useQuery<JobRole>({
    queryKey: ["/api/job-roles", user.jobRoleId],
    enabled: !!user && !!user.jobRoleId,
  });
  
  // Find primary job role - either from user job roles or direct
  const primaryJobRole = React.useMemo<JobRole | undefined>(() => {
    if (userJobRoles && userJobRoles.length > 0) {
      // First try to find role with isPrimary flag
      const primaryFromFlag = userJobRoles.find((role: UserJobRoleWithDetails) => role.isPrimary);
      if (primaryFromFlag?.role) return primaryFromFlag.role;
      
      // Then try to match with user.jobRoleId
      const primaryFromId = userJobRoles.find((role: UserJobRoleWithDetails) => role.jobRoleId === user.jobRoleId);
      if (primaryFromId?.role) return primaryFromId.role;
    }
    
    // Fallback to direct job role
    return directJobRole;
  }, [userJobRoles, directJobRole, user.jobRoleId]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Job Roles Information */}
      <Card className="profile-job-roles-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Job Roles
          </CardTitle>
          <CardDescription>
            Your professional roles and specializations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Primary role display */}
          {primaryJobRole && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{primaryJobRole.name}</h3>
                <Badge variant="default" className="bg-primary/80">Primary</Badge>
              </div>
              {primaryJobRole.category && (
                <Badge variant="outline" className="mb-2">
                  {primaryJobRole.category}
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                Your primary role is weighted more heavily in job matching
              </p>
            </div>
          )}
          
          {/* Secondary roles display */}
          {userJobRoles && userJobRoles.length > 0 ? (
            <div className="space-y-3">
              {userJobRoles.length > 1 && (
                <>
                  <Separator className="my-3" />
                  <h4 className="text-sm font-medium">Additional Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {userJobRoles
                      .filter((userRole: UserJobRoleWithDetails) => 
                        // Filter out primary role
                        !userRole.isPrimary && 
                        userRole.jobRoleId !== user.jobRoleId && 
                        userRole.role !== undefined
                      )
                      .map((userRole: UserJobRoleWithDetails) => (
                        <Badge 
                          key={userRole.jobRoleId} 
                          variant="secondary"
                          className="py-1"
                        >
                          {userRole.role?.name}
                        </Badge>
                      ))
                    }
                  </div>
                </>
              )}
              
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">
                  Adding multiple roles increases your visibility across different job types
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.location.href = '/profile/edit'}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Manage Roles
                </Button>
              </div>
            </div>
          ) : !primaryJobRole ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                {jobRolesLoading ? "Loading roles..." : "No job roles selected yet"}
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/profile/edit'}
              >
                Add Roles
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      {/* Skills Information */}
      <Card className="profile-skills-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Skills & Expertise
          </CardTitle>
          <CardDescription>
            Your professional skills and areas of expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skills && skills.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <Badge 
                    key={skill.id} 
                    variant="secondary"
                    className="group flex items-center gap-1 pr-2"
                  >
                    {skill.name}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            onClick={() => handleRemoveSkill(skill.id, skill.name)}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${skill.name} skill`}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove this skill</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Skills help us match you with suitable job opportunities
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => window.location.href = '/profile/edit'}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Skills
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                {skillsLoading ? "Loading skills..." : "No skills added yet"}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={() => window.location.href = '/profile/edit'}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add Skills
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Languages & Certifications */}
      <Card className="profile-languages-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Languages & Certifications
          </CardTitle>
          <CardDescription>
            Languages spoken and professional certifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Languages */}
            <div>
              <h4 className="text-sm font-medium mb-2">Languages</h4>
              {user.languages ? (
                <div className="flex flex-wrap gap-2">
                  {user.languages.split(",").map((lang, index) => (
                    <Badge key={index} variant="outline">
                      {lang.trim()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No languages added yet
                </p>
              )}
            </div>
            
            {/* Qualifications */}
            <div>
              <h4 className="text-sm font-medium mb-2">Qualifications</h4>
              {qualifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {qualifications.map(qualification => (
                    <Badge 
                      key={qualification.id} 
                      variant="outline"
                      className="group flex items-center gap-1 pr-2"
                    >
                      {qualification.name}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={() => handleRemoveQualification(qualification.id, qualification.name)}
                              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Remove ${qualification.name} qualification`}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove this qualification</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {qualificationsLoading ? "Loading qualifications..." : "No qualifications added yet"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Availability & Time Zone */}
      <Card className="profile-availability-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Availability
          </CardTitle>
          <CardDescription>
            Your working hours and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.timeZone ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {user.timeZone.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  (GMT {new Date().toLocaleString("en-US", { timeZone: user.timeZone, timeZoneName: "short" }).split(" ").pop()})
                </span>
              </div>
              
              {/* Availability slots visualization */}
              {availabilitySlots && availabilitySlots.length > 0 ? (
                <Collapsible 
                  open={showAvailabilityVisualizer} 
                  onOpenChange={setShowAvailabilityVisualizer}
                  className="bg-accent/10 rounded-lg p-4 border mt-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Availability Visualization
                    </h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {showAvailabilityVisualizer ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="mt-4">
                    <Tabs defaultValue="calendar" className="w-full">
                      <TabsList className="mb-4 grid grid-cols-2">
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Calendar View</span>
                        </TabsTrigger>
                        <TabsTrigger value="world-map" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>World Map</span>
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="calendar">
                        <TimeZoneVisualizer className="profile-timezone-visualizer"
                          selectedDays={availabilityData.days}
                          startHour={availabilityData.startHour}
                          endHour={availabilityData.endHour}
                          timeZone={user.timeZone}
                        />
                      </TabsContent>
                      <TabsContent value="world-map">
                        <WorldMapTimeZoneVisualizer
                          selectedDays={availabilityData.days}
                          startHour={availabilityData.startHour}
                          endHour={availabilityData.endHour}
                          timeZone={user.timeZone}
                        />
                      </TabsContent>
                    </Tabs>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {availabilityLoading ? "Loading availability data..." : "No specific availability slots configured"}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Your availability schedule helps employers find candidates in compatible time zones.
                </p>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/profile/edit'}
                  className="sm:flex-shrink-0"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit Availability
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                No availability information set
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/profile/edit'}
              >
                Set Availability
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* LinkedIn & Social */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-primary" />
            Professional Links
          </CardTitle>
          <CardDescription>
            Your professional profiles and links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user.linkedInProfile ? (
            <div className="space-y-3">
              <div className="flex items-center">
                <Linkedin className="h-5 w-5 text-[#0077b5] mr-2" />
                <a 
                  href={user.linkedInProfile} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  LinkedIn Profile
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Your LinkedIn profile helps verify your professional credentials
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                No professional links added
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/profile/edit'}
              >
                Add LinkedIn Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Education & Experience - Placeholder for future implementation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Education & Experience
          </CardTitle>
          <CardDescription>
            Your educational background and work experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You haven't added any education or experience details yet
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/profile/edit'}
            >
              Add Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}