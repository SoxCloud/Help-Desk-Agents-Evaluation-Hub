import React, { useMemo, useState } from "react";
import { Agent } from "../types";
import {
  PhoneCall,
  Clock,
  CheckCircle,
  Users,
  Activity,
  Search,
  Calendar,
  Award,
  Target,
  TrendingUp,
  Brain,
  Star,
  BarChart4,
  Ticket,
  Zap,
  Percent,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  agents: Agent[];
  dateRange: { start: string; end: string };
  onDateChange: (range: { start: string; end: string }) => void;
  onViewAgent: (id: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  agents,
  dateRange,
  onDateChange,
  onViewAgent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange.end ? new Date(dateRange.end) : null;

  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Filtered data by date range
  const agentsWithFilteredHistory = useMemo(() => {
    const filtered = agents.map((agent) => ({
      ...agent,
      history: agent.history.filter((h) => isWithinRange(h.date)),
      evaluations: agent.evaluations.filter((e) => isWithinRange(e.date)),
    }));

    const q = searchQuery.trim().toLowerCase();
    const result = !q ? filtered : filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
    
    // Sort by total tickets (highest to lowest)
    return result.sort((a, b) => {
      const ticketsA = a.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
      const ticketsB = b.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
      return ticketsB - ticketsA;
    });
  }, [agents, searchQuery, dateRange.start, dateRange.end]);

  // CALL STATS
  const totalCalls = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.answeredCalls || 0), 0),
    0,
  );

  // ABANDONED CALLS STATS
  const totalAbandonedCalls = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.abandonedCalls || 0), 0),
    0,
  );

  const callAbandonedRate = totalCalls > 0
    ? ((totalAbandonedCalls / totalCalls) * 100).toFixed(1)
    : "0";

  // EVALUATION STATS
  const allEvaluations = agentsWithFilteredHistory.flatMap((a) => a.evaluations);

  const totalTeamScore = allEvaluations.reduce((sum, e) => {
    const kpi = e.kpis || {};
    return sum + (kpi.product || 0) + (kpi.etiquette || 0) + (kpi.solving || 0) + 
           (kpi.upsell || 0) + (kpi.promo || 0) + (kpi.capture || 0);
  }, 0);
  const totalEvaluatedCalls = allEvaluations.length * 6;

  const teamAverageScore =
    totalEvaluatedCalls > 0
      ? (totalTeamScore / totalEvaluatedCalls).toFixed(1)
      : "0";
      
  const totalTickets = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.totalTickets || 0), 0),
    0,
  );
  const totalSolved = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.solvedTickets || 0), 0),
    0,
  );

  const weightedResolutionRate =
    totalTickets > 0 ? ((totalSolved / totalTickets) * 100).toFixed(1) : "0";

  const totalInteractions = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.interactions || 0), 0),
    0,
  );

  // AVERAGE RESOLUTION TIME (ART)
  const totalAvgResSeconds = agentsWithFilteredHistory.reduce((sum, a) => {
    return (
      sum +
      a.history.reduce((inner, h) => {
        const secs =
          (h.avgResolutionSeconds ??
            parseInt(h.avgResolutionTime || "0", 10)) ||
          0;
        return inner + secs;
      }, 0)
    );
  }, 0);

  const avgResSamples = agentsWithFilteredHistory.reduce(
    (sum, a) => sum + a.history.length,
    0,
  );

  const avgResolutionTime =
    avgResSamples > 0
      ? `${Math.round(totalAvgResSeconds / avgResSamples/60).toFixed(1)}m`
      : "0m";

  // Calculate total Debonairs Sales and Cheese Sales
  const totalDebSales = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.debonairsSales || 0), 0),
    0,
  );

  const totalCheeseSales = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.cheeseSales || 0), 0),
    0,
  );

  // Calculate total Credits/Discounts count (as number, not percentage)
  const totalCreditsDiscounts = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.creditsDiscounts || 0), 0),
    0,
  );

  // Calculate cheese upsell percentage using Formula 2
  // Formula: Cheese Upsell % = (Cheese Sales ÷ (Debonairs Sales - Cheese Sales)) × 100
  const baseSales = totalDebSales - totalCheeseSales;
  const cheeseUpsellPercentage = baseSales > 0
    ? ((totalCheeseSales / baseSales) * 100).toFixed(1)
    : "0";

  // Calculate average interactions per ticket for the team
  const totalTicketsForInteractions = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.totalTickets || 0), 0),
    0,
  );

  const avgInteractionsPerTicket = totalTicketsForInteractions > 0
    ? (totalInteractions / totalTicketsForInteractions).toFixed(1)
    : "0";

  // Calculate FCR (First Call Resolution) - average percentage across all agents
  const totalFCR = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.fcr || 0), 0),
    0,
  );
  
  const fcrSamples = agentsWithFilteredHistory.reduce(
    (sum, a) => sum + a.history.length,
    0,
  );

  const avgFCR = fcrSamples > 0
    ? (totalFCR / fcrSamples).toFixed(1)
    : "0";

  // CHART DATA - Ticket Performance
  const chartData = agentsWithFilteredHistory.map((a) => ({
    name: a.name.split(" ")[0],
    fullName: a.name,
    total: a.history.reduce((inner, h) => inner + (h.totalTickets || 0), 0),
    solved: a.history.reduce((inner, h) => inner + (h.solvedTickets || 0), 0),
    rate: (() => {
      const total = a.history.reduce((inner, h) => inner + (h.totalTickets || 0), 0);
      const solved = a.history.reduce((inner, h) => inner + (h.solvedTickets || 0), 0);
      return total > 0 ? Math.round((solved / total) * 100) : 0;
    })(),
  })).sort((a, b) => b.total - a.total);

  // OVERALL KPI SCORES - Calculate average of each KPI across all agents
  const kpiAverages = useMemo(() => {
    let totalProduct = 0;
    let totalEtiquette = 0;
    let totalSolving = 0;
    let totalUpsell = 0;
    let totalPromo = 0;
    let totalCapture = 0;
    let evalCount = 0;

    agentsWithFilteredHistory.forEach(agent => {
      agent.evaluations.forEach(evalItem => {
        totalProduct += evalItem.kpis.product || 0;
        totalEtiquette += evalItem.kpis.etiquette || 0;
        totalSolving += evalItem.kpis.solving || 0;
        totalUpsell += evalItem.kpis.upsell || 0;
        totalPromo += evalItem.kpis.promo || 0;
        totalCapture += evalItem.kpis.capture || 0;
        evalCount++;
      });
    });

    return {
      product: evalCount > 0 ? Math.round(totalProduct / evalCount) : 0,
      etiquette: evalCount > 0 ? Math.round(totalEtiquette / evalCount) : 0,
      solving: evalCount > 0 ? Math.round(totalSolving / evalCount) : 0,
      upsell: evalCount > 0 ? Math.round(totalUpsell / evalCount) : 0,
      promo: evalCount > 0 ? Math.round(totalPromo / evalCount) : 0,
      capture: evalCount > 0 ? Math.round(totalCapture / evalCount) : 0,
      totalEvals: evalCount,
    };
  }, [agentsWithFilteredHistory]);

  const activeAgents = agentsWithFilteredHistory.filter((a) => a.history.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a2639] text-white">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto space-y-6">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
      Dashboard Overview
    </h1>
            <p className="text-slate-400 text-sm">
              Real-time performance metrics from Master Sheet
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#1e293b] border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400" />
              <div className="flex items-center gap-1 text-xs text-white">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    onDateChange({ ...dateRange, start: e.target.value })
                  }
                  className="bg-transparent outline-none border-none focus:ring-0 w-28 text-white"
                />
                <span className="text-slate-600">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    onDateChange({ ...dateRange, end: e.target.value })
                  }
                  className="bg-transparent outline-none border-none focus:ring-0 w-28 text-white"
                />
              </div>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
              <Activity size={14} /> AI Insights
            </button>
          </div>
        </div>

        {/* Stats Grid - with Credits card added back */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {/* Numbers (no percentage) */}
          <MetricCard
            title="Total Tickets"
            value={totalTickets}
            change="All tickets"
            icon={<Ticket className="text-violet-400" />}
            showPercentage={false}
          />
          <MetricCard
            title="Solved"
            value={totalSolved}
            change={`${Math.round((totalSolved/totalTickets)*100)}%`}
            icon={<CheckCircle className="text-emerald-400" />}
            showPercentage={false}
          />
          
          {/* Percentages */}
          <MetricCard
            title="Resolution"
            value={weightedResolutionRate}
            change="Success"
            icon={<Target className="text-emerald-400" />}
            showPercentage={true}
          />
          
          {/* Time (with 'm' suffix) */}
          <MetricCard
            title="Resolution Time"
            value={avgResolutionTime}
            change="Per ticket"
            icon={<Clock className="text-sky-400" />}
            showPercentage={false}
          />
          
          {/* Percentages */}
          <MetricCard
            title="FCR"
            value={avgFCR}
            change="First Call Resolution"
            icon={<CheckCircle className="text-green-400" />}
            showPercentage={true}
          />
          
          {/* Numbers */}
          <MetricCard
            title="Interactions"
            value={totalInteractions}
            change="Total"
            icon={<Activity className="text-indigo-400" />}
            showPercentage={false}
          />
          <MetricCard
            title="Int/Ticket"
            value={avgInteractionsPerTicket}
            change="Avg"
            icon={<Activity className="text-cyan-400" />}
            showPercentage={false}
          />
          <MetricCard
            title="Total Calls"
            value={totalCalls}
            change="All calls"
            icon={<PhoneCall className="text-blue-400" />}
            showPercentage={false}
          />
          
          {/* Percentage (abandoned rate) */}
          <MetricCard
            title="Abandoned"
            value={totalAbandonedCalls}
            change={`${callAbandonedRate}%`}
            icon={<Activity className="text-rose-400" />}
            showPercentage={false}
          />
          
          {/* Numbers */}
          <MetricCard
            title="Evaluations"
            value={totalEvaluatedCalls}
            change="Total"
            icon={<CheckCircle className="text-emerald-400" />}
            showPercentage={false}
          />
          
          {/* Percentage */}
          <MetricCard
            title="CSAT Score"
            value={teamAverageScore}
            change="Avg score"
            icon={<Award className="text-purple-400" />}
            showPercentage={true}
          />
          
          {/* Special format (agents count) */}
          <MetricCard
            title="Active Agents"
            value={`${activeAgents}/${agents.length}`}
            icon={<Users className="text-indigo-400" />}
            showPercentage={false}
          />
          
          {/* Percentage */}
          <MetricCard
            title="Cheese Upsell"
            value={cheeseUpsellPercentage}
            change="Added"
            icon={<Zap className="text-amber-400" />}
            showPercentage={true}
          />
          
          {/* CREDITS CARD - ADDED BACK with showPercentage=false */}
          <MetricCard
            title="Credits Issued"
            value={totalCreditsDiscounts}
            change="Total given"
           icon={<Ticket className="text-purple-400" />}
            showPercentage={false}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Performance Chart */}
          <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Activity className="text-indigo-400" size={18} /> Ticket Performance
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-slate-400">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-400">Solved</span>
                </div>
              </div>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barGap={4}
                  barCategoryGap={16}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#334155" 
                    vertical={false} 
                  />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#94a3b8' }}
                    label={{ 
                      value: 'Tickets', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }
                    }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      padding: '12px',
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'total') return [`${value}`, 'Total'];
                      if (name === 'solved') return [`${value}`, 'Solved'];
                      return [value, name];
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#6366f1" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                    name="total"
                  />
                  <Bar 
                    dataKey="solved" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                    name="solved"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-800">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500">Total</p>
                <p className="text-lg font-black text-white">
                  {chartData.reduce((sum, item) => sum + (item.total || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500">Solved</p>
                <p className="text-lg font-black text-emerald-400">
                  {chartData.reduce((sum, item) => sum + (item.solved || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-500">Rate</p>
                <p className="text-lg font-black text-indigo-400">
                  {(() => {
                    const total = chartData.reduce((sum, item) => sum + (item.total || 0), 0);
                    const solved = chartData.reduce((sum, item) => sum + (item.solved || 0), 0);
                    return total > 0 ? `${Math.round((solved / total) * 100)}%` : '0%';
                  })()}
                </p>
              </div>
            </div>
          </div>

          {/* Current Status Donut Area */}
          <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="text-white font-semibold mb-4 w-full text-left">
              Current Status
            </h3>
            <div className="relative h-48 w-48 flex items-center justify-center">
              <div className="absolute inset-0 border-8 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-indigo-500 rounded-full border-t-transparent -rotate-45"></div>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-white">0</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                  Active
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 w-full text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-900/50 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-900/50 py-2 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> On Call
              </div>
            </div>
          </div>
        </div>

        {/* Overall Team KPI Scores Section */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600/20 rounded-xl">
              <Award className="text-indigo-400" size={20} />
            </div>
            <h3 className="text-white font-bold text-lg">Team KPI</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
              {kpiAverages.totalEvals} evals
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICard
              label="Product"
              value={kpiAverages.product}
              icon={<Brain className="text-blue-400" size={18} />}
              color="from-blue-500 to-blue-600"
            />
            <KPICard
              label="Etiquette"
              value={kpiAverages.etiquette}
              icon={<PhoneCall className="text-indigo-400" size={18} />}
              color="from-indigo-500 to-indigo-600"
            />
            <KPICard
              label="Problem"
              value={kpiAverages.solving}
              icon={<Target className="text-purple-400" size={18} />}
              color="from-purple-500 to-purple-600"
            />
            <KPICard
              label="Upsell"
              value={kpiAverages.upsell}
              icon={<TrendingUp className="text-emerald-400" size={18} />}
              color="from-emerald-500 to-emerald-600"
            />
            <KPICard
              label="Promo"
              value={kpiAverages.promo}
              icon={<Star className="text-amber-400" size={18} />}
              color="from-amber-500 to-amber-600"
            />
            <KPICard
              label="Capture"
              value={kpiAverages.capture}
              icon={<CheckCircle className="text-rose-400" size={18} />}
              color="from-rose-500 to-rose-600"
            />
          </div>
        </div>

        {/* Agent Performance Table - Compact Design */}
        <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/20">
            <h3 className="text-white font-semibold">Agent Performance</h3>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={14}
              />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:border-indigo-500 outline-none w-full transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/50 text-[9px] uppercase font-black text-slate-500 tracking-widest">
                <tr>
                  <th className="px-3 py-3 text-left">AGENT</th>
                  <th className="px-3 py-3 text-center">ANS</th>
                  <th className="px-3 py-3 text-center">ABN</th>
                  <th className="px-3 py-3 text-center">ABN%</th>
                  <th className="px-3 py-3 text-center">TKTS</th>
                  <th className="px-3 py-3 text-center">FCR%</th>
                  <th className="px-3 py-3 text-center">INT/TKT</th>
                  <th className="px-3 py-3 text-center">CSAT</th>
                  <th className="px-3 py-3 text-center">KPI</th>
                  <th className="px-3 py-3 text-center">CHEESE</th>
                  <th className="px-3 py-3 text-center">CRED</th>
                  <th className="px-3 py-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {agentsWithFilteredHistory.map((agent) => {
                  const totalAnswered = agent.history.reduce(
                    (s, h) => s + (h.answeredCalls || 0),
                    0,
                  );
                  const totalAbandoned = agent.history.reduce(
                    (s, h) => s + (h.abandonedCalls || 0),
                    0,
                  );
                  const abandonedRate = totalAnswered > 0
                    ? ((totalAbandoned / totalAnswered) * 100).toFixed(1)
                    : "0";
                  const totalTickets = agent.history.reduce(
                    (s, h) => s + (h.totalTickets || 0),
                    0,
                  );
                  
                  // Calculate cheese upsell for this agent
                  const agentDebSales = agent.history.reduce(
                    (s, h) => s + (h.debonairsSales || 0),
                    0,
                  );
                  const agentCheeseSales = agent.history.reduce(
                    (s, h) => s + (h.cheeseSales || 0),
                    0,
                  );
                  const agentBaseSales = agentDebSales - agentCheeseSales;
                  const agentCheeseUpsell = agentBaseSales > 0
                    ? ((agentCheeseSales / agentBaseSales) * 100).toFixed(1)
                    : "0";
                  
                  // Calculate average FCR for this agent
                  const agentFCR = agent.history.reduce(
                    (s, h) => s + (h.fcr || 0),
                    0,
                  );
                  const agentFcrAvg = agent.history.length > 0
                    ? (agentFCR / agent.history.length).toFixed(1)
                    : "0";
                  
                  // Calculate credits for this agent (as number, not percentage)
                  const agentCredits = agent.history.reduce(
                    (s, h) => s + (h.creditsDiscounts || 0),
                    0,
                  );
                  
                  const latestScore =
                    agent.evaluations.length > 0
                      ? agent.evaluations[agent.evaluations.length - 1]?.score
                      : 0;
                  
                  // Calculate average KPI score for this agent
                  const agentKpiAvg = agent.evaluations.length > 0
                    ? Math.round(
                        agent.evaluations.reduce((sum, e) => {
                          const kpiSum = (e.kpis.product || 0) + (e.kpis.etiquette || 0) + 
                                        (e.kpis.solving || 0) + (e.kpis.upsell || 0) + 
                                        (e.kpis.promo || 0) + (e.kpis.capture || 0);
                          return sum + (kpiSum / 6);
                        }, 0) / agent.evaluations.length
                      )
                    : 0;
                  
                  // Calculate average interactions per ticket for this agent
                  const agentTotalInteractions = agent.history.reduce(
                    (s, h) => s + (h.interactions || 0),
                    0,
                  );
                  const agentAvgInteractions = totalTickets > 0
                    ? (agentTotalInteractions / totalTickets).toFixed(1)
                    : "0";

                  return (
                  <tr
                    key={agent.id}
                    className="hover:bg-indigo-500/5 transition-colors group"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-[8px] font-black text-white shadow-inner flex-shrink-0">
                          {agent.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-[10px] font-bold text-slate-200 truncate max-w-[70px] sm:max-w-[90px]">
                          {agent.name.split(' ')[0]}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-blue-400">
                      {totalAnswered}
                    </td>
                    <td className="px-3 py-3 text-center font-black text-amber-400">
                      {totalAbandoned}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-black ${
                        parseFloat(abandonedRate) > 5 ? 'text-rose-400' : 
                        parseFloat(abandonedRate) > 2 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {abandonedRate}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-slate-300">
                      {totalTickets}
                    </td>
                    <td className="px-3 py-3 text-center font-black text-green-400">
                      {agentFcrAvg}%
                    </td>
                    <td className="px-3 py-3 text-center font-black text-cyan-400">
                      {agentAvgInteractions}
                    </td>
                    <td className="px-3 py-3 text-center font-black text-indigo-400">
                      {latestScore}%
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-black ${
                        agentKpiAvg >= 80 ? 'text-emerald-400' : 
                        agentKpiAvg >= 60 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {agentKpiAvg}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-black text-amber-400">
                      {agentCheeseUpsell}%
                    </td>
                    <td className="px-3 py-3 text-center font-black text-purple-400">
                      {agentCredits}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => onViewAgent(agent.id)}
                        className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-2 py-1 rounded-md text-[8px] font-bold transition-all whitespace-nowrap"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// MetricCard component - with showPercentage control
const MetricCard = ({ title, value, change, icon, showPercentage = false }: any) => {
  // Don't add % if showPercentage is false
  const displayValue = showPercentage ? `${value}%` : value;
  
  return (
    <div className="bg-[#1e293b] border border-slate-800 p-4 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1 truncate" title={title}>
            {title}
          </p>
          <div className="flex flex-wrap items-end gap-x-1 gap-y-1">
            <span className="text-xl md:text-2xl font-black text-white leading-none">
              {displayValue}
            </span>
            {change && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-emerald-500/10 text-emerald-500">
                {change}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 p-2 bg-slate-900 rounded-xl border border-slate-800 text-indigo-400 group-hover:scale-110 transition-transform">
          {React.cloneElement(icon, { size: 18 })}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ label, value, icon, color }: any) => (
  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-indigo-500/50 transition-all group">
    <div className="flex items-center justify-between mb-2">
      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
        {React.cloneElement(icon, { size: 16 })}
      </div>
      <span className="text-base font-black text-white">{value}%</span>
    </div>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate" title={label}>{label}</p>
    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);