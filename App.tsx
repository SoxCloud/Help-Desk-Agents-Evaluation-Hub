import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { AgentRoster } from './components/AgentRoster';
import { Login } from './components/Login';
import { User, UserRole, Agent, ValidUser } from './types';
import { fetchAllDashboardData } from './services/sheetService';
import { RefreshCw, Menu, X, AlertCircle } from 'lucide-react';

// Define valid users with their passwords
const VALID_USERS: ValidUser[] = [
  // Admin
  {
    email: 'callcenter@dialndine.com',
    password: 'admin@dialndine',
    id: 'admin',
    name: 'System Admin',
    role: UserRole.ADMIN,
    avatarUrl: 'https://i.pravatar.cc/150?u=admin'
  },
  // Agents
  {
    email: 'sogcinwacallcenter@gmail.com',
    password: 'dialndines',
    id: 'sogcinwa',
    name: 'Sogcinwa Nkala',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Sogcinwa+Nkala&background=random'
  },
  {
    email: 'mhmoses45@gmail.com',
    password: 'dialndinem',
    id: 'moses',
    name: 'Moses Nhlapho',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Moses+Nhlapho&background=random'
  },
  {
    email: 'qhamabracken@gmail.com',
    password: 'dialndinec',
    id: 'claire',
    name: 'Claire Makeleni',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Claire+Makeleni&background=random'
  },
  {
    email: 'leratolucytwala@gmail.com',
    password: 'dialndinel',
    id: 'lerato',
    name: 'Lerato Twala',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Lerato+Twala&background=random'
  },
  {
    email: 'hlonicallcenter@gmail.com',
    password: 'dialndineh',
    id: 'hloni',
    name: 'Lehloonolo Sejane',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Lehloonolo+Sejane&background=random'
  },
  {
    email: 'mbalenhlebracken@gmail.com',
    password: 'dialndinemb',
    id: 'mbali',
    name: 'Mbalenhle Makhubu',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mbalenhle+Makhubu&background=random'
  },
  {
    email: 'esthercallcenter1@gmail.com',
    password: 'dialndinee',
    id: 'esther',
    name: 'Esther Poswayo',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Esther+Poswayo&background=random'
  },
  {
    email: 'tswelopelebracken@gmail.com',
    password: 'dialndinet',
    id: 'tswelo',
    name: 'Tswelopele Motumi',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Tswelopele+Motumi&background=random'
  },
  {
    email: 'tshabalaladialndine@gmail.com',
    password: 'dialndinen',
    id: 'neo',
    name: 'Neo Tshabalala',
    role: UserRole.AGENT,
    avatarUrl: 'https://ui-avatars.com/api/?name=Neo+Tshabalala&background=random'
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAllDashboardData();
      setAgents(data.agents);
      console.log("✅ Loaded agents from Google Sheets:", data.agents.map(a => ({ 
        name: a.name, 
        email: a.email, 
        id: a.id 
      })));
    } catch (err) { 
      console.error("❌ Sync Error", err); 
    }
    finally { setLoading(false); }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const mail = email.toLowerCase().trim();
    
    // Check against valid users list
    const validUser = VALID_USERS.find(u => u.email.toLowerCase() === mail);
    
    if (validUser && validUser.password === password) {
      setUser({
        id: validUser.id,
        name: validUser.name,
        email: validUser.email,
        role: validUser.role,
        avatarUrl: validUser.avatarUrl
      });
      console.log("✅ User logged in:", validUser.email);
      return true;
    }
    
    console.log("❌ Login failed for:", mail);
    return false;
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-[#0f172a] dark:to-[#1e293b] text-slate-900 dark:text-white">
      <RefreshCw className="animate-spin mb-4 text-indigo-600 dark:text-indigo-500" size={32} />
      <p className="font-bold tracking-widest animate-pulse text-xs text-indigo-600 dark:text-indigo-400 text-center px-4">
        SYNCING OMNIDESK DATA...
      </p>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#0f172a] to-[#1a2639] text-white' 
          : 'bg-gradient-to-br from-slate-50 to-white text-slate-900'
      }`}
    >
      {/* Mobile header with menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f172a] dark:bg-[#0f172a] border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1d4ed8] flex items-center justify-center text-white font-black text-sm">
            D
          </div>
          <span className="text-white font-bold">OmniDesk</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-slate-800 rounded-lg text-white"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar - fixed width on desktop, slide-out on mobile */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={(tab: string) => { 
            setActiveTab(tab); 
            setSelectedAgentId(null);
            setSidebarOpen(false);
          }} 
          onLogout={() => setUser(null)} 
          isDarkMode={isDarkMode} 
          toggleTheme={() => setIsDarkMode(!isDarkMode)} 
        />
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Scrollable area */}
      <main className="flex-1 overflow-y-auto">
        {/* Spacer for mobile header */}
        <div className="h-16 lg:hidden"></div>
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-[2000px] mx-auto pb-8">
          {user.role === UserRole.ADMIN ? (
            selectedAgentId ? (
              (() => {
                const foundAgent = agents.find(a => a.id === selectedAgentId);
                if (!foundAgent) {
                  return (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-white text-lg font-bold">Agent not found</h3>
                        <p className="text-slate-400 mt-2">The agent you're looking for doesn't exist</p>
                        <button 
                          onClick={() => setSelectedAgentId(null)}
                          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <AgentDashboard 
                    agent={foundAgent}
                    dateRange={dateRange} 
                    onDateChange={setDateRange}
                    viewMode={adminViewMode}
                    onBack={() => setSelectedAgentId(null)}
                    showToggle={true}
                    onToggleView={(mode) => setAdminViewMode(mode)}
                  />
                );
              })()
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
              </>
            )
          ) : (
            (() => {
              // Find agent by email instead of ID
              const foundAgent = agents.find(a => a.email.toLowerCase() === user.email.toLowerCase());
              
              if (!foundAgent) {
                return (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                      <h3 className="text-white text-lg font-bold">Agent data not available</h3>
                      <p className="text-slate-400 mt-2">Please contact your administrator</p>
                      <button 
                        onClick={() => setUser(null)}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                      >
                        Back to Login
                      </button>
                    </div>
                  </div>
                );
              }
              
              return (
                <AgentDashboard
                  agent={foundAgent}
                  agents={agents}
                  dateRange={dateRange}
                  onDateChange={setDateRange}
                  viewMode={activeTab === 'evaluations' ? 'evaluations' : activeTab === 'agentStats' ? 'agentStats' : 'stats'}
                />
              );
            })()
          )}
        </div>
      </main>
    </div>
  );
};

export default App;