const tabs = [
  { id: 'map',    label: 'Route Map',      icon: '🗺️' },
  { id: 'report', label: 'Report Waste',   icon: '📝' },
  { id: 'ewaste', label: 'E-waste Finder', icon: '♻️' },
];

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-soft transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#147a59] flex items-center justify-center shadow-md shadow-[#1D9E75]/20">
              <span className="text-white text-sm font-bold font-display">W</span>
            </div>
            <span className="text-[19px] font-bold text-text tracking-tight font-display">
              Waste<span className="text-[#1D9E75]">Wise</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50/50 p-1 rounded-xl backdrop-blur-sm border border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer overflow-hidden
                  ${activeTab === tab.id
                    ? 'text-[#1D9E75] bg-white shadow-sm ring-1 ring-gray-900/5'
                    : 'text-text-muted hover:text-text hover:bg-gray-100/50'
                  }`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span className="hidden sm:inline text-base">{tab.icon}</span>
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#1D9E75]/80 to-[#1D9E75] rounded-t-full shadow-[0_-2px_8px_rgba(29,158,117,0.4)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
