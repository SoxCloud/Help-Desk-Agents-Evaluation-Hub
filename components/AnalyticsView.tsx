import React from 'react';
import { Agent } from '../types';
import { StatCard } from './StatCard';
import { TrendingUp, Users, Award, BarChart3, Activity, Clock } from 'lucide-react';

interface Props {
  agents: Agent[];
}

export const AnalyticsView: React.FC<Props> = ({ agents }) => {
  // Aggregate across full history
  const totalCalls = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.answeredCalls || 0), 0),
    0,
  );

  const allEvaluations = agents.flatMap((a) => a.evaluations);
  const avgQA =
    allEvaluations.length > 0
      ? Math.round(
          allEvaluations.reduce((sum, e) => sum + (e.score || 0), 0) /
            allEvaluations.length,
        )
      : 0;

  const totalSolved = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.solvedTickets || 0), 0),
    0,
  );

  const totalTickets = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce(
        (inner, h) => inner + (h.totalTickets || h.transactions || 0),
        0,
      ),
    0,
  );

  const avgResolutionRate =
    totalTickets > 0 ? Math.round((totalSolved / totalTickets) * 100) : 0;

  const totalEscalated = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.escalatedTickets || 0), 0),
    0,
  );

  const avgEscalationRate =
    totalTickets > 0 ? Math.round((totalEscalated / totalTickets) * 100) : 0;

  const totalInteractions = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.interactions || 0), 0),
    0,
  );

  const totalAhtSeconds = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.ahtSeconds || 0), 0),
    0,
  );
  const totalResSeconds = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.avgResolutionSeconds || 0), 0),
    0,
  );
  const totalDays = agents.reduce((acc, curr) => acc + curr.history.length, 0);

  const avgAht = totalDays > 0 ? `${Math.round(totalAhtSeconds / totalDays)}s` : "0s";
  const avgResTime = totalDays > 0 ? `${Math.round(totalResSeconds / totalDays)}s` : "0s";

  const totalCheesePct = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.cheeseUpsellPercentage || 0), 0),
    0,
  );
  const avgCheeseUpsell = totalDays > 0 ? (totalCheesePct / totalDays).toFixed(1) : "0";

  // 2. Sort agents for the "Top Performers" list by latest evaluation
  const topAgents = [...agents]
    .map((a) => {
      const latestEval = a.evaluations[a.evaluations.length - 1];
      const totalAgentCalls = a.history.reduce(
        (inner, h) => inner + (h.answeredCalls || 0),
        0,
      );
      return { agent: a, latestEval, totalAgentCalls };
    })
    .filter((x) => x.latestEval)
    .sort((a, b) => (b.latestEval!.score || 0) - (a.latestEval!.score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2rem] backdrop-blur-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="text-indigo-500" size={32} /> Operational Analytics
            </h2>
            <p className="text-slate-400 mt-2 font-medium">Aggregated team performance across {agents.length} active agents.</p>
          </div>
          <div className="hidden md:block text-right">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              Live Feed Active
            </span>
          </div>
        </div>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
        <StatCard title="Total Team Calls" value={totalCalls} subText="All answered calls" icon={<Users/>} color="text-blue-400" />
        <StatCard title="Team QA Average" value={`${avgQA}%`} subText="All evaluated calls" icon={<Award/>} color="text-emerald-400" />
        <StatCard title="Avg Handle Time" value={avgAht} subText="Across all days" icon={<Clock/>} color="text-orange-400" />
        <StatCard title="Avg Resolution Time" value={avgResTime} subText="Across all days" icon={<Clock/>} color="text-sky-400" />
        <StatCard title="Resolution Rate" value={`${avgResolutionRate}%`} subText="Weighted" icon={<TrendingUp/>} color="text-emerald-400" />
        <StatCard title="Escalation Rate" value={`${avgEscalationRate}%`} subText="Weighted" icon={<Activity/>} color="text-rose-400" />
        <StatCard title="Interactions" value={totalInteractions} subText="All channels" icon={<Activity/>} color="text-indigo-400" />
        <StatCard title="Cheese Upsell" value={`${avgCheeseUpsell}%`} subText="Avg per day" icon={<Activity/>} color="text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TEAM DISTRIBUTION CHART (Left 8 cols) */}
        <div className="lg:col-span-8 bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2rem]">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500"/> Call Volume Distribution
          </h3>
          <div className="flex items-end justify-between h-64 gap-2 md:gap-4 px-2">
            {agents.map((agent, i) => {
              const answered = agent.history.reduce(
                (inner, h) => inner + (h.answeredCalls || 0),
                0,
              );
              const height = answered * 3; // Scale for visual
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div 
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl transition-all duration-1000 group-hover:from-indigo-400 group-hover:to-indigo-300 relative"
                    style={{ height: `${height}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {answered}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase truncate w-full text-center">
                    {agent.name.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP PERFORMERS SIDEBAR (Right 4 cols) */}
        <div className="lg:col-span-4 bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2rem]">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6">Top Performers</h3>
          <div className="space-y-4">
            {topAgents.map(({ agent, latestEval, totalAgentCalls }, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-[10px]">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{agent.name}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase">{totalAgentCalls} Calls</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-400">{latestEval?.score}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};