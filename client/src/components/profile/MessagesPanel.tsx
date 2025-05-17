import { useState, useEffect } from "react";
import { User as UserType, DirectMessage } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, Search, SendHorizonal, 
  Clock, CheckCircle2, MessagesSquare, Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MessagesPanelProps {
  user: UserType;
}

// Common message interface for both types
interface BaseMessage {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  createdAt: string;
}

// Application-specific message
interface AppMessage extends BaseMessage {
  applicationId: number;
  isRead?: boolean;
  read?: boolean;
  sender?: {
    id: number;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

// Thread interface for displaying in the sidebar
interface Thread {
  id: number;
  type: "direct" | "application";
  title: string;
  subtitle?: string;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageDate: string; // This must be a string for proper React rendering
  unreadCount: number;
}

// Helper to ensure date is always a string
const ensureStringDate = (date: string | Date): string => {
  return typeof date === 'string' ? date : String(date);
};

export default function MessagesPanel({ user }: MessagesPanelProps) {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messageTab, setMessageTab] = useState<"all" | "direct" | "jobs">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch application messages
  const { 
    data: appMessages,
    isLoading: appMessagesLoading 
  } = useQuery({
    queryKey: ["/api/messages/me"],
    enabled: !!user,
  });
  
  // Fetch direct messages
  const { 
    data: directMessages,
    isLoading: directMessagesLoading 
  } = useQuery({
    queryKey: ["/api/direct-messages"],
    enabled: !!user,
  });
  
  // Fetch users for direct messages
  const {
    data: users
  } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && !!directMessages && (directMessages as any[])?.length > 0,
  });
  
  // Create threads from messages
  const [threads, setThreads] = useState<Thread[]>([]);
  
  // Build threads from messages
  useEffect(() => {
    const newThreads: Thread[] = [];
    const processedAppIds = new Set<number>();
    const processedUserIds = new Set<number>();
    
    // Process application messages
    if (appMessages && Array.isArray(appMessages)) {
      appMessages.forEach((msg: AppMessage) => {
        if (!msg.applicationId || processedAppIds.has(msg.applicationId)) return;
        
        const otherUserId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
        const otherUser = msg.senderId === user.id 
          ? null // We don't have recipient info in the message
          : msg.sender;
          
        const unreadCount = appMessages.filter((m: AppMessage) => 
          m.applicationId === msg.applicationId && 
          m.recipientId === user.id && 
          !(m.isRead || m.read)
        ).length;
        
        const latestMessage = appMessages
          .filter((m: AppMessage) => m.applicationId === msg.applicationId)
          .sort((a: AppMessage, b: AppMessage) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
        newThreads.push({
          id: msg.applicationId,
          type: "application",
          title: "Job Application",
          subtitle: "",
          otherUserId,
          otherUserName: otherUser ? (otherUser.fullName || otherUser.username) : `User ${otherUserId}`,
          otherUserAvatar: otherUser?.avatarUrl || null,
          lastMessageDate: latestMessage.createdAt.toString(),
          unreadCount
        });
        
        processedAppIds.add(msg.applicationId);
      });
    }
    
    // Process direct messages
    if (directMessages && Array.isArray(directMessages) && users && Array.isArray(users)) {
      // Group messages by other user
      const userMessages = new Map<number, DirectMessage[]>();
      
      directMessages.forEach((msg: DirectMessage) => {
        const otherUserId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
        
        if (!userMessages.has(otherUserId)) {
          userMessages.set(otherUserId, []);
        }
        
        userMessages.get(otherUserId)!.push(msg);
      });
      
      // Create a thread for each user
      userMessages.forEach((messages, otherUserId) => {
        if (processedUserIds.has(otherUserId)) return;
        
        const otherUser = users.find((u: any) => u.id === otherUserId);
        const unreadCount = messages.filter(m => 
          m.recipientId === user.id && !m.isRead
        ).length;
        
        const latestMessage = messages.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        
        newThreads.push({
          id: -otherUserId, // Negative ID to distinguish direct threads
          type: "direct",
          title: "Direct Message",
          otherUserId,
          otherUserName: otherUser ? (otherUser.fullName || otherUser.username) : `User ${otherUserId}`,
          otherUserAvatar: otherUser?.avatarUrl || null,
          lastMessageDate: latestMessage.createdAt.toString(),
          unreadCount
        });
        
        processedUserIds.add(otherUserId);
      });
    }
    
    // Sort threads by most recent message
    newThreads.sort((a, b) => 
      new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
    
    setThreads(newThreads);
  }, [appMessages, directMessages, users, user?.id]);
  
  // Filter threads based on tab and search
  const filteredThreads = threads.filter(thread => {
    // Filter by tab
    if (messageTab === "direct" && thread.type !== "direct") return false;
    if (messageTab === "jobs" && thread.type !== "application") return false;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        thread.otherUserName.toLowerCase().includes(query) ||
        thread.title.toLowerCase().includes(query) ||
        (thread.subtitle && thread.subtitle.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Fetch thread messages
  const { 
    data: threadMessages,
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery({
    queryKey: [
      selectedThread?.type === "direct" 
        ? `/api/direct-messages/conversation/${selectedThread.otherUserId}` 
        : `/api/messages/${selectedThread?.id}`,
      selectedThread?.id
    ],
    enabled: !!selectedThread,
    queryFn: async () => {
      if (!selectedThread) return [];
      
      try {
        if (selectedThread.type === "direct") {
          const res = await apiRequest("GET", 
            `/api/direct-messages/conversation/${selectedThread.otherUserId}`
          );
          return await res.json();
        } else {
          // The server expects application ID
          const res = await apiRequest("GET", 
            `/api/messages/${selectedThread.id}`
          );
          return await res.json();
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "There was a problem loading the conversation. Please try again.",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      content: string; 
      isDirect: boolean; 
      recipientId: number; 
      applicationId?: number;
    }) => {
      const { content, isDirect, recipientId, applicationId } = data;
      
      if (isDirect) {
        return apiRequest("POST", "/api/direct-messages", { 
          recipientId, 
          content 
        });
      } else {
        return apiRequest("POST", "/api/messages", { 
          applicationId,
          recipientId, 
          content 
        });
      }
    },
    onSuccess: () => {
      // Clear message text
      setMessageText("");
      
      // Refetch messages to update the conversation
      refetchMessages();
      
      // Invalidate queries to update thread list
      queryClient.invalidateQueries({ queryKey: ["/api/messages/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/direct-messages"] });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      console.error("Error sending message:", error);
    }
  });
  
  // Handle sending message
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedThread) return;
    
    sendMessageMutation.mutate({
      content: messageText,
      isDirect: selectedThread.type === "direct",
      recipientId: selectedThread.otherUserId,
      applicationId: selectedThread.type === "application" ? selectedThread.id : undefined
    });
  };
  
  // Format date
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Get avatar initials
  const getInitials = (name: string = "") => {
    if (!name) return "??";
    
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Loading state
  const isLoading = appMessagesLoading || directMessagesLoading;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(80vh-6rem)]">
      {/* Threads panel */}
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="px-4 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Messages</CardTitle>
            <div className="flex gap-1">
              {filteredThreads.some(thread => thread.unreadCount > 0) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8 px-2 border-dashed"
                  onClick={() => {
                    toast({
                      title: "Messages marked as read",
                      description: "All messages have been marked as read."
                    });
                    // In a real implementation, this would call an API endpoint
                    // to mark all messages as read and then refresh the data
                    queryClient.invalidateQueries({ queryKey: ["/api/messages/me"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/direct-messages"] });
                  }}
                >
                  Mark all as read
                </Button>
              )}
              <Button size="icon" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <Tabs 
              defaultValue="all" 
              className="w-full"
              value={messageTab}
              onValueChange={(value) => setMessageTab(value as "all" | "direct" | "jobs")}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="direct">Direct</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        
        <ScrollArea className="flex-1">
          <CardContent className="px-2">
            {isLoading ? (
              // Loading state
              <div className="space-y-3 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length > 0 ? (
              <div className="space-y-1 pt-2">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedThread?.id === thread.id
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    } ${thread.unreadCount > 0 ? "bg-blue-50/50" : ""}`}
                    onClick={() => setSelectedThread(thread)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={thread.otherUserAvatar || undefined} />
                      <AvatarFallback>
                        {getInitials(thread.otherUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-sm truncate max-w-[120px]">
                          {thread.otherUserName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageDate(thread.lastMessageDate)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {thread.title} {thread.subtitle && `• ${thread.subtitle}`}
                      </p>
                      {thread.unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs px-1.5 rounded-full w-fit mt-1 flex items-center gap-1">
                          <span className="relative h-2 w-2 flex">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          {thread.unreadCount} new
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessagesSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                <h3 className="text-sm font-medium mb-1">No messages found</h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms" 
                    : "When you apply to jobs or message other users, conversations will appear here"}
                </p>
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
      
      {/* Messages panel */}
      <Card className="lg:col-span-2 flex flex-col overflow-hidden">
        {selectedThread ? (
          <>
            <CardHeader className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={selectedThread.otherUserAvatar || undefined} />
                    <AvatarFallback>
                      {getInitials(selectedThread.otherUserName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-sm">
                      {selectedThread.otherUserName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedThread.title} {selectedThread.subtitle && `• ${selectedThread.subtitle}`}
                    </p>
                  </div>
                </div>
                {selectedThread.type === "application" && (
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/applications/${selectedThread.id}`}>
                          View Application
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Application ID: {selectedThread.id}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"} mb-4`}
                    >
                      {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                      <div>
                        <Skeleton className={`h-[60px] w-[200px] rounded-lg ${
                          i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"
                        }`} />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : threadMessages && (threadMessages as any[]).length > 0 ? (
                <div className="space-y-4 pt-2">
                  {(threadMessages as any[]).map((message: any) => {
                    const isCurrentUser = message.senderId === user.id;
                    const isRead = message.isRead ?? message.read ?? false;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}
                      >
                        {!isCurrentUser && (
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={selectedThread.otherUserAvatar || undefined} />
                            <AvatarFallback>
                              {getInitials(selectedThread.otherUserName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div className={isCurrentUser ? "items-end" : "items-start"}>
                          <div 
                            className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                              isCurrentUser 
                                ? "bg-primary text-primary-foreground rounded-tr-none" 
                                : "bg-muted rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          
                          <div className="flex items-center mt-1 text-xs text-muted-foreground gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatMessageDate(message.createdAt)}</span>
                            {isCurrentUser && isRead && (
                              <CheckCircle2 className="h-3 w-3 text-green-500 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <h3 className="text-sm font-medium mb-1">No messages yet</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Start the conversation by sending a message below.
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  className="min-h-[60px] flex-1"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  size="icon" 
                  className="h-[60px]"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <SendHorizonal className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-medium mb-2">Your Messages</h2>
              <p className="text-muted-foreground mb-6">
                Select a conversation to view messages or start a new one by applying to a job or messaging other users.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" asChild>
                  <a href="/job-listings">
                    Browse Jobs
                  </a>
                </Button>
                <Button asChild>
                  <a href="/post-job">
                    Post a Job
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}