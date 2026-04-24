import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, AlertTriangle, BarChart3, User } from 'lucide-react';
import classNames from 'classnames';

const BottomNav: React.FC = () => {
  const navItems = [
    { id: 'map', icon: Map, label: 'MAP', path: '/map' },
    { id: 'report', icon: AlertTriangle, label: 'REPORT', path: '/report' },
    { id: 'stats', icon: BarChart3, label: 'STATS', path: '/stats' },
    { id: 'profile', icon: User, label: 'PROFILE', path: '/profile' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 w-full flex justify-around items-center bg-white py-3 pb-[max(12px,env(safe-area-inset-bottom))] rounded-t-[20px] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              classNames('flex flex-col items-center justify-center no-underline transition-colors w-[60px] gap-1', 
                isActive ? 'text-primary' : 'text-text-muted'
              )
            }
          >
            <div className="flex items-center justify-center">
              <Icon size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold tracking-[0.5px] uppercase">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
