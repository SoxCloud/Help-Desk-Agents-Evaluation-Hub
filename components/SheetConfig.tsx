import { Agent, AgentStatus, UserRole } from "../types";

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
  // DailyStats: combined view of per‑agent / per‑day metrics
  const [dailyData, evalData, formData] = await Promise.all([
    fetchTabCsv("AgentsV1"),
    fetchTabCsv("DailyStatsV1"),
    fetchTabCsv("CallEvaluationsV1"),
   fetchTabCsv("FormData"),
  ]);

  const agentsMap: Record<string, Agent> = {};

  // 1. Process CallEvaluations (Mapping from image_141a5a)
  evalData.slice(1).forEach((row) => {
    // A:agent, B:email, D:Date, E:evaluator, H:Prod, I:Etiquette, J:Problem, K:Upsell, L:Promo, M:Capture, O:Pos, P:Improv, Q:Rating
    const [
      name,
      email,
      ,
      date,
      evaluator,
      ,
      ,
      prod,
      etiquette,
      problem,
      upsell,
      promo,
      capture,
      comments,
      positive,
      improvement,
      rating,
    ] = row;

    if (!email || email === "email" || isNaN(parseFloat(rating))) return; // Skip headers/empty

    if (!agentsMap[email]) {
      agentsMap[email] = {
        id: email,
        name,
        email,
        role: UserRole.AGENT,
        status: AgentStatus.OFFLINE,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        history: [],
        evaluations: [],
      };
    }

    agentsMap[email].evaluations.push({
      date: normalizeDate(date),
      evaluator,
      score: (parseFloat(rating) / 5) * 100, // 1-5 scale to 100%
      positivePoints: positive,
      improvementAreas: improvement,
      comments,
      kpis: {
        product: parseInt(prod) || 0,
        etiquette: parseInt(etiquette) || 0,
        solving: parseInt(problem) || 0,
        upsell: parseInt(upsell) || 0,
        promo: parseInt(promo) || 0,
        capture: parseInt(capture) || 0,
      },
    });
  });

  // 2. Process DailyStats tab (one row per agent per day)
  // Expected header (row 1):
  // Agent | Date | Answered calls | Abandoned calls | Transactions | Total tickets | Interactions | Solved tickets | Escalated tickets | AHT (sec) | Avg resolution time (sec) | Resolution rate | Escalation rate | Cheese upsell %
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
      (a) => normalizeName(a.name) === normalizeName(name),
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
        resolutionRate: parseFloat(resolutionRate) || 0,
        solvedTickets: parseInt(solvedTickets) || 0,
        escalatedTickets: parseInt(escalatedTickets) || 0,
        avgResolutionTime: avgResolutionSeconds
          ? `${avgResolutionSeconds}s`
          : "0s",
        escalationRate: parseFloat(escalationRate) || 0,
        cheeseUpsellPercentage: parseFloat(cheeseUpsellPct) || 0,
      });
    }
  });

  return { agents: Object.values(agentsMap) };
};
