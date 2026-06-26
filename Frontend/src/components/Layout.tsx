import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCompanyStore } from '@/store/companyStore';
import { useState } from 'react';
import { LogOut, Users, Settings, Bot, UserCheck } from 'lucide-react';

// Global Mode Confirmation Modal
function GlobalModeModal({
  isOpen,
  targetMode,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  targetMode: 'BOT_ACTIVE' | 'HUMAN_ASSIGNED';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  const switchingToHuman = targetMode === 'HUMAN_ASSIGNED';
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 ${switchingToHuman ? 'bg-amber-50' : 'bg-violet-50'}`}>
          {switchingToHuman
            ? <UserCheck className="h-6 w-6 text-amber-500" />
            : <Bot className="h-6 w-6 text-violet-500" />}
        </div>
        <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
          Switch All to {switchingToHuman ? 'Human Mode' : 'Bot Mode'}?
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
          {switchingToHuman
            ? 'All active conversations will be switched to Human mode. The bot will stop responding to everyone.'
            : 'All active conversations will be switched to Bot mode. The bot will resume responding to everyone.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-colors shadow-sm ${switchingToHuman ? 'bg-amber-500 hover:bg-amber-600' : 'bg-violet-500 hover:bg-violet-600'}`}
          >
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

  const navItems = [
    { name: 'Leads', path: '/', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <GlobalModeModal
        isOpen={showModal}
        targetMode={targetMode}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />

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
            {/* Global Bot/Human Toggle */}
            <button
              id="global-bot-toggle"
              onClick={handleToggleClick}
              disabled={loading}
              title={`All conversations: ${isHuman ? 'Human Mode' : 'Bot Mode'} — Click to switch all`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-60 ${
                isHuman
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'
              }`}
            >
              {isHuman
                ? <><UserCheck size={13} />All: Human</>
                : <><Bot size={13} />All: Bot</>}
              {/* Toggle pill */}
              <span className={`relative inline-flex h-4 w-7 rounded-full transition-colors duration-300 ${isHuman ? 'bg-amber-400' : 'bg-violet-400'}`}>
                <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform duration-300 ${isHuman ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </span>
            </button>

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
