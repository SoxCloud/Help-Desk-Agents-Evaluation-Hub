// sheetService.ts - UPDATED COLUMN MAPPING

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

// Helper to parse monetary values (remove R, spaces, commas)
const parseMoney = (value: string): number => {
  if (!value) return 0;
  // Remove 'R', spaces, commas and convert to number
  const cleanValue = value.toString().replace(/[R,\s]/g, '');
  return parseFloat(cleanValue) || 0;
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
    fetchTabCsv("FormData"),
  ]);

  const agentsMap: Record<string, Agent> = {};
  const nameToEmail: Record<string, string> = {};

  // Helper to find column indices by exact match or case-insensitive
  const getColumnIndices = (headers: string[]) => {
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
    
    const findColumn = (candidates: string[]): number => {
      for (const candidate of candidates) {
        const candLower = candidate.toLowerCase();
        // Exact match first
        let idx = normalizedHeaders.findIndex(h => h === candLower);
        if (idx !== -1) return idx;
        // Then try prefix match (e.g., "agent" matches "agent Sogcinwa...")
        idx = normalizedHeaders.findIndex(h => h.startsWith(candLower));
        if (idx !== -1) return idx;
      }
      return -1;
    };
    
    return { findColumn };
  };

  // 1) Build agents from AgentsV1 (source of truth)
  const agentHeaders = agentsV1[0] ?? [];
  const aIdx = getColumnIndices(agentHeaders);
  const idxName = aIdx.findColumn(["name", "agent"]);
  const idxEmail = aIdx.findColumn(["email"]);
  const idxDepartment = aIdx.findColumn(["department"]);

  agentsV1.slice(1).forEach((row) => {
    const name = (row[idxName] ?? "").trim();
    const emailRaw = (row[idxEmail] ?? "").trim();
    const email = emailRaw.toLowerCase();
    if (!email || email === "email") return;

    const department = (row[idxDepartment] ?? "").trim();
    agentsMap[email] = {
      id: email,
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

  // 2) FormData - Parsing form response sheet
  const evalHeaders = evalV1[0] ?? [];
  const eIdx = getColumnIndices(evalHeaders);
  
  const idxEvalDate = eIdx.findColumn(["Date"]);
  const idxAgentName = eIdx.findColumn(["Column 1"]);
  const idxFormEmail = eIdx.findColumn(["Email"]);
  const idxCallType = eIdx.findColumn(["Call Type"]);
  const idxCallerId = eIdx.findColumn(["caller ID"]);
  const idxPhoneEtiquette = eIdx.findColumn(["Phone etiquette"]);
  const idxProblemSolving = eIdx.findColumn(["Problem solving"]);
  const idxProductKnowledge = eIdx.findColumn(["Product knowladge"]);
  const idxResolution = eIdx.findColumn(["Overall was the customer fully assisted."]);
  const idxEvaluatorEmail = eIdx.findColumn(["Email address"]);
  const idxComment = eIdx.findColumn(["Evaluators comment"]);

  console.log("FormData column indices:", {
    headers: evalHeaders,
    date: idxEvalDate,
    agentName: idxAgentName,
    email: idxEmail,
    callType: idxCallType,
    callerId: idxCallerId,
    phoneEtiquette: idxPhoneEtiquette,
    problemSolving: idxProblemSolving,
    productKnowledge: idxProductKnowledge,
    resolution: idxResolution,
    evaluatorEmail: idxEvaluatorEmail,
    comment: idxComment,
  });

  let rowNum = 0;
  evalV1.slice(1).forEach((row) => {
    rowNum++;

    const emailRaw = (row[idxFormEmail] ?? "").trim();
    let email = emailRaw ? emailRaw.toLowerCase() : "";
    
    if (!email) {
      const agentName = (row[idxAgentName] ?? "").trim();
      if (agentName) email = nameToEmail[normalizeName(agentName)];
    }

    if (!email) return;

    const agent = agentsMap[email];
    if (!agent) return;

    const rawPhoneEtiquette = (row[idxPhoneEtiquette] ?? "").trim();
    const rawProblemSolving = (row[idxProblemSolving] ?? "").trim();
    const rawProductKnowledge = (row[idxProductKnowledge] ?? "").trim();
    const rawResolution = (row[idxResolution] ?? "").trim();

    const phoneEtiquette = rawPhoneEtiquette && !isNaN(Number(rawPhoneEtiquette)) ? parseInt(rawPhoneEtiquette, 10) : undefined;
    const problemSolving = rawProblemSolving && !isNaN(Number(rawProblemSolving)) ? parseInt(rawProblemSolving, 10) : undefined;
    const productKnowledge = rawProductKnowledge && !isNaN(Number(rawProductKnowledge)) ? parseInt(rawProductKnowledge, 10) : undefined;
    const resolution = rawResolution && !isNaN(Number(rawResolution)) ? parseInt(rawResolution, 10) : undefined;

    const scoredKpis = [phoneEtiquette, problemSolving, productKnowledge, resolution].filter(v => v !== undefined);
    const score = scoredKpis.length > 0 ? Math.round(scoredKpis.reduce((a, b) => a + b, 0) / scoredKpis.length) : 0;

    const comment = (row[idxComment] ?? "").trim();
    const callerId = (row[idxCallerId] ?? "").trim();
    const evaluatorEmail = (row[idxEvaluatorEmail] ?? "").trim();

    const evaluation: any = {
      id: callerId || `form-${rowNum}`,
      date: normalizeDate((row[idxEvalDate] ?? "").trim()),
      evaluator: evaluatorEmail || undefined,
      called: callerId || undefined,
      callType: (row[idxCallType] ?? "").trim() || undefined,
      score: score,
      comments: comment || undefined,
      kpis: {
        product: productKnowledge,
        etiquette: phoneEtiquette,
        solving: problemSolving,
        resolution: resolution,
      },
    };

    agent.evaluations.push(evaluation);
    console.log(`Added evaluation for ${agent.name} from FormData, total: ${agent.evaluations.length}`);
  });

  // 3) DailyStatsV1 (one row per agent per day)
  const dailyHeaders = dailyV1[0] ?? [];
  const dIdx = getColumnIndices(dailyHeaders);
  const idxDailyAgent = dIdx.findColumn(["agent"]);
  const idxDailyEmail = dIdx.findColumn(["email"]);
  const idxDailyDate = dIdx.findColumn(["date"]);
  const idxAnswered = dIdx.findColumn(["answered calls", "answeredcalls", "answered"]);
  const idxAbandoned = dIdx.findColumn(["abandoned calls", "abandonedcalls", "abandoned"]);
  const idxTransactions = dIdx.findColumn(["transactions"]);
  const idxAht = dIdx.findColumn(["aht (sec)", "aht(sec)", "aht"]);
  const idxResolutionRate = dIdx.findColumn(["resolution rate"]);
  const idxSolved = dIdx.findColumn(["solved tickets", "solved"]);
  const idxTotalTickets = dIdx.findColumn(["total tickets", "totaltickets"]);
  const idxInteractions = dIdx.findColumn(["interactions"]);
  const idxAvgResolution = dIdx.findColumn(["avg resolution time (sec)", "average resolution time", "avg resolution time"]);
  const idxEscalationRate = dIdx.findColumn(["escalation rate"]);
  const idxEscalated = dIdx.findColumn(["escalated tickets", "escalated"]);
  const idxDebonairsSales = dIdx.findColumn(["debsales", "deb sales", "debonairs", "deb"]);
  const idxCheeseSales = dIdx.findColumn(["cheese sales", "cheese"]);
  const idxCreditsDiscounts = dIdx.findColumn(["credits/discounts", "credits", "discounts"]);

  dailyV1.slice(1).forEach((row) => {
    const agentName = (row[idxDailyAgent] ?? "").trim();
    const emailRaw = (idxDailyEmail !== -1 ? (row[idxDailyEmail] ?? "").trim() : "").trim();
    const email = emailRaw ? emailRaw.toLowerCase() : nameToEmail[normalizeName(agentName)];
    if (!email) return;

    const agent = agentsMap[email];
    if (!agent) return;

    const ahtSeconds = parseTimeToSeconds((row[idxAht] ?? "").trim());
    const avgResolutionSeconds = parseTimeToSeconds((row[idxAvgResolution] ?? "").trim());
    
    const debonairsSales = parseMoney(row[idxDebonairsSales] ?? "");
    const cheeseSales = parseMoney(row[idxCheeseSales] ?? "");
    const creditsDiscounts = parseInt(row[idxCreditsDiscounts] ?? "0", 10) || 0;

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
      debonairsSales: debonairsSales || undefined,
      cheeseSales: cheeseSales || undefined,
      creditsDiscounts: creditsDiscounts || undefined,
    });
  });

  console.log("Final agents map:", Object.keys(agentsMap).map(email => ({
    email,
    name: agentsMap[email].name,
    evaluationsCount: agentsMap[email].evaluations.length
  })));

  const firstAgent = Object.values(agentsMap)[0];
  if (firstAgent?.evaluations[0]) {
    console.log("First evaluation in final data:", firstAgent.evaluations[0]);
  }

  return { agents: Object.values(agentsMap) };
};