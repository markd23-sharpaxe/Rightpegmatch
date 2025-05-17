import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Redirect, Route, useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { UserSubscription } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

/**
 * Protected route that requires a specific subscription plan
 * If user doesn't have the required subscription, they are redirected to the subscription page
 */
export function SubscriptionProtectedRoute({
  path,
  component: Component,
  requiredPlanId,
  redirectTo = "/subscription",
}: {
  path: string;
  component: () => React.JSX.Element | null;
  requiredPlanId: number;
  redirectTo?: string;
}) {
  const { user, isLoading } = useAuth();
  const [match] = useRoute(path);
  const [location] = useLocation();

  // Fetch user subscription
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription | null>({
    queryKey: ['/api/my-subscription'],
    enabled: !!user,
  });

  // Check if user has the required subscription
  const hasRequiredSubscription = userSubscription?.planId === requiredPlanId;

  return (
    <Route path={path}>
      {() => {
        // If still loading auth or subscription status, show loading spinner
        if (isLoading || subscriptionLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        // If no user is authenticated, redirect to auth page
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // If user doesn't have the required subscription, show subscription required message
        if (!hasRequiredSubscription) {
          return (
            <div className="container mx-auto p-8 max-w-3xl">
              <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                <ShieldAlert className="h-5 w-5 text-yellow-500" />
                <AlertTitle>Subscription Required</AlertTitle>
                <AlertDescription>
                  You need a Recruiter subscription to access this feature.
                </AlertDescription>
              </Alert>
              
              <div className="text-center">
                <h1 className="text-2xl font-semibold mb-4">Recruiter Subscription Required</h1>
                <p className="mb-6 text-muted-foreground">
                  This feature is only available to users with a Recruiter subscription plan.
                  Please upgrade your subscription to access the talent pool and advanced recruiting features.
                </p>
                
                <Button asChild>
                  <Link href={`${redirectTo}?plan=recruiter`}>Upgrade Now</Link>
                </Button>
              </div>
            </div>
          );
        }
        
        // If the route matched but component is not being rendered
        // This handles the case where the path is correct but component isn't rendering
        if (match) {
          console.log(`Protected route matched: ${path} at location ${location}`);
          return <Component />;
        }
        
        // This shouldn't happen since we're inside a Route that matched this path
        // But adding as a fallback
        return <Component />;
      }}
    </Route>
  );
}