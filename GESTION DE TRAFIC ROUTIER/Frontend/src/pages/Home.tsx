import React, { useState, useEffect } from 'react';
import { Search, Mic, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface TraficData {
  niveau: 'FLUIDE' | 'RALENTI' | 'SATURE' | 'BLOQUE';
  temps_retard_min: number;
}

interface RouteData {
  id: number;
  nom: string;
  distance_km: number;
  trafic: TraficData | null;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrafic = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/trafic/`);
      if (!response.ok) throw new Error('Erreur lors de la récupération du trafic');
      const data = await response.json();
      setRoutes(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafic();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTrafic, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (niveau: string | undefined) => {
    switch (niveau) {
      case 'FLUIDE': return 'text-green-600';
      case 'RALENTI': return 'text-yellow-600';
      case 'SATURE': return 'text-orange-600';
      case 'BLOQUE': return 'text-red-600';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (niveau: string | undefined) => {
    switch (niveau) {
      case 'FLUIDE': return 'bg-green-500';
      case 'RALENTI': return 'bg-yellow-500';
      case 'SATURE': return 'bg-orange-500';
      case 'BLOQUE': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const getStatusText = (niveau: string | undefined) => {
    if (!niveau) return 'DONNÉES INDISP.';
    return niveau;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-gradient-to-br from-[#1b5683] via-[#7db9b6] to-[#e0ebd3]">
      {/* Search Bar Segment */}
      <div className="p-4 px-5 z-20">
        <div className="bg-white rounded-full flex items-center px-5 py-3 shadow-[0_4px_15px_rgba(0,0,0,0.1)] mb-4">
          <Search size={20} className="text-text-muted" />
          <input type="text" placeholder="Rechercher une destination.." className="flex-1 border-none outline-none text-[15px] mx-3 text-text-main bg-transparent" />
          <Mic size={20} className="text-primary" />
        </div>

        {/* Alert Segment */}
        <div className="bg-alert-bg rounded-xl p-4 flex items-center shadow-[0_8px_20px_rgba(185,38,34,0.3)] relative">
          <div className="mr-3">
            <AlertTriangle size={24} color="white" />
          </div>
          <div className="flex flex-col flex-1 text-white">
            <span className="text-[11px] font-bold tracking-[0.5px] mb-1">ALERTE MAJEURE</span>
            <span className="text-sm font-medium leading-tight pr-5">Consultez les routes à proximité pour les détails</span>
          </div>
          <button className="absolute top-3 right-3 bg-none border-none text-white text-xl cursor-pointer opacity-80 hover:opacity-100">×</button>
        </div>
      </div>

      {/* Bottom Sheet wrapper */}
      <div className="absolute bottom-0 left-0 w-full bg-background-bg rounded-t-[24px] p-5 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col z-20 h-[calc(100%-180px)] md:h-[60%] lg:max-w-xl lg:left-1/2 lg:-translate-x-1/2">
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold mb-1 text-secondary">Routes à proximité</h3>
            <p className="text-[13px] text-text-muted">Données mises à jour en temps réel</p>
          </div>
          <button onClick={fetchTrafic} className="bg-white p-2 rounded-lg border border-gray-200">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && routes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-muted">Chargement du trafic...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle size={32} className="text-status-bloque" />
            <p className="text-status-bloque font-medium">{error}</p>
            <button onClick={fetchTrafic} className="px-6 py-2 bg-gray-200 rounded-lg text-sm font-bold">Réessayer</button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 mb-5">
            {routes.map(route => (
              <div key={route.id} className="bg-input-bg rounded-2xl p-4 flex items-center gap-4">
                <div
                  className={`w-1.5 h-9 rounded-full ${getStatusBg(route.trafic?.niveau)}`}
                ></div>
                <div className="flex-1 flex flex-col gap-1">
                  <h4 className="text-[15px] font-bold text-secondary">{route.nom}</h4>
                  <span
                    className={`text-[11px] font-bold tracking-[0.5px] ${getStatusColor(route.trafic?.niveau)}`}
                  >
                    {getStatusText(route.trafic?.niveau)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 text-secondary">
                  <span className="font-bold text-[15px]">
                    {route.trafic?.temps_retard_min ? `+${route.trafic.temps_retard_min} min` : 'Fluide'}
                  </span>
                  <span className="text-[11px] text-text-muted">{route.distance_km} km</span>
                </div>
              </div>
            ))}

            {routes.length === 0 && !loading && (
              <p className="text-center text-text-muted py-10 italic">Aucune route enregistrée pour le moment.</p>
            )}
          </div>
        )}

        <button
          className="flex items-center justify-center gap-2 w-full bg-primary text-white py-4 rounded-full text-base font-semibold transition-colors hover:bg-primary-dark"
          onClick={() => navigate('/report')}
        >
          <AlertCircle size={20} />
          Signaler un incident
        </button>
      </div>
    </div>
  );
};

export default Home;
