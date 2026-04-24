import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LogOut, AlertTriangle, CheckCircle, 
  XCircle, Send, Info, Clock, MapPin, Activity, Bell, X,
  Menu, User, Radio, Zap, Crosshair, ChevronRight, BarChart2, Sun, Moon
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface RouteData {
  id: number;
  nom: string;
  distance_km: number;
  trafic?: {
    niveau: string;
    temps_retard_min: number;
  };
}

interface UserMini {
  nom: string;
  prenom: string;
}

interface IncidentData {
  id: number;
  route_id: number;
  type_incident: string;
  description: string;
  statut: string;
  date_signalement: string;
  route: { nom: string };
  signaleur: UserMini;
}

interface AlerteData {
  id: number;
  type_incident: string;
  message: string;
  niveau_gravite: string;
  date_creation: string;
  route: { nom: string };
}

const PolicePanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'traffic' | 'alerts'>('traffic');
  const [policeTheme, setPoliceTheme] = useState<'dark' | 'light'>('dark');
  
  // Theme Variables
  const isDark = policeTheme === 'dark';
  const bgMain = isDark ? 'bg-[#0a0f1c]' : 'bg-[#f8fafc]';
  const textMain = isDark ? 'text-white' : 'text-slate-800';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  
  const bgCard = isDark ? 'bg-[#131b2f]' : 'bg-white';
  const borderCard = isDark ? 'border-slate-800' : 'border-slate-200';
  const shadowCard = isDark ? 'shadow-[0_0_15px_rgba(0,0,0,0.3)]' : 'shadow-sm';
  
  const bgInput = isDark ? 'bg-slate-900/50' : 'bg-slate-50';
  const borderInput = isDark ? 'border-slate-700' : 'border-slate-200';
  const focusInput = isDark ? 'focus:border-blue-500 focus:bg-[#0a0f1c]' : 'focus:border-blue-500 focus:bg-white';
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlerteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAlerteModal, setShowAlerteModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentData | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('FLUIDE');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Inline edit state
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);
  const [inlineStatus, setInlineStatus] = useState<string>('FLUIDE');

  // Form states for Alert
  const [alertForm, setAlertForm] = useState({
    route_id: '',
    type_incident: 'ACCIDENT',
    message: '',
    niveau_gravite: 'IMPORTANT'
  });

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!currentUser.id || currentUser.role !== 'POLICE') {
      navigate('/login');
      return;
    }
    fetchData();
    // Setup interval for live feel
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (activeTab === 'traffic') {
        const res = await fetch(`${API_BASE_URL}/trafic/`);
        setRoutes(await res.json());
      }
      
      const incRes = await fetch(`${API_BASE_URL}/incidents/`);
      const allIncidents = await incRes.json();
      setIncidents(allIncidents.filter((i: any) => i.statut === 'EN_ATTENTE'));

      if (activeTab === 'alerts') {
        const alertRes = await fetch(`${API_BASE_URL}/alertes/`);
        const alertsData = await alertRes.json();
        setActiveAlerts(alertsData.sort((a: any, b: any) => 
          new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
        ));
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTraffic = async (routeId: number, niveau: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/trafic/update/${routeId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id)
        },
        body: JSON.stringify({ niveau, temps_retard_min: niveau === 'FLUIDE' ? 0 : 15 })
      });
      if (res.ok) {
        showStatus('success', 'Transmission réseau validée');
        fetchData(false);
        setShowUpdateModal(false);
        setExpandedRouteId(null);
      }
    } catch (err) {
      showStatus('error', 'Échec de transmission');
    }
  };

  const handleProcessIncident = async (id: number, status: 'VALIDE' | 'REJETE') => {
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/${id}/status?status=${status}`, {
        method: 'PATCH',
        headers: { 'x-user-id': String(currentUser.id) }
      });
      if (res.ok) {
        showStatus('success', status === 'VALIDE' ? 'Intervention validée (Alerte générée)' : 'Signalement classé sans suite');
        fetchData(false);
      }
    } catch (err) {
      showStatus('error', 'Erreur système lors de la validation');
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRouteId = selectedIncident ? selectedIncident.route_id : parseInt(alertForm.route_id);
    if (!finalRouteId) {
      showStatus('error', 'Coordonnées de route manquantes');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/alertes/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': String(currentUser.id)
        },
        body: JSON.stringify({ ...alertForm, route_id: finalRouteId })
      });
      if (res.ok) {
        showStatus('success', 'Alerte diffusée sur le réseau public');
        setAlertForm({ route_id: '', type_incident: 'ACCIDENT', message: '', niveau_gravite: 'IMPORTANT' });
        setShowAlerteModal(false);
        fetchData(false);
      } else {
        showStatus('error', "Échec de diffusion");
      }
    } catch (err) {
      showStatus('error', 'Erreur de connexion serveur');
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const formatStatus = (status?: string) => {
    if (!status) return 'FLUIDE';
    return status.toUpperCase();
  };

  const getSeverityStyle = (niv: string) => {
    switch(niv) {
      case 'CRITIQUE': return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-500', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
      case 'IMPORTANT': return { bg: 'bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-500', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' };
      case 'INFO': return { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-500', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' };
      default: return { bg: 'bg-slate-500/10', border: 'border-slate-500', text: 'text-slate-500', shadow: '' };
    }
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
    <div className={`flex h-screen w-full ${bgMain} ${textMain} overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-300`}>
      
      {/* SIDEBAR: Themeable (Hidden on mobile, static on desktop) */}
      <aside className={`
        hidden lg:flex flex-col w-72 z-40 shrink-0 shadow-2xl border-r
        ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-slate-200'}
      `}>
        {/* Header Branding */}
        <div className="p-8 border-b border-[#1e293b]/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Shield className="text-white" size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">VOLCAN<span className="text-blue-500">WAY</span></h1>
              <span className="text-[9px] font-black tracking-[0.3em] text-blue-400/80 uppercase">Opérations</span>
            </div>
          </div>
        </div>

        {/* User Info Ticket */}
        <div className={`mx-6 mt-6 p-4 rounded-2xl flex items-center gap-4 ${isDark ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <User size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${textMuted}`}>Officier Connecté</div>
            <div className={`text-sm font-bold truncate ${textMain}`}>{currentUser.prenom} {currentUser.nom}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-3">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 pl-2">Réseau & Interventions</div>
          
          <button 
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all group
              ${activeTab === 'traffic' 
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
            `}
            onClick={() => { setActiveTab('traffic'); }}
          >
            <MapPin size={20} className={activeTab === 'traffic' ? 'text-white' : (isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600')} />
            <span className="flex-1 text-left">Monitoring Trafic</span>
            {activeTab === 'traffic' && <Activity size={16} className="animate-pulse opacity-70" />}
          </button>
          
          <button 
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all group relative
              ${activeTab === 'alerts' 
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' 
                : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')}
            `}
            onClick={() => { setActiveTab('alerts'); }}
          >
            <div className="relative">
              <AlertTriangle size={20} className={activeTab === 'alerts' ? 'text-white' : (isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600')} />
              {incidents.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
              )}
            </div>
            <span className="flex-1 text-left">Centre d'Alertes</span>
            {incidents.length > 0 && (
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${activeTab === 'alerts' ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {incidents.length} NEW
              </span>
            )}
          </button>
        </nav>

        <div className="p-6">
          <button 
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all group"
            onClick={handleLogout}
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Grid Pattern for Tech Vibe */}
        <div className={`absolute inset-0 pointer-events-none ${isDark ? 'opacity-[0.03]' : 'opacity-[0.015]'}`} style={{ backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <header className="px-6 sm:px-10 py-6 lg:py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 z-10">
          <div className="flex items-start gap-4">
            <div className="lg:hidden flex items-center gap-3 mt-1">
              <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <Shield size={20} strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Radio className="text-blue-600 animate-pulse" size={20} />
                <span className={`text-[11px] font-black tracking-[0.2em] text-blue-600 uppercase ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'} px-3 py-1 rounded-md`}>Système Actif</span>
              </div>
              <h1 className={`text-2xl lg:text-3xl font-black tracking-tight ${textMain}`}>
                {activeTab === 'traffic' ? 'Monitoring du Réseau' : 'Gestion des Incidents'}
              </h1>
              <p className={`text-sm font-bold mt-2 ${textMuted}`}>
                {activeTab === 'traffic' ? 'Vue satellitaire des axes routiers enregistrés' : `${incidents.length} signalement(s) en attente de validation`}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 z-10">
            {activeTab === 'traffic' && (
              <button 
                className={`flex items-center gap-3 ${isDark ? 'bg-white text-slate-900' : 'bg-[#0a0f1c] text-white'} py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all`}
                onClick={() => setShowUpdateModal(true)}
              >
                <Zap size={16} className="text-yellow-500" />
                Mise à jour
              </button>
            )}
            {activeTab === 'alerts' && (
              <button 
                className="flex items-center gap-3 bg-blue-600 text-white py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 hover:bg-blue-700 transition-all" 
                onClick={() => { setSelectedIncident(null); setShowAlerteModal(true); }}
              >
                <Crosshair size={16} />
                Déployer Alerte
              </button>
            )}
             {/* Mobile Theme Toggle */}
             <button 
               className={`lg:hidden p-3.5 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
               onClick={() => setPoliceTheme(t => t === 'dark' ? 'light' : 'dark')}
             >
               {isDark ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             {/* Mobile Logout */}
             <button 
               className={`lg:hidden p-3.5 rounded-xl transition-all border ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'}`}
               onClick={handleLogout}
             >
               <LogOut size={20} />
             </button>
          </div>
        </header>

        {/* Horizontal Navigation for Mobile/Tablet */}
        <nav className={`lg:hidden flex overflow-x-auto no-scrollbar items-center gap-2 px-6 py-3 border-b shrink-0 shadow-sm ${isDark ? 'bg-[#131b2f] border-slate-800' : 'bg-white border-slate-200'}`}>
          {[
            { id: 'traffic', label: 'Trafic', icon: MapPin },
            { id: 'alerts', label: 'Alertes', icon: AlertTriangle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800')
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.id === 'alerts' && incidents.length > 0 && (
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full ml-1">{incidents.length}</span>
              )}
            </button>
          ))}
        </nav>

        {statusMsg && (
          <div className={`fixed top-6 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-10 z-[100] px-6 py-4 rounded-2xl flex items-center gap-3 shadow-2xl font-black text-xs uppercase tracking-widest border-2 backdrop-blur-md animate-slideDown
            ${statusMsg.type === 'success' ? 'bg-green-50/90 text-green-700 border-green-500/30 shadow-[0_10px_40px_rgba(34,197,94,0.2)]' : 'bg-red-50/90 text-red-700 border-red-500/30 shadow-[0_10px_40px_rgba(239,68,68,0.2)]'}
          `}>
            {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            {statusMsg.text}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-12 z-10">
          {loading && activeTab !== 'alerts' ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
               <div className="relative">
                 <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                 <Radio size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" />
               </div>
               <span className="font-black text-xs uppercase tracking-[0.3em] text-slate-400">Balayage du réseau...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* TRAFFIC TAB */}
              {activeTab === 'traffic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {routes.map(r => {
                    const status = formatStatus(r.trafic?.niveau);
                    const colorKey = getStatusColor(status);
                    
                    // Maps color strings to Tailwind classes safely
                    const colorClasses: Record<string, string> = {
                      'green': isDark ? 'border-green-500/30 bg-green-500/10 text-green-400 shadow-green-500/10' : 'border-green-500 bg-green-50/50 text-green-700 shadow-green-500/20',
                      'yellow': isDark ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400 shadow-yellow-400/10' : 'border-yellow-400 bg-yellow-50/50 text-yellow-700 shadow-yellow-400/20',
                      'orange': isDark ? 'border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-orange-500/10' : 'border-orange-500 bg-orange-50/50 text-orange-700 shadow-orange-500/20',
                      'red': isDark ? 'border-red-500/30 bg-red-500/10 text-red-400 shadow-red-500/10' : 'border-red-500 bg-red-50/50 text-red-700 shadow-red-500/20'
                    };
                    const badgeClasses: Record<string, string> = {
                      'green': 'bg-green-500 text-white',
                      'yellow': 'bg-yellow-400 text-yellow-900',
                      'orange': 'bg-orange-500 text-white',
                      'red': 'bg-red-600 text-white animate-pulse'
                    };

                    return (
                      <div 
                        key={r.id} 
                        className={`relative border ${expandedRouteId === r.id ? `rounded-t-3xl rounded-b-none border-blue-500 shadow-xl shadow-blue-500/10 z-30 ${isDark ? 'bg-[#0f172a]' : 'bg-white'}` : `rounded-3xl ${borderCard} ${bgCard} ${shadowCard} hover:shadow-xl z-10`} transition-all cursor-pointer group flex flex-col`}
                        onClick={() => {
                          if (expandedRouteId !== r.id) {
                            setExpandedRouteId(r.id); 
                            setInlineStatus(status);
                          } else {
                            setExpandedRouteId(null);
                          }
                        }}
                      >
                        {/* Header of widget */}
                        <div className={`border-b p-4 px-6 flex justify-between items-center rounded-t-[23px] ${isDark ? 'bg-slate-800/80 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center gap-3">
                             <div className={`w-2.5 h-2.5 rounded-full ${badgeClasses[colorKey]}`}></div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: RTE-{r.id.toString().padStart(3, '0')}</span>
                           </div>
                           <BarChart2 size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        
                        {/* Body of widget */}
                        <div className="p-6 flex-1 flex flex-col justify-center relative">
                           <h3 className={`text-lg font-black mb-6 pr-10 ${textMain}`}>{r.nom}</h3>
                           
                           <div className="flex items-end justify-between mt-auto">
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${textMuted}`}>Statut Actuel</p>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 shadow-lg ${colorClasses[colorKey]}`}>
                                   <span className="font-black text-sm tracking-wide">{status}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                 <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textMuted}`}>Dernier relevé</p>
                                 <p className={`text-sm font-bold flex items-center gap-1 justify-end ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                   <Clock size={14} /> {r.trafic ? 'Récent' : 'N/A'}
                                 </p>
                              </div>
                           </div>

                           <div className={`absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${expandedRouteId === r.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'} border border-slate-100 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm`}>
                              <ChevronRight size={18} className={`transition-transform duration-300 ${expandedRouteId === r.id ? 'rotate-90' : ''}`} />
                           </div>
                        </div>

                        {/* Inline Edit Section */}
                        {expandedRouteId === r.id && (
                          <div className={`absolute top-full left-[-1px] right-[-1px] border border-t-0 border-blue-500 rounded-b-3xl p-5 shadow-2xl cursor-default animate-slideDown z-40 ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`} onClick={(e) => e.stopPropagation()}>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nouvel état :</p>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {[
                                { id: 'FLUIDE', label: 'Fluide', color: 'bg-green-500/20 text-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' },
                                { id: 'RALENTI', label: 'Ralenti', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' },
                                { id: 'SATURE', label: 'Saturé', color: 'bg-orange-500/20 text-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' },
                                { id: 'BLOQUE', label: 'Bloqué', color: 'bg-red-500/20 text-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' }
                              ].map(s => (
                                <button 
                                  key={s.id}
                                  className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-2
                                    ${inlineStatus === s.id ? s.color : `border-transparent ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-400 hover:bg-slate-200'} shadow-sm`}
                                  `}
                                  onClick={() => setInlineStatus(s.id)}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-3">
                               <button 
                                 className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-colors"
                                 onClick={(e) => { e.stopPropagation(); setExpandedRouteId(null); }}
                               >
                                 Annuler
                               </button>
                               <button 
                                 className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                 onClick={(e) => { e.stopPropagation(); handleUpdateTraffic(r.id, inlineStatus); }}
                               >
                                 <CheckCircle size={14} /> Valider
                               </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ALERTS TAB */}
              {activeTab === 'alerts' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Pending Incidents List */}
                  <div className="lg:col-span-8 space-y-6">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                      <Clock size={18} /> File d'attente des signalements
                    </h2>

                    {incidents.length === 0 ? (
                      <div className={`rounded-[32px] p-16 text-center border border-dashed shadow-sm ${bgCard} ${borderCard}`}>
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <CheckCircle size={40} className="text-green-500" />
                        </div>
                        <h3 className={`text-lg font-black mb-2 ${textMain}`}>Aucun signalement en attente</h3>
                        <p className={`font-bold ${textMuted}`}>Le réseau est actuellement calme. Bon travail d'équipe.</p>
                      </div>
                    ) : (
                      incidents.map((i, index) => (
                        <div key={i.id} className={`rounded-[32px] border ${bgCard} ${borderCard} ${shadowCard} overflow-hidden animate-slideUp`} style={{animationDelay: `${index * 100}ms`}}>
                          {/* Ticket Header */}
                          <div className="bg-[#1e293b] text-white p-4 px-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/20
                                ${i.type_incident === 'ACCIDENT' ? 'bg-red-500' : i.type_incident === 'BLOCAGE' ? 'bg-orange-500' : 'bg-slate-700'}
                              `}>
                                {i.type_incident}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">TICKET #{i.id.toString().padStart(4, '0')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300 bg-slate-800 px-3 py-1.5 rounded-lg">
                               <Clock size={14} className="text-blue-400" />
                               {new Date(i.date_signalement).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                          
                          {/* Ticket Body */}
                          <div className="p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row gap-8">
                              <div className="flex-1">
                                <h3 className={`text-xl font-black mb-4 ${textMain}`}>{i.route.nom}</h3>
                                <div className={`rounded-2xl p-5 border relative ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-2xl"></div>
                                  <p className={`font-bold italic leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    "{i.description || 'Aucun détail supplémentaire fourni.'}"
                                  </p>
                                </div>
                                <div className="mt-6 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500">
                                    {i.signaleur.prenom[0]}
                                  </div>
                                  <span className="text-xs font-bold text-slate-500">Signalé par <span className="text-slate-800 uppercase">{i.signaleur.prenom} {i.signaleur.nom}</span></span>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="sm:w-48 flex flex-col gap-3 shrink-0">
                                <button 
                                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-4 px-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-green-500/20 hover:-translate-y-1 hover:bg-green-700 transition-all"
                                  onClick={() => handleProcessIncident(i.id, 'VALIDE')}
                                >
                                  <CheckCircle size={16} /> Valider
                                </button>
                                <button 
                                  className="w-full flex items-center justify-center gap-2 bg-white text-slate-500 border-2 border-slate-200 py-4 px-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                                  onClick={() => handleProcessIncident(i.id, 'REJETE')}
                                >
                                  <XCircle size={16} /> Rejeter
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Active Alerts Sidebar / History */}
                  <div className="lg:col-span-4">
                    <div className={`rounded-[32px] border ${bgCard} ${borderCard} ${shadowCard} p-6 sticky top-6`}>
                      <h2 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center justify-between ${textMain}`}>
                        <span>Journal d'Alertes</span>
                        <span className={`px-3 py-1 rounded-full text-[9px] ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{activeAlerts.length} actives</span>
                      </h2>
                      
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                        {activeAlerts.length === 0 ? (
                          <p className="text-xs font-bold text-slate-400 text-center py-10">Aucune alerte publique en cours.</p>
                        ) : (
                          activeAlerts.map(a => {
                            const style = getSeverityStyle(a.niveau_gravite);
                            return (
                              <div key={a.id} className={`p-4 rounded-2xl border-l-4 ${style.bg} ${style.border} ${style.text} transition-all`}>
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest">{a.type_incident}</span>
                                  <span className="text-[9px] font-black opacity-60">
                                    {new Date(a.date_creation).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <h4 className={`font-black text-xs mb-1 ${textMain}`}>{a.route.nom}</h4>
                                <p className={`text-[11px] font-bold line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{a.message}</p>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Diffuser Alerte */}
      {showAlerteModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className={`${bgCard} w-full max-w-xl rounded-[40px] shadow-2xl animate-scaleUp overflow-hidden`}>
            <div className="bg-blue-600 p-8 text-white relative">
               <button className="absolute top-6 right-6 p-2 bg-blue-700/50 rounded-xl hover:bg-blue-700 transition-colors" onClick={() => setShowAlerteModal(false)}>
                 <X size={20} />
               </button>
               <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Crosshair size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black tracking-tight">Déployer Alerte</h3>
                   <p className="text-blue-200 text-sm font-bold mt-1">Diffusion sur le réseau public</p>
                 </div>
               </div>
            </div>
            
            <form onSubmit={handleSendAlert} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Axe routier ciblé</label>
                {selectedIncident ? (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <strong className="text-lg text-slate-800 font-black">{selectedIncident?.route.nom}</strong>
                    <p className="text-[10px] font-black text-blue-600 uppercase mt-1">Lien Ticket #{selectedIncident.id}</p>
                  </div>
                ) : (
                  <select 
                    className={`w-full p-4 rounded-2xl border font-black outline-none appearance-none cursor-pointer transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`}
                    value={alertForm.route_id} 
                    onChange={e => setAlertForm({...alertForm, route_id: e.target.value})}
                    required
                  >
                    <option value="">Sélectionner une route...</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Type d'événement</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['ACCIDENT', 'PANNE', 'BLOCAGE', 'METEO'].map(type => (
                    <button
                      key={type}
                      type="button"
                      className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all 
                        ${alertForm.type_incident === type ? 'bg-[#0a0f1c] border-[#0a0f1c] text-white shadow-lg' : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}`}
                      onClick={() => setAlertForm({...alertForm, type_incident: type})}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Niveau d'Urgence</label>
                <div className="flex gap-2">
                  {[
                    { id: 'INFO', label: 'Info', color: 'border-green-500 text-green-600', active: 'bg-green-500 text-white border-green-500' },
                    { id: 'IMPORTANT', label: 'Important', color: 'border-orange-500 text-orange-600', active: 'bg-orange-500 text-white border-orange-500' },
                    { id: 'CRITIQUE', label: 'Critique', color: 'border-red-600 text-red-600', active: 'bg-red-600 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]' }
                  ].map(lvl => (
                    <button
                      key={lvl.id}
                      type="button"
                      className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border-2 transition-all ${alertForm.niveau_gravite === lvl.id ? lvl.active : `${isDark ? 'bg-slate-800' : 'bg-white'} ${lvl.color}`}`}
                      onClick={() => setAlertForm({...alertForm, niveau_gravite: lvl.id})}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Consigne / Message</label>
                <textarea 
                  className={`w-full p-4 rounded-2xl border font-bold outline-none h-28 resize-none transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`}
                  placeholder="Ex: Évitez la zone, services de secours en route..."
                  value={alertForm.message}
                  onChange={e => setAlertForm({...alertForm, message: e.target.value})}
                  required
                />
              </div>

              <div className={`flex gap-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button type="button" className={`w-1/3 py-4 rounded-2xl font-black transition-all uppercase text-[11px] tracking-widest ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} onClick={() => setShowAlerteModal(false)}>Annuler</button>
                <button type="submit" className="w-2/3 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all uppercase text-[11px] tracking-widest flex items-center justify-center gap-2">
                  <Send size={16} /> Émettre Alerte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Traffic */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className={`${bgCard} w-full max-w-md rounded-[40px] shadow-2xl animate-scaleUp overflow-hidden`}>
            <div className="bg-[#0a0f1c] p-8 text-white relative">
               <button className="absolute top-6 right-6 p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors" onClick={() => setShowUpdateModal(false)}>
                 <X size={20} />
               </button>
               <div className="flex items-center gap-4 mb-2">
                 <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                    <Zap size={24} className="text-yellow-400" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black tracking-tight">Forcer État Trafic</h3>
                   <p className="text-slate-400 text-sm font-bold mt-1">Mise à jour manuelle</p>
                 </div>
               </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Sélection du segment</label>
                <select 
                  className={`w-full p-4 rounded-2xl border font-black outline-none appearance-none cursor-pointer transition-all ${bgInput} ${borderInput} ${focusInput} ${textMain}`}
                  value={selectedRoute?.id || ''} 
                  onChange={e => {
                    const r = routes.find(rt => rt.id === parseInt(e.target.value));
                    setSelectedRoute(r || null);
                    if (r?.trafic) setSelectedStatus(r.trafic.niveau);
                  }}
                >
                  <option value="">Sélectionner une route</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1 block">Niveau d'encombrement</label>
                <div className="flex flex-col gap-2 mt-2">
                  {[
                    { id: 'FLUIDE', label: 'Trafic Fluide', color: 'text-green-500 bg-green-500/10', active: 'border-green-500 bg-green-500/20 text-green-500 shadow-md shadow-green-500/10', icon: CheckCircle },
                    { id: 'RALENTI', label: 'Trafic Ralenti', color: 'text-yellow-500 bg-yellow-500/10', active: 'border-yellow-500 bg-yellow-500/20 text-yellow-500 shadow-md shadow-yellow-500/10', icon: Info },
                    { id: 'SATURE', label: 'Trafic Saturé', color: 'text-orange-500 bg-orange-500/10', active: 'border-orange-500 bg-orange-500/20 text-orange-500 shadow-md shadow-orange-500/10', icon: AlertTriangle },
                    { id: 'BLOQUE', label: 'Axe Bloqué', color: 'text-red-500 bg-red-500/10', active: 'border-red-500 bg-red-500/20 text-red-500 shadow-md shadow-red-500/10', icon: XCircle }
                  ].map(s => (
                    <button 
                      key={s.id}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black transition-all border-2
                        ${selectedStatus === s.id ? s.active : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                      `}
                      onClick={() => setSelectedStatus(s.id)}
                    >
                      <div className={`p-2 rounded-xl ${s.color}`}>
                        <s.icon size={20} />
                      </div>
                      {s.label}
                      {selectedStatus === s.id && <div className={`ml-auto w-2 h-2 rounded-full ${s.color.split(' ')[0].replace('text', 'bg')} animate-pulse`}></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex gap-4 pt-6 border-t mt-8 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button className={`w-1/3 py-4 rounded-2xl font-black transition-all uppercase text-[11px] tracking-widest ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} onClick={() => setShowUpdateModal(false)}>Annuler</button>
                <button 
                  className={`w-2/3 py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all uppercase text-[11px] tracking-widest flex justify-center items-center gap-2 ${isDark ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' : 'bg-[#0a0f1c] text-white shadow-slate-300 hover:bg-black'}`}
                  onClick={() => {
                    if (!selectedRoute) {
                      showStatus('error', 'Veuillez sélectionner un segment routier');
                      return;
                    }
                    handleUpdateTraffic(selectedRoute.id, selectedStatus);
                  }}
                >
                  <Zap size={16} className={isDark ? "text-white" : "text-yellow-400"} /> Transmettre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PolicePanel;
