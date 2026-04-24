import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LogOut, Users, UserPlus, Trash2, Mail, Lock, 
  User, ShieldCheck, ShieldAlert, AlertCircle, CheckCircle, AlertTriangle,
  Map, Activity, Navigation, Edit2, Plus, Bell, Clock, Info,
  Menu, X, MapPin, FileText, Printer, ChevronRight, BarChart2, Radio, Check,
  Sun, Moon
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface UserData {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  cree_le: string;
}

interface RouteData {
  id: number;
  nom: string;
  description: string;
  distance_km: number;
  trafic?: {
    niveau: string;
    temps_retard_min: number;
    date_maj: string;
  };
}

interface AlerteData {
  id: number;
  message: string;
  niveau_gravite: string;
  date_creation: string;
  route: { nom: string };
  police: { nom: string; prenom: string };
}

interface IncidentHistoryData {
  id: number;
  route_id: number;
  type_incident: string;
  description: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'RESOLU';
  date_signalement: string;
  date_traitement?: string;
  route: { nom: string };
  signaleur?: { nom: string; prenom: string };
  validateur?: { nom: string; prenom: string };
}

interface StatsData {
  policiers_actifs: number;
  routes_surveillees: number;
  alerts_aujourdhui: number;
  utilisateurs_total: number;
  incidents_par_type: Record<string, number>;
}

interface DailyReportData {
  date: string;
  total_incidents: number;
  incidents_valides: number;
  incidents_en_attente: number;
  incidents_rejetes: number;
  total_alertes: number;
  routes_fluides: number;
  routes_ralenties: number;
  routes_saturees: number;
  routes_bloquees: number;
  incidents_list: IncidentHistoryData[];
}

type TabType = 'stats' | 'admins' | 'police' | 'routes' | 'users' | 'traffic' | 'alerts';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('stats');
  const [sidebarTheme, setSidebarTheme] = useState<'dark' | 'light'>('dark');
  
  // Theme Variables
  const isDark = sidebarTheme === 'dark';
  const bgMain = isDark ? 'bg-[#0a0f1c]' : 'bg-[#f8fafc]';
  const textMain = isDark ? 'text-white' : 'text-slate-800';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  
  const bgCard = isDark ? 'bg-[#131b2f]' : 'bg-white';
  const borderCard = isDark ? 'border-slate-800' : 'border-slate-200';
  const shadowCard = isDark ? 'shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'shadow-sm';
  
  const bgInput = isDark ? 'bg-slate-900/50' : 'bg-slate-50';
  const borderInput = isDark ? 'border-slate-700' : 'border-slate-200';
  const focusInput = isDark ? 'focus:border-blue-500 focus:bg-[#0a0f1c]' : 'focus:border-blue-500 focus:bg-white';
  
  const bgHover = isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50';
  const dividerColor = isDark ? 'border-slate-800' : 'border-slate-100';

  // States for data
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [alerts, setAlerts] = useState<AlerteData[]>([]);
  const [incidents, setIncidents] = useState<IncidentHistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  // Report states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);

  // Form states
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'POLICE' });
  const [routeForm, setRouteForm] = useState({ nom: '', description: '', distance_km: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Status states
  const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!currentUser.id || currentUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/incidents-history`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        const data: IncidentHistoryData[] = await res.json();
        setPendingCount(data.filter(i => i.statut === 'EN_ATTENTE').length);
      } catch (err) {
        console.error("Fail fetch counts");
      }
    };
    if (currentUser.id) fetchCounts();
  }, [currentUser.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        setStats(await res.json());
      } else if (activeTab === 'users' || activeTab === 'police' || activeTab === 'admins') {
        const roleQuery = activeTab === 'users' ? 'STANDARD' : activeTab === 'police' ? 'POLICE' : 'ADMIN';
        const res = await fetch(`${API_BASE_URL}/admin/users?role=${roleQuery}`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        setUsers(await res.json());
      } else if (activeTab === 'routes') {
        const res = await fetch(`${API_BASE_URL}/admin/routes`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        setRoutes(await res.json());
      } else if (activeTab === 'traffic') {
        const res = await fetch(`${API_BASE_URL}/admin/traffic-overview`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        setRoutes(await res.json());
      } else if (activeTab === 'alerts') {
        const resI = await fetch(`${API_BASE_URL}/admin/incidents-history`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        setIncidents(await resI.json());

        const resA = await fetch(`${API_BASE_URL}/admin/alerts`, {
          headers: { 'x-user-id': String(currentUser.id) }
        });
        setAlerts(await resA.json());
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingId 
        ? `${API_BASE_URL}/admin/users/${editingId}`
        : `${API_BASE_URL}/admin/users`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUser.id) },
        body: JSON.stringify(userForm)
      });
      
      if (!res.ok) throw new Error((await res.json()).detail);
      
      setStatus({ type: 'success', msg: editingId ? "Compte mis à jour" : "Compte créé avec succès" });
      setIsAdding(false);
      setEditingId(null);
      setUserForm({ nom: '', prenom: '', email: '', mot_de_passe: '', role: 'POLICE' });
      loadData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const url = editingId 
        ? `${API_BASE_URL}/admin/routes/${editingId}`
        : `${API_BASE_URL}/admin/routes`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': String(currentUser.id) },
        body: JSON.stringify(routeForm)
      });
      
      if (!res.ok) throw new Error((await res.json()).detail);
      
      setStatus({ type: 'success', msg: editingId ? "Route mise à jour" : "Route créée avec succès" });
      setIsAdding(false);
      setEditingId(null);
      setRouteForm({ nom: '', description: '', distance_km: 0 });
      loadData();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (type: 'users' | 'routes', id: number) => {
    if (!window.confirm("Confirmer la suppression de cet élément ? Cette action est irréversible.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/${type}/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': String(currentUser.id) }
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      setStatus({ type: 'success', msg: "Élément supprimé de la base de données." });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/daily-report`, {
        headers: { 'x-user-id': String(currentUser.id) }
      });
      if (!res.ok) throw new Error("Erreur de chargement du rapport");
      const data = await res.json();
      setReportData(data);
      setShowReportModal(true);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: "Impossible de générer le rapport journalier." });
    } finally {
      setLoading(false);
    }
  };

  const showStatusMsg = (type: 'success' | 'error', text: string) => {
    setStatus({ type, msg: text });
    setTimeout(() => setStatus(null), 4000);
  };

  const calculateProgress = (val: number) => {
    const max = 20; // assumed max for visual scaling
    return Math.min((val / max) * 100, 100);
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'FLUIDE': return 'green';
      case 'RALENTI': return 'yellow';
      case 'SATURE': return 'orange';
      case 'BLOQUE': return 'red';
      default: return 'green';
    }
  };

  return (
    <>
    {/* MAIN WRAPPER WITH THEME APPLIED */}
    <div className={`flex h-screen w-full ${bgMain} ${textMain} overflow-hidden font-sans transition-colors duration-300 ${showReportModal ? 'print:hidden' : ''}`}>
      
      {/* SIDEBAR: Themeable (Hidden on mobile, static on desktop) */}
      <aside className={`
        hidden lg:flex flex-col w-72 z-40 shrink-0 shadow-2xl
        ${isDark ? 'bg-[#0f172a]' : 'bg-white border-r border-slate-200'}
      `}>
        <div className="p-8 pb-6 relative">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Shield size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={`text-xl font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>VOLCAN<span className="text-blue-500">WAY</span></h2>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Global Admin</p>
            </div>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className={`px-6 pb-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
            <div className={`w-10 h-10 rounded-full border-2 overflow-hidden shrink-0 ${isDark ? 'border-slate-600 bg-slate-700' : 'border-white bg-slate-200 shadow-sm'}`}>
               <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.prenom}&backgroundColor=3b82f6`} alt="avatar" />
            </div>
            <div className="overflow-hidden">
               <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentUser.prenom} {currentUser.nom}</p>
               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-0.5">Administrateur</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 pl-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Analytics & Overview</div>
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'stats' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
            onClick={() => { setActiveTab('stats'); setIsSidebarOpen(false); }}
          >
            <Activity size={18} /> Vue d'ensemble
          </button>
          
          <div className={`text-[10px] font-black uppercase tracking-[0.2em] mt-8 mb-4 pl-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Ressources Humaines</div>
          {[
            { id: 'admins', label: 'Administrateurs', icon: ShieldCheck },
            { id: 'police', label: 'Agents de Police', icon: User },
            { id: 'users', label: 'Usagers (Citoyens)', icon: Users }
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              onClick={() => { setActiveTab(item.id as TabType); setIsSidebarOpen(false); }}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}

          <div className={`text-[10px] font-black uppercase tracking-[0.2em] mt-8 mb-4 pl-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Infrastructure & Data</div>
          {[
            { id: 'routes', label: 'Réseau Routier', icon: Map },
            { id: 'traffic', label: 'Supervision Trafic', icon: Navigation },
            { id: 'alerts', label: 'Registre Incidents', icon: Bell }
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              onClick={() => { setActiveTab(item.id as TabType); setIsSidebarOpen(false); }}
            >
              <div className="relative">
                <item.icon size={18} />
                {item.id === 'alerts' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </div>
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'alerts' && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        
        <div className={`p-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'} flex gap-3`}>
           <button 
             className={`p-3.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
               isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
             }`}
             onClick={() => setSidebarTheme(t => t === 'dark' ? 'light' : 'dark')}
             title="Changer le thème global"
           >
             {isDark ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           <button 
             className={`flex-1 flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
               isDark ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-500 hover:bg-red-50 hover:text-red-600'
             }`}
             onClick={handleLogout}
           >
             <LogOut size={16} /> Déconnexion
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-24 px-6 sm:px-12 flex items-center justify-between shrink-0 border-b z-10 transition-colors ${isDark ? 'bg-[#0a0f1c]/90 border-slate-800' : 'bg-[#f8fafc]/90 border-slate-200/60'}`}>
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <Shield size={18} strokeWidth={2.5} />
              </div>
              <h2 className={`text-lg font-black leading-none tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>VOLCAN<span className="text-blue-500">WAY</span></h2>
            </div>
            <div className="hidden lg:block">
              <h1 className={`text-2xl font-black tracking-tight ${textMain}`}>
                {activeTab === 'stats' ? 'Tableau de Bord' : 
                 activeTab === 'admins' ? 'Administrateurs' :
                 activeTab === 'police' ? 'Agents de Police' :
                 activeTab === 'users' ? 'Citoyens' :
                 activeTab === 'routes' ? 'Infrastructure Routière' :
                 activeTab === 'traffic' ? 'Monitoring Global' : 'Archives & Incidents'}
              </h1>
              <p className={`text-xs font-bold mt-1 uppercase tracking-widest ${textMuted}`}>
                Portail de Configuration Système
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {activeTab === 'stats' && (
                <button 
                  onClick={loadReport} 
                  className={`hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95 border ${isDark ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md'}`}
                >
                  <FileText size={16} className="text-blue-500" /> Audit
                </button>
             )}
             {/* Mobile Theme Toggle */}
             <button 
               className={`lg:hidden p-2.5 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
               onClick={() => setSidebarTheme(t => t === 'dark' ? 'light' : 'dark')}
             >
               {isDark ? <Sun size={18} /> : <Moon size={18} />}
             </button>
             {/* Mobile Logout */}
             <button 
               className={`lg:hidden p-2.5 rounded-xl transition-all border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'}`}
               onClick={handleLogout}
             >
               <LogOut size={18} />
             </button>
          </div>
        </header>

        {/* Horizontal Navigation for Mobile/Tablet */}
        <nav className={`lg:hidden flex overflow-x-auto no-scrollbar items-center gap-2 px-6 py-3 border-b shrink-0 shadow-sm ${isDark ? 'bg-[#131b2f] border-slate-800' : 'bg-white border-slate-200'}`}>
          {[
            { id: 'stats', label: 'Vue d\'ensemble', icon: Activity },
            { id: 'admins', label: 'Admins', icon: ShieldCheck },
            { id: 'police', label: 'Police', icon: User },
            { id: 'users', label: 'Usagers', icon: Users },
            { id: 'routes', label: 'Routes', icon: Map },
            { id: 'traffic', label: 'Supervision', icon: Navigation },
            { id: 'alerts', label: 'Incidents', icon: Bell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.id === 'alerts' && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 z-10">
          {status && (
            <div className={`fixed top-6 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-10 z-[100] px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-black text-xs uppercase tracking-widest border-2 backdrop-blur-md animate-slideDown
              ${status.type === 'success' ? 'bg-green-50/90 text-green-700 border-green-500/30 shadow-[0_10px_40px_rgba(34,197,94,0.2)]' : 'bg-red-50/90 text-red-700 border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.2)]'}
            `}>
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              {status.msg}
            </div>
          )}

          {loading ? (
             <div className="flex flex-col items-center justify-center py-40 gap-6">
               <div className={`w-12 h-12 border-4 rounded-full animate-spin border-t-blue-600 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
               <span className={`font-black text-xs uppercase tracking-[0.2em] ${textMuted}`}>Synchronisation des données...</span>
             </div>
          ) : (
            <div className="max-w-7xl mx-auto">

              {/* DASHBOARD STATS */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-10 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Officiers de Police', val: stats.policiers_actifs, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                      { label: 'Axes Routiers', val: stats.routes_surveillees, icon: Map, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                      { label: 'Alertes Diffusées', val: stats.alerts_aujourdhui, icon: Radio, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                      { label: 'Citoyens Inscrits', val: stats.utilisateurs_total, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    ].map((s, i) => (
                      <div key={i} className={`p-6 rounded-[28px] border flex flex-col justify-between transition-all ${bgCard} ${borderCard} ${shadowCard}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl border ${s.bg} ${s.color} ${s.border}`}>
                            <s.icon size={22} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Actif</span>
                        </div>
                        <div>
                          <span className={`block text-4xl font-black mb-1 ${textMain}`}>{s.val}</span>
                          <p className={`text-xs font-bold uppercase tracking-wider ${textMuted}`}>{s.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-8 rounded-[32px] border ${bgCard} ${borderCard} ${shadowCard}`}>
                      <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-lg font-black ${textMain}`}>Typologie des Incidents</h3>
                        <Activity className={textMuted} size={20} />
                      </div>
                      <div className="space-y-5">
                        {[
                          { label: 'Accidents', type: 'ACCIDENT', color: 'bg-red-500' },
                          { label: 'Pannes', type: 'PANNE', color: 'bg-orange-500' },
                          { label: 'Blocages', type: 'BLOCAGE', color: isDark ? 'bg-slate-400' : 'bg-slate-800' },
                          { label: 'Météo', type: 'METEO', color: 'bg-blue-500' },
                          { label: 'Autres', type: 'AUTRE', color: 'bg-slate-500' },
                        ].map((bar, i) => {
                          const val = stats.incidents_par_type[bar.type] || 0;
                          return (
                          <div key={i}>
                            <div className={`flex justify-between text-xs font-bold mb-2 uppercase tracking-widest ${textMuted}`}>
                              <span>{bar.label}</span>
                              <span className={textMain}>{val} Signalements</span>
                            </div>
                            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${bar.color}`} 
                                style={{ width: `${calculateProgress(val)}%` }}
                              ></div>
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>

                    <div className={`p-8 rounded-[32px] shadow-xl relative overflow-hidden flex flex-col justify-center ${isDark ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' : 'bg-slate-900'}`}>
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
                      <ShieldCheck size={48} className="text-blue-500 mb-6" />
                      <h3 className="text-2xl font-black text-white mb-2">Sécurité du Réseau</h3>
                      <p className="text-slate-400 font-bold mb-8 text-sm leading-relaxed">
                        Le système VolcanWay est actif et opérationnel. Toutes les communications entre les citoyens et les forces de l'ordre sont chiffrées de bout en bout.
                      </p>
                      <button 
                        onClick={loadReport} 
                        className="self-start flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all"
                      >
                        <FileText size={16} /> Générer Audit Complet
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* USER MANAGEMENT */}
              {(activeTab === 'users' || activeTab === 'police' || activeTab === 'admins') && (
                <div className="animate-fadeIn">
                  <div className="flex justify-end mb-8">
                    {activeTab !== 'users' && (
                      <button 
                        className="flex justify-center items-center gap-2 bg-blue-600 text-white py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
                        onClick={() => { setIsAdding(true); setEditingId(null); setUserForm({ nom: '', prenom: '', email: '', mot_de_passe: '', role: activeTab === 'police' ? 'POLICE' : 'ADMIN' }) }}
                      >
                        <Plus size={16} /> Enregistrer un membre
                      </button>
                    )}
                  </div>

                  {(isAdding || editingId) && (
                    <div className={`mb-10 p-8 rounded-[32px] border ${bgCard} ${borderCard} ${shadowCard}`}>
                      <h4 className={`text-lg font-black mb-8 flex items-center gap-3 ${textMain}`}>
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><UserPlus size={20} /></div>
                        {editingId ? "Modification de Profil" : "Création de Profil Officiel"}
                      </h4>
                      <form onSubmit={handleUserSubmit} className="space-y-6 max-w-3xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Prénom</label>
                            <input type="text" className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={userForm.prenom} onChange={e => setUserForm({...userForm, prenom: e.target.value})} required />
                          </div>
                          <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Nom de famille</label>
                            <input type="text" className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={userForm.nom} onChange={e => setUserForm({...userForm, nom: e.target.value})} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Adresse Email</label>
                          <input type="email" className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Mot de passe d'accès</label>
                          <input type="password" placeholder={editingId ? "Laisser vide pour conserver l'actuel" : ""} className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={userForm.mot_de_passe} onChange={e => setUserForm({...userForm, mot_de_passe: e.target.value})} required={!editingId} />
                        </div>
                        
                        <div className={`flex gap-4 pt-4 border-t ${dividerColor}`}>
                          <button type="button" className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => { setIsAdding(false); setEditingId(null) }}>Annuler</button>
                          <button type="submit" className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'}`} disabled={formLoading}>{formLoading ? "Traitement..." : "Sauvegarder les accès"}</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(u => (
                      <div key={u.id} className={`rounded-[28px] border p-6 flex flex-col justify-between transition-all group ${bgCard} ${borderCard} ${bgHover}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-xl shadow-sm border
                            ${u.role === 'ADMIN' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                              u.role === 'POLICE' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
                              'bg-green-500/10 border-green-500/20 text-green-500'}
                          `}>
                            {u.prenom[0]}{u.nom[0]}
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                            ${u.role === 'ADMIN' ? 'bg-red-500 text-white border-red-600' : 
                              u.role === 'POLICE' ? 'bg-blue-600 text-white border-blue-700' : 
                              (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200')}
                          `}>
                            {u.role}
                          </span>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className={`text-lg font-black ${textMain}`}>{u.prenom} {u.nom}</h4>
                          <p className={`text-xs font-bold flex items-center gap-2 mt-1 ${textMuted}`}>
                            <Mail size={12} /> {u.email}
                          </p>
                        </div>

                        <div className={`flex gap-2 pt-4 border-t ${dividerColor}`}>
                           <button className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`} onClick={() => { setEditingId(u.id); setUserForm({ nom: u.nom, prenom: u.prenom, email: u.email, mot_de_passe: '', role: u.role }) }}>
                             <Edit2 size={12} /> Éditer
                           </button>
                           {u.id !== currentUser.id && (
                             <button className={`flex-1 py-2.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${isDark ? 'bg-[#0a0f1c] border-slate-800 text-red-500 hover:bg-red-500/10 hover:border-red-500/30' : 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200'}`} onClick={() => handleDelete('users', u.id)}>
                               <Trash2 size={12} /> Révoquer
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ROUTES MANAGEMENT */}
              {activeTab === 'routes' && (
                <div className="animate-fadeIn">
                  <div className="flex justify-end mb-8">
                    <button 
                      className={`flex justify-center items-center gap-2 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'}`}
                      onClick={() => { setIsAdding(true); setEditingId(null); setRouteForm({ nom: '', description: '', distance_km: 0 }) }}
                    >
                      <Plus size={16} /> Déclarer une route
                    </button>
                  </div>

                  {(isAdding || editingId) && (
                    <div className={`mb-10 p-8 rounded-[32px] border ${bgCard} ${borderCard} ${shadowCard}`}>
                      <h4 className={`text-lg font-black mb-8 flex items-center gap-3 ${textMain}`}>
                        <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-800'}`}><Map size={20} /></div>
                        {editingId ? "Modification de l'infrastructure" : "Ajout d'un segment routier"}
                      </h4>
                      <form onSubmit={handleRouteSubmit} className="space-y-6 max-w-3xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Nom officiel</label>
                            <input type="text" placeholder="Ex: Boulevard de l'Indépendance" className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={routeForm.nom} onChange={e => setRouteForm({...routeForm, nom: e.target.value})} required />
                          </div>
                          <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Longueur (Km)</label>
                            <input type="number" step="0.1" className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={routeForm.distance_km} onChange={e => setRouteForm({...routeForm, distance_km: parseFloat(e.target.value)})} required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${textMuted}`}>Notes techniques / Observations</label>
                          <textarea className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all h-28 resize-none ${bgInput} ${borderInput} ${focusInput} ${textMain}`} value={routeForm.description} onChange={e => setRouteForm({...routeForm, description: e.target.value})} />
                        </div>
                        
                        <div className={`flex gap-4 pt-4 border-t ${dividerColor}`}>
                          <button type="button" className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} onClick={() => { setIsAdding(false); setEditingId(null) }}>Annuler</button>
                          <button type="submit" className={`px-8 py-4 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all ${isDark ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`} disabled={formLoading}>{formLoading ? "Enregistrement..." : "Valider l'infrastructure"}</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {routes.map(r => (
                      <div key={r.id} className={`rounded-[28px] border p-6 flex flex-col justify-between transition-all group ${bgCard} ${borderCard} ${bgHover}`}>
                         <div className="flex justify-between items-start mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                              <Map size={20} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>ID: RTE-{r.id.toString().padStart(3, '0')}</span>
                         </div>
                         <div className="mb-6">
                            <h4 className={`text-lg font-black mb-2 ${textMain}`}>{r.nom}</h4>
                            <span className={`inline-block border text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              {r.distance_km} KM
                            </span>
                         </div>
                         <p className={`text-xs font-bold line-clamp-2 h-8 mb-6 italic ${textMuted}`}>
                            "{r.description || 'Aucune spécification'}"
                         </p>
                         <div className={`flex gap-2 pt-4 border-t ${dividerColor}`}>
                           <button className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`} onClick={() => { setEditingId(r.id); setRouteForm({ nom: r.nom, description: r.description, distance_km: r.distance_km }) }}>
                             Éditer
                           </button>
                           <button className={`p-2.5 border rounded-xl transition-colors ${isDark ? 'bg-[#0a0f1c] border-slate-800 text-red-500 hover:bg-red-500/10 hover:border-red-500/30' : 'bg-white border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200'}`} onClick={() => handleDelete('routes', r.id)}>
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRAFFIC LIVE VIEW */}
              {activeTab === 'traffic' && (
                <div className="animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map(r => {
                      const status = r.trafic?.niveau || 'FLUIDE';
                      const colorKey = getStatusColor(status);
                      const badgeClasses: Record<string, string> = {
                        'green': 'bg-green-500', 'yellow': 'bg-yellow-400', 'orange': 'bg-orange-500', 'red': 'bg-red-600 animate-pulse'
                      };
                      const boxClasses: Record<string, string> = {
                        'green': isDark ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-green-500 bg-green-50 text-green-700', 
                        'yellow': isDark ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400' : 'border-yellow-400 bg-yellow-50 text-yellow-700', 
                        'orange': isDark ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' : 'border-orange-500 bg-orange-50 text-orange-700', 
                        'red': isDark ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-red-500 bg-red-50 text-red-700'
                      };

                      return (
                        <div key={r.id} className={`rounded-3xl border overflow-hidden flex flex-col ${bgCard} ${borderCard} ${shadowCard}`}>
                          <div className={`p-4 px-6 flex justify-between items-center border-b ${isDark ? 'bg-slate-800/80 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${badgeClasses[colorKey]}`}></div>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>ID: RTE-{r.id.toString().padStart(3, '0')}</span>
                            </div>
                            <Activity size={16} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                          </div>
                          <div className="p-6">
                            <h3 className={`text-lg font-black mb-6 ${textMain}`}>{r.nom}</h3>
                            <div className="flex items-end justify-between">
                              <div>
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${textMuted}`}>État Global</p>
                                <div className={`inline-flex px-4 py-1.5 rounded-lg border ${boxClasses[colorKey]}`}>
                                  <span className="font-black text-xs uppercase tracking-widest">{status}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${textMuted}`}>Impact</p>
                                <p className={`text-sm font-bold flex items-center justify-end gap-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <Clock size={12} /> {r.trafic?.temps_retard_min || 0} min
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ALERTS ARCHIVE */}
              {activeTab === 'alerts' && (
                <div className={`animate-fadeIn rounded-[32px] border overflow-hidden ${bgCard} ${borderCard} ${shadowCard}`}>
                   <div className={`p-8 border-b ${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <h3 className={`text-lg font-black ${textMain}`}>Registre Global des Incidents</h3>
                      <p className={`text-xs font-bold mt-1 ${textMuted}`}>Historique complet des tickets usagers.</p>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className={`border-b text-[10px] font-black uppercase tracking-widest ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                           <th className="p-5 pl-8">ID</th>
                           <th className="p-5">Localisation</th>
                           <th className="p-5">Type & Détails</th>
                           <th className="p-5">Source</th>
                           <th className="p-5">Statut Actuel</th>
                           <th className="p-5 pr-8">Date</th>
                         </tr>
                       </thead>
                       <tbody className="text-sm">
                         {incidents.length === 0 ? (
                           <tr><td colSpan={6} className={`p-10 text-center font-bold ${textMuted}`}>Aucune donnée historique.</td></tr>
                         ) : (
                           incidents.map(inc => (
                             <tr key={inc.id} className={`border-b transition-colors group ${isDark ? 'border-slate-800/50 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50'}`}>
                               <td className={`p-5 pl-8 font-black text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>#{inc.id.toString().padStart(4, '0')}</td>
                               <td className={`p-5 font-bold ${textMain}`}>{inc.route.nom}</td>
                               <td className="p-5">
                                 <div className="flex flex-col gap-1">
                                   <span className={`inline-block self-start px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{inc.type_incident}</span>
                                   <span className={`text-xs font-medium line-clamp-1 group-hover:line-clamp-none max-w-xs ${textMuted}`}>{inc.description || 'N/A'}</span>
                                 </div>
                               </td>
                               <td className={`p-5 font-bold text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                 {inc.signaleur ? `${inc.signaleur.prenom} ${inc.signaleur.nom}` : 'Usager inconnu'}
                               </td>
                               <td className="p-5">
                                 <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                   ${inc.statut === 'EN_ATTENTE' ? (isDark ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-orange-600 border-orange-200') : 
                                     inc.statut === 'VALIDE' ? (isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200') : 
                                     (isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200')}
                                 `}>
                                   {inc.statut.replace('_', ' ')}
                                 </span>
                               </td>
                               <td className={`p-5 pr-8 text-xs font-bold whitespace-nowrap ${textMuted}`}>
                                 {new Date(inc.date_signalement).toLocaleString()}
                               </td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* REPORT MODAL */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white print:block">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden print:shadow-none print:rounded-none flex flex-col max-h-[90vh] print:max-h-none print:h-auto">
            
            {/* Modal Actions Header (Hidden in Print) */}
            <div className="bg-slate-900 p-6 flex justify-between items-center print:hidden shrink-0">
               <h3 className="text-xl font-black text-white">Rapport d'Audit Quotidien</h3>
               <div className="flex gap-4">
                 <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg" onClick={() => window.print()}>
                   <Printer size={16} /> Imprimer PDF
                 </button>
                 <button className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all" onClick={() => setShowReportModal(false)}>
                   <X size={20} />
                 </button>
               </div>
            </div>

            {/* Printable Area (Always Light Mode) */}
            <div className="p-10 sm:p-14 overflow-y-auto bg-white flex-1 print:p-0 print:overflow-visible">
              
              {/* Document Header */}
              <div className="border-b-4 border-slate-900 pb-8 mb-10 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">VOLCAN<span className="text-blue-600">WAY</span></h1>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Direction des Opérations de Trafic</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-slate-800">Synthèse d'Activité</p>
                  <p className="text-sm font-bold text-slate-500">{new Date(reportData.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4 mb-10">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Signalements</p>
                  <p className="text-3xl font-black text-slate-900">{reportData.total_incidents}</p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                  <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Validés</p>
                  <p className="text-3xl font-black text-green-800">{reportData.incidents_valides}</p>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Rejetés</p>
                  <p className="text-3xl font-black text-red-800">{reportData.incidents_rejetes}</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Alertes Emises</p>
                  <p className="text-3xl font-black text-blue-800">{reportData.total_alertes}</p>
                </div>
              </div>

              {/* Network Status */}
              <div className="mb-10">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">État du Réseau en fin de journée</h3>
                <div className="flex rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  {[
                    { label: 'Fluide', val: reportData.routes_fluides, color: 'bg-green-500' },
                    { label: 'Ralenti', val: reportData.routes_ralenties, color: 'bg-yellow-400' },
                    { label: 'Saturé', val: reportData.routes_saturees, color: 'bg-orange-500' },
                    { label: 'Bloqué', val: reportData.routes_bloquees, color: 'bg-red-600' }
                  ].map((s, i) => (
                    <div key={i} className="flex-1 p-4 bg-slate-50 border-r border-slate-200 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${s.color}`}></div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{s.label}</span>
                      </div>
                      <p className="text-2xl font-black text-slate-900">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incident Table */}
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Journal Détaillé des Opérations</h3>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold">
                      <th className="p-3 border border-slate-200">Heure</th>
                      <th className="p-3 border border-slate-200">Axe Routier</th>
                      <th className="p-3 border border-slate-200">Type</th>
                      <th className="p-3 border border-slate-200">Décision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.incidents_list.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-500 italic border border-slate-200">Aucun incident enregistré aujourd'hui.</td></tr>
                    ) : (
                      reportData.incidents_list.map((inc) => (
                        <tr key={inc.id} className="border-b border-slate-200">
                          <td className="p-3 border-x border-slate-200 font-bold">{new Date(inc.date_signalement).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="p-3 border-x border-slate-200">{inc.route.nom}</td>
                          <td className="p-3 border-x border-slate-200 text-xs font-bold uppercase">{inc.type_incident}</td>
                          <td className="p-3 border-x border-slate-200">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                              inc.statut === 'VALIDE' ? 'bg-green-100 text-green-700' : 
                              inc.statut === 'REJETE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                            }`}>{inc.statut}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Footer signatures */}
              <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between">
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Généré par le Système Automatisé VolcanWay</div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visa Administrateur : _________________</div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default AdminPanel;
