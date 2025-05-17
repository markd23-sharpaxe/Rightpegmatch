import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Step 1: Enter username
const usernameSchema = z.object({
  username: z.string().min(3, "Please enter a valid username"),
});

// Step 2: Answer secret question
const secretAnswerSchema = z.object({
  secretAnswer: z.string().min(1, "Secret answer is required"),
});

// Step 3: Set new password
const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UsernameFormValues = z.infer<typeof usernameSchema>;
type SecretAnswerFormValues = z.infer<typeof secretAnswerSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'username' | 'secretQuestion' | 'resetPassword'>('username');
  const [username, setUsername] = useState('');
  const [secretQuestion, setSecretQuestion] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Username form
  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });
  
  // Secret answer form
  const secretAnswerForm = useForm<SecretAnswerFormValues>({
    resolver: zodResolver(secretAnswerSchema),
    defaultValues: {
      secretAnswer: "",
    },
  });
  
  // Reset password form
  const resetPasswordForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  
  // Step 1: Find user by username
  const findUserMutation = useMutation({
    mutationFn: async (data: UsernameFormValues) => {
      const res = await apiRequest("POST", "/api/find-user-for-reset", data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.secretQuestion) {
        setUsername(usernameForm.getValues().username);
        setSecretQuestion(data.secretQuestion);
        setStep('secretQuestion');
      } else {
        toast({
          title: "User not found",
          description: "No user with this username exists or they haven't set a secret question.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Step 2: Verify secret answer
  const verifySecretAnswerMutation = useMutation({
    mutationFn: async (data: SecretAnswerFormValues) => {
      const res = await apiRequest("POST", "/api/verify-secret-answer", {
        username,
        secretAnswer: data.secretAnswer
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.token) {
        setTempToken(data.token);
        setStep('resetPassword');
      } else {
        toast({
          title: "Incorrect Answer",
          description: "The answer you provided doesn't match our records.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Step 3: Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      const res = await apiRequest("POST", "/api/reset-password-with-token", {
        token: tempToken,
        password: data.password
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in with your new password.",
      });
      navigate("/auth");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit handlers for each step
  const onSubmitUsername = (data: UsernameFormValues) => {
    findUserMutation.mutate(data);
  };
  
  const onSubmitSecretAnswer = (data: SecretAnswerFormValues) => {
    verifySecretAnswerMutation.mutate(data);
  };
  
  const onSubmitResetPassword = (data: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription>
                {step === 'username' && "Enter your username to start the password recovery process"}
                {step === 'secretQuestion' && "Answer your secret question to verify your identity"}
                {step === 'resetPassword' && "Create a new password for your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'username' && (
                <Form {...usernameForm}>
                  <form onSubmit={usernameForm.handleSubmit(onSubmitUsername)} className="space-y-4">
                    <FormField
                      control={usernameForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary-dark"
                      disabled={findUserMutation.isPending}
                    >
                      {findUserMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Continue
                    </Button>
                  </form>
                </Form>
              )}
              
              {step === 'secretQuestion' && (
                <Form {...secretAnswerForm}>
                  <form onSubmit={secretAnswerForm.handleSubmit(onSubmitSecretAnswer)} className="space-y-4">
                    <Alert className="mb-4">
                      <AlertDescription>
                        <strong>Your secret question:</strong> {secretQuestion}
                      </AlertDescription>
                    </Alert>
                    
                    <FormField
                      control={secretAnswerForm.control}
                      name="secretAnswer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Answer</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your answer" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep('username')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-primary hover:bg-primary-dark"
                        disabled={verifySecretAnswerMutation.isPending}
                      >
                        {verifySecretAnswerMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Verify
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
              
              {step === 'resetPassword' && (
                <Form {...resetPasswordForm}>
                  <form onSubmit={resetPasswordForm.handleSubmit(onSubmitResetPassword)} className="space-y-4">
                    <FormField
                      control={resetPasswordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={resetPasswordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep('secretQuestion')}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-primary hover:bg-primary-dark"
                        disabled={resetPasswordMutation.isPending}
                      >
                        {resetPasswordMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Reset Password
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}