import BlurText from './BlurText';
import { Map, FileEdit, Recycle, Shield, List, LogOut } from 'lucide-react';

const getTabs = (isAdmin) => {
  const base = [
    { id: 'map',    label: 'Route Map',      icon: <Map size={16} className="text-[#1D9E75]" /> },
    { id: 'report', label: 'Report Waste',   icon: <FileEdit size={16} className="text-[#1D9E75]" /> },
    { id: 'myReports', label: 'My Reports',  icon: <List size={16} className="text-[#1D9E75]" /> },
    { id: 'ewaste', label: 'E-waste Finder', icon: <Recycle size={16} className="text-[#1D9E75]" /> },
  ];
  if (isAdmin) {
    return [
      { id: 'admin', label: 'Admin Dashboard', icon: <Shield size={16} className="text-amber-500" /> },
      { id: 'map',   label: 'Route Map',       icon: <Map size={16} className="text-[#1D9E75]" /> }
    ];
  }
  return base;
};

export default function Navbar({ activeTab, onTabChange, isAdmin, user, onLogout }) {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[95%] max-w-[1100px] liquid-glass rounded-full transition-all duration-500 pointer-events-auto font-sans">
      <div className="px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={() => { if (!isAdmin) onTabChange('map'); }}
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center overflow-hidden shadow-[0_4px_16px_rgba(29,158,117,0.3)] ring-[1.5px] ring-white/10 bg-black/40 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img src="/logo.png" alt="WasteWise Logo" className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:inline text-[24px] tracking-tight font-display italic drop-shadow-sm text-white transition-colors group-hover:text-[#1D9E75]">
              <BlurText text="WasteWise" delay={0.1} />
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-full shadow-inner ring-1 ring-white/5 overflow-x-auto scrollbar-hide">
              {getTabs(isAdmin).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300 cursor-pointer overflow-hidden
                    ${activeTab === tab.id
                      ? (isAdmin && tab.id === 'admin' ? 'text-black bg-amber-500 shadow-lg scale-[1.02]' : 'text-white bg-white/10 shadow-lg ring-1 ring-white/20 scale-[1.02]')
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                    }`}
                >
                  <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                    <span className="hidden sm:inline text-lg drop-shadow-sm">{tab.icon}</span>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>

            {isAdmin && (
              <span className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 ring-1 ring-amber-500/40 text-amber-400 text-[13px] font-bold tracking-wider whitespace-nowrap">
                <Shield size={14} className="shrink-0" />
                BMC Context
              </span>
            )}

            {!isAdmin && user && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 mr-1 shrink-0">
                <div className="w-5 h-5 rounded-full bg-[#1D9E75]/20 flex items-center justify-center text-[#1D9E75] text-[10px] uppercase font-bold shrink-0">
                  {user.email.charAt(0)}
                </div>
                <span className="text-[11px] text-white/50 truncate max-w-[140px]">{user.email}</span>
              </div>
            )}

            {!isAdmin && user && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-400/10 ring-1 ring-white/10 hover:ring-red-400/30 transition-all duration-300"
              >
                <LogOut size={13} />
              </button>
            )}

            {isAdmin && (
              <button
                onClick={onLogout}
                title="Exit Admin Panel"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-full text-[12px] font-bold tracking-wider transition-all duration-300 cursor-pointer ring-1 whitespace-nowrap bg-amber-500/20 ring-amber-500/50 text-amber-300 hover:bg-amber-500/30 ml-2"
              >
                <LogOut size={13} />
                Exit
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
