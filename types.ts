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
  cheeseUpsellPercentage?: number;
}

export interface Kpis {
  capture: number;
  etiquette: number;
  solving: number;
  product: number;
  promo?: number;
  upsell?: number;
}

export interface AgentEval {
  id: string;
  kpis: Kpis;
  date: string;
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
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AgentStatus;
  avatarUrl: string;
  history: DailyStats[];
  evaluations: AgentEval[]; // This uses AgentEval, which is correct
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

// FIXED: This should match AgentEval structure since that's what you're using
export interface Evaluation extends AgentEval {
  // This extends AgentEval, so it inherits all its properties
  // You can add any additional fields specific to Evaluation here if needed
}

// OR if you don't want to use extends, define it explicitly:
// export interface Evaluation {
//   kpis: Kpis;
//   date: string;
//   evaluator?: string;
//   score: number;
//   positivePoints?: string;
//   improvementAreas?: string;
//   comments?: string;
//   id?: string;
// }
