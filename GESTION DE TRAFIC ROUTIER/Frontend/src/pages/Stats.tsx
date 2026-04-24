import React from 'react';
import { Calendar, TrendingDown, ChevronRight, Info, History, BarChart3, Clock, AlertCircle } from 'lucide-react';

const Stats: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto py-10 px-6 sm:px-0 space-y-8 animate-fadeIn">
      <header className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-primary bg-blue-50 px-3 py-1 rounded-full self-start tracking-widest uppercase">AUJOURD'HUI</span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Analyse de Trafic</h1>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-white text-slate-900 shadow-sm transition-all">Jour</button>
        <button className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600 transition-all">Semaine</button>
        <button className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-600 transition-all">Mois</button>
        <button className="p-3 bg-white/50 text-slate-400 ml-1 rounded-xl hover:bg-white hover:text-primary transition-all">
          <Calendar size={18} />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-8 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
           <BarChart3 size={120} />
        </div>
        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block mb-8">Résumé de la journée</span>

        <div className="space-y-8">
          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <span className="text-6xl font-black text-slate-900 tracking-tighter">14</span>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Incidents déclarés</span>
            </div>
            <div className="h-12 w-[2px] bg-slate-100 mb-2"></div>
            <p className="text-slate-500 font-bold text-sm mb-2 max-w-[120px] leading-tight">Recensés sur le secteur Les Volcans</p>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex flex-col">
              <span className="text-5xl font-black text-orange-500 tracking-tighter">+12<span className="text-2xl ml-1">min</span></span>
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest mt-1">Retard Moyen</span>
            </div>
            <div className="h-10 w-[2px] bg-slate-100 mb-2"></div>
            <p className="text-slate-500 font-bold text-sm mb-2 max-w-[140px] leading-tight">Pointes de trafic (Matin & Soir)</p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-50 flex items-center gap-2 text-green-500">
          <TrendingDown size={18} />
          <span className="text-xs font-black uppercase tracking-wider">-4% d'affluence par rapport à hier</span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-blue-900/10 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Flux de circulation / Heure</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
              <div className="w-2 h-2 bg-primary rounded-full"></div> AUJOURD'HUI
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
              <div className="w-2 h-2 bg-slate-700 rounded-full"></div> MOYENNE
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-end gap-2 h-32">
            {[30, 60, 45, 90, 75, 40].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                 <div className="w-full bg-slate-800 rounded-lg relative overflow-hidden h-full flex flex-col justify-end">
                    <div 
                      className="w-full bg-primary rounded-lg transition-all duration-1000 group-hover:bg-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                      style={{ height: `${h}%` }}
                    ></div>
                 </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span>08h</span>
            <span>10h</span>
            <span>12h</span>
            <span>14h</span>
            <span>16h</span>
            <span>18h</span>
          </div>
        </div>
      </div>

      {/* Congestion List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Zones à risque</h2>
          <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Voir la carte</button>
        </div>

        <div className="space-y-3">
          {[
            { id: 1, name: 'Avenue des Cratères', status: 'BLOQUÉ', color: 'bg-red-500', bg: 'bg-red-50 text-red-600', trend: '+18 min' },
            { id: 2, name: 'Boulevard du Magma', status: 'SATURÉ', color: 'bg-orange-500', bg: 'bg-orange-50 text-orange-600', trend: '+9 min' },
            { id: 3, name: 'Rue de la Caldeira', status: 'RALENTI', color: 'bg-yellow-500', bg: 'bg-yellow-50 text-yellow-600', trend: '+4 min' },
          ].map(z => (
            <div key={z.id} className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:translate-x-1 transition-all">
              <div className="flex items-center gap-4 text-slate-300 font-black text-xl w-8 italic">
                {z.id}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-800">{z.name}</h4>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{z.trend} • Volume élevé</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${z.bg}`}>
                  {z.status}
                </span>
                <ChevronRight size={16} className="text-slate-300" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advice Card */}
      <div className="bg-primary p-8 rounded-[40px] text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Info size={80} />
        </div>
        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
           Conseil d'expert
        </h3>
        <p className="text-blue-50 font-medium leading-relaxed mb-6">
          Évitez l'Avenue des Cratères entre 17h00 et 18h30. Les données historiques prévoient un pic de congestion inhabituel.
        </p>
        <div className="flex items-center gap-2 text-xs font-black bg-blue-600/50 py-3 px-5 rounded-2xl w-fit">
           <Navigation size={14} />
           <span>Itinéraire bis via Rue des Cendres conseillé</span>
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col sm:flex-row gap-4 mb-20">
        <div className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all cursor-pointer">
          <div className="bg-white p-3.5 rounded-2xl text-green-500 shadow-sm transition-transform group-hover:scale-110">
             <History size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Historique complet</h4>
            <p className="text-xs font-bold text-slate-400 mt-0.5 group-hover:text-primary transition-colors">Exporter le rapport PDF</p>
          </div>
        </div>
        
        <button className="sm:w-auto w-full bg-slate-900 text-white px-8 py-4 rounded-[32px] font-black text-sm shadow-xl shadow-slate-200 hover:scale-105 transition-all">
           Archives
        </button>
      </div>
    </div>
  );
};

export default Stats;
