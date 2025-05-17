import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useRoute, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading } = useAuth();
  const [match] = useRoute(path);
  const [location] = useLocation();

  return (
    <Route path={path}>
      {() => {
        // If still loading auth status, show loading spinner
        if (isLoading) {
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