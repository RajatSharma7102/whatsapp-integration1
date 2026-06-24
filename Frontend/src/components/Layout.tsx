import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LogOut, Users, Settings } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Leads', path: '/', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">MB</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-lg tracking-tight">Bugs Desk 360</span>
                <span className="ml-2 text-xs text-slate-400 font-medium hidden sm:inline">CRM</span>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">
              Welcome back, <span className="font-medium text-slate-700">{user?.name || 'User'}</span>
            </span>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <button onClick={logout} className="ml-2 p-2 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
