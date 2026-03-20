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
    fetchTabCsv("CallEvaluationsV1"),
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

  // 2) CallEvaluationsV1 - UPDATED MAPPING TO MATCH YOUR ACTUAL COLUMNS
  const evalHeaders = evalV1[0] ?? [];
  const eIdx = getColumnIndices(evalHeaders);
  
  // Map your exact column names from the image
  const idxEvalAgent = eIdx.findColumn(["agent"]);
  const idxEvalEmail = eIdx.findColumn(["email"]);
  const idxCalled = eIdx.findColumn(["callId"]);  // Changed from callid to callId
  const idxEvalDate = eIdx.findColumn(["Date"]);   // Capital D in Date
  const idxEvaluator = eIdx.findColumn(["evaluator"]);
  const idxCallType = eIdx.findColumn(["callType"]);
  const idxDuration = eIdx.findColumn(["duration"]);
  const idxPhoneEtiquette = eIdx.findColumn(["phoneEtiquetteScore"]);
  const idxProblemSolving = eIdx.findColumn(["problemSolvingScore"]);
  const idxProductKnowledge = eIdx.findColumn(["productKnowledgeScore"]);
  const idxFCR = eIdx.findColumn(["FCR"]);
  const idxUpselling = eIdx.findColumn(["upsellingScore"]);
  const idxPromotion = eIdx.findColumn(["promotionScore"]);
  const idxInfoCapturing = eIdx.findColumn(["infoCapturingScore"]);
  const idxResolution = eIdx.findColumn(["Resolution"]);
  const idxComment = eIdx.findColumn(["evaluatorComment"]);
  
  // For overall rating - if not present, we'll calculate from the scores
  const idxOverallRating = eIdx.findColumn(["overallRating", "overall rating", "rating"]);

  console.log("Column indices found:", {
    headers: evalHeaders,
    agent: idxEvalAgent,
    email: idxEvalEmail,
    callId: idxCalled,
    date: idxEvalDate,
    evaluator: idxEvaluator,
    callType: idxCallType,
    duration: idxDuration,
    phoneEtiquette: idxPhoneEtiquette,
    problemSolving: idxProblemSolving,
    productKnowledge: idxProductKnowledge,
    fcr: idxFCR,
    upselling: idxUpselling,
    promotion: idxPromotion,
    infoCapturing: idxInfoCapturing,
    resolution: idxResolution,
    comment: idxComment,
    overallRating: idxOverallRating
  });

  evalV1.slice(1).forEach((row) => {
    // Log the row to see what data is coming in
    console.log("Processing evaluation row:", row);
    
    const agentName = (row[idxEvalAgent] ?? "").trim();
    const emailRaw = (row[idxEvalEmail] ?? "").trim();
    let email = "";
    
    if (emailRaw) {
      email = emailRaw.toLowerCase();
    } else if (agentName) {
      email = nameToEmail[normalizeName(agentName)];
    }
    
    if (!email) {
      console.log("No email found for agent:", agentName);
      return;
    }

    const agent = agentsMap[email];
    if (!agent) {
      console.log("Agent not found in map for email:", email);
      return;
    }

    // Parse duration (value "20" means 20 seconds)
    const durationStr = (row[idxDuration] ?? "").trim();
    let durationSeconds = 0;
    if (durationStr) {
      durationSeconds = parseInt(durationStr, 10) || 0;
    }
    
    // Parse scores (from your example: Esther has all zeros)
    const phoneEtiquette = parseInt((row[idxPhoneEtiquette] ?? "0").trim(), 10) || 0;
    const problemSolving = parseInt((row[idxProblemSolving] ?? "0").trim(), 10) || 0;
    const productKnowledge = parseInt((row[idxProductKnowledge] ?? "0").trim(), 10) || 0;
    const fcr = parseInt((row[idxFCR] ?? "0").trim(), 10) || 0;
    const upselling = parseInt((row[idxUpselling] ?? "0").trim(), 10) || 0;
    const promotion = parseInt((row[idxPromotion] ?? "0").trim(), 10) || 0;
    const infoCapturing = parseInt((row[idxInfoCapturing] ?? "0").trim(), 10) || 0;
    const resolution = parseInt((row[idxResolution] ?? "0").trim(), 10) || 0;
    
    // Calculate overall score as average of all 6 KPIs
    const score = Math.round(
      (phoneEtiquette + problemSolving + productKnowledge + upselling + promotion + infoCapturing) / 6
    );
    
    // Try to get overall rating if it exists
    let overallRating: number | undefined;
    if (idxOverallRating !== -1) {
      const ratingRaw = (row[idxOverallRating] ?? "").trim();
      overallRating = parseFloat(ratingRaw) || undefined;
    }
    
    // Get comment (from your example: "Not acceptable you bil transferred the custom...")
    const comment = (row[idxComment] ?? "").trim();
    
    // Get callId (phone number)
    const called = (row[idxCalled] ?? "").trim();
    
    console.log("Parsed evaluation data:", {
      agent: agent.name,
      phoneEtiquette,
      problemSolving,
      productKnowledge,
      fcr,
      upselling,
      promotion,
      infoCapturing,
      resolution,
      score,
      comment,
      called
    });

    // Create evaluation object
    const evaluation: any = {
      id: called || `eval-${Date.now()}-${Math.random()}`,
      date: normalizeDate((row[idxEvalDate] ?? "").trim()),
      evaluator: (row[idxEvaluator] ?? "").trim() || undefined,
      called: called || undefined,
      callType: (row[idxCallType] ?? "").trim() || undefined,
      duration: durationStr || undefined,
      durationSeconds: durationSeconds || undefined,
      overallRating: overallRating,
      score: score,
      comments: comment || undefined,
      kpis: {
        product: productKnowledge,
        etiquette: phoneEtiquette,
        solving: problemSolving,
        upsell: upselling,
        promo: promotion,
        capture: infoCapturing,
      },
    };

    // Add FCR and Resolution if they exist
    if (fcr > 0) evaluation.fcr = fcr;
    if (resolution > 0) evaluation.resolution = resolution;

    agent.evaluations.push(evaluation);
    console.log(`Added evaluation for ${agent.name}, total evaluations now: ${agent.evaluations.length}`);
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

  return { agents: Object.values(agentsMap) };
};