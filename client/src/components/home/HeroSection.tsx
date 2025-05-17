import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CalendarClock, Users, Clock, Globe } from "lucide-react";

export default function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-28">
      {/* Subtle purple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-white/0"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Clean, modern heading with purple accent */}
          <div className="mb-6">
            <h1 className="font-inter font-bold text-4xl md:text-6xl leading-tight text-gray-800">
              The Future of <span className="text-primary">Remote Working</span>
            </h1>
          </div>
          
          {/* Clean subtitle with good contrast */}
          <div className="mb-10">
            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Create the work-life that fits your needs at every stage of your career. Work for multiple employers, find specialized talent, or do both.
            </p>
          </div>
          
          {/* Feature boxes with Cord.com style - clean grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 mx-auto">
            {[
              {
                icon: <Globe className="h-6 w-6 text-primary" />,
                text: "Connect with opportunities across time zones that match your availability"
              },
              {
                icon: <Clock className="h-6 w-6 text-primary" />,
                text: "Set your own hours and choose when and how much you work"
              },
              {
                icon: <CalendarClock className="h-6 w-6 text-primary" />,
                text: "Find work that fits your life, not the other way around"
              },
              {
                icon: <Users className="h-6 w-6 text-primary" />,
                text: "Hire precisely the talent you need for exactly the hours required"
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                <div className="bg-primary/10 p-3 rounded-full">
                  {feature.icon}
                </div>
                <p className="text-gray-700">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
          
          {/* Action buttons - Cord.com style */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            {user ? (
              <>
                <Link href="/profile">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium w-full sm:w-auto rounded-full px-8 shadow-md">
                    <CalendarClock className="mr-2 h-5 w-5" /> Find Opportunities
                  </Button>
                </Link>
                <Link href="/my-jobs">
                  <Button size="lg" variant="outline" className="text-gray-800 hover:bg-gray-50 font-medium w-full sm:w-auto rounded-full px-8 border border-gray-300">
                    <Users className="mr-2 h-5 w-5" /> Post or Manage Jobs
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium w-full sm:w-auto rounded-full px-8 shadow-md">
                    <CalendarClock className="mr-2 h-5 w-5" /> Find Opportunities
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="text-gray-800 hover:bg-gray-50 font-medium w-full sm:w-auto rounded-full px-8 border border-gray-300">
                    <Users className="mr-2 h-5 w-5" /> Post Jobs
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
