import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { safeClickHandler } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

import { 
  Menu, 
  X, 
  LogOut, 
  BriefcaseBusiness,
  ClipboardList,
  Briefcase,
  User,
  CreditCard,
  Home,
  Plus,
  Search,
  Users,
  MessageSquare,
  LayoutDashboard,
  Clock,
  BarChart2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch unread direct messages count
  const { data: unreadMessagesData } = useQuery<{ count: number }>({
    queryKey: ["/api/direct-messages/unread-count"],
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle clicks outside the mobile menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMobileMenuOpen(false);
  };

  // Helper function to check active route
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-md" : "bg-white shadow-sm"
      }`}
      ref={menuRef}
    >
      {/* Brand at the top with logo */}
      <div className="container mx-auto px-4 py-1 text-center">
        <Link href="/" className="inline-flex items-center">
          <Logo className="mr-2" size="md" />
        </Link>
      </div>

      {/* Navigation ribbon */}
      <div className="bg-gray-50 border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10">
            {/* Quick Action Buttons - Always visible on all screen sizes */}
            <div className="flex items-center space-x-1">
              {user ? (
                <>
                  {/* Post Job Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-md p-1.5 h-8 transition-all duration-150 ${
                      isActive('/post-job') 
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      window.location.href = '/post-job';
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span className="text-sm font-medium">Post Job</span>
                  </Button>


                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:bg-gray-100 rounded-md"
                    asChild
                  >
                    <Link href="/auth?tab=employer">
                      <Plus className="h-4 w-4 mr-1.5" />
                      <span className="font-medium">Post Job</span>
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:bg-gray-100 rounded-md"
                    asChild
                  >
                    <Link href="/auth">
                      <Search className="h-4 w-4 mr-1.5" />
                      <span className="font-medium">Find Work</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Center Links (only on medium+ screens) */}
            <nav className="hidden md:flex items-center justify-center">
              {user ? (
                <Tabs defaultValue="profile" className="w-auto">
                  <TabsList className="bg-gray-100/70">
                    {/* Profile Section */}
                    <TabsTrigger 
                      value="profile" 
                      className={`flex items-center gap-1.5 px-4 ${
                        isActive('/profile') || isActive('/') ? 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary' : ''
                      }`}
                      asChild
                    >
                      <Link href="/profile">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </TabsTrigger>

                    {/* Messages Section */}
                    <TabsTrigger 
                      value="messages" 
                      className={`flex items-center gap-1.5 px-4 ${
                        isActive('/messages') ? 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary' : ''
                      }`}
                      asChild
                    >
                      <Link href="/messages" className="relative">
                        <div className="relative">
                          <MessageSquare className="h-4 w-4" />
                          {unreadMessagesData && unreadMessagesData.count && unreadMessagesData.count > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                          )}
                        </div>
                        <span>Messages</span>
                        {unreadMessagesData && unreadMessagesData.count && unreadMessagesData.count > 0 && (
                          <Badge variant="destructive" className="ml-1 text-xs font-bold">
                            {unreadMessagesData.count}
                          </Badge>
                        )}
                      </Link>
                    </TabsTrigger>

                    {/* Job Matches Section */}
                    <TabsTrigger 
                      value="job-matches" 
                      className={`flex items-center gap-1.5 px-4 ${
                        isActive('/job-listings') ? 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary' : ''
                      }`}
                      asChild
                    >
                      <Link href="/job-listings">
                        <BarChart2 className="h-4 w-4" />
                        <span>Job Matches</span>
                      </Link>
                    </TabsTrigger>

                    {/* Job Posting Section */}
                    <TabsTrigger 
                      value="jobs" 
                      className={`flex items-center gap-1.5 px-4 ${
                        isActive('/my-jobs') || isActive('/find-talent') ? 'data-[state=active]:bg-primary/10 data-[state=active]:text-primary' : ''
                      }`}
                      asChild
                    >
                      <Link href="/my-jobs">
                        <BriefcaseBusiness className="h-4 w-4" />
                        <span>My Jobs</span>
                      </Link>
                    </TabsTrigger>

                    {/* Talent Search Section - Hidden as requested */}
                  </TabsList>
                </Tabs>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-md transition-all duration-150 ${
                      isActive('/') 
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    asChild
                  >
                    <Link href="/">
                      <Home className="h-4 w-4 mr-1.5" />
                      <span className="font-medium">Home</span>
                    </Link>
                  </Button>

                  
                </>
              )}
            </nav>

            {/* Right Side - User Menu or Auth */}
            <div className="flex items-center space-x-1">
              {user ? (
                <>
                  {/* Mobile Menu Toggle for logged-in users */}
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="md:hidden h-8 w-8 p-1 mr-1"
                    onClick={toggleMobileMenu}
                  >
                    {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>

                  {/* User Menu - Reorganized with sections */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-2 text-sm rounded-md transition-all duration-150 text-gray-700 hover:bg-gray-100 h-8 p-1.5"
                      >
                        <span className="font-medium">
                          {user.username.length > 10 
                            ? `${user.username.substring(0, 10)}...` 
                            : user.username}
                        </span>
                        <Badge variant="outline" className="flex items-center gap-1 h-5 px-1.5 py-0">
                          <span className="text-xs font-normal">Account</span>
                          <Menu className="h-3 w-3" />
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-64 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-100"
                      style={{ 
                        maxHeight: '400px',
                        position: 'absolute',
                        top: '35px',
                        right: 0,
                        overflowY: 'auto'
                      }}
                    >
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Profile Section */}
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                          Profile Section
                        </DropdownMenuLabel>

                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            <span>My Profile</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/profile/edit" className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            <span>Edit Profile</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/messages" className="cursor-pointer relative">
                            <div className="relative">
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {unreadMessagesData && unreadMessagesData.count && unreadMessagesData.count > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                </span>
                              )}
                            </div>
                            <span>Messages</span>
                            {unreadMessagesData && unreadMessagesData.count && unreadMessagesData.count > 0 && (
                              <Badge variant="destructive" className="ml-2 text-xs font-bold">
                                {unreadMessagesData.count}
                              </Badge>
                            )}
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/subscription" className="cursor-pointer">
                            <CreditCard className="h-4 w-4 mr-2" />
                            <span>Subscription Plan</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      {/* Jobs Section */}
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                          Job Management
                        </DropdownMenuLabel>

                        <DropdownMenuItem asChild>
                          <Link href="/my-jobs" className="cursor-pointer">
                            <BriefcaseBusiness className="h-4 w-4 mr-2" />
                            <span>My Posted Jobs</span>
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                          onClick={() => {
                            window.location.href = '/post-job';
                          }}
                          className="cursor-pointer"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <span>Post New Job</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                          Jobs & Talent
                        </DropdownMenuLabel>

                        <DropdownMenuItem asChild>
                          <Link href="/job-listings" className="cursor-pointer">
                            <BarChart2 className="h-4 w-4 mr-2" />
                            <span>Job Matches</span>
                          </Link>
                        </DropdownMenuItem>

                        {/* Find Talent menu item removed as requested */}
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem 
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50/80 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>{logoutMutation.isPending ? "Logging out..." : "Log Out"}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Auth Buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:bg-gray-100 rounded-md hidden sm:flex"
                    asChild
                  >
                    <Link href="/auth?tab=login">
                      <span className="font-medium">Log In</span>
                    </Link>
                  </Button>

                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 rounded-md text-white hidden sm:flex"
                    asChild
                  >
                    <Link href="/auth">
                      <span className="font-medium">Sign Up</span>
                    </Link>
                  </Button>

                  {/* Mobile Menu Toggle (for non-logged in users) */}
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="sm:hidden h-8 w-8 p-1"
                    onClick={toggleMobileMenu}
                  >
                    {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <motion.div 
            className="md:hidden bg-white border-b border-gray-200 shadow-md"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ 
              position: 'absolute',
              top: '60px', /* Adjusted for the smaller header height */
              left: 0,
              right: 0,
              zIndex: 50,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            <div className="container divide-y divide-gray-100">
              <Link 
                href="/" 
                className={`flex items-center py-3 px-4 ${isActive('/') ? 'text-primary' : 'text-gray-700'}`}
              >
                <Home className="h-4 w-4 mr-3" />
                <span className="font-medium">Home</span>
              </Link>

              {user ? (
                <>
                  {/* Mobile Navigation with the three sections */}
                  <div className="py-2">
                    <div className="flex items-center px-4 py-2">
                      <User className="h-4 w-4 mr-3 text-primary" />
                      <span className="font-medium text-primary">Profile Section</span>
                    </div>

                    <Link 
                      href="/profile" 
                      className={`flex items-center py-2 px-4 pl-11 ${isActive('/profile') ? 'text-primary' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">My Profile</span>
                    </Link>

                    <Link 
                      href="/profile/edit" 
                      className={`flex items-center py-2 px-4 pl-11 ${isActive('/profile/edit') ? 'text-primary' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">Edit Profile</span>
                    </Link>

                    <Link 
                      href="/subscription" 
                      className={`flex items-center py-2 px-4 pl-11 ${isActive('/subscription') ? 'text-primary' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">Subscription</span>
                    </Link>
                  </div>

                  <div className="py-2">
                    <div className="flex items-center px-4 py-2">
                      <BriefcaseBusiness className="h-4 w-4 mr-3 text-primary" />
                      <span className="font-medium text-primary">Job Management</span>
                    </div>

                    <Link 
                      href="/my-jobs" 
                      className={`flex items-center py-2 px-4 pl-11 ${isActive('/my-jobs') ? 'text-primary' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">My Posted Jobs</span>
                    </Link>

                    <div 
                      className={`flex items-center py-2 px-4 pl-11 cursor-pointer ${isActive('/post-job') ? 'text-primary' : 'text-gray-700'}`}
                      onClick={() => {
                        window.location.href = '/post-job';
                      }}
                    >
                      <span className="font-medium">Post New Job</span>
                    </div>


                  </div>

                  <div className="py-2">
                    <div className="flex items-center px-4 py-2">
                      <BarChart2 className="h-4 w-4 mr-3 text-primary" />
                      <span className="font-medium text-primary">Jobs & Talent</span>
                    </div>

                    <Link 
                      href="/job-listings" 
                      className={`flex items-center py-2 px-4 pl-11 ${isActive('/job-listings') ? 'text-primary' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">Job Matches</span>
                    </Link>

                    {/* Find Talent mobile link removed as requested */}
                  </div>

                  <div className="p-4">
                    <Button
                      className="w-full text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                      variant="outline"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>{logoutMutation.isPending ? "Logging out..." : "Log Out"}</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  

                  {/* Auth options for mobile */}
                  <div className="py-4 px-4 flex items-center justify-center gap-3">
                    <Link href="/auth?tab=login" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link href="/auth" className="w-full">
                      <Button
                        className="bg-primary text-white w-full"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}