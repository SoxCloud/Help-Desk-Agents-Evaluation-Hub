import React from 'react';
import { LayoutDashboard, Users, BarChart3, Moon, Sun, LogOut, PlayCircle } from 'lucide-react';
import { User, UserRole } from '../types';

export const Sidebar = ({ user, activeTab, setActiveTab, onLogout, isDarkMode, toggleTheme }: any) => {
  const menuItems = user.role === UserRole.ADMIN 
    ? [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'agents', label: 'Agent Roster', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ]
    : [
        { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
        { id: 'evaluations', label: 'Evaluated Calls', icon: PlayCircle },
      ];

  return (
    <aside className={`flex flex-col h-full w-64 border-r transition-colors ${
      isDarkMode ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      {/* Logo section - fixed at top */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0f172a] flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-500/40">
            <div className="w-7 h-7 rounded-xl bg-[#1d4ed8] flex items-center justify-center text-white font-black text-lg">
              D
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Help Desk</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Agents Evaluation Hub
            </span>
          </div>
        </div>
      </div>

      {/* Navigation - scrollable if content overflows */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === item.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : isDarkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom section - fixed at bottom with theme toggle, user info, and logout */}
      <div className={`flex-shrink-0 p-4 border-t space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs font-bold ${
            isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <span>{isDarkMode ? 'LIGHT MODE' : 'DARK MODE'}</span>
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Info with email */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
          isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-bold truncate">{user.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};