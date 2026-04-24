import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Map, BellRing, Sparkles, Navigation, Shield } from 'lucide-react';

const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40"></div>

      <div className="relative z-10 text-center mb-16 animate-fadeIn">
        <div className="w-24 h-24 bg-primary text-white p-5 rounded-[32px] shadow-2xl shadow-primary/30 mx-auto mb-8 animate-bounce transition-transform hover:scale-110 cursor-pointer">
           <Shield size={56} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">VolcanWay</h1>
        <div className="flex items-center justify-center gap-2">
           <div className="h-[2px] w-8 bg-primary rounded-full"></div>
           <p className="text-primary font-black uppercase tracking-[0.2em] text-xs">L'itinéraire intelligent</p>
           <div className="h-[2px] w-8 bg-primary rounded-full"></div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-6 mb-16 relative z-10 animate-slideUp">
        {[
          { 
            icon: Map, 
            title: 'Cartographie Temps Réel', 
            desc: "Visualisez l'état du trafic et évitez les bouchons stratégiquement.",
            color: 'bg-blue-50 text-primary'
          },
          { 
            icon: BellRing, 
            title: 'Alertes & Incidents', 
            desc: 'Signalez et recevez des notifications d\'accidents instantanées.',
            color: 'bg-orange-50 text-orange-600'
          },
          { 
            icon: ShieldCheck, 
            title: 'Trajets Sécurisés', 
            desc: 'Arrivez à destination en toute sérénité avec nos itinéraires vérifiés.',
            color: 'bg-green-50 text-green-600'
          }
        ].map((f, i) => (
          <div key={i} className="group p-5 bg-white border border-slate-100 rounded-[28px] flex items-center gap-5 transition-all hover:bg-slate-50 hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1">
            <div className={`p-4 rounded-2xl ${f.color} transition-transform group-hover:scale-110 shadow-sm font-bold`}>
              <f.icon size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-xs font-bold text-slate-400 group-hover:text-slate-500 leading-relaxed mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
        <button 
          className="w-full flex items-center justify-center gap-3 bg-primary text-white py-6 rounded-[28px] font-black text-lg shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group"
          onClick={() => navigate('/login')}
        >
          Commencer l'aventure
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
        <p className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-6">Propulsé par les autorités civiles</p>
      </div>
    </div>
  );
};

export default Welcome;
