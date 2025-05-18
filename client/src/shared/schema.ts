// This is a simplified version of the schema for Netlify deployment
// It contains all the types and exports needed by the frontend

import { z } from "zod";

// Experience level enum - needed by edit-profile-page.tsx
export enum ExperienceLevel {
  LessThanOneYear = "Less than 1 year",
  TwoToFiveYears = "2-5 years",
  FiveToTenYears = "5-10 years",
  TenPlusYears = "10+ years"
}

// Job families enum type definition
export enum JobFamily {
  ProjectManagement = "Project Management",
  SoftwareDevelopment = "Software Development",
  Design = "Design",
  Sales = "Sales",
  Marketing = "Marketing",
  CustomerSupport = "Customer Support",
  Finance = "Finance",
  HumanResources = "Human Resources",
  Executive = "Executive",
  Operations = "Operations",
  DataAnalysis = "Data Analysis",
  Other = "Other"
}

// Salary type definition - needed by salary-input.tsx
export type SalaryType = 'hourly' | 'weekly' | 'monthly' | 'yearly';

// Start date flexibility options for job terms - needed by JobForm
export type StartDateFlexibilityType = 'exact' | 'month' | 'immediate';

// Type definitions needed by the frontend
export type JobRole = {
  id: number;
  name: string;
  category?: string;
  jobFamily?: string;
};

export type User = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  location?: string;
  timeZone?: string;
  bio?: string;
  avatarUrl?: string;
  languages?: string;
  linkedInProfile?: string;
  preferredHoursPerWeek?: number;
  minSalaryRequirement?: string;
  maxSalaryRequirement?: string;
  salaryCurrency?: string;
  preferredSalaryType?: string;
  emailNotificationsEnabled?: boolean;
  messageNotifications?: boolean;
  jobMatchNotifications?: boolean;
  applicationUpdateNotifications?: boolean;
  role?: string;
  jobRoleId?: number;
  createdAt: Date;
  matchScore?: JobMatchScore;
  firstName?: string;
  lastName?: string;
};

export type Skill = {
  id: number;
  name: string;
};

export type Qualification = {
  id: number;
  name: string;
};

export type UserSkill = {
  id: number;
  userId: number;
  skillId: number;
};

export type UserQualification = {
  id: number;
  userId: number;
  qualificationId: number;
};

export type UserJobRole = {
  id: number;
  userId: number;
  jobRoleId: number;
  isPrimary: boolean;
  experienceLevel?: string;
};

export type AvailabilitySlot = {
  id: number;
  userId: number;
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  timeZone?: string;
};

export type JobAvailabilityRequirement = {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  timeZone: string;
};

export type Job = {
  id: number;
  title: string;
  employerId: number;
  companyName: string;
  jobRoleId?: number;
  hoursPerWeek?: number;
  hourlyRate?: string;
  salaryAmount?: string;
  salaryType?: string;
  currency?: string;
  requiredLanguages?: string;
  requiredAvailability?: JobAvailabilityRequirement[];
  status: string;
  createdAt: Date;
  requiredSkills?: number[];
  requiredQualifications?: number[];
  optionalQualifications?: number[];
  jobFamily?: string;
  startDate?: Date;
  endDate?: Date;
  startDateFlexibility?: string;
  isPermanent?: boolean;
  minSalary?: string;
  maxSalary?: string;
  description?: string;
  minHoursPerWeek?: number;
  maxHoursPerWeek?: number;
  timeZoneRequirements?: string;
  timeZoneOverlap?: string;
  salary?: string;
  jobType?: string;
  location?: string;
  matchScore?: JobMatchScore;
};

export type JobApplication = {
  id: number;
  jobId: number;
  jobseekerId: number;
  status: string;
  message?: string;
  createdAt: Date;
};

export type SubscriptionPlan = {
  id: number;
  name: string;
  description: string;
  price: string;
  maxSearches: number;
  maxApplicantViews: number;
  isUnlimited: boolean;
};

export type UserSubscription = {
  id: number;
  userId: number;
  planId: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  searchesUsed: number;
  applicantViewsUsed: number;
  jobId?: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
};

export type Message = {
  id: number;
  applicationId: number;
  senderId: number;
  recipientId: number;
  content: string;
  isRead: boolean;
  createdAt: Date;
};

// Match details interface
export interface MatchDetails {
  matchedRoleId?: number;
  matchedSkillIds?: number[];
  requiredSkillsCount?: number;
  matchedSkillsCount?: number;
  matchedRequiredQualificationIds?: number[];
  requiredQualificationsCount?: number;
  matchedRequiredQualificationsCount?: number;
  missingRequiredQualifications?: Qualification[];
  matchedOptionalQualificationIds?: number[];
  optionalQualificationsCount?: number;
  matchedOptionalQualificationsCount?: number;
  availabilityMatchPercentage?: number;
  matchedSlots?: number;
  totalSlots?: number;
  userJobFamily?: string;
  jobJobFamily?: string;
  jobFamilyMatch?: boolean;
  aiMatchExplanation?: string;
  aiStrengths?: string[];
  aiGaps?: string[];
  aiLanguageMatch?: number;
  aiCompensationMatch?: number;
  [key: string]: any;
}

export interface JobMatchScore {
  overallScore: number;
  roleScore: number;
  availabilityScore: number;
  skillsScore: number;
  skillsMatchPercentage: number;
  qualificationsScore: number;
  requiredQualificationsMatchPercentage: number;
  optionalQualificationsMatchPercentage: number;
  matchDetails?: MatchDetails;
  lastUpdated?: Date;
}

export interface RelatedJobRole {
  roleId: number;
  similarRoleIds: number[];
}

// Zod schemas needed by the frontend
// This includes insertUserSchema which is used by auth-page.tsx
export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email(),
  fullName: z.string().min(2),
  location: z.string().optional(),
  timeZone: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  languages: z.string().optional(),
  linkedInProfile: z.string().optional(),
  preferredHoursPerWeek: z.number().optional(),
  minSalaryRequirement: z.string().optional(),
  maxSalaryRequirement: z.string().optional(),
  salaryCurrency: z.string().optional(),
  preferredSalaryType: z.string().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  messageNotifications: z.boolean().optional(),
  jobMatchNotifications: z.boolean().optional(),
  applicationUpdateNotifications: z.boolean().optional(),
  role: z.string().optional(),
  jobRoleId: z.number().optional(),
});

// Additional schemas required by other pages
export const insertJobSchema = z.object({
  title: z.string().min(5),
  employerId: z.number(),
  companyName: z.string().min(2),
  jobRoleId: z.number().optional(),
  hoursPerWeek: z.number().optional(),
  hourlyRate: z.string().optional(),
  salaryAmount: z.string().optional(),
  salaryType: z.string().optional(),
  currency: z.string().optional(),
  requiredLanguages: z.string().optional(),
  requiredAvailability: z.array(
    z.object({
      dayOfWeek: z.number(),
      startHour: z.number(),
      endHour: z.number(),
      timeZone: z.string(),
    })
  ).optional(),
  requiredSkills: z.array(z.number()).optional(),
  requiredQualifications: z.array(z.number()).optional(),
  optionalQualifications: z.array(z.number()).optional(),
  jobFamily: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startDateFlexibility: z.string().optional(),
  isPermanent: z.boolean().optional(),
  minSalary: z.string().optional(),
  maxSalary: z.string().optional(),
  description: z.string().optional(),
  minHoursPerWeek: z.number().optional(),
  maxHoursPerWeek: z.number().optional(),
  timeZoneRequirements: z.string().optional(),
  timeZoneOverlap: z.string().optional(),
  salary: z.string().optional(),
  jobType: z.string().optional(),
  location: z.string().optional(),
});

export const insertJobApplicationSchema = z.object({
  jobId: z.number(),
  jobseekerId: z.number(),
  message: z.string().optional(),
});

export const insertMessageSchema = z.object({
  applicationId: z.number(),
  senderId: z.number(),
  recipientId: z.number(),
  content: z.string(),
});

// Type exports from zod schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;