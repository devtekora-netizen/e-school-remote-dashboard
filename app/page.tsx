'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  LayoutDashboard,
  Menu,
  X,
  GraduationCap,
  Wallet,
  Receipt,
  LogOut,
  Lock,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';


import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#38bdf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

  // Heartbeat Loop
  useEffect(() => {
    if (!isAuthenticated || !schoolId) return;

    const sendHeartbeat = () => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, sessionId })
      }).catch(() => {}); // Silent fail
    };

    sendHeartbeat(); // Premier lancement
    const interval = setInterval(sendHeartbeat, 60000); // Toutes les minutes
    return () => clearInterval(interval);
  }, [isAuthenticated, schoolId, sessionId]);


  const checkAuth = async (id: string, key: string) => {
    try {
      const encodedId = encodeURIComponent(id);
      const encodedKey = encodeURIComponent(key);
      const res = await fetch(`/api/sync?schoolId=${encodedId}&apiKey=${encodedKey}`);
      if (res.ok) {

        localStorage.setItem('schoolId', id);
        localStorage.setItem('apiKey', key);
        setSchoolId(id);
        setApiKey(key);
        setIsAuthenticated(true);
        fetchData(id, key);
        return { success: true };
      }
      
      const errorData = await res.json();
      return { 
        success: false, 
        status: res.status, 
        message: errorData.error || "Une erreur est survenue" 
      };
    } catch (err) {
      return { success: false, status: 500, message: "Erreur de connexion au serveur" };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    
    const result = await checkAuth(schoolId, apiKey);
    
    if (!result.success) {
      if (result.status === 404) {
        setLoginError("École introuvable. Avez-vous effectué une première synchronisation depuis l'application Java ?");
      } else if (result.status === 401) {
        setLoginError("Clé API invalide pour cette école. Vérifiez vos paramètres Java.");
      } else {
        setLoginError(result.message);
      }
    }
    setLoading(false);
  };


  const handleLogout = () => {
    localStorage.removeItem('schoolId');
    localStorage.removeItem('apiKey');
    setIsAuthenticated(false);
    setData(null);
  };

  const fetchData = async (id = schoolId, key = apiKey) => {
    if (!id || !key) return;
    setRefreshing(true);
    try {
      const encodedId = encodeURIComponent(id);
      const encodedKey = encodeURIComponent(key);
      const res = await fetch(`/api/sync?schoolId=${encodedId}&apiKey=${encodedKey}`);

      const json = await res.json();
      if (!json.error) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const savedId = localStorage.getItem('schoolId');
    const savedKey = localStorage.getItem('apiKey');
    if (savedId && savedKey) {
      setSchoolId(savedId);
      setApiKey(savedKey);
      checkAuth(savedId, savedKey);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => fetchData(), 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, schoolId, apiKey]);



  const displayStats = data?.stats || {
    totalStudents: 0,
    attendanceRate: 0,
    teachersPresent: 0,
    teachersAbsent: 0,
    totalRecettesUSD: 0,
    totalRecettesCDF: 0,
    totalDepensesUSD: 0,
    totalDepensesCDF: 0,
    balanceUSD: 0,
    balanceCDF: 0
  };

  const optionData = data?.distribution?.options 
    ? Object.entries(data.distribution.options).map(([name, value]) => ({ name, value }))
    : [];

  const promotionData = data?.distribution?.promotions
    ? Object.entries(data.distribution.promotions).map(([name, value], index) => ({ name, value, fill: COLORS[index % COLORS.length] }))
    : [];

  const financialEvolutionData = React.useMemo(() => {
    const months = ["Septembre", "Octobre", "Novembre", "Décembre", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août"];
    const payroll = data?.lists?.payroll || [];
    const fees = data?.lists?.fees || [];
    
    return months.map(m => {
      const payrollTotal = payroll
        .filter((p: any) => p.month === m)
        .reduce((acc: number, curr: any) => acc + (curr.amount || 0) + (curr.prime || 0) + (curr.bonus || 0), 0);
      
      const feesTotal = fees
        .filter((f: any) => f.month === m)
        .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
        
      const transactions = data?.lists?.transactions || [];
      const recGen = transactions
        .filter((t: any) => t.type === 'RECETTE' && t.date.includes(m)) // Simplified month check
        .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
      
      const depGen = transactions
        .filter((t: any) => t.type === 'DEPENSE' && t.date.includes(m))
        .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

      return {
        name: m.substring(0, 4),
        "Dépenses": payrollTotal + depGen,
        "Recettes": feesTotal + recGen
      };
    });
  }, [data]);

  const renderContent = () => {
    switch (activeView) {
      case 'students':
        return <ListView title="Liste des Élèves" data={data?.lists?.students || []} type="students" />;
      case 'teachers':
        return <ListView title="Liste des Enseignants" data={data?.lists?.teachers || []} type="teachers" />;
      case 'payroll':
        return <ListView title="Gestion de la Paie" data={data?.lists?.payroll || []} type="payroll" />;
      case 'fees':
        return <ListView title="Frais Scolaires" data={data?.lists?.fees || []} type="fees" />;
      case 'transactions':
        return <ListView title="Trésorerie & Recettes" data={data?.lists?.transactions || []} type="transactions" />;
      case 'grades':
        return <ListView title="Points & Bulletins" data={data?.lists?.grades || []} type="grades" />;
      default:
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard 
                icon={<TrendingUp className="text-blue-400" />}
                label="Recettes Totales"
                valueUSD={displayStats.totalRecettesUSD}
                valueCDF={displayStats.totalRecettesCDF}
                trend="Année Scolaire"
              />
              <StatCard 
                icon={<DollarSign className="text-rose-400" />}
                label="Dépenses Totales"
                valueUSD={displayStats.totalDepensesUSD}
                valueCDF={displayStats.totalDepensesCDF}
                trend="Année Scolaire"
              />
              <StatCard 
                icon={<Wallet className={`text-${(displayStats.balanceUSD >= 0 && displayStats.balanceCDF >= 0) ? 'emerald' : 'rose'}-400`} />}
                label="Solde Net (Balance)"
                valueUSD={displayStats.balanceUSD}
                valueCDF={displayStats.balanceCDF}
                trend="État Global"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <PieChartIcon className="text-accent" /> Répartition par Option
                  </h3>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={optionData}
                        cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={5} dataKey="value"
                        label={({ name, percent }: { name?: string, percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {optionData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="text-accent-secondary" /> Volume par Promotion
                  </h3>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={promotionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={90} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                        {promotionData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-emerald-400" /> Évolution Financière (Recettes vs Dépenses)
                </h3>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-400">Recettes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-slate-400">Dépenses</span>
                  </div>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialEvolutionData}>
                    <defs>
                      <linearGradient id="colorRecettes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} $`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                      <Area 
                       type="monotone" 
                       dataKey="Recettes" 
                       stroke="#10b981" 
                       strokeWidth={4} 
                       fillOpacity={1} 
                       fill="url(#colorRecettes)" 
                       animationDuration={1500}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="Dépenses" 
                       stroke="#ef4444" 
                       strokeWidth={4} 
                       fillOpacity={1} 
                       fill="url(#colorDepenses)" 
                       animationDuration={1500}
                     />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="text-accent animate-spin" size={48} />
          <p className="text-slate-400 font-medium animate-pulse">Chargement de E-School...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-3xl mb-6 border border-accent/20 transition-transform hover:scale-105 duration-500">
              <GraduationCap className="text-accent" size={40} />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">E-SCHOOL</h1>
            <p className="text-slate-400 font-medium tracking-wide">Portail de Supervision Administrative</p>
          </div>

          <form onSubmit={handleLogin} className="glass rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Identifiant École</label>
              <div className="relative group">
                <LayoutDashboard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type="text" 
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  placeholder="ex: ECOLE_MAMA_MARIA"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all placeholder:text-slate-600 font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Clé API de Sécurité</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                <input 
                  type={showApiKey ? "text" : "password"} 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-accent transition-all placeholder:text-slate-600 font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>


            {loginError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <X size={18} />
                {loginError}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:opacity-90 text-white font-black py-4 rounded-2xl shadow-lg shadow-accent/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Accéder au Dashboard
              <RefreshCw size={18} className={loading ? "animate-spin" : "hidden"} />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-600 text-xs font-bold tracking-widest uppercase">
            Propulsé par <span className="text-slate-400">E-School Management</span>
          </p>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <GraduationCap className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">E-School</h1>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4 mt-6">Général</p>
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Vue d'ensemble" 
              active={activeView === 'overview'} 
              onClick={() => { setActiveView('overview'); setIsSidebarOpen(false); }} 
            />
            
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4 mt-6">Ressources Humaines</p>
            <NavItem 
              icon={<Users size={20} />} 
              label="Élèves" 
              active={activeView === 'students'} 
              onClick={() => { setActiveView('students'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Briefcase size={20} />} 
              label="Enseignants" 
              active={activeView === 'teachers'} 
              onClick={() => { setActiveView('teachers'); setIsSidebarOpen(false); }} 
            />

            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4 mt-6">Finances</p>
            <NavItem 
              icon={<Wallet size={20} />} 
              label="Paie Personnel" 
              active={activeView === 'payroll'} 
              onClick={() => { setActiveView('payroll'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Receipt size={20} />} 
              label="Frais Scolaires" 
              active={activeView === 'fees'} 
              onClick={() => { setActiveView('fees'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<TrendingUp size={20} />} 
              label="Trésorerie & Recettes" 
              active={activeView === 'transactions'} 
              onClick={() => { setActiveView('transactions'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<GraduationCap size={20} />} 
              label="Résultats & Bulletins" 
              active={activeView === 'grades'} 
              onClick={() => { setActiveView('grades'); setIsSidebarOpen(false); }} 
            />
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
            <div className="glass p-4 rounded-2xl">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Session Active</p>
              <p className="font-bold text-slate-200 truncate">{schoolId}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-all font-bold group"
            >
              <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-h-screen overflow-y-auto">
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold flex items-center gap-3">
              {activeView === 'overview' ? <LayoutDashboard className="text-accent" /> : activeView === 'students' ? <Users className="text-blue-400" /> : activeView === 'teachers' ? <Briefcase className="text-amber-400" /> : activeView === 'payroll' ? <Wallet className="text-emerald-400" /> : activeView === 'fees' ? <Receipt className="text-rose-400" /> : activeView === 'transactions' ? <TrendingUp className="text-emerald-400" /> : <GraduationCap className="text-blue-500" />}
              {activeView === 'overview' ? "Vue d'ensemble" : activeView === 'students' ? "Gestion des Élèves" : activeView === 'teachers' ? "Personnel Enseignant" : activeView === 'payroll' ? "Gestion de la Paie" : activeView === 'fees' ? "Recouvrement Frais" : activeView === 'transactions' ? "Trésorerie & Recettes" : "Palmarès & Bulletins"}
              
              {data?.academicYear && (
                <span className="ml-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
                  <Calendar size={12} className="text-accent" />
                  Cycle {data.academicYear}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => fetchData()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-xl border border-white/10 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mise à jour</span>
                <span className="hidden sm:inline text-xs font-bold">{data?.receivedAt ? new Date(data.receivedAt).toLocaleTimeString() : '---'}</span>
              </div>
            </button>
          </div>
        </header>


        <div className="p-6 md:p-10">
          {!data ? (
            <div className="glass p-12 rounded-[2.5rem] text-center max-w-2xl mx-auto border border-white/5">
              <RefreshCw className="text-accent/20 mx-auto mb-6 animate-pulse" size={64} />
              <h3 className="text-2xl font-bold mb-3 text-white">Attente de synchronisation...</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Connectez-vous à l'application locale E-School et cliquez sur "Synchroniser" pour faire apparaître vos données ici.
              </p>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </main>

    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${active ? 'bg-accent text-white shadow-lg shadow-accent/20 font-bold' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function ListView({ title, data, type }: { title: string, data: any[], type: 'students' | 'teachers' | 'payroll' | 'fees' | 'transactions' | 'grades' }) {

  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getHeaders = () => {
    switch (type) {
      case 'students':
        return ["Nom Complet", "Genre", "Option", "Promotion", "Classe"];
      case 'teachers':
        return ["Nom Complet", "Matricule", "Qualification", "Téléphone", "Email", "Genre"];
      case 'payroll':
        return ["Personnel", "Type", "Salaire", "Primes/Bonus", "Devise", "Période", "Date"];
      case 'fees':
        return ["Élève", "Type de Frais", "Montant", "Devise", "Période", "Date", "Observation"];
      case 'transactions':
        return ["Type", "Catégorie", "Description", "Montant", "Devise", "Date", "Méthode"];
      case 'grades':
        return ["Élève", "Cours", "Enseignant", "Période", "Cote", "Maximum", "Pourcentage"];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold">{title}</h3>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase font-bold tracking-widest border-b border-white/5">
                {getHeaders().map((h, i) => (
                  <th key={i} className="px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length > 0 ? filteredData.map((item: any, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs group-hover:bg-accent transition-colors">
                        {(item.name || item.staffName || item.studentName || '?')[0]}
                      </div>
                      {type === 'students' || type === 'teachers' 
                        ? `${item.name} ${item.postNom} ${item.prenom}`
                        : item.staffName || item.studentName}
                    </div>
                  </td>
                  
                  {type === 'students' && (
                    <>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black ${item.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.gender}</span></td>
                      <td className="px-6 py-4 text-slate-400">{item.option}</td>
                      <td className="px-6 py-4 text-slate-400">{item.promotion}</td>
                      <td className="px-6 py-4"><span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold">{item.class}</span></td>
                    </>
                  )}

                   {type === 'teachers' && (
                    <>
                      <td className="px-6 py-4 text-slate-200 font-bold">{item.matricule || '---'}</td>
                      <td className="px-6 py-4 text-slate-400">{item.qualification}</td>
                      <td className="px-6 py-4 text-slate-400">{item.phone}</td>
                      <td className="px-6 py-4 text-slate-400">{item.email}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-black ${item.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'}`}>{item.gender}</span></td>
                    </>
                  )}

                  {type === 'payroll' && (
                    <>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold ${item.type === 'ENSEIGNANT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{item.type}</span></td>
                      <td className="px-6 py-4 font-bold text-slate-200">{item.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400">+{(item.prime + item.bonus)?.toLocaleString()}</td>
                      <td className="px-6 py-4"><span className="text-xs font-black text-accent">{item.currency || 'USD'}</span></td>
                      <td className="px-6 py-4 text-slate-400">{item.month} {item.year}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{item.date}</td>
                    </>
                  )}

                  {type === 'fees' && (
                    <>
                      <td className="px-6 py-4 text-slate-400">{item.type}</td>
                      <td className="px-6 py-4 font-bold text-emerald-400">{item.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4"><span className="text-xs font-black text-emerald-500">{item.currency || 'USD'}</span></td>
                      <td className="px-6 py-4 text-slate-400">{item.month} {item.year}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{item.date}</td>
                      <td className="px-6 py-4 text-slate-500 italic text-xs">{item.obs || '---'}</td>
                    </>
                  )}

                  {type === 'transactions' && (
                    <>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${item.type === 'RECETTE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{item.category}</td>
                      <td className="px-6 py-4 text-slate-300 italic">{item.description}</td>
                      <td className="px-6 py-4 font-bold text-slate-200">{item.amount?.toLocaleString()}</td>
                      <td className="px-6 py-4"><span className="text-xs font-black text-slate-400">{item.currency || 'USD'}</span></td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{item.date}</td>
                      <td className="px-6 py-4 text-slate-400 font-medium">{item.method}</td>
                    </>
                  )}

                   {type === 'grades' && (
                    <>
                      <td className="px-6 py-4 text-slate-300 font-bold">{item.courseName}</td>
                      <td className="px-6 py-4 text-slate-400 italic text-xs">{item.teacherName || '---'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-black">{item.period}</span>
                      </td>
                      <td className={`px-6 py-4 font-bold ${item.score < (item.maxScore/2) ? 'text-rose-400' : 'text-emerald-400'}`}>{item.score}</td>
                      <td className="px-6 py-4 text-slate-500">{item.maxScore}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-24">
                            <div 
                              className={`h-full rounded-full ${item.score < (item.maxScore/2) ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{((item.score / item.maxScore) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                    Aucune donnée trouvée ou synchronisée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, valueUSD, valueCDF, trend }: { icon: React.ReactNode, label: string, valueUSD: number, valueCDF: number, trend: string }) {
  return (
    <div className="glass rounded-3xl p-6 shadow-lg border border-white/5 hover:border-white/10 transition-all hover:translate-y--1 group">
      <div className="bg-slate-800/50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors group-hover:bg-slate-800">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 24 }) : icon}
      </div>
      <p className="text-slate-400 text-sm font-medium">{label}</p>
      <div className="space-y-1 mt-2">
        <div className="flex items-baseline justify-between transition-all">
          <h2 className="text-2xl font-black tracking-tight text-white">{valueUSD?.toLocaleString('fr-FR')}</h2>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">USD</span>
        </div>
        <div className="flex items-baseline justify-between opacity-80">
          <h2 className="text-xl font-bold tracking-tight text-slate-300">{valueCDF?.toLocaleString('fr-FR')}</h2>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CDF</span>
        </div>
      </div>
      <p className="text-emerald-400 text-xs font-semibold mt-4 flex items-center gap-1">
        <TrendingUp size={12} /> {trend}
      </p>
    </div>
  );
}
