import { Agent, AgentStatus, UserRole, AgentEval } from "../types";

const SHEET_ID = "1_MEcMoGiXuYhmxwKv0-Cc0SryMYVIpVOMO6ea2MrKwY";

// HELPER: Normalizes names to handle "Claire M" vs "Claire Makeleni"
const normalizeName = (name: string) => name.trim().toLowerCase().split(" ")[0];

const normalizeDate = (dateStr: string): string => {
  if (
    !dateStr ||
    dateStr === "undefined" ||
    dateStr.trim() === "" ||
    dateStr.includes("Date")
  )
    return "";
  const cleanDate = dateStr.trim();
  if (cleanDate.includes("/")) {
    const parts = cleanDate.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return cleanDate;
};

// Helper to preserve leading zeros in cellphone numbers
const preserveCellphoneNumber = (value: string): string => {
  if (!value || value === "undefined") return "";
  const strValue = value.toString();
  // If it's a number without leading zero, add it back
  if (strValue.match(/^\d+$/) && strValue.length === 9) {
    return `0${strValue}`;
  }
  return strValue;
};

async function fetchTabCsv(tabName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${tabName}`;
  const response = await fetch(url);
  const text = await response.text();
  return text
    .split("\n")
    .map((row) =>
      row
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((cell) => cell.replace(/"/g, "").trim()),
    );
}

export const fetchAllDashboardData = async () => {
  // Fetch all necessary tabs
  const [dailyData, evalData, formData] = await Promise.all([
    fetchTabCsv("AgentsV1"),
    fetchTabCsv("DailyStatsV1"),
    fetchTabCsv("CallEvaluationsV1"), // Your evaluations sheet
    fetchTabCsv("FormData"),
  ]);

  const agentsMap: Record<string, Agent> = {};

  // 1. Process CallEvaluations tab with exact column mapping from your image
  evalData.slice(1).forEach((row) => {
    // Based on your image columns:
    // agent | email | callId | Date | evaluator | callType | duration | 
    // productKnowledgeScore | phoneEtiquetteScore | problemSolvingScore | 
    // upsellingScore | promotionScore | infoCapturingScore | 
    // evaluatorComment | positivePoints | improvementAreas | overallRating
    const [
      name,
      email,
      callId,
      date,
      evaluator,
      callType,
      duration,
      productKnowledgeScore,
      phoneEtiquetteScore,
      problemSolvingScore,
      upsellingScore,
      promotionScore,
      infoCapturingScore,
      evaluatorComment,
      positivePoints,
      improvementAreas,
      overallRating,
    ] = row;

    // Skip if no valid email
    if (!email || email === "email" || !email.includes('@')) return;

    // Create agent if doesn't exist
    if (!agentsMap[email]) {
      agentsMap[email] = {
        id: email,
        name: name || "Unknown Agent",
        email,
        role: UserRole.AGENT,
        status: AgentStatus.OFFLINE,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Agent")}&background=random`,
        history: [],
        evaluations: [],
      };
    }

    // Parse duration from HH:MM:SS format to seconds
    let durationSeconds = 0;
    if (duration) {
      const timeParts = duration.split(':').map(Number);
      if (timeParts.length === 3) {
        durationSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
      } else if (timeParts.length === 2) {
        durationSeconds = timeParts[0] * 60 + timeParts[1];
      }
    }

    // Calculate score from overallRating (1-5 scale to percentage)
    const rating = parseFloat(overallRating) || 0;
    const score = rating * 20; // Convert 1-5 to 0-100

    // Preserve the cellphone number with leading zero
    const preservedCallId = preserveCellphoneNumber(callId || "");

    // Create evaluation object with all 7 KPIs from your sheet
    const evaluation: AgentEval = {
      id: preservedCallId || `eval-${Date.now()}-${Math.random()}`,
      date: normalizeDate(date),
      evaluator: evaluator || undefined,
      callType: callType || undefined,
      duration: duration || undefined,
      durationSeconds: durationSeconds || undefined,
      overallRating: rating || undefined,
      score: score,
      positivePoints: positivePoints || undefined,
      improvementAreas: improvementAreas || undefined,
      comments: evaluatorComment || positivePoints || improvementAreas || "No comments recorded",
      kpis: {
        product: parseInt(productKnowledgeScore) || 0,
        etiquette: parseInt(phoneEtiquetteScore) || 0,
        solving: parseInt(problemSolvingScore) || 0,
        upsell: parseInt(upsellingScore) || 0,
        promo: parseInt(promotionScore) || 0,
        capture: parseInt(infoCapturingScore) || 0,
      },
    };

    agentsMap[email].evaluations.push(evaluation);
  });

  // 2. Process DailyStats tab (one row per agent per day)
  dailyData.slice(1).forEach((row) => {
    const [
      name,
      date,
      answered,
      abandoned,
      transactions,
      totalTickets,
      interactions,
      solvedTickets,
      escalatedTickets,
      ahtSeconds,
      avgResolutionSeconds,
      resolutionRate,
      escalationRate,
      cheeseUpsellPct,
    ] = row;

    const agent = Object.values(agentsMap).find(
      (a) => normalizeName(a.name) === normalizeName(name || ""),
    );

    if (agent) {
      agent.history.push({
        date: normalizeDate(date),
        answeredCalls: parseInt(answered) || 0,
        abandonedCalls: parseInt(abandoned) || 0,
        transactions: parseInt(transactions) || 0,
        totalTickets: parseInt(totalTickets) || 0,
        interactions: parseInt(interactions) || 0,
        aht: ahtSeconds ? `${ahtSeconds}s` : "0s",
        ahtSeconds: parseInt(ahtSeconds) || 0,
        resolutionRate: parseFloat(resolutionRate) || 0,
        solvedTickets: parseInt(solvedTickets) || 0,
        escalatedTickets: parseInt(escalatedTickets) || 0,
        avgResolutionTime: avgResolutionSeconds
          ? `${avgResolutionSeconds}s`
          : "0s",
        avgResolutionSeconds: parseInt(avgResolutionSeconds) || 0,
        escalationRate: parseFloat(escalationRate) || 0,
        cheeseUpsellPercentage: parseFloat(cheeseUpsellPct) || 0,
      });
    }
  });

  return { agents: Object.values(agentsMap) };
};