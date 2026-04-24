import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mot_de_passe: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Erreur de connexion');
      }

      // Stocker les infos utilisateur
      sessionStorage.setItem('user', JSON.stringify(data));

      // Rediriger selon le rôle
      if (data.role === 'ADMIN') {
        navigate('/admin');
      } else if (data.role === 'POLICE') {
        navigate('/police');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col px-6 py-10 min-h-screen bg-background-bg md:justify-center md:items-center">
      <div className="md:w-full md:max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="bg-white w-20 h-20 rounded-2xl flex justify-center items-center mb-6 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
             {/* Volcano Logo */}
             <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--primary-color)">
               <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z" />
               <path d="M12 8l-2 4h4l-2-4z" fill="#fff"/>
             </svg>
          </div>
          <h1 className="text-3xl font-bold leading-tight mb-3 text-secondary">Bienvenue sur<br />VolcanWay</h1>
          <p className="text-text-muted text-[15px] leading-relaxed">Gérez et consultez le trafic des<br />Volcans en temps réel</p>
        </div>

        <form className="bg-white rounded-[20px] p-6 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)] mb-10" onSubmit={handleLogin}>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-4 border border-red-100">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4">
            <label className="text-[12px] font-bold text-text-main uppercase tracking-wider">ADRESSE E-MAIL</label>
            <div className="bg-input-bg rounded-xl flex items-center px-4">
              <Mail className="text-text-muted mr-3" size={20} />
              <input 
                type="email" 
                className="bg-transparent border-none py-3.5 text-[15px] w-full text-text-main focus:outline-none" 
                placeholder="nom@exemple.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            <label className="text-[12px] font-bold text-text-main uppercase tracking-wider">MOT DE PASSE</label>
            <div className="bg-input-bg rounded-xl flex items-center px-4">
              <Lock className="text-text-muted mr-3" size={20} />
              <input 
                type="password" 
                className="bg-transparent border-none py-3.5 text-[15px] w-full text-text-main focus:outline-none" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="text-right mb-6">
            <a href="#" className="text-primary text-[13px] font-bold">Mot de passe oublié ?</a>
          </div>

          <button 
            type="submit" 
            className="w-full bg-primary text-white py-3.5 rounded-full text-base font-semibold transition-colors hover:bg-primary-dark disabled:opacity-70 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className="text-center mt-4 text-sm">
            <span className="text-text-muted">Pas encore de compte ?</span>
            <button 
              type="button"
              className="text-primary font-bold ml-2 cursor-pointer" 
              onClick={() => navigate('/register')}
            >
              S'inscrire
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-text-muted mt-auto pt-6 md:mt-0">
          © 2024 VolcanWay Smart City Systems
        </div>
      </div>
    </div>
  );
};

export default Login;
