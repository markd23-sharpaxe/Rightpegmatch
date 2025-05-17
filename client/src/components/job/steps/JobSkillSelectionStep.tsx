import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skill, JobRole } from "@shared/schema";
import { Check, CheckCircle, Loader2, Search, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface JobSkillSelectionStepProps {
  jobRoleId: number | null;
  selectedSkills: number[];
  onSkillToggle: (skillId: number) => void;
  onContinue: () => void;
}

export function JobSkillSelectionStep({ 
  jobRoleId, 
  selectedSkills, 
  onSkillToggle, 
  onContinue 
}: JobSkillSelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  // Fetch all skills
  const { data: allSkills, isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  // Fetch selected job role details
  const { data: jobRoles } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Get the selected job role
  const selectedRole = jobRoles?.find(role => role.id === jobRoleId);
  
  // Fetch AI suggested skills for the job role
  const { data: suggestedSkills, isLoading: suggestionsLoading } = useQuery<{name: string, description: string}[]>({
    queryKey: ["/api/ai/job-role-skills", jobRoleId],
    enabled: !!jobRoleId,
  });
  
  // Filter skills based on search query
  const filteredSkills = allSkills?.filter(skill => 
    skill.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Find suggested skills that match our existing skills
  const matchedSuggestions = suggestedSkills?.map(suggestion => {
    const matchingSkill = allSkills?.find(
      skill => skill.name.toLowerCase() === suggestion.name.toLowerCase()
    );
    
    return {
      ...suggestion,
      skillId: matchingSkill?.id || null,
    };
  });
  
  // Handle continuing to next step
  const handleContinue = () => {
    if (selectedSkills.length === 0) {
      toast({
        title: "Required Skills",
        description: "Please select at least one required skill for this job.",
        variant: "destructive",
      });
      return;
    }
    
    onContinue();
  };
  
  // Handle shortcut to select all suggested skills
  const handleSelectAllSuggested = () => {
    const validSuggestions = matchedSuggestions
      ?.filter(suggestion => suggestion.skillId !== null)
      .map(suggestion => suggestion.skillId);
    
    if (validSuggestions && validSuggestions.length > 0) {
      // Toggle each skill individually
      validSuggestions.forEach(skillId => {
        if (skillId !== null && !selectedSkills.includes(skillId)) {
          onSkillToggle(skillId);
        }
      });
      
      toast({
        title: "Skills Selected",
        description: `Added ${validSuggestions.length} suggested skills to your job requirements.`,
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Required Skills</h2>
        <p className="text-muted-foreground max-w-md mx-auto mt-2">
          Select the skills required for this {selectedRole?.name || "job position"}
        </p>
      </div>
      
      {/* AI Suggestions */}
      {jobRoleId && (
        <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">AI-Suggested Skills</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 gap-1.5"
                onClick={handleSelectAllSuggested}
                disabled={suggestionsLoading || !matchedSuggestions?.some(s => s.skillId !== null)}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Select All
              </Button>
            </div>
            <CardDescription>
              Based on the {selectedRole?.name || "job role"} profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {matchedSuggestions?.map((suggestion, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      {suggestion.skillId ? (
                        <Checkbox 
                          id={`suggestion-${index}`}
                          checked={selectedSkills.includes(suggestion.skillId)}
                          onCheckedChange={() => suggestion.skillId && onSkillToggle(suggestion.skillId)}
                        />
                      ) : (
                        <Badge variant="outline" className="px-1.5 py-0 text-xs border-blue-200 text-blue-600 bg-blue-50">
                          New
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Label 
                        htmlFor={`suggestion-${index}`}
                        className={suggestion.skillId ? "cursor-pointer font-medium" : "font-medium text-blue-600"}
                      >
                        {suggestion.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* All Skills Selection */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="border rounded-md p-4">
          {skillsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredSkills?.map((skill) => (
                <div 
                  key={skill.id}
                  className={`border rounded-md p-3 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedSkills.includes(skill.id) ? "border-primary bg-primary/5" : "hover:bg-slate-50"
                  }`}
                  onClick={() => onSkillToggle(skill.id)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id={`skill-${skill.id}`}
                      checked={selectedSkills.includes(skill.id)}
                      onCheckedChange={() => {}}
                      className="pointer-events-none"
                    />
                    <Label 
                      htmlFor={`skill-${skill.id}`}
                      className="cursor-pointer font-medium"
                    >
                      {skill.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Selected Skills Summary */}
      <div className="bg-slate-50 rounded-md p-4 border">
        <h3 className="font-medium mb-2">Selected Skills ({selectedSkills.length})</h3>
        <div className="flex flex-wrap gap-2">
          {selectedSkills.length > 0 ? (
            allSkills
              ?.filter(skill => selectedSkills.includes(skill.id))
              .map(skill => (
                <Badge 
                  key={skill.id} 
                  variant="outline"
                  className="bg-white flex items-center gap-1.5"
                >
                  {skill.name}
                  <button 
                    className="h-3.5 w-3.5 rounded-full bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center"
                    onClick={() => onSkillToggle(skill.id)}
                  >
                    <span className="sr-only">Remove</span>
                    <span aria-hidden="true" className="h-2.5 w-0.5 bg-slate-400 absolute rounded-full"></span>
                    <span aria-hidden="true" className="h-0.5 w-2.5 bg-slate-400 absolute rounded-full"></span>
                  </button>
                </Badge>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">No skills selected yet</p>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}