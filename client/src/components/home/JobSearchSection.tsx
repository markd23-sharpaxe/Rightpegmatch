import { useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function JobSearchSection() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [hours, setHours] = useState("any");
  const [timeZoneOverlap, setTimeZoneOverlap] = useState("any");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery) params.append("query", searchQuery);
    if (hours !== "any") params.append("hours", hours);
    if (timeZoneOverlap !== "any") params.append("timeZoneOverlap", timeZoneOverlap);
    
    navigate(`/jobs?${params.toString()}`);
  };
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="pt-6">
            <h2 className="font-inter font-semibold text-2xl mb-6 text-center">Find Remote Opportunities</h2>
            
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Skills or Job Title</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                    <Input 
                      type="text" 
                      placeholder="React, Project Manager, etc." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Weekly Hours</label>
                  <Select value={hours} onValueChange={setHours}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any Hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Hours</SelectItem>
                      <SelectItem value="part-time">Part-time (&lt; 20 hrs)</SelectItem>
                      <SelectItem value="full-time">Full-time (40+ hrs)</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Time Zone Overlap</label>
                  <Select value={timeZoneOverlap} onValueChange={setTimeZoneOverlap}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Any Overlap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Overlap</SelectItem>
                      <SelectItem value="americas">Americas (GMT-8 to GMT-3)</SelectItem>
                      <SelectItem value="europe">Europe/Africa (GMT-1 to GMT+3)</SelectItem>
                      <SelectItem value="asia">Asia/Pacific (GMT+5 to GMT+12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button type="submit" className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-8">
                  Search Jobs
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
