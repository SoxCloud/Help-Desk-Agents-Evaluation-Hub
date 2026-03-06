import { Agent, AgentStatus, UserRole } from './types';

// ==============================================================================
// ⚙️ SYSTEM CONFIGURATION
// ==============================================================================

export const GOOGLE_SHEET_ID = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQD959UiBDL42jofQwxD6K6O0YeRSSu6csKfg15kxFceRcXqPDSGbecdXgtcdfn8cd-Lz5DBqAu-1Ij/pub?output=csv"; 

export const APP_NAME = "OmniDesk Portal";

// ==============================================================================
// 👥 MOCK AGENTS (Aligned with Premium Dashboard Structure)
// ==============================================================================

export const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    email: 'sarah.j@dialndine.com',
    role: UserRole.AGENT,
    avatarUrl: 'https://picsum.photos/200/200?random=1',
    status: AgentStatus.ON_CALL,
    history: [{
      date: '2026-02-01',
      answeredCalls: 45,
      transactions: 46,
      missedCalls: 2,
      aht: '1m 30s',
      abandonedCalls: 0,
      resolutionRate: 0
    }],
    evaluations: [
      {
        score: 94,
        date: '2026-02-01',
        comments: "Sarah handled the high-pressure situation perfectly. Her product knowledge regarding the seasonal menu was impressive.",
        kpis: {
          capture: 95,
          etiquette: 98,
          solving: 90,
          product: 92
        }
      },
      {
        score: 88,
        date: '2026-01-30',
        comments: "Great energy. Try to capture the customer's phone number earlier in the call to prevent data loss.",
        kpis: {
          capture: 80,
          etiquette: 95,
          solving: 85,
          product: 92
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.c@dialndine.com',
    role: UserRole.AGENT,
    avatarUrl: 'https://picsum.photos/200/200?random=2',
    status: AgentStatus.ONLINE,
    history: [{
      date: '2026-02-01',
      answeredCalls: 52,
      transactions: 53,
      missedCalls: 0,
      aht: '1m 15s',
      abandonedCalls: 0,
      resolutionRate: 0
    }],
    evaluations: [
      {
        score: 91,
        date: '2026-02-01',
        comments: "Michael is extremely efficient. He manages to solve complex reservation issues in under 2 minutes consistently.",
        kpis: {
          capture: 88,
          etiquette: 90,
          solving: 95,
          product: 91
        }
      }
    ]
  },
  {
    id: '3',
    name: 'Jessica Dubrow',
    email: 'jessica.d@dialndine.com',
    role: UserRole.AGENT,
    avatarUrl: 'https://picsum.photos/200/200?random=3',
    status: AgentStatus.AWAY,
    history: [{
      date: '2026-02-01',
      answeredCalls: 30,
      transactions: 33,
      missedCalls: 5,
      aht: '2m 10s',
      abandonedCalls: 0,
      resolutionRate: 0
    }],
    evaluations: [
      {
        score: 78,
        date: '2026-02-01',
        comments: "Jessica needs to focus on 'closing' the call with the standard script. Her tone was helpful but lacked professional structure.",
        kpis: {
          capture: 98,
          etiquette: 75,
          solving: 70,
          product: 69
        }
      }
    ]
  },
  {
    id: 'admin',
    name: 'Call Center Admin',
    email: 'callcenter@dialndine.com',
    role: UserRole.ADMIN,
    avatarUrl: 'httpshttps://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff',
    status: AgentStatus.ONLINE,
    history: [],
    evaluations: []
  }
];