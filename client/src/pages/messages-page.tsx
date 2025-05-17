import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import MessagesPanel from "@/components/profile/MessagesPanel";

export default function MessagesPage() {
  const { user } = useAuth();

  // Fetch unread message count for notification badge
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/direct-messages/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  if (!user) return null;
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
          {unreadCount && unreadCount.count > 0 && (
            <Badge className="bg-primary hover:bg-primary/90">
              {unreadCount.count} New
            </Badge>
          )}
        </div>
        
        {/* Use the same MessagesPanel component as in profile page */}
        <MessagesPanel user={user} />
      </div>
    </div>
  );
}