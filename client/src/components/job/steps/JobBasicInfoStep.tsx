import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { JobRole } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Briefcase, Building, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define schema for basic job info
const basicInfoSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  title: z.string().min(2, "Job title is required"),
  jobRoleId: z.coerce.number().min(1, "Job role is required"),
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

interface JobBasicInfoStepProps {
  basicInfo: {
    companyName: string;
    title: string;
    jobRoleId: number | null;
  };
  onUpdate: (basicInfo: JobBasicInfoStepProps['basicInfo']) => void;
  onContinue: () => void;
}

export function JobBasicInfoStep({ basicInfo, onUpdate, onContinue }: JobBasicInfoStepProps) {
  // Fetch job roles
  const { data: jobRoles, isLoading: jobRolesLoading } = useQuery<JobRole[]>({
    queryKey: ["/api/job-roles"],
  });
  
  // Set up form
  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      companyName: basicInfo.companyName || "",
      title: basicInfo.title || "",
      jobRoleId: basicInfo.jobRoleId || undefined,
    },
  });
  
  // Update parent component when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      onUpdate({
        companyName: value.companyName || "",
        title: value.title || "",
        jobRoleId: value.jobRoleId || null,
      });
    });
    
    return () => subscription.unsubscribe();
  }, [form, onUpdate]);
  
  // Handle form submission
  const onSubmit = (values: BasicInfoValues) => {
    onUpdate({
      companyName: values.companyName,
      title: values.title,
      jobRoleId: values.jobRoleId,
    });
    onContinue();
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Job Posting Basics</h2>
        <p className="text-muted-foreground max-w-md mx-auto mt-2">
          Let's start with some basic information about the job you're posting
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Your company name" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="e.g., Senior Frontend Developer" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobRoleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Role Category</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value?.toString() || ""}
                    disabled={jobRolesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job role category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobRoles?.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name} {role.category ? `(${role.category})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="submit"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Continue"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}