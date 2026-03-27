import BlurText from './BlurText';

const tabs = [
  { id: 'map',    label: 'Route Map',      icon: '🗺️' },
  { id: 'report', label: 'Report Waste',   icon: '📝' },
  { id: 'ewaste', label: 'E-waste Finder', icon: '♻️' },
];

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-[95%] max-w-[800px] liquid-glass-strong rounded-full transition-all duration-500 pointer-events-auto font-sans">
      <div className="px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0 cursor-pointer group">
            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center overflow-hidden shadow-[0_4px_16px_rgba(29,158,117,0.3)] ring-[1.5px] ring-white/10 bg-black/50 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img src="/logo.png" alt="WasteWise Logo" className="w-full h-full object-cover" />
            </div>
            <span className="hidden sm:inline text-[24px] tracking-tight font-display italic drop-shadow-sm text-white transition-colors group-hover:text-[#1D9E75]">
              <BlurText text="WasteWise" delay={0.1} />
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full shadow-inner ring-1 ring-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-300 cursor-pointer overflow-hidden
                  ${activeTab === tab.id
                    ? 'text-white bg-white/10 shadow-lg ring-1 ring-white/20 scale-[1.02]'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span className="hidden sm:inline text-lg drop-shadow-sm">{tab.icon}</span>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
