/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Agent, Evaluation } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("⚠️  VITE_GEMINI_API_KEY is missing from .env file");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");

export const generateCoachingFeedback = async (agent: Agent, latestEval: Evaluation | undefined) => {
  if (!latestEval) {
    return "Select a date range with evaluation data to generate AI coaching.";
  }

  if (!API_KEY) {
    return "AI Coach is not configured. Please add VITE_GEMINI_API_KEY to your .env file.";
  }

  try {
    // Using gemini-2.0-flash - Best free tier model with 1,500 requests/day
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      You are an expert Call Center Performance Coach. Analyze this agent's latest evaluation:
      
      Agent: ${agent.name}
      Overall Score: ${latestEval.score}%
      
      Performance Metrics:
      - Product Knowledge: ${latestEval.kpis?.product || 0}/100
      - Phone Etiquette: ${latestEval.kpis?.etiquette || 0}/100
      - Problem Solving: ${latestEval.kpis?.solving || 0}/100
      - Information Capture: ${latestEval.kpis?.capture || 0}/100
      
      Feedback:
      - Positive Points: "${latestEval.positivePoints || 'Good overall performance'}"
      - Areas to Improve: "${latestEval.improvementAreas || 'Continue developing skills'}"

      Write ONE concise, motivating paragraph (2-3 sentences) that:
      1. Acknowledges their strongest skill
      2. Provides ONE specific, actionable tip for improvement
      3. Ends with an encouraging note

      Keep it professional, warm, and under 50 words. No bullet points or markdown.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error: any) {
    console.error("Gemini API Error:", error?.message || error);
    
    // User-friendly fallback messages based on error type
    if (error?.message?.includes("API key")) {
      return "🔑 Invalid API key. Please check your Gemini API configuration.";
    } else if (error?.message?.includes("quota") || error?.message?.includes("rate limit")) {
      return "⏳ Daily coaching limit reached. Try again tomorrow or upgrade your API tier.";
    } else if (error?.message?.includes("404") || error?.message?.includes("model")) {
      return "🤖 Model temporarily unavailable. Please try again in a few minutes.";
    } else {
      return "✨ AI Coach is recharging. Click refresh to try again!";
    }
  }
};