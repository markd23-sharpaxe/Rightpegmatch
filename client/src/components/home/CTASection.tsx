import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CalendarClock, Users } from "lucide-react";

export default function CTASection() {
  const { user } = useAuth();
  
  return (
    <section className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl p-12 text-center">
          <h2 className="font-inter font-bold text-4xl mb-4 text-gray-800">Design Your Ideal Work Life</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10">
            Create the flexibility you need - find talent, find work, or do both. Our platform adapts to your changing needs throughout your career.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {user ? (
              <>
                <Link href="/profile">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium rounded-full px-8 shadow-md">
                    <CalendarClock className="mr-2 h-5 w-5" /> Find Opportunities
                  </Button>
                </Link>
                <Link href="/my-jobs">
                  <Button size="lg" variant="outline" className="text-gray-800 hover:bg-gray-50 font-medium rounded-full px-8 border border-gray-300">
                    <Users className="mr-2 h-5 w-5" /> Manage Your Jobs
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-50 font-medium rounded-full px-8 border border-primary/20 shadow-sm">
                    Update Your Profile
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium rounded-full px-8 shadow-md">
                    <CalendarClock className="mr-2 h-5 w-5" /> Find Opportunities
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button size="lg" variant="outline" className="text-gray-800 hover:bg-gray-50 font-medium rounded-full px-8 border border-gray-300">
                    <Users className="mr-2 h-5 w-5" /> Post Jobs
                  </Button>
                </Link>
              </>
            )}
          </div>
          
          <p className="text-gray-600 mt-10 max-w-xl mx-auto text-sm">
            One account. Multiple possibilities. Work the way you want, when you want, for whom you want.
          </p>
        </div>
      </div>
    </section>
  );
}
