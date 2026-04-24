import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Bell, LogOut } from 'lucide-react';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Routes where the header/nav should be hidden
  const hideChrome = [
    '/login', 
    '/welcome', 
    '/', 
    '/register', 
    '/admin', 
    '/police',
    '/dashboard'
  ].includes(location.pathname);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background-bg overflow-hidden relative">
      {!hideChrome && (
        <header className="flex justify-between items-center px-5 py-4 bg-background-bg z-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 flex items-center justify-center">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--primary-color)">
                 <path d="M12 2L2 22h20L12 2zm0 4l6 12H6l6-12z" />
                 <path d="M12 8l-2 4h4l-2-4z" fill="#fff"/>
               </svg>
             </div>
             <h2 className="text-xl font-bold tracking-tight text-secondary">VolcanWay</h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-secondary hover:bg-white transition-colors">
              <Bell size={20} />
            </button>
            <button 
              className="p-2 rounded-lg text-status-bloque hover:bg-white transition-colors" 
              onClick={handleLogout} 
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto no-scrollbar ${hideChrome ? 'pb-0' : 'pb-20'}`}>
        <Outlet />
      </main>

      {!hideChrome && <BottomNav />}
    </div>
  );
};

export default Layout;
