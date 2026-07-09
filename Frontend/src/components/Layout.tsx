import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';
import { useState } from 'react';
import {
  LogOut, Users, Settings, Bot, UserCheck,
  LayoutDashboard, ChevronDown, Bell, Search, Menu, X
} from 'lucide-react';

// Global Mode Confirmation Modal
function GlobalModeModal({
  isOpen, targetMode, onConfirm, onCancel,
}: {
  isOpen: boolean;
  targetMode: 'BOT_ACTIVE' | 'HUMAN_ASSIGNED';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  const switchingToHuman = targetMode === 'HUMAN_ASSIGNED';
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${switchingToHuman ? 'bg-amber-50' : 'bg-violet-50'}`}>
          {switchingToHuman
            ? <UserCheck className="h-6 w-6 text-amber-500" />
            : <Bot className="h-6 w-6 text-violet-500" />}
        </div>
        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
          Switch All to {switchingToHuman ? 'Human Mode' : 'Bot Mode'}?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          {switchingToHuman
            ? 'All active conversations will be switched to Human mode. The bot will stop responding.'
            : 'All active conversations will be switched to Bot mode. The bot will resume responding.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium shadow-sm ${switchingToHuman ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-500 hover:bg-violet-600'}`}>
            Yes, Switch All
          </button>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  const { user, logout } = useAuthStore();
  const { globalBotMode, setGlobalBotMode, loading } = useCompanyStore();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [targetMode, setTargetMode] = useState<'BOT_ACTIVE' | 'HUMAN_ASSIGNED'>('BOT_ACTIVE');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: 'Queries', path: '/', icon: Users, badge: null },
    { name: 'Settings', path: '/settings', icon: Settings, badge: null },
  ];

  const handleToggleClick = () => {
    const next = globalBotMode === 'BOT_ACTIVE' ? 'HUMAN_ASSIGNED' : 'BOT_ACTIVE';
    setTargetMode(next);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    setShowModal(false);
    await setGlobalBotMode(targetMode);
  };

  const isHuman = globalBotMode === 'HUMAN_ASSIGNED';

  return (
    <div className="h-screen w-full bg-[#F0F2F8] flex overflow-hidden">
      <GlobalModeModal
        isOpen={showModal}
        targetMode={targetMode}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />

      {/* ── Sidebar ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed top-0 left-0 h-full w-60 z-40 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `} style={{ background: 'linear-gradient(180deg, #1a1f3c 0%, #1e2347 60%, #1a1f3c 100%)' }}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg bg-white overflow-hidden shrink-0">
              <img src="/logo.jpeg" alt="Logo" className="h-full w-full object-contain p-0.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">BugsDesk</p>
              <p className="text-white/40 text-[9px] font-medium tracking-wide uppercase truncate">Powered by Marketing Bugs</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/40 hover:text-white lg:hidden">
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Main Menu</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #7c3aed33, #4f46e533)', border: '1px solid #7c3aed44' }} />
                  )}
                  <span className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? 'text-violet-300' : 'text-white/40 group-hover:text-white/70'}`}>
                    <item.icon size={16} />
                  </span>
                  <span className="relative z-10">{item.name}</span>
                  {isActive && <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Bot Toggle */}
          <div className="px-4 py-4 border-t border-white/10 shrink-0">
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mb-3">Response Mode</p>
            <button
              id="global-bot-toggle"
              onClick={handleToggleClick}
              disabled={loading}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isHuman
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25'
              }`}
            >
              <div className="flex items-center gap-2">
                {isHuman ? <UserCheck size={14} /> : <Bot size={14} />}
                {isHuman ? 'Human Mode' : 'Bot Mode'}
              </div>
              <span className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${isHuman ? 'bg-amber-400' : 'bg-violet-500'}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${isHuman ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </span>
            </button>
          </div>

          {/* User Footer */}
          <div className="px-4 py-4 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user?.name || 'User'}</p>
                <p className="text-white/40 text-[10px] truncate">{user?.email || ''}</p>
              </div>
              <button onClick={logout} className="text-white/30 hover:text-red-400 transition-colors p-1" title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>
      </>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm shrink-0">
          <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Mobile menu btn */}
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800 p-1">
              <Menu size={20} />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-sm hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Search size={15} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search queries..."
                className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
              />
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 ml-auto">
              <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell size={18} />
              </button>
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
