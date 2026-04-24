import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    mot_de_passe: '',
    confirm_mot_de_passe: '',
    role: 'STANDARD' // Rôle par défaut pour les inscriptions publiques
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (formData.mot_de_passe !== formData.confirm_mot_de_passe) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      // Create a payload without the confirmation password
      const payload = { ...formData };
      delete (payload as any).confirm_mot_de_passe;

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erreur lors de l\'inscription');
      }

      // Auto-connecter l'utilisateur après inscription
      sessionStorage.setItem('user', JSON.stringify(data));
      
      setSuccess('Compte créé avec succès !');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-bg px-6 py-10 md:justify-center md:items-center">
      <div className="w-full md:max-w-md">
        <div className="relative mb-6">
          <button className="absolute top-0 left-0 p-2 text-text-main hover:bg-white rounded-lg transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col items-center mt-7">
            <div className="bg-white h-14 w-14 rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary-color)">
                <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z" />
                <path d="M12 8l-2 4h4l-2-4z" fill="#fff"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">Créer un compte</h2>
            <p className="text-text-muted text-sm text-center">Rejoignez la communauté VolcanWay</p>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex flex-col gap-4 mb-8 text-secondary">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-100">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-100">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-text-main uppercase tracking-wider">Prénom</label>
                <div className="bg-input-bg rounded-xl flex items-center px-4">
                  <User size={18} className="text-text-muted mr-3" />
                  <input 
                    type="text" 
                    className="bg-transparent border-none py-3.5 text-[15px] w-full focus:outline-none" 
                    placeholder="John" 
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-text-main uppercase tracking-wider">Nom</label>
                <div className="bg-input-bg rounded-xl flex items-center px-4">
                  <input 
                    type="text" 
                    className="bg-transparent border-none py-3.5 text-[15px] w-full focus:outline-none" 
                    placeholder="Doe" 
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-main uppercase tracking-wider">E-mail</label>
              <div className="bg-input-bg rounded-xl flex items-center px-4">
                <Mail size={18} className="text-text-muted mr-3" />
                <input 
                  type="email" 
                  className="bg-transparent border-none py-3.5 text-[15px] w-full focus:outline-none" 
                  placeholder="votre@email.com" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-main uppercase tracking-wider">Mot de passe</label>
              <div className="bg-input-bg rounded-xl flex items-center px-4">
                <Lock size={18} className="text-text-muted mr-3" />
                <input 
                  type="password" 
                  className="bg-transparent border-none py-3.5 text-[15px] w-full focus:outline-none" 
                  placeholder="********" 
                  name="mot_de_passe"
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-text-main uppercase tracking-wider">Confirmer le mot de passe</label>
              <div className="bg-input-bg rounded-xl flex items-center px-4">
                <Lock size={18} className="text-text-muted mr-3" />
                <input 
                  type="password" 
                  className="bg-transparent border-none py-3.5 text-[15px] w-full focus:outline-none" 
                  placeholder="********" 
                  name="confirm_mot_de_passe"
                  value={formData.confirm_mot_de_passe}
                  onChange={handleChange}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-3 bg-primary text-white py-3.5 rounded-full text-base font-semibold hover:bg-primary-dark transition-colors disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Création...' : "S'inscrire"}
            </button>
          </form>

          <div className="text-center mt-4 text-sm">
            <span className="text-text-muted">Déjà un compte ?</span>
            <button className="text-primary font-bold ml-2" onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
