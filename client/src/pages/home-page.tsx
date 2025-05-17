import HeroSection from "@/components/home/HeroSection";
import FeaturedJobsSection from "@/components/home/FeaturedJobsSection";
import RemoteBenefitsSection from "@/components/home/RemoteBenefitsSection";
import RemoteWorkplaceSection from "@/components/home/RemoteWorkplaceSection";
import TimeZoneToolSection from "@/components/home/TimeZoneToolSection";

import CTASection from "@/components/home/CTASection";
import JobRecommendationCarousel from "@/components/job/JobRecommendationCarousel";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      <HeroSection />

      {/* Content for authenticated users */}
      {user && (
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Your Personalized Job Matches</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Based on your skills, experience, and availability, we've found these opportunities 
                that might be perfect for you. Swipe to explore your matches.
              </p>

              {/* Test Button for Post Job */}
              <div className="mt-5">
                <Link href="/post-job" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
                  Test Post Job Page
                </Link>
              </div>
            </div>
            <JobRecommendationCarousel />
          </div>
        </section>
      )}

      <RemoteBenefitsSection />
      <TimeZoneToolSection />
      <RemoteWorkplaceSection />
      <CTASection />
    </div>
  );
}