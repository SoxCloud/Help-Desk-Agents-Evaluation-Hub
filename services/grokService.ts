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
- Upselling: ${latestEval.kpis?.upsell || 0}/100
- Promotion: ${latestEval.kpis?.promo || 0}/100
- Information Capture: ${latestEval.kpis?.capture || 0}/100

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