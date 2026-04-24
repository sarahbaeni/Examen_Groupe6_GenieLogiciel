import React, { useState, useEffect } from 'react';
import { ChevronDown, MapPin, Camera, ShieldCheck, Megaphone, AlertCircle, CheckCircle, Navigation, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

interface RouteOption {
  id: number;
  nom: string;
}

const Report: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [formData, setFormData] = useState({
    route_id: '',
    type_incident: 'ACCIDENT',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchingRoutes, setFetchingRoutes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/trafic/`);
        if (!response.ok) throw new Error('Erreur lors du chargement des routes');
        const data = await response.json();
        setRoutes(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, route_id: data[0].id.toString() }));
        }
      } catch (err: any) {
        setError("Impossible de charger les routes.");
      } finally {
        setFetchingRoutes(false);
      }
    };
    fetchRoutes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      setError("Vous devez être connecté pour signaler un incident.");
      setLoading(false);
      return;
    }

    const user = JSON.parse(userStr);

    try {
      const response = await fetch(`${API_BASE_URL}/incidents/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          route_id: parseInt(formData.route_id),
          type_incident: formData.type_incident,
          description: formData.description
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Erreur lors de l'envoi du rapport");
      }

      setSuccess(true);
      setTimeout(() => navigate('/map'), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100 animate-bounce">
          <CheckCircle size={48} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Rapport envoyé !</h1>
        <p className="text-slate-500 font-bold max-w-xs mx-auto mb-8">
          Merci pour votre contribution. Un agent de police va vérifier l'information immédiatement.
        </p>
        <button 
          className="bg-primary text-white py-4 px-10 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          onClick={() => navigate('/map')}
        >
          Retour à la carte
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6 sm:px-0">
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-primary px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm border border-blue-100">
          <Megaphone size={14} />
          <span>Report Center</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Signaler un incident</h1>
        <p className="text-slate-400 font-bold">Aidez la communauté en fournissant des mises à jour terrain.</p>
      </div>

      <form className="bg-white p-8 sm:p-10 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-100 space-y-8" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-start gap-3 animate-shake">
            <AlertCircle className="text-red-500 mt-1" size={20} />
            <div className="flex-1">
               <strong className="block text-red-800 text-sm font-black uppercase tracking-wider">Erreur de transmission</strong>
               <p className="text-red-600 text-[13px] font-bold mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Route Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <MapPin size={16} className="text-primary" />
            Localisation (Route)
          </label>
          <div className="relative group">
            <select 
              className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none appearance-none cursor-pointer transition-all" 
              name="route_id" 
              value={formData.route_id} 
              onChange={handleChange}
              required
              disabled={fetchingRoutes}
            >
              {fetchingRoutes ? (
                <option>Chargement des routes...</option>
              ) : routes.length > 0 ? (
                routes.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)
              ) : (
                <option>Aucune route disponible</option>
              )}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-primary transition-colors" size={20} />
          </div>
        </div>

        {/* Incident Type */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            <AlertCircle size={16} className="text-orange-500" />
            Nature de l'incident
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ACCIDENT', label: 'Accident', bg: 'hover:bg-red-50', border: 'border-red-200', active: 'bg-red-600 border-red-600 text-white shadow-red-100' },
              { id: 'PANNE', label: 'Panne', bg: 'hover:bg-orange-50', border: 'border-orange-200', active: 'bg-orange-500 border-orange-500 text-white shadow-orange-100' },
              { id: 'BLOCAGE', label: 'Blocage', bg: 'hover:bg-slate-50', border: 'border-slate-200', active: 'bg-slate-800 border-slate-800 text-white shadow-slate-200' },
              { id: 'METEO', label: 'Météo', bg: 'hover:bg-blue-50', border: 'border-blue-200', active: 'bg-blue-500 border-blue-500 text-white shadow-blue-100' },
              { id: 'AUTRE', label: 'Autre', bg: 'hover:bg-gray-50', border: 'border-gray-200', active: 'bg-gray-600 border-gray-600 text-white shadow-gray-200' },
            ].map(type => (
              <button
                key={type.id}
                type="button"
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all 
                  ${formData.type_incident === type.id ? `${type.active} shadow-lg scale-105` : `bg-white text-slate-400 ${type.border} ${type.bg}`}
                `}
                onClick={() => setFormData({...formData, type_incident: type.id})}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            Description détaillée
          </label>
          <textarea 
            className="w-full p-5 bg-slate-50 rounded-[24px] border-none font-medium text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none h-32 resize-none transition-all placeholder:text-slate-300" 
            name="description"
            placeholder="Ex: Poids lourd en travers de la route, deux voies bloquées..."
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>

        {/* Photo Upload Placeholder */}
        <div className="space-y-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
            Preuves & Photos
          </label>
          <div className="bg-slate-50 p-6 rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white hover:border-primary transition-all group">
             <div className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 group-hover:text-primary transition-colors">
                <Camera size={32} />
             </div>
             <span className="text-[13px] font-black text-slate-400 group-hover:text-slate-800">Prendre une photo du terrain</span>
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100" 
            disabled={loading || fetchingRoutes}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Envoi sécurisé...
              </>
            ) : (
              <>
                <Send size={20} />
                Envoyer le rapport
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center gap-4 mt-6">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <ShieldCheck className="text-green-500" size={16} />
                <span>Authentifié</span>
             </div>
             <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <Navigation className="text-primary" size={16} />
                <span>Temps Réel</span>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Report;
