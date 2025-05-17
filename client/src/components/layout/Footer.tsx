import { Link } from "wouter";
import { 
  Globe, 
  Twitter, 
  Linkedin, 
  Instagram,
  Mail,
  ArrowRight
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main footer content */}
      <div className="py-12 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            <div>
              <div className="flex items-center mb-5">
                <Logo className="mr-3" size="md" />
                <span className="font-bold text-xl text-white">RightPegMatch.com</span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Connecting global talent with remote opportunities, regardless of time zones or borders.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://twitter.com/rightpegmatch" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white hover:bg-primary/20 transition-colors duration-200 cursor-pointer"
                  aria-label="Follow RightPegMatch on Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/right-peg-match/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white hover:bg-primary/20 transition-colors duration-200 cursor-pointer"
                  aria-label="Connect with RightPegMatch on LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a 
                  href="https://www.instagram.com/rightpegmatch" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gray-800 p-2 rounded-full text-gray-400 hover:text-white hover:bg-primary/20 transition-colors duration-200 cursor-pointer"
                  aria-label="Follow RightPegMatch on Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-5 relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-full">
                For Job Seekers
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/profile" className="text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                    Create Profile
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-5 relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-full">
                For Employers
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/post-job" className="text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link href="/subscription" className="text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <Link href="/my-jobs" className="text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                    Manage Jobs
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-5 relative pl-3 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-full">
                Contact Us
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Email Us</p>
                    <a href="mailto:info@rightpegmatch.com" className="text-gray-400 hover:text-primary transition-colors duration-200">
                      info@rightpegmatch.com
                    </a>
                  </div>
                </li>

              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer bottom */}
      <div className="py-6 text-center text-gray-500 text-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {currentYear} RightPegMatch.com. All rights reserved.</p>
            <div className="flex flex-wrap gap-6 justify-center">
              <Link href="/privacy-policy" className="hover:text-primary transition-colors duration-200 cursor-pointer">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-primary transition-colors duration-200 cursor-pointer">Terms of Service</Link>
              <Link href="/cookie-policy" className="hover:text-primary transition-colors duration-200 cursor-pointer">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
