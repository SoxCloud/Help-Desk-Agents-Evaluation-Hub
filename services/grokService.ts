/// <reference types="vite/client" />
import { Agent, AgentEval, DailyStats } from "../types";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ VITE_GROQ_API_KEY is missing from .env file");
}

const AVAILABLE_MODELS = {
  FAST: "llama-3.3-70b-versatile",
  BALANCED: "llama-3.1-8b-instant",
  POWERFUL: "mixtral-8x7b-32768",
};

const calculateAgentStats = (history: DailyStats[]) => {
  if (!history || history.length === 0) {
    return { totalCalls: 0, totalTickets: 0, solvedTickets: 0, avgFCR: 0, avgResolution: 0 };
  }
  
  const totals = history.reduce((acc, day) => ({
    calls: acc.calls + (day.answeredCalls || 0) + (day.abandonedCalls || 0),
    tickets: acc.tickets + (day.totalTickets || 0),
    solved: acc.solved + (day.solvedTickets || 0),
    fcr: acc.fcr + (day.fcr || 0),
    resolutionTime: acc.resolutionTime + (day.avgResolutionSeconds || 0),
  }), { calls: 0, tickets: 0, solved: 0, fcr: 0, resolutionTime: 0 });

  return {
    totalCalls: totals.calls,
    totalTickets: totals.tickets,
    solvedTickets: totals.solved,
    avgFCR: history.length > 0 ? Math.round(totals.fcr / history.length) : 0,
    avgResolution: history.length > 0 ? Math.round(totals.resolutionTime / history.length) : 0,
  };
};

export const generateCoachingFeedback = async (agent: Agent, latestEval?: AgentEval, history?: DailyStats[]) => {
  if (!latestEval) {
    return "👋 Welcome! Complete an evaluation to receive personalized coaching.";
  }

  if (!API_KEY) {
    return "AI Coach is not configured. Please add your Groq API key to the .env file.";
  }

  try {
    const stats = history ? calculateAgentStats(history) : calculateAgentStats(agent.history || []);
    
    const prompt = `
You are an expert Call Center Performance Coach. Analyze this agent's performance data:

Agent: ${agent.name}

📞 CALL & TICKET STATS:
- Total Calls Handled: ${stats.totalCalls}
- Total Tickets: ${stats.totalTickets}
- Tickets Solved: ${stats.solvedTickets}
- Average FCR (First Call Resolution): ${stats.avgFCR}%
- Avg Resolution Time: ${stats.avgResolution} seconds

📊 EVALUATION SCORES:
- Overall CSAT: ${latestEval.score}%
- Product Knowledge: ${latestEval.kpis?.product || 0}/100
- Phone Etiquette: ${latestEval.kpis?.etiquette || 0}/100
- Problem Solving: ${latestEval.kpis?.solving || 0}/100
- Resolution: ${latestEval.kpis?.resolution || 0}/100
- FCR: ${latestEval.fcr || 0}%

💬 Evaluator Feedback: "${latestEval.comments || latestEval.positivePoints || 'No comments'}"

Write ONE concise, motivating paragraph (2-3 sentences) that:
1. Mentions something they're doing well with calls/tickets OR evaluations
2. Provides ONE specific, actionable tip for improvement
3. Ends with an encouraging note
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: "You are a professional call center coach providing brief, actionable feedback. Keep responses under 3 sentences and always be encouraging." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
      mode: 'cors'
    });

    console.log("Groq API response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      
      if (response.status === 400) {
        console.log("Trying fallback model...");
        const fallbackResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [
              { role: "system", content: "You are a professional call center coach providing brief, actionable feedback." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 150
          })
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return fallbackData.choices[0].message.content.trim();
        }
      }
      
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
    
  } catch (error: any) {
    console.error("Groq API Error:", error.message || error);
    if (!API_KEY) {
      return "⚠️ AI Coach not configured. Please add VITE_GROQ_API_KEY to .env file.";
    }
    if (error.message?.includes('CORS') || error.message?.includes('fetch')) {
      return "⚠️ CORS issue detected. For local development, please use a CORS proxy or deploy the app.";
    }
    return "⚠️ AI Coach is having trouble connecting. Please try again in a moment.";
  }
};

export const generateTeamInsights = async (agents: Agent[]) => {
  if (!API_KEY) {
    return "AI Coach is not configured. Please add your Groq API key to the .env file.";
  }

  try {
    // Calculate team stats
    const teamStats = {
      totalAgents: agents.length,
      totalCalls: 0,
      totalTickets: 0,
      totalSolved: 0,
      totalFCR: 0,
      avgCSAT: 0,
      avgEtiquette: 0,
      avgProduct: 0,
      avgSolving: 0,
      avgResolution: 0,
      topPerformer: { name: '', score: 0 },
      needsHelp: { name: '', score: 100 },
    };

    let evalCount = 0;

    agents.forEach(agent => {
      // Calculate agent stats
      const totalCalls = agent.history.reduce((s, h) => s + (h.answeredCalls || 0) + (h.abandonedCalls || 0), 0);
      const totalTickets = agent.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
      const solvedTickets = agent.history.reduce((s, h) => s + (h.solvedTickets || 0), 0);
      const totalFCR = agent.history.reduce((s, h) => s + (h.fcr || 0), 0);
      const avgFCR = agent.history.length > 0 ? totalFCR / agent.history.length : 0;

      teamStats.totalCalls += totalCalls;
      teamStats.totalTickets += totalTickets;
      teamStats.totalSolved += solvedTickets;
      teamStats.totalFCR += avgFCR;

      // Get latest evaluation
      if (agent.evaluations.length > 0) {
        const latestEval = agent.evaluations[agent.evaluations.length - 1];
        const score = latestEval.score || 0;
        
        teamStats.avgCSAT += score;
        teamStats.avgEtiquette += latestEval.kpis?.etiquette || 0;
        teamStats.avgProduct += latestEval.kpis?.product || 0;
        teamStats.avgSolving += latestEval.kpis?.solving || 0;
        teamStats.avgResolution += latestEval.kpis?.resolution || 0;
        evalCount++;

        if (score > teamStats.topPerformer.score) {
          teamStats.topPerformer = { name: agent.name, score };
        }
        if (score < teamStats.needsHelp.score) {
          teamStats.needsHelp = { name: agent.name, score };
        }
      }
    });

    // Calculate averages
    if (evalCount > 0) {
      teamStats.avgCSAT = Math.round(teamStats.avgCSAT / evalCount);
      teamStats.avgEtiquette = Math.round(teamStats.avgEtiquette / evalCount);
      teamStats.avgProduct = Math.round(teamStats.avgProduct / evalCount);
      teamStats.avgSolving = Math.round(teamStats.avgSolving / evalCount);
      teamStats.avgResolution = Math.round(teamStats.avgResolution / evalCount);
    }
    teamStats.totalFCR = agents.length > 0 ? Math.round(teamStats.totalFCR / agents.length) : 0;

    const prompt = `
You are an expert Call Center Team Manager. Analyze this team's performance data and provide actionable insights:

📊 TEAM OVERVIEW:
- Total Agents: ${teamStats.totalAgents}
- Total Calls Handled: ${teamStats.totalCalls}
- Total Tickets: ${teamStats.totalTickets}
- Tickets Solved: ${teamStats.totalSolved}
- Average Team FCR: ${teamStats.totalFCR}%
- Average CSAT Score: ${teamStats.avgCSAT}%
- Evaluations Analyzed: ${evalCount}

📈 KPI BREAKDOWN (Average Scores):
- Phone Etiquette: ${teamStats.avgEtiquette}%
- Product Knowledge: ${teamStats.avgProduct}%
- Problem Solving: ${teamStats.avgSolving}%
- Resolution: ${teamStats.avgResolution}%
- FCR: ${teamStats.totalFCR}%

🏆 TOP PERFORMER: ${teamStats.topPerformer.name} (${teamStats.topPerformer.score}%)
⚠️ NEEDS ATTENTION: ${teamStats.needsHelp.name} (${teamStats.needsHelp.score}%)

Provide a concise analysis (3-4 sentences) that:
1. Identifies the team's strongest area
2. Highlights the biggest area for improvement
3. Provides ONE specific team-wide recommendation
4. Gives an encouraging closing note
`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { 
            role: "system", 
            content: "You are a professional call center team manager providing data-driven insights. Be specific and actionable in your feedback." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
      mode: 'cors'
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      
      if (response.status === 400) {
        const fallbackResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [
              { role: "system", content: "You are a professional call center team manager providing data-driven insights." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 200
          })
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return fallbackData.choices[0].message.content.trim();
        }
      }
      
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
    
  } catch (error: any) {
    console.error("Groq API Error:", error.message || error);
    if (!API_KEY) {
      return "⚠️ AI Coach not configured. Please add VITE_GROQ_API_KEY to .env file.";
    }
    if (error.message?.includes('CORS') || error.message?.includes('fetch')) {
      return "⚠️ CORS issue detected. For local development, please use a CORS proxy or deploy the app.";
    }
    return "⚠️ AI Coach is having trouble connecting. Please try again in a moment.";
  }
};