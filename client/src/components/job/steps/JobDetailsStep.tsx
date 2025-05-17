import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2, Sparkles, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define schema for job details
const detailsSchema = z.object({
  description: z.string().min(10, "Description is required (minimum 10 characters)"),
  hoursPerWeek: z.coerce.number().min(1, "Hours per week is required"),
  hourlyRate: z.string().min(1, "Pay rate is required"),
  currency: z.string().min(1, "Currency is required"),
});

type DetailsValues = z.infer<typeof detailsSchema>;

interface JobDetailsStepProps {
  jobDetails: {
    description: string;
    enhancedDescription: string;
    hoursPerWeek: number;
    hourlyRate: string;
    currency: string;
    requiredLanguages: string[];
  };
  jobTitle: string;
  companyName: string;
  onUpdate: (details: Partial<JobDetailsStepProps['jobDetails']>) => void;
  onContinue: () => void;
}

export function JobDetailsStep({ 
  jobDetails, 
  jobTitle,
  companyName,
  onUpdate, 
  onContinue 
}: JobDetailsStepProps) {
  const { toast } = useToast();
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({
    description: jobDetails.enhancedDescription ? "enhanced" : "original",
    languages: "select",
  });
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    jobDetails.requiredLanguages || []
  );
  
  // Set up form
  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      description: jobDetails.description || "",
      hoursPerWeek: jobDetails.hoursPerWeek || 40,
      hourlyRate: jobDetails.hourlyRate || "",
      currency: jobDetails.currency || "USD",
    },
  });
  
  // Enhance job description mutation
  const enhanceMutation = useMutation({
    mutationFn: async (draftDescription: string) => {
      const res = await apiRequest("POST", "/api/ai/enhance-job-listing", {
        jobTitle,
        draftDescription,
        companyName,
      });
      const data = await res.json();
      return data.enhancedDescription as string;
    },
    onSuccess: (enhancedDescription) => {
      onUpdate({ enhancedDescription });
      setActiveTabs(prev => ({ ...prev, description: "enhanced" }));
      
      toast({
        title: "Description Enhanced",
        description: "Your job description has been enhanced with AI.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Enhancement Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle language toggle
  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => {
      const newLanguages = prev.includes(language) 
        ? prev.filter(lang => lang !== language)
        : [...prev, language];
      
      onUpdate({ requiredLanguages: newLanguages });
      return newLanguages;
    });
  };
  
  // Handle form submission
  const onSubmit = (values: DetailsValues) => {
    if (selectedLanguages.length === 0) {
      toast({
        title: "Required Languages",
        description: "Please select at least one required language.",
        variant: "destructive",
      });
      return;
    }
    
    const finalDescription = activeTabs.description === "enhanced" && jobDetails.enhancedDescription
      ? jobDetails.enhancedDescription
      : values.description;
    
    onUpdate({
      description: values.description,
      hoursPerWeek: values.hoursPerWeek,
      hourlyRate: values.hourlyRate,
      currency: values.currency,
      requiredLanguages: selectedLanguages,
    });
    
    onContinue();
  };
  
  // Currency options for dropdown
  const currencies = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "JPY", label: "JPY (¥)" },
    { value: "CAD", label: "CAD ($)" },
    { value: "AUD", label: "AUD ($)" },
  ];
  
  // Language options
  const languages = [
    { value: "English", label: "English" },
    { value: "Spanish", label: "Spanish" },
    { value: "French", label: "French" },
    { value: "German", label: "German" },
    { value: "Chinese", label: "Chinese" },
    { value: "Japanese", label: "Japanese" },
    { value: "Arabic", label: "Arabic" },
    { value: "Russian", label: "Russian" },
    { value: "Portuguese", label: "Portuguese" },
    { value: "Italian", label: "Italian" },
    { value: "Hindi", label: "Hindi" },
    { value: "Bengali", label: "Bengali" },
    { value: "Dutch", label: "Dutch" },
    { value: "Korean", label: "Korean" },
    { value: "Turkish", label: "Turkish" },
    { value: "Swedish", label: "Swedish" },
    { value: "Polish", label: "Polish" },
    { value: "Vietnamese", label: "Vietnamese" },
    { value: "Thai", label: "Thai" },
    { value: "Greek", label: "Greek" },
  ];
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Job Details</h2>
        <p className="text-muted-foreground max-w-md mx-auto mt-2">
          Provide detailed information about the job you're posting
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Description Section */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Textarea 
                        placeholder="Describe the job, responsibilities, and requirements..."
                        className="min-h-[150px]"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          
                          // If user changes description, clear the enhanced version
                          if (jobDetails.enhancedDescription && e.target.value !== jobDetails.description) {
                            onUpdate({ enhancedDescription: "" });
                            setActiveTabs(prev => ({ ...prev, description: "original" }));
                          }
                        }}
                      />
                      
                      {field.value && field.value.length >= 10 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          onClick={() => enhanceMutation.mutate(field.value)}
                          disabled={enhanceMutation.isPending}
                        >
                          {enhanceMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enhancing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Enhance with AI
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Enhanced Description Preview */}
            {jobDetails.enhancedDescription && (
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-base">AI-Enhanced Description</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tabs 
                        value={activeTabs.description} 
                        onValueChange={(v) => setActiveTabs(prev => ({ ...prev, description: v }))}
                        className="h-8"
                      >
                        <TabsList className="h-8 px-1">
                          <TabsTrigger value="original" className="text-xs h-6 px-2">Original</TabsTrigger>
                          <TabsTrigger value="enhanced" className="text-xs h-6 px-2">Enhanced</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none text-sm leading-normal">
                  {activeTabs.description === "original" ? (
                    <pre className="whitespace-pre-wrap font-sans">{form.watch("description")}</pre>
                  ) : (
                    <div 
                      className="prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2"
                      dangerouslySetInnerHTML={{ __html: jobDetails.enhancedDescription.replace(/\n/g, '<br />') }} 
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    {activeTabs.description === "enhanced" ? "AI-enhanced description" : "Your original description"}
                  </span>
                  <div className="flex gap-2">
                    {activeTabs.description === "enhanced" && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => setActiveTabs(prev => ({ ...prev, description: "original" }))}
                      >
                        <X className="h-3 w-3" />
                        Discard
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => setActiveTabs(prev => ({ 
                        ...prev, 
                        description: prev.description === "original" ? "enhanced" : "original" 
                      }))}
                    >
                      <Check className="h-3 w-3" />
                      Use {activeTabs.description === "original" ? "Enhanced" : "Original"}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}
          </div>
          
          {/* Compensation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Compensation Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hoursPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours per Week</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="80"
                        placeholder="40"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Rate</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 25" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Required Languages */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Required Languages</h3>
              <Tabs 
                value={activeTabs.languages} 
                onValueChange={(v) => setActiveTabs(prev => ({ ...prev, languages: v }))}
                className="h-8"
              >
                <TabsList className="h-8 px-1">
                  <TabsTrigger value="select" className="text-xs h-6 px-2">Select</TabsTrigger>
                  <TabsTrigger value="selected" className="text-xs h-6 px-2">
                    Selected ({selectedLanguages.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div>
              {activeTabs.languages === "select" ? (
                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                  {languages.map(lang => (
                    <div key={lang.value} className="flex items-center gap-2">
                      <Checkbox 
                        id={`lang-${lang.value}`} 
                        checked={selectedLanguages.includes(lang.value)}
                        onCheckedChange={() => handleLanguageToggle(lang.value)}
                      />
                      <Label 
                        htmlFor={`lang-${lang.value}`} 
                        className="text-sm cursor-pointer"
                      >
                        {lang.label}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedLanguages.length > 0 ? (
                      selectedLanguages.map(lang => (
                        <Badge 
                          key={lang} 
                          variant="outline"
                          className="bg-white flex items-center gap-1.5"
                        >
                          {lang}
                          <button 
                            className="h-3.5 w-3.5 rounded-full bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center"
                            onClick={() => handleLanguageToggle(lang)}
                          >
                            <span className="sr-only">Remove</span>
                            <span aria-hidden="true" className="h-2.5 w-0.5 bg-slate-400 absolute rounded-full"></span>
                            <span aria-hidden="true" className="h-0.5 w-2.5 bg-slate-400 absolute rounded-full"></span>
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No languages selected yet</p>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLanguages.length === 0 && (
                <p className="text-xs text-destructive">At least one language is required</p>
              )}
            </div>
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