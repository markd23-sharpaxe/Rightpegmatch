import { useState, useEffect } from "react";
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
  CardTitle,
  CardFooter 
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
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [resetStatus, setResetStatus] = useState<"pending" | "success" | "error">("pending");
  const [tokenFromUrl, setTokenFromUrl] = useState<string>("");
  
  // Get token from URL query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      setTokenFromUrl(token);
    }
  }, []);
  
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Update token field when tokenFromUrl changes
  useEffect(() => {
    if (tokenFromUrl) {
      form.setValue("token", tokenFromUrl);
    }
  }, [tokenFromUrl, form]);
  
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormValues) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        token: data.token,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      setResetStatus("success");
      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });
    },
    onError: (error: Error) => {
      setResetStatus("error");
      toast({
        title: "Error",
        description: error.message || "An error occurred while resetting your password",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: ResetPasswordFormValues) => {
    resetPasswordMutation.mutate(data);
  };
  
  if (resetStatus === "success") {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">Password Reset Complete</CardTitle>
                <CardDescription className="text-center">
                  Your password has been successfully reset
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button onClick={() => navigate("/auth")}>
                  Go to Login
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (resetStatus === "error") {
    return (
      <div className="min-h-screen bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">Reset Failed</CardTitle>
                <CardDescription className="text-center">
                  The password reset link is invalid or has expired
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center flex-col space-y-2">
                <Button onClick={() => navigate("/forgot-password")}>
                  Request New Reset Link
                </Button>
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  Return to Login
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Create New Password</CardTitle>
              <CardDescription>
                Please enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {!tokenFromUrl && (
                    <FormField
                      control={form.control}
                      name="token"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reset Token</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your reset token" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your new password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-dark"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Reset Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}