/// <reference types="vite/client" />
import { Agent, Evaluation } from "../types";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ VITE_GROQ_API_KEY is missing from .env file");
}

// List of currently available free models on Groq (as of March 2026)
const AVAILABLE_MODELS = {
  FAST: "llama-3.3-70b-versatile",     // Fast, versatile model
  BALANCED: "llama-3.1-8b-instant",    // Good balance of speed and quality
  POWERFUL: "mixtral-8x7b-32768",      // More powerful, slightly slower
};

export const generateCoachingFeedback = async (agent: Agent, latestEval?: Evaluation) => {
  if (!latestEval) {
    return "👋 Welcome! Complete an evaluation to receive personalized coaching.";
  }

  if (!API_KEY) {
    return "AI Coach is not configured. Please add your Groq API key to the .env file.";
  }

  try {
    const prompt = `
      You are an expert Call Center Performance Coach. Analyze this agent's evaluation:
      
      Agent: ${agent.name}
      Overall Score: ${latestEval.score}%
      
      Performance Metrics:
      - Product Knowledge: ${latestEval.kpis?.product || 0}/100
      - Phone Etiquette: ${latestEval.kpis?.etiquette || 0}/100
      - Problem Solving: ${latestEval.kpis?.solving || 0}/100
      - Upselling: ${latestEval.kpis?.upsell || 0}/100
      - Promotion: ${latestEval.kpis?.promo || 0}/100
      - Information Capture: ${latestEval.kpis?.capture || 0}/100
      
      Feedback: "${latestEval.comments || latestEval.positivePoints || ''}"

      Write ONE concise, motivating paragraph (2-3 sentences) that:
      1. Acknowledges their strongest skill
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
        // Using llama-3.1-8b-instant which is currently available
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
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error:", errorData);
      
      // Try fallback model if first one fails
      if (response.status === 400) {
        console.log("Trying fallback model...");
        const fallbackResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mixtral-8x7b-32768", // Fallback model
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
    console.error("Groq API Error:", error);
    return "✨ The AI Coach is taking a quick break. Please try again in a moment!";
  }
};