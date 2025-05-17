import { Globe, Clock, Scale, Users, Briefcase, Calendar } from "lucide-react";

export default function RemoteBenefitsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-inter font-bold text-4xl mb-5 text-gray-800">The New World of Work</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Remote working has transformed the relationship between employers and talent, offering unprecedented flexibility for both sides.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* Benefit 1 - Cord.com style */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <Globe className="text-primary h-8 w-8" />
            </div>
            <h3 className="font-inter font-semibold text-xl mb-3 text-gray-800">Work Across Time Zones</h3>
            <p className="text-gray-600">
              Work for Middle East companies in the morning and US companies in the evening. Match your work hours to global opportunities.
            </p>
          </div>
          
          {/* Benefit 2 - Cord.com style */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <Calendar className="text-primary h-8 w-8" />
            </div>
            <h3 className="font-inter font-semibold text-xl mb-3 text-gray-800">Flexible Career Path</h3>
            <p className="text-gray-600">
              Scale back as you approach retirement. Take breaks between contracts. Design your ideal work-life balance throughout your career.
            </p>
          </div>
          
          {/* Benefit 3 - Cord.com style */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <Users className="text-primary h-8 w-8" />
            </div>
            <h3 className="font-inter font-semibold text-xl mb-3 text-gray-800">Multiple Income Streams</h3>
            <p className="text-gray-600">
              Work for multiple employers simultaneously. Create a diverse portfolio of projects that suit your skills and availability.
            </p>
          </div>
        </div>
        
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-inter font-bold text-4xl mb-5 text-gray-800">For Employers</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Employer Benefit 1 - Cord.com style */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <Briefcase className="text-primary h-8 w-8" />
            </div>
            <h3 className="font-inter font-semibold text-xl mb-3 text-gray-800">Flexible Staffing</h3>
            <p className="text-gray-600">
              No need for permanent hires when you don't need them. Bring in talent for exactly the hours and duration you require.
            </p>
          </div>
          
          {/* Employer Benefit 2 - Cord.com style */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <Globe className="text-primary h-8 w-8" />
            </div>
            <h3 className="font-inter font-semibold text-xl mb-3 text-gray-800">Global Talent Pool</h3>
            <p className="text-gray-600">
              Access skills from anywhere in the world. Find the perfect expertise without geographical limitations.
            </p>
          </div>
          
          {/* Employer Benefit 3 - Cord.com style */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <Clock className="text-primary h-8 w-8" />
            </div>
            <h3 className="font-inter font-semibold text-xl mb-3 text-gray-800">Around-the-Clock Coverage</h3>
            <p className="text-gray-600">
              Build teams across time zones for continuous productivity. Create overlap periods exactly when you need them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
