import React from 'react';
import { Agent } from '../types';
import { StatCard } from './StatCard';
import { 
  TrendingUp, 
  Users, 
  Award, 
  BarChart3, 
  Activity, 
  Clock,
  PhoneCall,
  Ticket,
  CheckCircle,
  AlertCircle,
  PieChart,
  LineChart,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';

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

  const totalAbandonedCalls = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.abandonedCalls || 0), 0),
    0,
  );

  const callAbandonedRate = totalCalls > 0
    ? Math.round((totalAbandonedCalls / totalCalls) * 100)
    : 0;

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

  const avgInteractionsPerTicket = totalTickets > 0
    ? (totalInteractions / totalTickets).toFixed(1)
    : "0";

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

  const avgAht = totalDays > 0 ? `${Math.round(totalAhtSeconds / totalDays / 60)}m` : "0m";
  const avgResTime = totalDays > 0 ? `${Math.round(totalResSeconds / totalDays / 60)}m` : "0m";

  // Calculate cheese upsell totals
  const totalDebSales = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.debonairsSales || 0), 0),
    0,
  );

  const totalCheeseSales = agents.reduce(
    (acc, curr) =>
      acc +
      curr.history.reduce((inner, h) => inner + (h.cheeseSales || 0), 0),
    0,
  );

  const baseSales = totalDebSales - totalCheeseSales;
  const cheeseUpsellPercentage = baseSales > 0
    ? ((totalCheeseSales / baseSales) * 100).toFixed(1)
    : "0";

  // CHART 1: Ticket Performance by Agent
  const ticketChartData = agents.map((agent) => {
    const total = agent.history.reduce((inner, h) => inner + (h.totalTickets || 0), 0);
    const solved = agent.history.reduce((inner, h) => inner + (h.solvedTickets || 0), 0);
    const escalated = agent.history.reduce((inner, h) => inner + (h.escalatedTickets || 0), 0);
    
    return {
      name: agent.name.split(' ')[0],
      fullName: agent.name,
      total,
      solved,
      escalated,
      pending: total - solved - escalated,
      rate: total > 0 ? Math.round((solved / total) * 100) : 0
    };
  }).sort((a, b) => b.total - a.total);

  // CHART 2: Call Performance by Agent
  const callChartData = agents.map((agent) => {
    const calls = agent.history.reduce((inner, h) => inner + (h.answeredCalls || 0), 0);
    const aht = agent.history.length > 0 
      ? Math.round(agent.history.reduce((inner, h) => inner + (h.ahtSeconds || 0), 0) / agent.history.length / 60)
      : 0;
    
    return {
      name: agent.name.split(' ')[0],
      fullName: agent.name,
      calls,
      aht,
      interactions: agent.history.reduce((inner, h) => inner + (h.interactions || 0), 0)
    };
  }).sort((a, b) => b.calls - a.calls);

  // CHART 3: Monthly Trends (simulated from history)
  const monthlyData = () => {
    const monthMap = new Map();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    agents.forEach(agent => {
      agent.history.forEach(day => {
        if (day.date) {
          const date = new Date(day.date);
          const monthIndex = date.getMonth();
          const month = months[monthIndex];
          
          if (!monthMap.has(month)) {
            monthMap.set(month, { 
              month, 
              calls: 0, 
              tickets: 0, 
              solved: 0,
              escalated: 0 
            });
          }
          const data = monthMap.get(month);
          data.calls += day.answeredCalls || 0;
          data.tickets += day.totalTickets || 0;
          data.solved += day.solvedTickets || 0;
          data.escalated += day.escalatedTickets || 0;
        }
      });
    });
    
    // Ensure all months are present in order
    return months.map(month => 
      monthMap.get(month) || { month, calls: 0, tickets: 0, solved: 0, escalated: 0 }
    );
  };

  const trendData = monthlyData();

  // CHART 4: Resolution Rate Distribution
  const resolutionData = [
    { name: 'High (90%+)', value: ticketChartData.filter(a => a.rate >= 90).length, color: '#10b981' },
    { name: 'Medium (70-89%)', value: ticketChartData.filter(a => a.rate >= 70 && a.rate < 90).length, color: '#6366f1' },
    { name: 'Low (<70%)', value: ticketChartData.filter(a => a.rate < 70 && a.rate > 0).length, color: '#f59e0b' },
    { name: 'No Data', value: ticketChartData.filter(a => a.rate === 0).length, color: '#64748b' },
  ].filter(item => item.value > 0);

  // CHART 5: Ticket Status Distribution
  const totalTicketsAll = ticketChartData.reduce((sum, a) => sum + a.total, 0);
  const totalSolvedAll = ticketChartData.reduce((sum, a) => sum + a.solved, 0);
  const totalEscalatedAll = ticketChartData.reduce((sum, a) => sum + a.escalated, 0);
  const totalPendingAll = totalTicketsAll - totalSolvedAll - totalEscalatedAll;

  const ticketStatusData = [
    { name: 'Solved', value: totalSolvedAll, color: '#10b981' },
    { name: 'Pending', value: totalPendingAll, color: '#6366f1' },
    { name: 'Escalated', value: totalEscalatedAll, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // 2. Sort agents for the "Top Performers" list by latest evaluation
  const topAgents = [...agents]
    .map((a) => {
      const latestEval = a.evaluations[a.evaluations.length - 1];
      const totalAgentCalls = a.history.reduce(
        (inner, h) => inner + (h.answeredCalls || 0),
        0,
      );
      const totalAgentTickets = a.history.reduce(
        (inner, h) => inner + (h.totalTickets || 0),
        0,
      );
      const solvedAgentTickets = a.history.reduce(
        (inner, h) => inner + (h.solvedTickets || 0),
        0,
      );
      const resolutionRate = totalAgentTickets > 0 
        ? Math.round((solvedAgentTickets / totalAgentTickets) * 100) 
        : 0;
      
      return { 
        agent: a, 
        latestEval, 
        totalAgentCalls,
        totalAgentTickets,
        resolutionRate
      };
    })
    .filter((x) => x.latestEval)
    .sort((a, b) => (b.latestEval!.score || 0) - (a.latestEval!.score || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION - Updated to match Agent Roster */}
      <div className="relative overflow-hidden bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] shadow-lg">
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

      {/* METRIC GRID - Updated with proper text colors */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-6">
        <StatCard title="Total Team Calls" value={totalCalls} subText="All answered calls" icon={<Users/>} color="text-blue-400" />
        <StatCard title="Total Tickets" value={totalTickets} subText="All tickets" icon={<Ticket/>} color="text-violet-400" />
        <StatCard title="Team QA Average" value={`${avgQA}%`} subText="All evaluated calls" icon={<Award/>} color="text-emerald-400" />
        <StatCard title="Avg Handle Time" value={avgAht} subText="Across all days" icon={<Clock/>} color="text-orange-400" />
        <StatCard title="Avg Resolution Time" value={avgResTime} subText="Across all days" icon={<Clock/>} color="text-sky-400" />
        <StatCard title="Resolution Rate" value={`${avgResolutionRate}%`} subText="Weighted" icon={<TrendingUp/>} color="text-emerald-400" />
        <StatCard title="Abandoned Rate" value={`${callAbandonedRate}%`} subText="Of total calls" icon={<AlertCircle/>} color="text-rose-400" />
        <StatCard title="Interactions" value={totalInteractions} subText="All channels" icon={<Activity/>} color="text-indigo-400" />
        <StatCard title="Cheese Upsell" value={`${cheeseUpsellPercentage}%`} subText="Added to base" icon={<Zap/>} color="text-amber-400" />
        <StatCard title="Avg Int/Ticket" value={avgInteractionsPerTicket} subText="Per ticket" icon={<Activity/>} color="text-cyan-400" />
        <StatCard title="Solved Tickets" value={totalSolved} subText={`${Math.round((totalSolved/totalTickets)*100)}% of total`} icon={<CheckCircle/>} color="text-emerald-400" />
      </div>

      {/* CHARTS ROW 1: Ticket Performance and Call Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Performance Chart */}
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-[2rem] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <Ticket size={16} className="text-indigo-500"/> Ticket Performance by Agent
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketChartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'total') return [`${value} tickets`, 'Total'];
                    if (name === 'solved') return [`${value} tickets`, 'Solved'];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="solved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Call Performance Chart */}
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-[2rem] shadow-lg">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <PhoneCall size={16} className="text-indigo-500"/> Call Volume by Agent
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callChartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold">Avg Calls/Agent</p>
              <p className="text-xl font-black text-white">
                {Math.round(totalCalls / agents.length)}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold">Busiest Agent</p>
              <p className="text-sm font-black text-indigo-400 truncate">
                {callChartData[0]?.name || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Monthly Trends and Ticket Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-[2rem] shadow-lg">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <LineChart size={16} className="text-indigo-500"/> Monthly Performance Trends
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar yAxisId="left" dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} name="Tickets" />
                <Line yAxisId="right" type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} name="Calls" />
                <Line yAxisId="right" type="monotone" dataKey="solved" stroke="#f59e0b" strokeWidth={2} name="Solved" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ticket Status Distribution */}
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-[2rem] shadow-lg">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <PieChart size={16} className="text-indigo-500"/> Ticket Status Distribution
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={ticketStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {ticketStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4 md:mt-0 md:ml-6">
              {ticketStatusData.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-400">{item.name}:</span>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                  <span className="text-[10px] text-slate-500">
                    ({Math.round((item.value / totalTicketsAll) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 3: Resolution Rate Distribution and AHT Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resolution Rate Distribution */}
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-[2rem] shadow-lg">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <Award size={16} className="text-indigo-500"/> Resolution Rate Distribution
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={resolutionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {resolutionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4 md:mt-0 md:ml-6">
              {resolutionData.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-slate-400">{item.name}:</span>
                  <span className="text-sm font-bold text-white">{item.value} agents</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AHT Analysis */}
        <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-[2rem] shadow-lg">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock size={16} className="text-indigo-500"/> Average Handle Time (AHT) by Agent
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callChartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} unit="m" tick={{ fill: '#94a3b8' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false}
                  width={60}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: number) => [`${value}m`, 'Avg Handle Time']}
                />
                <Bar dataKey="aht" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400">Team Average AHT: <span className="text-white font-bold">{avgAht}</span></p>
          </div>
        </div>
      </div>

      {/* Top Performers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-[#1e293b] border border-slate-800 p-8 rounded-[2rem] shadow-lg">
          <h3 className="text-white font-black text-sm uppercase tracking-widest mb-6">Top Performing Agents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topAgents.map(({ agent, latestEval, totalAgentCalls, totalAgentTickets, resolutionRate }, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 border border-slate-700 hover:border-indigo-500/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{agent.name}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase">{totalAgentCalls} Calls</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700">
                    <p className="text-[8px] text-slate-400">QA Score</p>
                    <p className="text-sm font-black text-emerald-400">{latestEval?.score}%</p>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-2 border border-slate-700">
                    <p className="text-[8px] text-slate-400">Tickets</p>
                    <p className="text-sm font-black text-indigo-400">{totalAgentTickets}</p>
                  </div>
                  <div className="bg-slate-800/80 rounded-xl p-2 col-span-2 border border-slate-700">
                    <p className="text-[8px] text-slate-400">Resolution Rate</p>
                    <p className="text-sm font-black text-amber-400">{resolutionRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-[#1e293b] border border-slate-800 rounded-[2rem] overflow-hidden shadow-lg">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Agent Performance Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Agent</th>
                <th className="px-6 py-4 text-center">Calls</th>
                <th className="px-6 py-4 text-center">Tickets</th>
                <th className="px-6 py-4 text-center">Solved</th>
                <th className="px-6 py-4 text-center">Resolution</th>
                <th className="px-6 py-4 text-center">AHT</th>
                <th className="px-6 py-4 text-center">QA Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {agents.map((agent) => {
                const calls = agent.history.reduce((s, h) => s + (h.answeredCalls || 0), 0);
                const tickets = agent.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
                const solved = agent.history.reduce((s, h) => s + (h.solvedTickets || 0), 0);
                const resolutionRate = tickets > 0 ? Math.round((solved / tickets) * 100) : 0;
                const aht = agent.history.length > 0 
                  ? Math.round(agent.history.reduce((s, h) => s + (h.ahtSeconds || 0), 0) / agent.history.length / 60)
                  : 0;
                const latestScore = agent.evaluations.length > 0 
                  ? agent.evaluations[agent.evaluations.length - 1]?.score 
                  : 0;
                
                return (
                  <tr key={agent.id} className="hover:bg-indigo-500/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[10px] font-black text-white">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-bold text-slate-200">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-400">{calls}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-400">{tickets}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-400">{solved}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${
                        resolutionRate >= 90 ? 'text-emerald-400' : 
                        resolutionRate >= 70 ? 'text-indigo-400' : 
                        resolutionRate > 0 ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {resolutionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-orange-400">{aht}m</td>
                    <td className="px-6 py-4 text-center font-bold text-purple-400">{latestScore}%</td>
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