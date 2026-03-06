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

const parseTimeToSeconds = (value: string): number => {
  if (!value) return 0;
  const v = value.trim();
  if (!v) return 0;

  // strip a trailing "s" if present (e.g. "92s")
  const withoutSuffix = v.endsWith("s") ? v.slice(0, -1) : v;

  // plain number (seconds)
  if (/^\d+(\.\d+)?$/.test(withoutSuffix)) {
    return Math.round(parseFloat(withoutSuffix));
  }

  // hh:mm:ss or mm:ss
  const parts = withoutSuffix.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
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
  const [agentsV1, dailyV1, evalV1] = await Promise.all([
    fetchTabCsv("AgentsV1"),
    fetchTabCsv("DailyStatsV1"),
    fetchTabCsv("CallEvaluationsV1"),
  ]);

  const agentsMap: Record<string, Agent> = {};
  const nameToEmail: Record<string, string> = {};

  const headerIndex = (headers: string[]) => {
    const normalized = headers.map((h) => h.trim().toLowerCase());
    const get = (candidates: string[]) =>
      candidates
        .map((c) => normalized.indexOf(c.toLowerCase()))
        .find((idx) => idx !== -1) ?? -1;
    return { get };
  };

  // 1) Build agents from AgentsV1 (source of truth)
  // Expected header: agentId | name | email | department
  const agentHeaders = agentsV1[0] ?? [];
  const aIdx = headerIndex(agentHeaders);
  const idxName = aIdx.get(["name"]);
  const idxEmail = aIdx.get(["email"]);
  const idxDepartment = aIdx.get(["department"]);

  agentsV1.slice(1).forEach((row) => {
    const name = (row[idxName] ?? "").trim();
    const emailRaw = (row[idxEmail] ?? "").trim();
    const email = emailRaw.toLowerCase();
    if (!email || email === "email") return;

    const department = (row[idxDepartment] ?? "").trim();
    agentsMap[email] = {
      id: email, // keep login method: id == email
      name,
      email,
      role: UserRole.AGENT,
      status: AgentStatus.OFFLINE,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      history: [],
      evaluations: [],
      department: department || undefined,
    };

    if (name) nameToEmail[normalizeName(name)] = email;
  });

  // 2) CallEvaluationsV1 (one row per evaluated call)
  const evalHeaders = evalV1[0] ?? [];
  const eIdx = headerIndex(evalHeaders);
  const idxEvalAgent = eIdx.get(["agent"]);
  const idxEvalEmail = eIdx.get(["email"]);
  const idxCalled = eIdx.get(["called", "dialed", "phone"]);
  const idxEvalDate = eIdx.get(["date"]);
  const idxEvaluator = eIdx.get(["evaluator"]);
  const idxCallType = eIdx.get(["calltype", "call type"]);
  const idxDuration = eIdx.get(["duration"]);
  const idxProduct = eIdx.get(["productknowledgescore", "product knowledge score", "productknowledge", "product"]);
  const idxEtiquette = eIdx.get(["phoneetiquettescore", "phone etiquette score", "phoneetiquette", "etiquette"]);
  const idxProblem = eIdx.get(["problemsolvingscore", "problem solving score", "problemsolving", "problem"]);
  const idxUpsell = eIdx.get(["upsellingskillscore", "upsellingscore", "upselling", "upsell"]);
  const idxPromo = eIdx.get(["promotionbillscore", "promotion score", "promo"]);
  const idxCapture = eIdx.get(["infocapturingscore", "info capturing score", "infocapturing", "capture"]);
  const idxComment = eIdx.get(["evaluatorcomment", "evaluator comment", "comment", "comments"]);
  const idxPositive = eIdx.get(["positivepoints", "positive points"]);
  const idxImprove = eIdx.get(["improvementareas", "improvement areas", "improvement"]);
  const idxRating = eIdx.get(["overallrating", "overall rating", "rating"]);

  evalV1.slice(1).forEach((row) => {
    const agentName = (row[idxEvalAgent] ?? "").trim();
    const emailRaw = (row[idxEvalEmail] ?? "").trim();
    const email = emailRaw ? emailRaw.toLowerCase() : nameToEmail[normalizeName(agentName)];
    if (!email) return;

    const ratingRaw = (row[idxRating] ?? "").trim();
    const rating = parseFloat(ratingRaw);
    if (Number.isNaN(rating)) return;

    const agent = agentsMap[email];
    if (!agent) return;

    const durationSeconds = parseTimeToSeconds((row[idxDuration] ?? "").trim());

    agent.evaluations.push({
      date: normalizeDate((row[idxEvalDate] ?? "").trim()),
      evaluator: (row[idxEvaluator] ?? "").trim(),
      called: (row[idxCalled] ?? "").trim() || undefined,
      callType: (row[idxCallType] ?? "").trim() || undefined,
      durationSeconds: durationSeconds || undefined,
      overallRating: rating,
      score: (rating / 5) * 100,
      positivePoints: (row[idxPositive] ?? "").trim() || undefined,
      improvementAreas: (row[idxImprove] ?? "").trim() || undefined,
      comments: (row[idxComment] ?? "").trim() || undefined,
      kpis: {
        product: parseInt((row[idxProduct] ?? "").trim(), 10) || 0,
        etiquette: parseInt((row[idxEtiquette] ?? "").trim(), 10) || 0,
        solving: parseInt((row[idxProblem] ?? "").trim(), 10) || 0,
        upsell: parseInt((row[idxUpsell] ?? "").trim(), 10) || 0,
        promo: parseInt((row[idxPromo] ?? "").trim(), 10) || 0,
        capture: parseInt((row[idxCapture] ?? "").trim(), 10) || 0,
      },
    });
  });

  // 3) DailyStatsV1 (one row per agent per day)
  const dailyHeaders = dailyV1[0] ?? [];
  const dIdx = headerIndex(dailyHeaders);
  const idxDailyAgent = dIdx.get(["agent"]);
  const idxDailyEmail = dIdx.get(["email"]);
  const idxDailyDate = dIdx.get(["date"]);
  const idxAnswered = dIdx.get(["answered calls", "answeredcalls", "answered"]);
  const idxAbandoned = dIdx.get(["abandoned calls", "abandonedcalls", "abandoned"]);
  const idxTransactions = dIdx.get(["transactions"]);
  const idxAht = dIdx.get(["aht (sec)", "aht(sec)", "aht"]);
  const idxResolutionRate = dIdx.get(["resolution rate"]);
  const idxSolved = dIdx.get(["solved tickets", "solved"]);
  const idxTotalTickets = dIdx.get(["total tickets", "totaltickets"]);
  const idxInteractions = dIdx.get(["interactions"]);
  const idxAvgResolution = dIdx.get(["avg resolution time (sec)", "average resolution time", "avg resolution time"]);
  const idxEscalationRate = dIdx.get(["escalation rate"]);
  const idxEscalated = dIdx.get(["escalated tickets", "escalated"]);
  const idxCheese = dIdx.get(["cheese upsell %", "cheese upsell", "cheese"]);

  dailyV1.slice(1).forEach((row) => {
    const agentName = (row[idxDailyAgent] ?? "").trim();
    const emailRaw = (idxDailyEmail !== -1 ? (row[idxDailyEmail] ?? "").trim() : "").trim();
    const email = emailRaw ? emailRaw.toLowerCase() : nameToEmail[normalizeName(agentName)];
    if (!email) return;

    const agent = agentsMap[email];
    if (!agent) return;

    const ahtSeconds = parseTimeToSeconds((row[idxAht] ?? "").trim());
    const avgResolutionSeconds = parseTimeToSeconds((row[idxAvgResolution] ?? "").trim());

    agent.history.push({
      date: normalizeDate((row[idxDailyDate] ?? "").trim()),
      answeredCalls: parseInt((row[idxAnswered] ?? "").trim(), 10) || 0,
      abandonedCalls: parseInt((row[idxAbandoned] ?? "").trim(), 10) || 0,
      transactions: parseInt((row[idxTransactions] ?? "").trim(), 10) || 0,
      aht: ahtSeconds ? `${ahtSeconds}s` : "0s",
      ahtSeconds: ahtSeconds || undefined,
      resolutionRate: parseFloat((row[idxResolutionRate] ?? "").trim()) || 0,
      solvedTickets: parseInt((row[idxSolved] ?? "").trim(), 10) || 0,
      totalTickets: parseInt((row[idxTotalTickets] ?? "").trim(), 10) || 0,
      interactions: parseInt((row[idxInteractions] ?? "").trim(), 10) || 0,
      avgResolutionTime: avgResolutionSeconds ? `${avgResolutionSeconds}s` : "0s",
      avgResolutionSeconds: avgResolutionSeconds || undefined,
      escalationRate: parseFloat((row[idxEscalationRate] ?? "").trim()) || 0,
      escalatedTickets:
        idxEscalated !== -1
          ? parseInt((row[idxEscalated] ?? "").trim(), 10) || 0
          : undefined,
      cheeseUpsellPercentage:
        idxCheese !== -1 ? parseFloat((row[idxCheese] ?? "").trim()) || 0 : 0,
    });
  });

  return { agents: Object.values(agentsMap) };
};
