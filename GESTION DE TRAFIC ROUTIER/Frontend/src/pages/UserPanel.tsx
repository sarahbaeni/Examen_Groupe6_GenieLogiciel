import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, AlertTriangle, LogOut,
  Send, Clock, CheckCircle, AlertCircle, RefreshCw,
  Menu, X, Bell, Shield, ChevronRight, Info, Sun, Moon
} from 'lucide-react';
import { API_BASE_URL } from '../config';

interface RouteData {
  id: number;
  nom: string;
  distance_km: number;
  trafic?: {
    niveau: 'FLUIDE' | 'RALENTI' | 'SATURE' | 'BLOQUE';
    temps_retard_min: number;
  };
}

interface AlerteData {
  id: number;
  message: string;
  niveau_gravite: 'INFO' | 'IMPORTANT' | 'CRITIQUE';
  date_creation: string;
  route: { nom: string };
  police?: { nom: string; prenom: string };
}

const UserPanel: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'traffic' | 'report' | 'alerts'>('traffic');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userTheme, setUserTheme] = useState<'dark' | 'light'>('dark');

  // Theme Variables
  const isDark = userTheme === 'dark';
  const bgMain = isDark ? 'bg-[#0a0f1c]' : 'bg-[#f8fafc]';
  const textMain = isDark ? 'text-white' : 'text-slate-800';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const bgCard = isDark ? 'bg-[#131b2f]' : 'bg-white';
  const borderCard = isDark ? 'border-slate-800' : 'border-gray-100';
  const bgInput = isDark ? 'bg-slate-900/50' : 'bg-slate-50';
  const borderInput = isDark ? 'border-slate-700' : 'border-transparent';

  const [alertFilter, setAlertFilter] = useState<'ALL' | 'INFO' | 'IMPORTANT' | 'CRITIQUE'>('ALL');
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ route_id: '', type_incident: 'ACCIDENT', description: '' });
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [alerts, setAlerts] = useState<AlerteData[]>([]);
  const [myIncidents, setMyIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlerteData | null>(null);

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const filteredAlerts = alertFilter === 'ALL'
    ? alerts
    : alerts.filter(a => a.niveau_gravite === alertFilter);

  // Initial load
  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    loadData();
  }, [activeTab]);

  // Polling for new alerts
  useEffect(() => {
    if (!user.id) return;

    const checkNewAlerts = async () => {
      try {
        const [resA, resI] = await Promise.all([
          fetch(`${API_BASE_URL}/alertes/`),
          fetch(`${API_BASE_URL}/incidents/`)
        ]);

        const alertsData = await resA.json();
        const incidentsData = await resI.json();

        // On n'affiche que les incidents validés qui ne sont pas déjà des alertes (pour éviter les doublons si l'auto-alerte est activée)
        // Mais avec la nouvelle logique, on affichera surtout les alertes officielles.
        const unified = [...alertsData]
          .sort((a: any, b: any) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());

        if (activeTab === 'alerts') {
          setAlerts(unified);
          setUnreadAlertsCount(0);
        } else {
          if (unified.length > alerts.length) {
            setUnreadAlertsCount(unified.length - alerts.length);
          }
        }
      } catch (err) {
        console.error("Erreur polling alertes");
      }
    };

    const interval = setInterval(checkNewAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user.id, activeTab, alerts.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'traffic') {
        const res = await fetch(`${API_BASE_URL}/trafic/`);
        setRoutes(await res.json());
      } else if (activeTab === 'alerts') {
        const resA = await fetch(`${API_BASE_URL}/alertes/`);
        const alertsData = await resA.json();

        const sorted = [...alertsData].sort((a: any, b: any) =>
          new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
        );

        setAlerts(sorted);
        setUnreadAlertsCount(0);
      } else {
        const res = await fetch(`${API_BASE_URL}/incidents/me`, {
          headers: { 'x-user-id': String(user.id) }
        });
        setMyIncidents(await res.json());

        if (routes.length === 0) {
          const resR = await fetch(`${API_BASE_URL}/trafic/`);
          const routesData = await resR.json();
          setRoutes(routesData);
          if (routesData.length > 0 && !formData.route_id) {
            setFormData(prev => ({ ...prev, route_id: routesData[0].id.toString() }));
          }
        } else if (!formData.route_id && routes.length > 0) {
          setFormData(prev => ({ ...prev, route_id: routes[0].id.toString() }));
        }
      }
    } catch (err) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/incidents/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': String(user.id)
        },
        body: JSON.stringify({
          route_id: parseInt(formData.route_id),
          type_incident: formData.type_incident,
          description: formData.description
        })
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");

      setFormData({ ...formData, description: '' });
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusInfo = (niveau?: string) => {
    switch (niveau) {
      case 'FLUIDE': return { label: 'Fluide', color: 'status-fluide', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700', help: 'Circulation normale - Bonne route !' };
      case 'RALENTI': return { label: 'Ralenti', color: 'status-ralenti', bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-700', help: 'Trafic ralenti - Gardez vos distances' };
      case 'SATURE': return { label: 'Dense', color: 'status-sature', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-700', help: 'Circulation dense - Anticipez un temps de trajet plus long' };
      case 'BLOQUE': return { label: 'Bloqué', color: 'status-bloque', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', help: 'Route bloquée - Privilégiez un itinéraire alternatif' };
      default: return { label: 'Inconnu', color: 'text-muted', bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-700', help: 'Données indisponibles' };
    }
  };

  const getAlertSeverityInfo = (niv: string) => {
    switch (niv) {
      case 'CRITIQUE': return {
        bg: 'bg-red-600',
        lightBg: 'bg-red-50',
        text: 'text-white',
        textColor: 'text-red-700',
        icon: AlertCircle,
        label: 'CRITIQUE',
        gradient: 'from-red-600 to-red-700',
        glow: 'shadow-red-500/20',
        animate: 'animate-subtlePulse'
      };
      case 'IMPORTANT': return {
        bg: 'bg-orange-500',
        lightBg: 'bg-orange-50',
        text: 'text-white',
        textColor: 'text-orange-700',
        icon: AlertTriangle,
        label: 'IMPORTANT',
        gradient: 'from-orange-500 to-orange-600',
        glow: 'shadow-orange-500/20',
        animate: ''
      };
      case 'INFO':
      default: return {
        bg: 'bg-green-600',
        lightBg: 'bg-green-50',
        text: 'text-white',
        textColor: 'text-green-700',
        icon: Bell,
        label: 'INFO',
        gradient: 'from-green-500 to-green-600',
        glow: 'shadow-green-500/20',
        animate: ''
      };
    }
  };

  return (
    <div className={`flex flex-col h-screen w-full ${bgMain} overflow-hidden ${textMain} transition-colors duration-300`}>
      {/* HEADER */}
      <header className={`flex justify-between items-center px-6 py-4 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-gray-200'} border-b h-[70px] shrink-0 z-30 shadow-sm transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <button
            className={`md:hidden p-2 -ml-2 rounded-lg ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-text-muted hover:bg-gray-100'}`}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-primary text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
              <User size={22} />
            </div>
            <div className="hidden sm:block">
              <h2 className={`text-base font-bold leading-tight ${isDark ? 'text-white' : 'text-secondary'}`}>Mon espace</h2>
              <p className={`text-[13px] leading-tight ${textMuted}`}>{user.prenom} {user.nom}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`p-2.5 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-gray-200 text-slate-400 hover:text-slate-800'}`}
            onClick={() => setUserTheme(t => t === 'dark' ? 'light' : 'dark')}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-xl transition-all active:scale-95 ${isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-status-bloque hover:bg-red-50'}`}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="hidden sm:inline text-sm">Quitter</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex transition-all duration-300 ease-in-out
          w-64 ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-gray-200'} border-r p-6 flex flex-col gap-2 z-20 shrink-0
          h-[calc(100vh-70px)]
        `}>
          <button
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${activeTab === 'traffic' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-text-muted hover:bg-gray-50')}`}
            onClick={() => { setActiveTab('traffic'); setIsSidebarOpen(false); }}
          >
            <MapPin size={20} />
            <span>Trafic Direct</span>
          </button>
          <button
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all relative ${activeTab === 'alerts' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-text-muted hover:bg-gray-50')}`}
            onClick={() => { setActiveTab('alerts'); setIsSidebarOpen(false); }}
          >
            <div className="relative">
              <Bell size={20} />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 ${isDark ? 'border-[#0f172a]' : 'border-white'}`}></span>
                </span>
              )}
            </div>
            <span>Alertes</span>
            {unreadAlertsCount > 0 && (
              <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === 'alerts' ? 'bg-white text-primary' : 'bg-red-600 text-white shadow-lg shadow-red-200'}`}>
                {unreadAlertsCount}
              </span>
            )}
          </button>
          <button
            className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all ${activeTab === 'report' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : (isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-text-muted hover:bg-gray-50')}`}
            onClick={() => { setActiveTab('report'); setIsSidebarOpen(false); }}
          >
            <AlertTriangle size={20} />
            <span>Signaler</span>
          </button>
        </aside>

        {isSidebarOpen && (
          <div className={`fixed inset-0 ${isDark ? 'bg-black/40' : 'bg-black/20'} z-10 md:hidden backdrop-blur-sm`} onClick={() => setIsSidebarOpen(false)}></div>
        )}

        <main className={`flex-1 overflow-y-auto p-6 md:p-10 ${bgMain} transition-colors duration-300`}>
          {activeTab === 'traffic' ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h1 className={`text-3xl font-black mb-2 ${textMain}`}>Trafic en temps réel</h1>
                  <p className={`font-medium ${textMuted}`}>État de circulation sur les axes majeurs de Goma</p>
                </div>
                <button onClick={loadData} className={`w-fit border p-3 rounded-2xl shadow-sm transition-all group active:scale-95 ${isDark ? 'bg-[#131b2f] border-slate-700 text-slate-400 hover:text-blue-400 hover:border-blue-500' : 'bg-white border-gray-200 text-slate-400 hover:text-primary hover:border-primary'}`}>
                  <RefreshCw size={22} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {routes.map((route, index) => {
                  const status = getStatusInfo(route.trafic?.niveau);
                  return (
                    <div
                      key={route.id}
                      className={`rounded-[32px] p-8 border-2 transition-all hover:-translate-y-2 hover:shadow-2xl shadow-sm animate-slideUp ${isDark ? `${status.bg.replace('50', '500/10')} ${status.border.replace('100', '500/30')}` : `${status.bg} ${status.border}`} ${isDark ? 'hover:shadow-slate-900' : 'hover:shadow-slate-200'}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex-1">
                          <h3 className={`text-xl font-black mb-2 ${isDark ? status.text.replace('700', '400') : status.text}`}>{route.nom}</h3>
                          <div className={`flex flex-wrap items-center gap-y-2 gap-x-5 ${isDark ? status.text.replace('700', '400') : status.text} opacity-80 text-[13px] font-bold`}>
                            <span className="flex items-center gap-2"><MapPin size={16} /> {route.distance_km} km</span>
                            <span className={`flex items-center gap-2 px-2 py-1 rounded-lg ${isDark ? 'bg-white/10' : 'bg-white/60'}`}><Clock size={16} /> +{route.trafic?.temps_retard_min || 0} min</span>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-sm shrink-0 ${isDark ? `bg-slate-800 ${status.text.replace('700', '400')}` : `bg-white ${status.text}`}`}>
                          {status.label}
                        </div>
                      </div>
                      <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-white/50'}`}>
                        <p className={`text-sm font-bold flex items-center gap-2 ${isDark ? status.text.replace('700', '400') : status.text}`}>
                          <Info size={18} className="shrink-0" />
                          {status.help}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'alerts' ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <h1 className={`text-3xl font-black mb-2 ${textMain}`}>Centre d'Alertes</h1>
                    <p className={`font-medium ${textMuted}`}>Informations certifiées par la police routière</p>
                  </div>
                  <button onClick={loadData} className={`w-fit border p-3 rounded-2xl shadow-sm transition-all active:scale-95 ${isDark ? 'bg-[#131b2f] border-slate-700 text-slate-400 hover:text-blue-400' : 'bg-white border-gray-200 text-slate-400 hover:text-primary'}`}>
                    <RefreshCw size={22} className={`${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* FILTER BAR */}
                <div className={`flex flex-wrap gap-2 mb-8 p-2 rounded-[24px] shadow-sm border ${isDark ? 'bg-[#131b2f] border-slate-800' : 'bg-white border-gray-100'}`}>
                  {[
                    { id: 'ALL', label: 'Tous', color: 'bg-slate-900' },
                    { id: 'INFO', label: 'Info 🟢', color: 'bg-green-600' },
                    { id: 'IMPORTANT', label: 'Important 🟠', color: 'bg-orange-500' },
                    { id: 'CRITIQUE', label: 'Critique 🔴', color: 'bg-red-600' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setAlertFilter(f.id as any)}
                      className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all
                          ${alertFilter === f.id ? `${f.color} text-white shadow-lg` : (isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50')}
                        `}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {filteredAlerts.map((alert, index) => {
                  const info = getAlertSeverityInfo(alert.niveau_gravite);
                  return (
                    <div
                      key={alert.id}
                      className={`rounded-[40px] p-0 border shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-500 animate-slideUp ${isDark ? 'bg-[#131b2f] border-slate-800 hover:shadow-slate-900/50' : 'bg-white border-gray-100 hover:shadow-slate-200/50'}`}
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      <div className="flex flex-col md:flex-row min-h-[160px]">
                        <div className={`w-full md:w-3 flex items-center justify-center shrink-0 bg-gradient-to-b ${info.gradient} ${info.animate}`}></div>
                        <div className="flex-1 p-8 sm:p-10 flex flex-col justify-between">
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${info.bg} ${info.text} ${info.glow}`}>
                                <info.icon size={12} strokeWidth={3} />
                                {info.label}
                              </span>
                              <div className={`h-4 w-[1px] mx-1 hidden sm:block ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                              <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDark ? 'text-white bg-slate-800 border-slate-700' : 'text-slate-800 bg-slate-50 border-gray-100'}`}>
                                <MapPin size={12} className="text-primary" />
                                {alert.route.nom}
                              </span>
                            </div>
                            <h3 className={`text-xl sm:text-2xl font-black leading-tight tracking-tight ${textMain}`}>
                              {alert.message}
                            </h3>
                          </div>
                          <div className={`pt-8 mt-4 border-t flex flex-wrap items-center justify-between gap-4 ${isDark ? 'border-slate-800' : 'border-gray-50'}`}>
                            <div className="flex items-center gap-6">
                              <div className={`flex items-center gap-2 text-[11px] font-bold ${textMuted}`}>
                                <Clock size={16} className={isDark ? 'text-slate-600' : 'text-gray-300'} />
                                <span>Publié le {new Date(alert.date_creation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className={`flex items-center gap-2 text-[11px] font-black text-blue-500 uppercase tracking-tighter px-3 py-1 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                <Shield size={14} /> Source Officielle
                              </div>
                            </div>
                            <button
                              className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              Détails <ChevronRight size={14} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                        <div className={`hidden lg:flex shrink-0 w-32 items-center justify-center p-6 transition-colors ${isDark ? 'bg-slate-800/30 group-hover:bg-slate-800/50' : 'bg-slate-50/50 group-hover:bg-white'}`}>
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${info.lightBg} ${info.textColor} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                            <info.icon size={32} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredAlerts.length === 0 && !loading && (
                  <div className={`py-24 text-center space-y-8 rounded-[50px] border-2 border-dashed animate-fadeIn overflow-hidden ${isDark ? 'bg-[#131b2f] border-slate-800' : 'bg-white border-gray-100'}`}>
                    <div className="relative inline-block">
                      <div className={`w-24 h-24 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm relative z-10 transition-transform hover:rotate-12 ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                        <CheckCircle size={48} strokeWidth={1.5} />
                      </div>
                      <div className="absolute top-0 left-0 w-24 h-24 bg-green-200/20 rounded-full animate-ping"></div>
                    </div>
                    <div className="space-y-2 px-10">
                      <h3 className={`text-2xl font-black ${textMain}`}>Tout est calme</h3>
                      <p className={`font-bold max-w-xs mx-auto text-sm leading-relaxed ${textMuted}`}>Aucune alerte "{alertFilter}" signalée pour le moment.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="mb-10">
                  <h1 className={`text-3xl font-black mb-2 ${textMain}`}>Signaler un incident</h1>
                  <p className={`font-medium ${textMuted}`}>Votre signalement aide la ville à mieux circuler</p>
                </div>

                {!isFormOpen ? (
                  <button
                    className="w-full flex flex-col items-center justify-center gap-4 bg-primary text-white p-10 rounded-[40px] font-black text-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-2 transition-all active:scale-95 group"
                    onClick={() => setIsFormOpen(true)}
                  >
                    <div className="bg-white/20 p-5 rounded-full group-hover:bg-white/30 transition-colors">
                      <Send size={40} />
                    </div>
                    <span>Créer un signalement</span>
                  </button>
                ) : (
                  <form className={`rounded-[40px] p-10 border shadow-xl animate-scaleUp ${isDark ? 'bg-[#131b2f] border-slate-800' : 'bg-white border-gray-100'}`} onSubmit={handleSubmitReport}>
                    <h3 className={`text-2xl font-black mb-8 border-b pb-6 flex items-center gap-3 ${isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-50'}`}>
                      <div className="w-2 h-8 bg-primary rounded-full"></div>
                      Détails de l'incident
                    </h3>

                    <div className="space-y-8">
                      <div className="flex flex-col gap-3">
                        <label className={`text-xs font-black uppercase tracking-widest pl-1 ${textMuted}`}>Axe routier</label>
                        <select
                          className={`w-full p-4 rounded-2xl border-2 outline-none appearance-none cursor-pointer font-bold transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-transparent text-slate-700 focus:border-primary/20 focus:bg-white'}`}
                          value={formData.route_id}
                          onChange={e => setFormData({ ...formData, route_id: e.target.value })}
                          required
                        >
                          {routes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                        </select>
                      </div>

                      <div className="flex flex-col gap-3">
                        <label className={`text-xs font-black uppercase tracking-widest pl-1 ${textMuted}`}>Type de problème</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'ACCIDENT', label: 'Accident', icon: AlertCircle, color: 'text-red-500', bg: isDark ? 'bg-red-500/10' : 'bg-red-50' },
                            { id: 'PANNE', label: 'Panne', icon: AlertTriangle, color: 'text-orange-500', bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50' },
                            { id: 'BLOCAGE', label: 'Blocage', icon: X, color: isDark ? 'text-slate-300' : 'text-slate-700', bg: isDark ? 'bg-slate-800' : 'bg-slate-100' },
                            { id: 'METEO', label: 'Météo', icon: Bell, color: 'text-blue-500', bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50' }
                          ].map(type => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, type_incident: type.id })}
                              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.type_incident === type.id ? 'border-primary bg-primary/5 shadow-md' : (isDark ? 'border-slate-700 bg-[#0f172a] hover:bg-slate-800' : 'border-slate-50 bg-white hover:bg-slate-50')}`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type.bg} ${type.color}`}>
                                <type.icon size={20} />
                              </div>
                              <span className={`font-bold ${formData.type_incident === type.id ? 'text-primary' : (isDark ? 'text-slate-300' : 'text-slate-600')}`}>{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <label className={`text-xs font-black uppercase tracking-widest pl-1 ${textMuted}`}>Précisions (optionnel)</label>
                        <textarea
                          className={`w-full p-5 rounded-[24px] border-2 outline-none min-h-[140px] resize-none font-medium transition-all ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500' : 'bg-slate-50 border-transparent text-slate-700 focus:border-primary/20 focus:bg-white'}`}
                          placeholder="Ex: Un camion bloque la voie de droite après le rond-point..."
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                          type="button"
                          className={`flex-1 py-4 font-black text-sm uppercase tracking-widest rounded-2xl transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
                          onClick={() => setIsFormOpen(false)}
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className={`flex-[2] py-4 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all disabled:opacity-50 active:scale-95 ${isDark ? 'bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
                          disabled={formLoading}
                        >
                          {formLoading ? 'Envoi...' : 'Publier le signalement'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* SIDEBAR FOR REPORTS */}
              <div className="lg:col-span-1">
                <div className={`rounded-[24px] p-6 border shadow-sm h-full max-h-[600px] flex flex-col ${isDark ? 'bg-[#131b2f] border-slate-800' : 'bg-white border-gray-100'}`}>
                  <h3 className={`text-lg font-bold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-secondary'}`}>
                    <Clock size={20} className="text-primary" />
                    Mes derniers envois
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 no-scrollbar">
                    {myIncidents.map(inc => (
                      <div key={inc.id} className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/30' : 'bg-gray-50 border-gray-100 hover:border-primary/20'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold text-sm truncate mr-2 ${isDark ? 'text-white' : 'text-secondary'}`}>{inc.route.nom}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter shrink-0
                            ${inc.statut === 'VALIDE' ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700') : inc.statut === 'EN_ATTENTE' ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700') : (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')}
                          `}>
                            {inc.statut === 'VALIDE' ? 'Validé' : inc.statut === 'EN_ATTENTE' ? 'En attente' : inc.statut}
                          </span>
                        </div>
                        <p className={`text-[13px] mb-3 font-medium ${textMuted}`}>{inc.type_incident}</p>
                        <div className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          <Clock size={12} />
                          {new Date(inc.date_signalement).toLocaleString('fr-FR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                    {myIncidents.length === 0 && (
                      <div className={`flex flex-col items-center justify-center py-20 gap-2 ${isDark ? 'text-slate-600' : 'text-gray-300'}`}>
                        <Send size={40} strokeWidth={1} />
                        <p className="text-sm italic font-medium">Aucun signalement</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ALERT DETAILS MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedAlert(null)}></div>
          <div className={`relative w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-scaleUp p-8 sm:p-10 ${isDark ? 'bg-[#131b2f]' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className={`text-2xl font-black mb-2 ${textMain}`}>Détails de l'Alerte</h3>
                <p className={`font-bold flex items-center gap-2 ${textMuted}`}>
                  <MapPin size={16} className="text-primary" />
                  {selectedAlert.route.nom}
                </p>
              </div>
              <button onClick={() => setSelectedAlert(null)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100'}`}>
                <X size={24} />
              </button>
            </div>

            <div className={`p-6 rounded-3xl mb-8 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${textMuted}`}>Message Officiel</span>
              <p className={`text-lg font-black leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{selectedAlert.message}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-white'}`}>
                <div className={`w-12 h-12 rounded-full text-primary flex items-center justify-center ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                  <Shield size={24} />
                </div>
                <div>
                  <span className={`block text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Source Authentifiée</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Police Routière - Goma</span>
                </div>
              </div>
              <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-white'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <Clock size={24} />
                </div>
                <div>
                  <span className={`block text-[10px] font-black uppercase tracking-widest ${textMuted}`}>Publié le</span>
                  <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(selectedAlert.date_creation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <button
              className={`w-full mt-8 py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${isDark ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'}`}
              onClick={() => setSelectedAlert(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPanel;
