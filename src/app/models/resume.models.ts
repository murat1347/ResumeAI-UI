// LLM Provider Types
export enum LLMProvider {
  OpenAI = 0,
  Gemini = 1,
  Qwen = 2
}

export interface ConfigureLLMRequest {
  apiKey: string;
}

export interface LLMStatusResponse {
  isConfigured: boolean;
  currentProvider: string | null;
  currentModel: string | null;
}

export interface LLMConfigResponse {
  provider: string;
  model: string;
  hasApiKey: boolean;
}

// Job Requirements
export interface JobRequirement {
  jobTitle: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minYearsOfExperience: number;
  maxYearsOfExperience?: number;
  requiredDegree: string;
  preferredFieldsOfStudy: string[];
  skillsWeight: number;
  experienceWeight: number;
  educationWeight: number;
}

// Candidate
export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  fileName: string;
  uploadedAt: Date;
  skills: Skill[];
  experiences: Experience[];
  education?: Education;
}

export interface Skill {
  name: string;
  yearsOfExperience: number;
  level: string;
}

export interface Experience {
  companyName: string;
  position: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  isCurrent: boolean;
  durationInMonths: number;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationYear?: number;
  gpa?: number;
}

// Analysis Results
export interface AnalysisResult {
  id: string;
  candidateId: string;
  candidate?: Candidate;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  totalScore: number;
  skillsAnalysis?: SkillsAnalysis;
  experienceAnalysis?: ExperienceAnalysis;
  educationAnalysis?: EducationAnalysis;
  aiSummary: string;
  strengths: string;
  weaknesses: string;
  analyzedAt: Date;
}

export interface SkillsAnalysis {
  matchedSkills: string[];
  missingSkills: string[];
  matchedCount: number;
  requiredCount: number;
  matchPercentage: number;
}

export interface ExperienceAnalysis {
  totalYearsOfExperience: number;
  requiredYears: number;
  numberOfCompanies: number;
  averageYearsPerCompany: number;
  hasRelevantExperience: boolean;
}

export interface EducationAnalysis {
  hasRequiredDegree: boolean;
  isRelevantField: boolean;
  actualDegree: string;
  actualField: string;
}

// API Responses
export interface UploadResponse {
  sessionId: string;
  totalFiles: number;
  successfullyUploaded: number;
  failedToUpload: number;
  candidates: Candidate[];
  errors: string[];
}

export interface AnalyzeResponse {
  sessionId: string;
  totalCandidates: number;
  successfullyAnalyzed: number;
  failedToAnalyze: number;
  results: AnalysisResult[];
  errors: string[];
  analyzedAt: Date;
}

export interface AnalyzeRequest {
  jobRequirement: JobRequirement;
}

export interface SessionResponse {
  sessionId: string;
}
