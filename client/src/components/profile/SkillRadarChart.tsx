import React from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Skill } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';

interface SkillRadarChartProps {
  skills?: (Skill & { proficiency: number })[];
  loading?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

const MAX_SKILLS_TO_DISPLAY = 8;

interface RadarDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ 
  skills, 
  loading = false,
  className = "",
  title = "Skills Radar",
  description = "Visualization of your current skill set"
}) => {
  // If loading, show loading indicator
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-center">
            Loading skill data...
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // If no skills are provided, return a placeholder
  if (!skills || skills.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-center">
            Add skills to your profile to see them visualized here
          </p>
        </CardContent>
      </Card>
    );
  }

  // Limit the number of skills to display to prevent overcrowding
  const displayedSkills = skills.slice(0, MAX_SKILLS_TO_DISPLAY);
  
  // Create radar chart data
  const data: RadarDataPoint[] = displayedSkills.map((skill) => ({
    subject: skill.name,
    value: skill.proficiency,
    fullMark: 100,
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Proficiency"
                dataKey="value"
                stroke="#5BBFBA"
                fill="#5BBFBA"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Proficiency']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillRadarChart;