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

  const avgHandleTime =
    totalAhtSamples > 0
      ? `${Math.round(totalAhtSeconds / totalAhtSamples)}s`
      : "0s";

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
      ? `${Math.round(totalAvgResSeconds / avgResSamples)}s`
      : "0s";

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

  const chartData = agentsWithFilteredHistory.map((a) => ({
    name: a.name.split(" ")[0],
    calls: a.history.reduce(
      (inner, h) => inner + (h.answeredCalls || 0),
      0,
    ),
  }));

  const activeAgents = agentsWithFilteredHistory.filter((a) => a.history.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Area with Restored Date Range */}
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
                className="bg-transparent outline-none border-none focus:ring-0 w-28"
              />
              <span className="text-slate-600">-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  onDateChange({ ...dateRange, end: e.target.value })
                }
                className="bg-transparent outline-none border-none focus:ring-0 w-28"
              />
            </div>
          </div>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
            <Activity size={14} /> AI Insights
          </button>
        </div>
      </div>

      {/* Stats Grid - Now using Dynamic Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Calls"
          value={totalCalls}
          change="In range"
          icon={<PhoneCall className="text-blue-400" />}
        />
        <MetricCard
          title="Total Tickets"
          value={totalTickets}
          change="In range"
          icon={<Activity className="text-violet-400" />}
        />
        <MetricCard
          title="Evaluated Recordings"
          value={totalEvaluatedCalls}
          change="In range"
          icon={<CheckCircle className="text-emerald-400" />}
        />
        <MetricCard
          title="Avg Handle Time"
          value={avgHandleTime}
          change="Team avg"
          icon={<Clock className="text-orange-400" />}
        />
        <MetricCard
          title="Avg Resolution Time"
          value={avgResolutionTime}
          change="Team avg"
          icon={<Clock className="text-sky-400" />}
        />
        <MetricCard
          title="Team QA Average"
          value={`${teamAverageScore}%`}
          change="In range"
          icon={<CheckCircle className="text-emerald-400" />}
        />
        <MetricCard
          title="Active Agents"
          value={`${activeAgents}/${agents.length}`}
          icon={<Users className="text-purple-400" />}
        />
        <MetricCard
          title="Resolution Rate"
          value={`${weightedResolutionRate}%`}
          change="Weighted"
          icon={<CheckCircle className="text-emerald-400" />}
        />
        <MetricCard
          title="Escalation Rate"
          value={`${weightedEscalationRate}%`}
          change="Weighted"
          icon={<Activity className="text-rose-400" />}
        />
        <MetricCard
          title="Interactions"
          value={totalInteractions}
          change="In range"
          icon={<Activity className="text-indigo-400" />}
        />
        <MetricCard
          title="Cheese upsell %"
          value={`${avgCheeseUpsell}%`}
          change="Team avg"
          icon={<Activity className="text-amber-400" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Volume Chart */}
        <div className="lg:col-span-2 bg-[#1e293b]/50 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Activity className="text-indigo-400" size={18} /> Call Volume per
            Agent
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#2d3748" }}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="calls"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  barSize={25}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Status Donut Area */}
        <div className="bg-[#1e293b]/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
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

      {/* Agent Performance Table */}
      <div className="bg-[#1e293b]/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                <th className="px-6 py-4 text-center">Tickets</th>
                <th className="px-6 py-4 text-center">CSAT</th>
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
                  <td className="px-6 py-4 text-sm font-black text-slate-300 text-center">
                    {totalTickets}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-black text-indigo-400">
                      {latestScore}%
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

const MetricCard = ({ title, value, change, icon, isNegative }: any) => (
  <div className="bg-[#1e293b]/50 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-lg min-h-[120px]">
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
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${isNegative ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
            >
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
