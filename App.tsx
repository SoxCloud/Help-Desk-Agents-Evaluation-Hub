import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { AgentRoster } from './components/AgentRoster';
import { Login } from './components/Login';
import { AnalyticsView } from './components/AnalyticsView';
import { User, UserRole, Agent } from './types';
import { fetchAllDashboardData } from './services/sheetService';
import { RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<'stats' | 'evaluations'>('stats');

  const [dateRange, setDateRange] = useState({
    start: '2026-02-01',
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllDashboardData();
      setAgents(data.agents);
    } catch (err) { console.error("Sync Error", err); }
    finally { setLoading(false); }
  };

  const handleLogin = (email: string) => {
    const mail = email.toLowerCase().trim();
    if (mail === 'callcenter@dialndine.com') {
      setUser({ id: 'admin', name: 'System Admin', email: mail, role: UserRole.ADMIN, avatarUrl: 'https://i.pravatar.cc/150?u=admin' });
      return true;
    }
    const found = agents.find(a => a.email.toLowerCase() === mail);
    if (found) {
      setUser({ id: found.id, name: found.name, email: found.email, role: UserRole.AGENT, avatarUrl: found.avatarUrl });
      return true;
    }
    return false;
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white">
      <RefreshCw className="animate-spin mb-4 text-indigo-500" size={32} />
      <p className="font-bold tracking-widest animate-pulse text-xs">SYNCING OMNIDESK DATA...</p>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div
      className={`h-screen overflow-hidden transition-colors ${
        isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Scale the whole app down by 10% while filling viewport */}
      <div
        className="origin-top-left"
        style={{
          transform: "scale(0.9)",
          width: "111.1111%",
          height: "111.1111%",
        }}
      >
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={(tab: string) => { setActiveTab(tab); setSelectedAgentId(null); }} 
            onLogout={() => setUser(null)} 
            isDarkMode={isDarkMode} 
            toggleTheme={() => setIsDarkMode(!isDarkMode)} 
          />

          <main className="flex-1 overflow-y-auto lg:ml-64 p-8">
        {user.role === UserRole.ADMIN ? (
          /* ADMIN VIEW */
          selectedAgentId ? (
            <AgentDashboard 
              agent={agents.find(a => a.id === selectedAgentId)!} 
              dateRange={dateRange} 
              onDateChange={setDateRange}
              viewMode={adminViewMode}
              onBack={() => setSelectedAgentId(null)}
              showToggle={true}
              onToggleView={(mode) => setAdminViewMode(mode)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard 
                  agents={agents} 
                  dateRange={dateRange} 
                  onDateChange={setDateRange} 
                  onViewAgent={(id) => { setSelectedAgentId(id); setAdminViewMode('stats'); }} 
                />
              )}

              {activeTab === 'agents' && (
                <AgentRoster 
                  agents={agents} 
                  onViewAgent={(id) => { setSelectedAgentId(id); setAdminViewMode('stats'); }} 
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView agents={agents} />
              )}
            </>
          )
        ) : (
          /* AGENT SELF VIEW */
          <AgentDashboard 
            agent={agents.find(a => a.id === user.id)!} 
            dateRange={dateRange} 
            onDateChange={setDateRange}
            viewMode={activeTab === 'evaluations' ? 'evaluations' : 'stats'} 
          />
        )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;