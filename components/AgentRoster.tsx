import React, { useState } from 'react';
import { Agent } from '../types';
import { Mail, PhoneCall, Star, ArrowRight } from 'lucide-react';

interface Props {
  agents: Agent[];
  onViewAgent: (id: string) => void;
}

export const AgentRoster: React.FC<Props> = ({ agents, onViewAgent }) => {
  const [hoveredEmail, setHoveredEmail] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agent Roster</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Directory of all synchronized personnel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map((agent) => {
          const lastEval = agent.evaluations[agent.evaluations.length - 1];
          const totalCalls = agent.history.reduce((sum, day) => sum + day.answeredCalls, 0);

          return (
            <div 
              key={agent.id} 
              className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-all relative"
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src={agent.avatarUrl} 
                    alt={agent.name} 
                    className="w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-700 flex-shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                      {agent.name}
                    </h3>
                    <div 
                      className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1 relative"
                      onMouseEnter={() => setHoveredEmail(agent.email)}
                      onMouseLeave={() => setHoveredEmail(null)}
                    >
                      <Mail size={12} className="mr-1 flex-shrink-0" /> 
                      <span className="truncate cursor-help">
                        {agent.email.length > 24 ? agent.email.substring(0, 20) + '...' : agent.email}
                      </span>
                      
                      {/* Tooltip */}
                      {hoveredEmail === agent.email && agent.email.length > 24 && (
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-50">
                          {agent.email}
                          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Total Calls
                    </p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center">
                      <PhoneCall size={14} className="mr-2 text-indigo-500 flex-shrink-0" /> 
                      <span className="truncate">{totalCalls}</span>
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Latest CSAT
                    </p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center">
                      <Star size={14} className="mr-2 text-amber-500 flex-shrink-0" /> 
                      <span className="truncate">{lastEval?.score || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onViewAgent(agent.id)} 
                className="mt-6 w-full bg-slate-100 dark:bg-slate-800/80 hover:dark:bg-indigo-600 hover:bg-indigo-500 text-slate-600 dark:text-slate-300 hover:text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all group-hover:shadow-md"
              >
                View Profile <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};