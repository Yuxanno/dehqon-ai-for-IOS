import { useNavigate, useLocation } from 'react-router-dom';
import { User, Bot } from 'lucide-react';
import clsx from 'clsx';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { path: '/profile', label: 'Профиль', icon: User },
  ];

  return (
    <header className="header-app border-b border-earth-200 bg-white hidden lg:block">
      <div className="header-content flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <button 
          onClick={() => navigate('/marketplace')}
          className="flex items-center gap-2 font-bold text-xl text-earth-900 hover:text-primary-600 transition-colors"
        >
          <span className="text-2xl">🌾</span>
          <span>Dehqonjon</span>
        </button>

        {/* Desktop Navigation */}
        <nav className="top-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                isActive(item.path)
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-earth-600 hover:text-earth-900 hover:bg-earth-100'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}

          {/* AI Button - Desktop */}
          <button
            onClick={() => navigate('/ai')}
            className={clsx(
              'ai-button-desktop',
              isActive('/ai') && 'ring-2 ring-primary-300 ring-offset-2'
            )}
          >
            <Bot className="w-5 h-5" />
            <span>Dehqonjon AI</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
