import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

// Define types for our data
interface JobRole {
  id: number;
  name: string;
  category?: string;
}

interface Skill {
  id: number;
  name: string;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  timeZone: string;
}

// Helper function to convert day number to day name
function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber] || 'Unknown';
}

export default function TestJobForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch job roles and skills with proper typing
  const { data: jobRoles, isLoading: isLoadingRoles } = useQuery<JobRole[]>({
    queryKey: ['/api/job-roles'],
  });
  
  const { data: skills, isLoading: isLoadingSkills } = useQuery<Skill[]>({
    queryKey: ['/api/skills'],
  });
  
  // Default new availability slot for adding to the form
  const [newSlot, setNewSlot] = useState<AvailabilitySlot>({
    dayOfWeek: 1,
    startHour: 9,
    endHour: 17,
    timeZone: 'UTC'
  });
  
  const [formData, setFormData] = useState({
    companyName: 'Test Company',
    title: 'Test Job',
    jobRoleId: 1, // Default to Software Engineer
    requiredSkills: [1, 2, 3] as number[], // Some default skills
    description: 'This is a test job description for remote work. We are looking for skilled professionals to join our team.',
    hoursPerWeek: 40,
    hourlyRate: '25.00',
    currency: 'USD',
    requiredLanguages: 'English',
    jobType: 'full-time',
    location: 'Remote',
    requiredAvailability: [
      {
        dayOfWeek: 1,
        startHour: 9,
        endHour: 17,
        timeZone: 'UTC'
      }
    ] as AvailabilitySlot[]
  });

  // Update job role if initial selection changes
  useEffect(() => {
    if (jobRoles && jobRoles.length > 0) {
      const jobRole = jobRoles.find(role => role.id === formData.jobRoleId);
      if (jobRole) {
        setFormData(prev => ({
          ...prev,
          title: jobRole.name
        }));
      }
    }
  }, [jobRoles]);

  const createJobMutation = useMutation({
    mutationFn: async () => {
      console.log('Submitting test job with data:', JSON.stringify(formData, null, 2));
      
      try {
        // Log the data we're about to send
        console.log('Required fields check:');
        console.log('- companyName:', !!formData.companyName);
        console.log('- title:', !!formData.title);
        console.log('- jobRoleId:', !!formData.jobRoleId);
        console.log('- Sending requiredSkills:', formData.requiredSkills);
        console.log('- Sending requiredAvailability:', formData.requiredAvailability);
        
        const res = await apiRequest('POST', '/api/jobs', formData);
        console.log('API response status:', res.status);
        
        try {
          // Attempt to parse the response as JSON
          const data = await res.json();
          console.log('API response data:', JSON.stringify(data, null, 2));
          return data;
        } catch (parseError) {
          // If response isn't JSON, try to get the text
          console.error('Error parsing response as JSON:', parseError);
          const text = await res.text();
          console.log('Response text:', text);
          throw new Error('Failed to parse server response: ' + text);
        }
      } catch (error: unknown) {
        // Safe error handling with type checking
        if (error instanceof Error) {
          console.error('API request failed complete error:', error);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          
          // Check if it's a fetch error with a response
          const fetchError = error as unknown as { response?: Response };
          if (fetchError.response) {
            console.error('Response status:', fetchError.response.status);
            try {
              const errText = await fetchError.response.text();
              console.error('Response text:', errText);
            } catch (e) {
              console.error('Could not get response text:', e);
            }
          }
        } else {
          console.error('Unknown error type:', error);
        }
        
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Job created successfully:', JSON.stringify(data, null, 2));
      toast({
        title: 'Success!',
        description: 'Your job has been posted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        console.error('Failed to create job - Complete error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        toast({
          title: 'Error',
          description: `Failed to create job: ${error.message}`,
          variant: 'destructive',
        });
      } else {
        console.error('Unknown error type:', error);
        toast({
          title: 'Error',
          description: 'Failed to create job: Unknown error',
          variant: 'destructive',
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJobMutation.mutate();
  };

  if (isLoadingRoles || isLoadingSkills) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p>Loading form data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Post a Test Job</CardTitle>
        <CardDescription>This is a simplified form to test job posting functionality</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name (Required)</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="jobRoleId">Job Role (Required)</Label>
            <Select 
              value={formData.jobRoleId.toString()} 
              onValueChange={(value) => {
                const id = parseInt(value);
                const jobRole = jobRoles?.find(role => role.id === id);
                setFormData({ 
                  ...formData, 
                  jobRoleId: id,
                  title: jobRole?.name || formData.title
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job role" />
              </SelectTrigger>
              <SelectContent>
                {jobRoles?.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="title">Job Title (Required)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Note: This will be overridden by the job role name on the server</p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hoursPerWeek">Hours Per Week</Label>
              <Input
                id="hoursPerWeek"
                type="number"
                value={formData.hoursPerWeek.toString()}
                onChange={(e) => setFormData({ ...formData, hoursPerWeek: parseInt(e.target.value) })}
              />
            </div>
            
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input
                id="hourlyRate"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="requiredLanguages">Required Languages</Label>
            <Input
              id="requiredLanguages"
              value={formData.requiredLanguages}
              onChange={(e) => setFormData({ ...formData, requiredLanguages: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Required Skills</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.requiredSkills.map(skillId => {
                const skill = skills?.find(s => s.id === skillId);
                return skill ? (
                  <Badge 
                    key={skillId} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        requiredSkills: prev.requiredSkills.filter(id => id !== skillId)
                      }));
                    }}
                  >
                    {skill.name} ✕
                  </Badge>
                ) : null;
              })}
              {formData.requiredSkills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills selected</p>
              )}
            </div>
            
            <div className="mt-2">
              <Select 
                onValueChange={(value) => {
                  const skillId = parseInt(value);
                  if (!formData.requiredSkills.includes(skillId)) {
                    setFormData(prev => ({
                      ...prev,
                      requiredSkills: [...prev.requiredSkills, skillId]
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Add a skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills?.map(skill => (
                    <SelectItem 
                      key={skill.id} 
                      value={skill.id.toString()}
                      disabled={formData.requiredSkills.includes(skill.id)}
                    >
                      {skill.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>Required Availability</Label>
            <div className="mt-2 text-sm">
              {formData.requiredAvailability.map((slot, index) => (
                <div key={index} className="border rounded p-2 mb-2 flex justify-between items-center">
                  <span>
                    Day: {getDayName(slot.dayOfWeek)}, Hours: {slot.startHour}:00 - {slot.endHour}:00 {slot.timeZone}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0 hover:text-destructive"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        requiredAvailability: prev.requiredAvailability.filter((_, i) => i !== index)
                      }));
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              {formData.requiredAvailability.length === 0 && (
                <p className="text-sm text-muted-foreground">No availability slots defined</p>
              )}
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-2">
              <div>
                <Label htmlFor="dayOfWeek" className="text-xs">Day</Label>
                <Select 
                  defaultValue="1"
                  onValueChange={(value) => {
                    setNewSlot(prev => ({
                      ...prev,
                      dayOfWeek: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="dayOfWeek">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startHour" className="text-xs">Start</Label>
                <Select 
                  defaultValue="9"
                  onValueChange={(value) => {
                    setNewSlot(prev => ({
                      ...prev,
                      startHour: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="startHour">
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="endHour" className="text-xs">End</Label>
                <Select 
                  defaultValue="17"
                  onValueChange={(value) => {
                    setNewSlot(prev => ({
                      ...prev,
                      endHour: parseInt(value)
                    }));
                  }}
                >
                  <SelectTrigger id="endHour">
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="timezone" className="text-xs">Timezone</Label>
                <Select 
                  defaultValue="UTC"
                  onValueChange={(value) => {
                    setNewSlot(prev => ({
                      ...prev,
                      timeZone: value
                    }));
                  }}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="TZ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="GMT">GMT</SelectItem>
                    <SelectItem value="EST">EST</SelectItem>
                    <SelectItem value="PST">PST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  requiredAvailability: [...prev.requiredAvailability, newSlot]
                }));
              }}
            >
              Add Availability Slot
            </Button>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createJobMutation.isPending}
          >
            {createJobMutation.isPending ? 'Posting...' : 'Post Job'}
          </Button>
          
          {createJobMutation.isPending && (
            <div className="text-center">
              <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" />
              Submitting job data...
            </div>
          )}
          
          {createJobMutation.isError && (
            <div className="text-red-500 text-sm mt-2">
              Error: {(createJobMutation.error as Error).message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}