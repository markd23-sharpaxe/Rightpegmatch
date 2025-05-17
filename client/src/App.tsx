import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import JobListingsPage from "@/pages/job-listings-page";
import JobDetailsPage from "@/pages/job-details-page";
import ProfilePage from "@/pages/profile-page";
import EditProfilePage from "@/pages/edit-profile-page";
// import FindTalentPage from "@/pages/find-talent-page"; // Removed as requested
import MyJobsPage from "@/pages/my-jobs-page";
import PostJobPage from "@/pages/post-job-page";
import JobApplicationsPage from "@/pages/job-applications-page";
import MessagesPage from "@/pages/messages-page";
import SubscriptionPage from "@/pages/subscription-page";
import PaymentSuccessPage from "@/pages/payment-success-page";
import TestJobFormPage from "@/pages/test-job-form-page";
import TermsOfServicePage from "@/pages/terms-of-service-page";
import PrivacyPolicyPage from "@/pages/privacy-policy-page";
import CookiePolicyPage from "@/pages/cookie-policy-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import { ProtectedRoute } from "./lib/protected-route";
import { SubscriptionProtectedRoute } from "./lib/subscription-protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { checkApiConnection, onConnectionStatusChange } from "./lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/job-listings" component={JobListingsPage} />
      <ProtectedRoute path="/jobs/:id" component={JobDetailsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/edit" component={EditProfilePage} />
      {/* Find Talent route disabled as requested */}
      <ProtectedRoute path="/post-job" component={PostJobPage} />
      <ProtectedRoute path="/my-jobs" component={MyJobsPage} />
      <ProtectedRoute path="/jobs/:jobId/applications" component={JobApplicationsPage} />
      <ProtectedRoute path="/job-applications/:jobId" component={JobApplicationsPage} /> {/* Keep for backward compatibility */}
      <ProtectedRoute path="/applications/:id" component={JobApplicationsPage} /> {/* Single application view */}
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/messages/:userId" component={MessagesPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <Route path="/payment-success" component={PaymentSuccessPage} />
      <ProtectedRoute path="/test-job-form" component={TestJobFormPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/cookie-policy" component={CookiePolicyPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { toast } = useToast();
  
  // Monitor API connection status
  useEffect(() => {
    // Initial connection check
    checkApiConnection();
    
    // Subscribe to connection status changes
    const unsubscribe = onConnectionStatusChange((connected) => {
      // Only show toast for connection loss/recovery after initial load
      if (!connected) {
        toast({
          variant: "destructive",
          title: "Connection lost",
          description: "Unable to connect to the server. Some features may not work.",
        });
      } else {
        toast({
          title: "Connection restored",
          description: "Successfully reconnected to the server.",
        });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [toast]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="px-4 sm:px-6 lg:px-8 py-2">
        <ConnectionStatus className="max-w-6xl mx-auto mb-2" />
      </div>
      <main className="flex-grow">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
