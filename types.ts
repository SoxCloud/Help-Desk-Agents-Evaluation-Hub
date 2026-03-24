export enum UserRole {
  ADMIN = "ADMIN",
  AGENT = "AGENT",
}

export enum AgentStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  BUSY = "BUSY",
  ON_CALL = "ON_CALL",
  AWAY = "AWAY",
}

export interface DailyStats {
  date: string;
  answeredCalls: number;
  abandonedCalls: number;
  transactions: number;
  aht: string;
  ahtSeconds?: number;
  resolutionRate: number;
  missedCalls?: number;
  solvedTickets?: number;
  totalTickets?: number;
  interactions?: number;
  avgResolutionTime?: string;
  avgResolutionSeconds?: number;
  escalationRate?: number;
  escalatedTickets?: number;
  debonairsSales?: number;
  cheeseSales?: number;
  cheeseUpsellPercentage?: number;
  creditsDiscounts?: number;
  fcr?: number; 
}

export interface Kpis {
  etiquette?: number;
  solving?: number;
  product?: number;
  resolution?: number;
}

export interface AgentEval {
  id: string;
  kpis: Kpis;
  date: string;
  callReceivedDate?: string;
  evaluator?: string;
  called?: string;
  callType?: string;
  duration?: string;
  durationSeconds?: number;
  overallRating?: number;
  score: number;
  positivePoints?: string;
  improvementAreas?: string;
  comments?: string;
  // Add these new fields to match your spreadsheet
  fcr?: number;          // First Call Resolution score
  resolution?: number;   // Resolution score
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AgentStatus;
  avatarUrl: string;
  history: DailyStats[];
  evaluations: AgentEval[];
  department?: string;
  shiftStart?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export interface ValidUser {
  email: string;
  password: string;
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}