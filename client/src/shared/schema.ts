// This is a simplified version of the schema for Netlify deployment
// It contains only the types needed by the frontend

import { z } from "zod";

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

// Experience level enum
export enum ExperienceLevel {
  LessThanOneYear = "Less than 1 year",
  TwoToFiveYears = "2-5 years",
  FiveToTenYears = "5-10 years",
  TenPlusYears = "10+ years"
}

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