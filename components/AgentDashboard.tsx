import React, { useState, useEffect } from 'react';
import { generateCoachingFeedback } from "../services/grokService";
import { Agent } from "../types";
import {
  PhoneCall,
  CheckCircle,
  Clock,
  Target,
  LayoutGrid,
  Activity,
  Calendar,
  MessageSquare,
  ChevronLeft,
  TrendingUp,
  Award,
  Zap,
  RefreshCw,
  BarChart3,
  GitCompare,
  Bell,
  Gift,
  Crown,
  Star,
  Trophy,
  Medal,
  Flame,
  Sparkles,
  Rocket,
  Brain,
  Heart,
  Download,
  Share2,
  Bookmark,
  Eye,
  ThumbsUp,
  AlertCircle,
  Ticket,
  BarChart4,
  Percent,
  ShoppingCart,
} from "lucide-react";

interface Props {
  agent: Agent;
  agents?: Agent[];
  dateRange: { start: string; end: string };
  onDateChange: (range: { start: string; end: string }) => void;
  viewMode: "stats" | "evaluations" | "agentStats";
  onBack?: () => void;
  showToggle?: boolean;
  onToggleView?: (mode: "stats" | "evaluations") => void;
}

export const AgentDashboard: React.FC<Props> = ({
  agent,
  agents = [],
  dateRange,
  onDateChange,
  viewMode,
  onBack,
  showToggle,
  onToggleView,
}) => {
  // Add null check at the beginning
  if (!agent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h3 className="text-white text-lg font-bold">Agent data not available</h3>
          <p className="text-slate-400 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  const startDate = dateRange.start ? new Date(dateRange.start) : null;
  const endDate = dateRange.end ? new Date(dateRange.end) : null;
  const [coachText, setCoachText] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [showTrends, setShowTrends] = useState(false);
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'tired' | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [goals, setGoals] = useState([
    { id: 1, name: 'Calls', target: 50, current: 0, unit: 'calls' },
    { id: 2, name: 'CSAT Score', target: 90, current: 0, unit: '%' },
    { id: 3, name: 'Resolution Rate', target: 85, current: 0, unit: '%' },
    { id: 4, name: 'Tickets Solved', target: 40, current: 0, unit: 'tickets' },
  ]);
  const [editableGoals, setEditableGoals] = useState(goals);

  const tips = [
    { icon: <Zap size={16} />, text: 'Try to acknowledge customer by name twice per call' },
    { icon: <Clock size={16} />, text: 'Your AHT is improving. Keep up the pace!' },
    { icon: <Target size={16} />, text: 'Focus on capturing complete customer info on first call' },
    { icon: <TrendingUp size={16} />, text: 'You\'ve improved this week. Keep it up!' },
    { icon: <Brain size={16} />, text: 'Remember to use open-ended questions to understand needs' },
    { icon: <Heart size={16} />, text: 'Customers respond well to empathy. Keep showing you care!' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  };

  // Safely access history and evaluations with default empty arrays
  const filteredHistory = (agent.history || []).filter((h) => isWithinRange(h.date));
  const filteredEvaluations = (agent.evaluations || []).filter((e) =>
    isWithinRange(e.date),
  );

  const latestEval =
    filteredEvaluations.length > 0
      ? filteredEvaluations[filteredEvaluations.length - 1]
      : (agent.evaluations || [])[agent.evaluations?.length - 1];

  const kpis = latestEval?.kpis || {
    capture: 0,
    etiquette: 0,
    solving: 0,
    product: 0,
    upsell: 0,
    promo: 0,
  };
  const currentScore = latestEval?.score || 0;

  const totalEvaluations = filteredEvaluations.length || agent.evaluations?.length || 0;
  const totalScore = (filteredEvaluations.length
    ? filteredEvaluations
    : (agent.evaluations || [])
  ).reduce((sum, evalItem) => sum + (evalItem.score || 0), 0);

  const totalCalls = filteredHistory.reduce(
    (sum, h) => sum + (h.answeredCalls || 0),
    0,
  );
  const totalTickets = filteredHistory.reduce(
    (sum, h) => sum + (h.totalTickets || 0),
    0,
  );
  const solvedTickets = filteredHistory.reduce(
    (sum, h) => sum + (h.solvedTickets || 0),
    0,
  );
  const interactions = filteredHistory.reduce(
    (sum, h) => sum + (h.interactions || 0),
    0,
  );

  const weightedResolutionRate =
    totalTickets > 0 ? Math.round((solvedTickets / totalTickets) * 100) : 0;

  // Calculate average KPI score
  const evaluations = agent.evaluations || [];
  const totalKpiScore = evaluations.reduce((sum, e) => 
    sum + (e.kpis?.product || 0) + (e.kpis?.etiquette || 0) + (e.kpis?.solving || 0) + 
    (e.kpis?.upsell || 0) + (e.kpis?.promo || 0) + (e.kpis?.capture || 0), 0);
  const averageKpiScore = evaluations.length > 0 
    ? Math.round(totalKpiScore / (evaluations.length * 6)) : 0;

  // Calculate average resolution time in minutes
  const avgResolutionTimeMinutes = filteredHistory.length > 0
    ? (filteredHistory.reduce((sum, h) => {
        const secs = h.avgResolutionSeconds ?? 
                    (parseInt(h.avgResolutionTime || "0", 10) || 0);
        return sum + secs;
      }, 0) / filteredHistory.length / 60).toFixed(1)
    : "0";

  // Calculate cheese upsell for the selected date range using Formula 2
  const totalDebSales = filteredHistory.reduce(
    (sum, h) => sum + (h.debonairsSales || 0),
    0,
  );
  const totalCheeseSales = filteredHistory.reduce(
    (sum, h) => sum + (h.cheeseSales || 0),
    0,
  );
  const baseSales = totalDebSales - totalCheeseSales;
  const cheeseUpsellPercentage = baseSales > 0
    ? ((totalCheeseSales / baseSales) * 100).toFixed(1)
    : "0";

  // Calculate total Credits/Discounts count for this agent
  const totalCreditsDiscounts = filteredHistory.reduce(
    (sum, h) => sum + (h.creditsDiscounts || 0),
    0,
  );

  // Calculate total Transactions for this agent
  const totalTransactions = filteredHistory.reduce(
    (sum, h) => sum + (h.transactions || 0),
    0,
  );

  // Calculate FCR (First Call Resolution) for this agent
  const totalFCR = filteredHistory.reduce(
    (sum, h) => sum + (h.fcr || 0),
    0,
  );
  const avgFCR = filteredHistory.length > 0
    ? (totalFCR / filteredHistory.length).toFixed(1)
    : "0";

  // Update goals with current values
  useEffect(() => {
    setGoals([
      { id: 1, name: 'Calls', target: 50, current: totalCalls, unit: 'calls' },
      { id: 2, name: 'CSAT Score', target: 90, current: currentScore, unit: '%' },
      { id: 3, name: 'Resolution Rate', target: 85, current: weightedResolutionRate, unit: '%' },
      { id: 4, name: 'Tickets Solved', target: 40, current: solvedTickets, unit: 'tickets' },
    ]);
  }, [totalCalls, currentScore, weightedResolutionRate, solvedTickets]);

  // Fetch AI coaching feedback when latestEval changes
  useEffect(() => {
    const fetchCoachingFeedback = async () => {
      if (!latestEval) {
        setCoachText(null);
        return;
      }

      setCoachLoading(true);
      setCoachError(null);
      
      try {
        const feedback = await generateCoachingFeedback(agent, latestEval, agent.history);
        setCoachText(feedback);
      } catch (err) {
        console.error("Error fetching coaching feedback:", err);
        setCoachError("Unable to connect to AI Coach. Please try again later.");
      } finally {
        setCoachLoading(false);
      }
    };

    fetchCoachingFeedback();
  }, [agent, latestEval]);

  // Manual refresh function
  const handleRefreshCoach = async () => {
    if (!latestEval) return;
    
    setCoachLoading(true);
    setCoachError(null);
    
    try {
      const feedback = await generateCoachingFeedback(agent, latestEval, agent.history);
      setCoachText(feedback);
    } catch (err) {
      setCoachError("Refresh failed. Please try again.");
    } finally {
      setCoachLoading(false);
    }
  };

  // Calculate achievements
  const achievements = [
    { 
      id: 1, 
      name: '100 Club', 
      icon: <Crown className="text-yellow-400" size={20} />,
      achieved: ((agent.evaluations || []).filter(e => e.score >= 90).length) >= 3,
      description: '3 evaluations with 90%+ score',
      progress: Math.min(100, ((agent.evaluations || []).filter(e => e.score >= 90).length / 3) * 100)
    },
    { 
      id: 2, 
      name: 'Ticket Master', 
      icon: <Ticket className="text-emerald-400" size={20} />,
      achieved: (agent.history || []).reduce((sum, h) => sum + (h.solvedTickets || 0), 0) >= 100,
      description: 'Solve 100 tickets',
      progress: Math.min(100, ((agent.history || []).reduce((sum, h) => sum + (h.solvedTickets || 0), 0) / 100) * 100)
    },
    { 
      id: 3, 
      name: 'Call Warrior', 
      icon: <PhoneCall className="text-blue-400" size={20} />,
      achieved: totalCalls >= 200,
      description: 'Handle 200 calls',
      progress: Math.min(100, (totalCalls / 200) * 100)
    },
    { 
      id: 4, 
      name: 'Rising Star', 
      icon: <Rocket className="text-purple-400" size={20} />,
      achieved: (agent.evaluations || []).length >= 5 && currentScore > 80,
      description: '5+ evals with 80%+ score',
      progress: Math.min(100, ((agent.evaluations || []).length / 5) * 100)
    },
    { 
      id: 5, 
      name: 'Consistency King', 
      icon: <Flame className="text-orange-400" size={20} />,
      achieved: (agent.evaluations || []).length >= 10,
      description: '10+ evaluations completed',
      progress: Math.min(100, ((agent.evaluations || []).length / 10) * 100)
    },
    { 
      id: 6, 
      name: 'Problem Solver', 
      icon: <Brain className="text-indigo-400" size={20} />,
      achieved: weightedResolutionRate >= 85,
      description: '85%+ resolution rate',
      progress: weightedResolutionRate
    },
  ];

  // Historical scores for trend
  const historicalScores = (agent.evaluations || []).slice(-7).map((e, i) => ({
    day: `Day ${i + 1}`,
    score: e.score,
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  // Team averages (mock data - replace with actual team data)
  const teamAvgScore = 78;
  const teamAvgCalls = 45;
  const teamAvgResolution = 82;

  const comparisons = [
    {
      metric: 'CSAT Score',
      value: currentScore,
      teamAvg: teamAvgScore,
      icon: <Target size={14} />,
      color: currentScore > teamAvgScore ? 'text-emerald-400' : 'text-amber-400'
    },
    {
      metric: 'Calls Handled',
      value: totalCalls,
      teamAvg: teamAvgCalls,
      icon: <PhoneCall size={14} />,
      color: totalCalls > teamAvgCalls ? 'text-emerald-400' : 'text-amber-400'
    },
    {
      metric: 'Resolution Rate',
      value: weightedResolutionRate,
      teamAvg: teamAvgResolution,
      icon: <CheckCircle size={14} />,
      color: weightedResolutionRate > teamAvgResolution ? 'text-emerald-400' : 'text-amber-400'
    },
  ];

  // Export function
  const exportData = () => {
    const data = {
      agent: agent.name,
      period: `${dateRange.start} to ${dateRange.end}`,
      stats: {
        totalCalls,
        totalTickets,
        currentScore,
        weightedResolutionRate,
        interactions,
        kpis,
        debonairsSales: totalDebSales,
        cheeseSales: totalCheeseSales,
        cheeseUpsellPercentage: cheeseUpsellPercentage,
        creditsDiscounts: totalCreditsDiscounts,
        fcr: avgFCR
      },
      evaluations: agent.evaluations || []
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agent.name}-performance-${dateRange.start}.json`;
    a.click();
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "Unknown";
    if (phone.match(/^\d{9}$/)) {
      return `0${phone}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* PREMIUM HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-indigo-600 dark:via-indigo-700 dark:to-purple-800 p-8 rounded-[2rem] shadow-2xl">
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Go back"
                className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 hover:scale-110 transition-all duration-300"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-white tracking-tight">
                  {onBack
                    ? agent.name
                    : `Welcome back, ${agent.name.split(" ")[0]}!`}
                </h1>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="animate-pulse" />
                  Live Dashboard
                </span>
              </div>
              <p className="text-white/80 text-sm font-medium">
                Real-time performance metrics • Last updated just now
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Export button */}
            <button
              onClick={exportData}
              aria-label="Export data"
              className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              <Download size={16} className="text-white" aria-hidden="true" />
            </button>

            {/* Date picker */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl">
              <Calendar size={16} className="text-white/70 ml-1" />
              <div className="flex items-center gap-2 text-xs text-white font-bold">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    onDateChange({ ...dateRange, start: e.target.value })
                  }
                  className="bg-transparent border-none focus:ring-0 w-24 text-white placeholder-white/50 [color-scheme:dark]"
                />
                <span className="text-white/40">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    onDateChange({ ...dateRange, end: e.target.value })
                  }
                  className="bg-transparent border-none focus:ring-0 w-24 text-white placeholder-white/50 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* View toggle */}
            {showToggle && onToggleView && (
              <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                <button
                  onClick={() => onToggleView("stats")}
                  aria-label="Switch to stats view"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    viewMode === "stats" 
                      ? "bg-white text-indigo-700 shadow-lg" 
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Stats
                </button>
                <button
                  onClick={() => onToggleView("evaluations")}
                  aria-label="Switch to calls view"
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    viewMode === "evaluations" 
                      ? "bg-white text-indigo-700 shadow-lg" 
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  Calls
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {viewMode === "stats" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* STAT CARDS GRID - UPDATED with requested changes */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
              <PremiumStatCard
                title="Calls Handled"
                value={totalCalls}
                sub="vs 40 target"
                icon={<PhoneCall />}
                color="from-blue-500 to-cyan-500"
                trend={totalCalls > 40 ? `+${totalCalls - 40}` : `${totalCalls - 40}`}
              />
              <PremiumStatCard
                title="Tickets"
                value={totalTickets}
                sub="in selected range"
                icon={<LayoutGrid />}
                color="from-violet-500 to-purple-500"
              />
              <PremiumStatCard
                title="Resolution Time"
                value={`${avgResolutionTimeMinutes}m`}
                sub="avg per ticket"
                icon={<Clock />}
                color="from-sky-500 to-cyan-500"
              />
              <PremiumStatCard
                title="CSAT Score"
                value={`${currentScore}%`}
                sub="latest evaluation"
                icon={<Target />}
                color="from-emerald-500 to-teal-500"
              />
              <PremiumStatCard
                title="Resolution Rate"
                value={`${weightedResolutionRate}%`}
                sub="success rate"
                icon={<CheckCircle />}
                color="from-emerald-500 to-green-500"
              />
              <PremiumStatCard
                title="FCR Score"
                value={`${avgFCR}%`}
                sub="first call resolution"
                icon={<CheckCircle />}
                color="from-green-500 to-emerald-500"
              />
              <PremiumStatCard
                title="Interactions"
                value={interactions}
                sub="total touches"
                icon={<Activity />}
                color="from-indigo-500 to-blue-500"
              />
              <PremiumStatCard
                title="Avg Interactions/Ticket"
                value={totalTickets > 0 ? (interactions / totalTickets).toFixed(1) : "0"}
                sub="per ticket"
                icon={<Activity />}
                color="from-cyan-500 to-teal-500"
              />
              <PremiumStatCard
                title="Avg KPI Score"
                value={`${averageKpiScore}%`}
                sub="overall performance"
                icon={<Award />}
                color="from-purple-500 to-pink-500"
              />
              <PremiumStatCard
                title="Cheese Upsell"
                value={`${cheeseUpsellPercentage}%`}
                sub="added to base"
                icon={<Zap />}
                color="from-amber-500 to-yellow-500"
              />
              <PremiumStatCard
                title="Credits/Discounts"
                value={totalCreditsDiscounts}
                sub="total given"
                icon={<Percent />}
                color="from-purple-500 to-pink-500"
              />
              <PremiumStatCard
                title="Transactions"
                value={totalTransactions}
                sub="total completed"
                icon={<ShoppingCart />}
                color="from-teal-500 to-cyan-500"
              />
            </div>

            {/* Trend Chart Toggle */}
            <button
              onClick={() => setShowTrends(!showTrends)}
              aria-label={showTrends ? 'Hide performance trend' : 'Show performance trend'}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors"
            >
              <BarChart3 size={16} aria-hidden="true" />
              {showTrends ? 'Hide' : 'Show'} Performance Trend
            </button>

            {/* Performance Trend Chart */}
            {showTrends && historicalScores.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl p-6 border border-indigo-500/30 animate-in slide-in-from-bottom">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-400" />
                    Performance Trend (Last 7 Evaluations)
                  </h4>
                </div>
                <div className="h-40 flex items-end gap-2">
                  {historicalScores.map((item, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-lg transition-all group-hover:from-indigo-400 group-hover:to-indigo-300"
                          style={{ height: `${item.score}px`, maxHeight: '100px', minHeight: '20px' }}
                        >
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                            {item.score}%
                          </div>
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 mt-2">{item.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Carousel */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl p-5 border border-indigo-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <div className="relative flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  {tips[tipIndex].icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-white">{tips[tipIndex].text}</p>
                  <div className="flex gap-1 mt-3">
                    {tips.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setTipIndex(i)}
                        aria-label={`Tip ${i + 1}`}
                        className={`h-1 rounded-full transition-all ${
                          i === tipIndex ? 'w-4 bg-indigo-400' : 'w-2 bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button 
                aria-label="Export report"
                className="bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
              >
                <Download size={20} className="group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-[10px] font-bold">Export Report</span>
              </button>
              <button 
                aria-label="Share progress"
                className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
              >
                <Share2 size={20} className="group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-[10px] font-bold">Share Progress</span>
              </button>
              <button 
                aria-label="Save goal"
                className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
              >
                <Bookmark size={20} className="group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-[10px] font-bold">Save Goal</span>
              </button>
              <button 
                aria-label="Set alert"
                className="bg-amber-600 hover:bg-amber-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2 transition-all group"
              >
                <Bell size={20} className="group-hover:scale-110 transition" aria-hidden="true" />
                <span className="text-[10px] font-bold">Set Alert</span>
              </button>
            </div>

            {/* Peer Comparison */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl p-6 border border-indigo-500/30">
              <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                <GitCompare size={18} className="text-indigo-400" />
                vs Team Average
              </h4>
              <div className="space-y-4">
                {comparisons.map((comp, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-slate-400">
                        {comp.icon}
                        <span>{comp.metric}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{comp.value}{comp.metric.includes('Score') ? '%' : ''}</span>
                        <span className="text-slate-500">vs {comp.teamAvg}{comp.metric.includes('Score') ? '%' : ''}</span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(comp.value / Math.max(comp.value, comp.teamAvg)) * 100}%` }}
                      ></div>
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-white"
                        style={{ left: `${(comp.teamAvg / Math.max(comp.value, comp.teamAvg)) * 100}%` }}
                      ></div>
                    </div>
                    <p className={`text-[9px] font-bold ${comp.color}`}>
                      {comp.value > comp.teamAvg ? '▲ Above average' : '▼ Below average'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Competency Section */}
            <div className="bg-[#1e293b]/40 border border-slate-800 p-8 rounded-[2rem] relative overflow-hidden">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Performance Metrics
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                <ThickKPI
                  label="Product Knowledge"
                  value={kpis.product || 0}
                  color="bg-blue-500"
                />
                <ThickKPI
                  label="Phone Etiquette"
                  value={kpis.etiquette || 0}
                  color="bg-indigo-500"
                />
                <ThickKPI
                  label="Problem Solving"
                  value={kpis.solving || 0}
                  color="bg-purple-500"
                />
                <ThickKPI
                  label="Upselling"
                  value={kpis.upsell || 0}
                  color="bg-emerald-500"
                />
                <ThickKPI
                  label="Promotion"
                  value={kpis.promo || 0}
                  color="bg-amber-500"
                />
                <ThickKPI
                  label="Information Capture"
                  value={kpis.capture || 0}
                  color="bg-rose-500"
                />
              </div>
            </div>

            {/* KPI Breakdown Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <BarChart4 size={18} className="text-indigo-400" />
                  Your KPI Performance
                </h4>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full">
                  Based on {(agent.evaluations || []).length} evaluations
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MiniKPICard
                  label="Product"
                  value={kpis.product || 0}
                  color="from-blue-500 to-blue-600"
                />
                <MiniKPICard
                  label="Etiquette"
                  value={kpis.etiquette || 0}
                  color="from-indigo-500 to-indigo-600"
                />
                <MiniKPICard
                  label="Problem"
                  value={kpis.solving || 0}
                  color="from-purple-500 to-purple-600"
                />
                <MiniKPICard
                  label="Upsell"
                  value={kpis.upsell || 0}
                  color="from-emerald-500 to-emerald-600"
                />
                <MiniKPICard
                  label="Promo"
                  value={kpis.promo || 0}
                  color="from-amber-500 to-amber-600"
                />
                <MiniKPICard
                  label="Capture"
                  value={kpis.capture || 0}
                  color="from-rose-500 to-rose-600"
                />
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                <Activity size={18} className="text-indigo-400" />
                Recent Activity
              </h4>
              <div className="space-y-3">
                {(agent.evaluations || []).slice(-3).map((eval_, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs border-b border-slate-700/50 pb-3 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <MessageSquare size={12} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-slate-300">New evaluation received</p>
                      <p className="text-[9px] text-slate-500">
                        Score: {eval_.score}% • {new Date(eval_.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredHistory.slice(-2).map((history, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs border-b border-slate-700/50 pb-3 last:border-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <PhoneCall size={12} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-slate-300">Handled {history.answeredCalls} calls</p>
                      <p className="text-[9px] text-slate-500">{history.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Coach Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-500/30 p-8 rounded-[2rem] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <Award className="text-white" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      AI Performance Coach
                    </h4>
                    <p className="text-indigo-200 text-[8px] font-bold uppercase tracking-wider">
                      Powered by Grok AI
                    </p>
                  </div>
                </div>
                {latestEval && !coachLoading && (
                  <button
                    onClick={handleRefreshCoach}
                    aria-label="Refresh AI insights"
                    className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <RefreshCw size={16} className="text-indigo-300" aria-hidden="true" />
                  </button>
                )}
              </div>
              
              <div className="bg-slate-950/40 rounded-2xl p-6 border border-white/5 min-h-[120px] flex items-center">
                {coachLoading ? (
                  <div className="flex items-center justify-center w-full gap-3">
                    <RefreshCw className="animate-spin text-indigo-300" size={20} />
                    <span className="text-indigo-100/70 text-sm">Analyzing performance...</span>
                  </div>
                ) : coachError ? (
                  <div className="text-amber-300 text-sm text-center w-full">
                    {coachError}
                    <button 
                      onClick={handleRefreshCoach}
                      aria-label="Try again"
                      className="block mx-auto mt-2 text-xs text-indigo-300 hover:text-white underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : coachText ? (
                  <p className="text-indigo-100/90 text-sm italic leading-relaxed">
                    "{coachText}"
                  </p>
                ) : (
                  <p className="text-indigo-100/50 text-sm text-center w-full">
                    {latestEval ? "✨ Click refresh for AI insights" : "📅 Select a date range to begin"}
                  </p>
                )}
              </div>
              
              <button 
                className="w-full mt-6 py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors"
                aria-label="View detailed analysis"
              >
                Deep Dive Insights →
              </button>
            </div>

            {/* Mood Tracker */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl p-6 border border-indigo-500/30">
              <h4 className="text-white font-bold flex items-center gap-2 mb-4">
                <Heart size={18} className="text-rose-400" />
                How are you feeling today?
              </h4>
              <div className="flex gap-2 justify-between">
                {[
                  { mood: 'great', emoji: '🚀', label: 'Great' },
                  { mood: 'good', emoji: '😊', label: 'Good' },
                  { mood: 'okay', emoji: '😐', label: 'Okay' },
                  { mood: 'tired', emoji: '😴', label: 'Tired' },
                ].map((item) => (
                  <button
                    key={item.mood}
                    onClick={() => setMood(item.mood as any)}
                    aria-label={`Feeling ${item.label.toLowerCase()}`}
                    className={`flex-1 p-3 rounded-xl text-center transition-all ${
                      mood === item.mood
                        ? 'bg-indigo-600 text-white scale-105'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-lg block mb-1" aria-hidden="true">{item.emoji}</span>
                    <span className="text-[8px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
              {mood && (
                <p className="text-center text-xs text-indigo-400 mt-3 animate-pulse">
                  Thanks for sharing! Your feedback helps us improve.
                </p>
              )}
            </div>

            {/* Weekly Goals */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Target size={18} className="text-indigo-400" />
                  Weekly Goals
                </h4>
                <button 
                  onClick={() => setIsEditingGoals(!isEditingGoals)}
                  aria-label={isEditingGoals ? "Save goals" : "Edit your goals"}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300"
                >
                  {isEditingGoals ? "Save" : "Edit Goals"}
                </button>
              </div>
              
              <div className="space-y-4">
                {editableGoals.map((goal) => {
                  const progress = Math.min(100, (goal.current / goal.target) * 100);
                  const isComplete = goal.current >= goal.target;
                  
                  return (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{goal.name}</span>
                        <div className="flex items-center gap-2">
                          {isEditingGoals ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={goal.target}
                                onChange={(e) => {
                                  const newGoals = editableGoals.map(g => 
                                    g.id === goal.id ? {...g, target: parseInt(e.target.value) || 0} : g
                                  );
                                  setEditableGoals(newGoals);
                                }}
                                className="w-16 bg-slate-700 text-white text-xs rounded px-2 py-1 border border-slate-600"
                                min="1"
                              />
                              <span className="text-slate-400">{goal.unit}</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-white font-bold">
                                {goal.current}{goal.unit}
                              </span>
                              <span className="text-slate-500">
                                / {goal.target}{goal.unit}
                              </span>
                            </>
                          )}
                          {isComplete && !isEditingGoals && (
                            <span className="text-emerald-400 text-[10px] flex items-center gap-0.5">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      </div>
                      {!isEditingGoals && (
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {isEditingGoals && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setGoals(editableGoals);
                      setIsEditingGoals(false);
                      localStorage.setItem('agentGoals', JSON.stringify(editableGoals));
                    }}
                    aria-label="Save changes"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditableGoals(goals);
                      setIsEditingGoals(false);
                    }}
                    aria-label="Cancel editing"
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" />
                  Achievements
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                    {achievements.filter(a => a.achieved).length}/{achievements.length}
                  </span>
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {achievements.map((ach) => (
                  <div 
                    key={ach.id} 
                    className={`relative group p-3 rounded-xl text-center transition-all ${
                      ach.achieved 
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30' 
                        : 'bg-slate-800/50 border border-slate-700/50 opacity-50'
                    }`}
                    title={ach.description}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {ach.icon}
                      <span className="text-[8px] font-bold text-white mt-1">{ach.name}</span>
                      {!ach.achieved && (
                        <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${ach.progress}%` }}
                          ></div>
                        </div>
                      )}
                      {ach.achieved && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "agentStats" ? (
        /* AGENT STATS VIEW */
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy size={20} /> Agent Performance Comparison
            </h2>
            <p className="text-indigo-200 text-sm mt-1">See how you stack up against the team</p>
          </div>
          
          <div className="bg-[#1e293b] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/50 text-[9px] uppercase font-black text-slate-500 tracking-widest">
                  <tr>
                    <th className="px-3 py-3 text-left">AGENT</th>
                    <th className="px-3 py-3 text-center">TICKETS</th>
                    <th className="px-3 py-3 text-center">SOLVED</th>
                    <th className="px-3 py-3 text-center">CALLS</th>
                    <th className="px-3 py-3 text-center">ABN%</th>
                    <th className="px-3 py-3 text-center">CSAT</th>
                    <th className="px-3 py-3 text-center">CHEESE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {[...agents]
                    .sort((a, b) => {
                      const ticketsA = a.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
                      const ticketsB = b.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
                      return ticketsB - ticketsA;
                    })
                    .map((a) => {
                      const latestScore = a.evaluations.length > 0 
                        ? a.evaluations[a.evaluations.length - 1]?.score || 0 
                        : 0;
                      const totalCalls = a.history.reduce((s, h) => s + (h.answeredCalls || 0), 0);
                      const totalAbandoned = a.history.reduce((s, h) => s + (h.abandonedCalls || 0), 0);
                      const abandonedRate = totalCalls > 0 ? ((totalAbandoned / totalCalls) * 100).toFixed(1) : "0";
                      const totalTickets = a.history.reduce((s, h) => s + (h.totalTickets || 0), 0);
                      const solved = a.history.reduce((s, h) => s + (h.solvedTickets || 0), 0);
                      const debSales = a.history.reduce((s, h) => s + (h.debonairsSales || 0), 0);
                      const cheeseSales = a.history.reduce((s, h) => s + (h.cheeseSales || 0), 0);
                      const cheeseUpsell = debSales > cheeseSales ? ((cheeseSales / (debSales - cheeseSales)) * 100).toFixed(1) : "0";
                      const isMe = a.email.toLowerCase() === agent.email.toLowerCase();
                      
                      return (
                        <tr key={a.id} className={`hover:bg-indigo-500/5 transition-colors ${isMe ? 'bg-indigo-500/10' : ''}`}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-[8px] font-black text-white">
                                {a.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <span className="text-[10px] font-bold text-slate-200">
                                {a.name.split(' ')[0]} {isMe && <span className="text-indigo-400">(You)</span>}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center font-black text-slate-300">
                            {totalTickets}
                          </td>
                          <td className="px-3 py-3 text-center font-black text-emerald-400">
                            {solved}
                          </td>
                          <td className="px-3 py-3 text-center font-black text-blue-400">
                            {totalCalls}
                          </td>
                          <td className="px-3 py-3 text-center font-black text-amber-400">
                            {abandonedRate}%
                          </td>
                          <td className="px-3 py-3 text-center font-black text-indigo-400">
                            {latestScore}%
                          </td>
                          <td className="px-3 py-3 text-center font-black text-amber-400">
                            {cheeseUpsell}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* EVALUATIONS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-bottom-6 duration-500">
          {(filteredEvaluations.length ? filteredEvaluations : (agent.evaluations || [])).map((evalItem, idx) => {
            const phoneNumber = evalItem.id ? formatPhoneNumber(evalItem.id) : `#${1000 + idx}`;
            
            return (
              <div
                key={idx}
                className="bg-[#1e293b] border border-slate-800 rounded-lg overflow-hidden shadow-lg group hover:border-indigo-500/40 transition-all"
              >
                <div className="p-3 border-b border-slate-800 bg-slate-900/40">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-bold text-xs truncate">{phoneNumber}</span>
                    <span className={`text-lg font-black ${evalItem.score >= 90 ? "text-emerald-400" : "text-orange-400"}`}>
                      {evalItem.score}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <div className="flex flex-col">
                      {evalItem.callReceivedDate && (
                        <span>Called: {evalItem.callReceivedDate}</span>
                      )}
                      <span className="text-indigo-400">{evalItem.date || dateRange.start}</span>
                    </div>
                    <span>{evalItem.duration || (evalItem.durationSeconds ? `${Math.floor(evalItem.durationSeconds / 60)}:${(evalItem.durationSeconds % 60).toString().padStart(2, "0")}` : "")}</span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <KPIMini label="Product" value={evalItem.kpis.product || 0} />
                  <KPIMini label="Etiquette" value={evalItem.kpis.etiquette || 0} />
                  <KPIMini label="Solving" value={evalItem.kpis.solving || 0} />
                  <KPIMini label="Upsell" value={evalItem.kpis.upsell || 0} />
                  <KPIMini label="Promotion" value={evalItem.kpis.promo || 0} />
                  <KPIMini label="Capture" value={evalItem.kpis.capture || 0} />
                </div>

                {evalItem.comments && (
                  <div className="px-3 pb-3 border-t border-slate-800/50 mt-2 pt-2">
                    <p className="text-[9px] text-slate-400 italic line-clamp-2">
                      "{evalItem.comments}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* STYLED COMPONENTS */
const PremiumStatCard = ({ title, value, sub, icon, color, trend }: any) => (
  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-2xl group hover:scale-105 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/20">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
        {React.cloneElement(icon, { className: "text-white", size: 20 })}
      </div>
      {trend && (
        <span className={`text-xs font-bold ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-slate-400 text-xs uppercase font-bold mb-1">{title}</p>
    <p className="text-2xl font-black text-white mb-1">{value}</p>
    <p className="text-slate-500 text-[10px]">{sub}</p>
  </div>
);

const ThickKPI = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center px-1">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
        {label}
      </span>
      <span className="text-xs font-black text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
        {value}%
      </span>
    </div>
    <div className="h-4 bg-slate-950 rounded-full border border-slate-800/80 overflow-hidden p-[3px] shadow-inner">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${color} shadow-[0_0_15px_rgba(99,102,241,0.2)]`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

const MiniKPICard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-indigo-500/50 transition-all group">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-black text-white">{value}%</span>
    </div>
    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full bg-gradient-to-r ${color}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);

const KPIMini = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center text-[10px]">
      <span className="text-slate-500 font-bold">{label}</span>
      <span className="text-white font-black">{value}%</span>
    </div>
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className="h-full bg-indigo-500 rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);