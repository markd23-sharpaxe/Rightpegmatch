import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skill } from "@shared/schema";
import { useLocation } from "wouter";
import JobForm from "@/components/job/JobForm";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";

export default function PostJobPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);
  
  // Fetch all skills for the job form
  const { data: allSkills, isLoading: skillsLoading } = useQuery<Skill[]>({
    queryKey: ["/api/skills"],
  });
  
  if (!user || skillsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b pb-6">
              <CardTitle className="text-2xl font-bold text-primary">Post a New Job</CardTitle>
              <CardDescription>
                Fill out the details below to create a new job posting. Be as specific as possible to attract the right candidates.
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              <JobForm 
                skills={allSkills || []} 
                onSuccess={() => {
                  console.log("Job creation successful - navigating to My Jobs page");
                  toast({
                    title: "Job created",
                    description: "Your job has been posted successfully",
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
                  // Force navigation with a slight delay to ensure toast is shown
                  setTimeout(() => {
                    navigate("/my-jobs");
                  }, 500);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}