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
    if (!q) return filtered;
    return filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
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

  const totalEvaluatedCalls = allEvaluations.length;

  const totalTeamScore = allEvaluations.reduce(
    (sum, e) => sum + (e.score || 0),
    0,
  );

  const teamAverageScore =
    totalEvaluatedCalls > 0
      ? (totalTeamScore / totalEvaluatedCalls).toFixed(1)
      : "0";
      
  // Average handle time across all agents in range
  const totalAhtSeconds = agentsWithFilteredHistory.reduce((sum, a) => {
    return (
      sum +
      a.history.reduce((inner, h) => {
        const secs = parseInt(h.aht || "0", 10) || 0;
        return inner + secs;
      }, 0)
    );
  }, 0);

  const totalAhtSamples = agentsWithFilteredHistory.reduce(
    (sum, a) => sum + a.history.length,
    0,
  );

  const avgHandleTimeMinutes =
    totalAhtSamples > 0
      ? `${Math.round(totalAhtSeconds / totalAhtSamples/60).toFixed(1)}m`
      : "0m";

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
  const totalEscalated = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.escalatedTickets || 0), 0),
    0,
  );

  const weightedResolutionRate =
    totalTickets > 0 ? ((totalSolved / totalTickets) * 100).toFixed(1) : "0";
  const weightedEscalationRate =
    totalTickets > 0 ? ((totalEscalated / totalTickets) * 100).toFixed(1) : "0";

  const totalInteractions = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.interactions || 0), 0),
    0,
  );

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

  // Team cheese upsell % (average across all days in range)
  const totalDays = agentsWithFilteredHistory.reduce(
    (s, a) => s + a.history.length,
    0,
  );
  const totalCheesePct = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum +
      a.history.reduce((inner, h) => inner + (h.cheeseUpsellPercentage ?? 0), 0),
    0,
  );
  const avgCheeseUpsell =
    totalDays > 0 ? (totalCheesePct / totalDays).toFixed(1) : "0";

  // NEW: Calculate average interactions per ticket for the team
  const totalTicketsForInteractions = agentsWithFilteredHistory.reduce(
    (sum, a) =>
      sum + a.history.reduce((inner, h) => inner + (h.totalTickets || 0), 0),
    0,
  );

  const avgInteractionsPerTicket = totalTicketsForInteractions > 0
    ? (totalInteractions / totalTicketsForInteractions).toFixed(1)
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
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
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

      {/* Stats Grid - GROUPED by Ticket Stats and Call Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* TICKET STATS GROUP */}
        <MetricCard
          title="Total Tickets"
          value={totalTickets}
          change="All tickets"
          icon={<Ticket className="text-violet-400" />}
        />
        <MetricCard
          title="Solved Tickets"
          value={totalSolved}
          change={`${Math.round((totalSolved/totalTickets)*100)}% of total`}
          icon={<CheckCircle className="text-emerald-400" />}
        />
        <MetricCard
          title="Escalated Tickets"
          value={totalEscalated}
          change={`${weightedEscalationRate}%`}
          icon={<Activity className="text-rose-400" />}
        />
        <MetricCard
          title="Resolution Rate"
          value={`${weightedResolutionRate}%`}
          change="Success rate"
          icon={<Target className="text-emerald-400" />}
        />
        
        {/* CALL STATS GROUP */}
        <MetricCard
          title="Total Calls"
          value={totalCalls}
          change="All calls"
          icon={<PhoneCall className="text-blue-400" />}
        />
        <MetricCard
          title="Abandoned Calls"
          value={totalAbandonedCalls}
          change={`${callAbandonedRate}%`}
          icon={<Activity className="text-rose-400" />}
        />
        <MetricCard
          title="Avg Handle Time"
          value={`${avgHandleTimeMinutes}m`}
          change="Per call"
          icon={<Clock className="text-orange-400" />}
        />
        <MetricCard
          title="Avg Resolution Time"
          value={avgResolutionTime}
          change="Per ticket"
          icon={<Clock className="text-sky-400" />}
        />
        
        {/* EVALUATION STATS */}
        <MetricCard
          title="Evaluated Recordings"
          value={totalEvaluatedCalls}
          change="Total evals"
          icon={<CheckCircle className="text-emerald-400" />}
        />
        <MetricCard
          title="Team QA Average"
          value={`${teamAverageScore}%`}
          change="Avg score"
          icon={<Award className="text-purple-400" />}
        />
        
        {/* AGENT STATS */}
        <MetricCard
          title="Active Agents"
          value={`${activeAgents}/${agents.length}`}
          icon={<Users className="text-indigo-400" />}
        />
        
        {/* INTERACTION STATS */}
        <MetricCard
          title="Total Interactions"
          value={totalInteractions}
          change="All channels"
          icon={<Activity className="text-indigo-400" />}
        />
        <MetricCard
          title="Avg Interactions/Ticket"
          value={avgInteractionsPerTicket}
          change="Per ticket"
          icon={<Activity className="text-cyan-400" />}
        />
        
        {/* UPSELL STATS */}
        <MetricCard
          title="Cheese upsell %"
          value={`${avgCheeseUpsell}%`}
          change="Avg per day"
          icon={<Activity className="text-amber-400" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Performance Chart */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Activity className="text-indigo-400" size={18} /> Ticket Performance per Agent
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
          
          <div className="h-72">
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
                    value: 'Number of Tickets', 
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
                    if (name === 'total') return [`${value} tickets`, 'Total Tickets'];
                    if (name === 'solved') return [`${value} tickets`, 'Solved Tickets'];
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
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tickets</p>
              <p className="text-lg font-black text-white">
                {chartData.reduce((sum, item) => sum + (item.total || 0), 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Solved</p>
              <p className="text-lg font-black text-emerald-400">
                {chartData.reduce((sum, item) => sum + (item.solved || 0), 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resolution Rate</p>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
              Online
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-900/50 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> On
              Call
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
          <h3 className="text-white font-bold text-lg">Team Performance Metrics</h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
            Based on {kpiAverages.totalEvals} evaluations
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            label="Product Knowledge"
            value={kpiAverages.product}
            icon={<Brain className="text-blue-400" size={18} />}
            color="from-blue-500 to-blue-600"
          />
          <KPICard
            label="Phone Etiquette"
            value={kpiAverages.etiquette}
            icon={<PhoneCall className="text-indigo-400" size={18} />}
            color="from-indigo-500 to-indigo-600"
          />
          <KPICard
            label="Problem Solving"
            value={kpiAverages.solving}
            icon={<Target className="text-purple-400" size={18} />}
            color="from-purple-500 to-purple-600"
          />
          <KPICard
            label="Upselling"
            value={kpiAverages.upsell}
            icon={<TrendingUp className="text-emerald-400" size={18} />}
            color="from-emerald-500 to-emerald-600"
          />
          <KPICard
            label="Promotion"
            value={kpiAverages.promo}
            icon={<Star className="text-amber-400" size={18} />}
            color="from-amber-500 to-amber-600"
          />
          <KPICard
            label="Info Capture"
            value={kpiAverages.capture}
            icon={<CheckCircle className="text-rose-400" size={18} />}
            color="from-rose-500 to-rose-600"
          />
        </div>

        {/* Performance Summary */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400">Top Performing KPI</p>
            <p className="text-sm font-bold text-white">
              {Object.entries({
                'Product Knowledge': kpiAverages.product,
                'Phone Etiquette': kpiAverages.etiquette,
                'Problem Solving': kpiAverages.solving,
                'Upselling': kpiAverages.upsell,
                'Promotion': kpiAverages.promo,
                'Info Capture': kpiAverages.capture,
              }).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400">KPI Needing Improvement</p>
            <p className="text-sm font-bold text-white">
              {Object.entries({
                'Product Knowledge': kpiAverages.product,
                'Phone Etiquette': kpiAverages.etiquette,
                'Problem Solving': kpiAverages.solving,
                'Upselling': kpiAverages.upsell,
                'Promotion': kpiAverages.promo,
                'Info Capture': kpiAverages.capture,
              }).sort((a, b) => a[1] - b[1])[0]?.[0] || 'N/A'}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400">Overall Average</p>
            <p className="text-sm font-bold text-white">
              {Math.round(
                (kpiAverages.product + kpiAverages.etiquette + kpiAverages.solving + 
                 kpiAverages.upsell + kpiAverages.promo + kpiAverages.capture) / 6
              )}%
            </p>
          </div>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
          <h3 className="text-white font-semibold">Agent Performance Table</h3>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={14}
            />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:border-indigo-500 outline-none w-64 transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
              <tr>
                <th className="px-6 py-4">Agent Name</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4 text-center">Answered</th>
                <th className="px-6 py-4 text-center">Abandoned %</th>
                <th className="px-6 py-4 text-center">Tickets</th>
                <th className="px-6 py-4 text-center">Avg Int/Tkt</th>
                <th className="px-6 py-4 text-center">CSAT</th>
                <th className="px-6 py-4 text-center">KPI Score</th>
                <th className="px-6 py-4 text-center">Cheese %</th>
                <th className="px-6 py-4 text-right">Action</th>
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
                const avgCheese =
                  agent.history.length > 0
                    ? (
                        agent.history.reduce(
                          (s, h) => s + (h.cheeseUpsellPercentage ?? 0),
                          0,
                        ) / agent.history.length
                      ).toFixed(1)
                    : "0";
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
                const agentTotalTickets = agent.history.reduce(
                  (s, h) => s + (h.totalTickets || 0),
                  0,
                );
                const agentAvgInteractions = agentTotalTickets > 0
                  ? (agentTotalInteractions / agentTotalTickets).toFixed(1)
                  : "0";
                
                return (
                <tr
                  key={agent.id}
                  className="hover:bg-indigo-500/5 transition-colors group"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[11px] font-black text-white shadow-inner">
                      {agent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                      {agent.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-bold text-slate-500 flex items-center w-fit gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>{" "}
                      Offline
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-300 text-center">
                    {totalAnswered}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-black ${
                      parseFloat(abandonedRate) > 5 ? 'text-rose-400' : 
                      parseFloat(abandonedRate) > 2 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {abandonedRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-slate-300 text-center">
                    {totalTickets}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-cyan-400">
                      {agentAvgInteractions}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-indigo-400">
                      {latestScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm font-black ${
                      agentKpiAvg >= 80 ? 'text-emerald-400' : 
                      agentKpiAvg >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {agentKpiAvg}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-amber-400">
                      {avgCheese}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewAgent(agent.id)}
                      className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      View Stats
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
  );
};

const MetricCard = ({ title, value, change, icon }: any) => (
  <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all">
    <div className="flex justify-between items-start gap-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2 truncate">
          {title}
        </p>
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-2xl md:text-3xl font-black text-white leading-none">
            {value}
          </span>
          {change && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap bg-emerald-500/10 text-emerald-500">
              {change}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-indigo-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </div>
  </div>
);

const KPICard = ({ label, value, icon, color }: any) => (
  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-indigo-500/50 transition-all group">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${color} bg-opacity-20`}>
        {icon}
      </div>
      <span className="text-xl font-black text-white">{value}%</span>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);