import { useState, useRef, useEffect } from 'react';

const CENTERS = [
  { id: 1, name: 'EcoRecycle Hub',           area: 'Andheri West',   lat: 19.1365, lng: 72.8312, accepted: ['laptops', 'desktops', 'peripherals', 'printers'],                          hours: 'Mon–Sat 9 AM – 6 PM' },
  { id: 2, name: 'GreenTech Disposal',       area: 'Powai',          lat: 19.1190, lng: 72.9083, accepted: ['laptops', 'phones', 'tablets', 'batteries', 'tvs'],                         hours: 'Mon–Fri 10 AM – 5 PM' },
  { id: 3, name: 'MobileGreen Center',       area: 'Bandra West',    lat: 19.0544, lng: 72.8371, accepted: ['phones', 'tablets', 'wearables', 'chargers'],                               hours: 'Mon–Sat 10 AM – 8 PM' },
  { id: 4, name: 'Mumbai E-Waste Recyclers', area: 'Dadar',          lat: 19.0197, lng: 72.8432, accepted: ['laptops', 'phones', 'batteries', 'monitors'],                               hours: 'Mon–Sat 8 AM – 7 PM' },
  { id: 5, name: 'ScreenSafe Recyclers',     area: 'Goregaon East',  lat: 19.1632, lng: 72.8553, accepted: ['tvs', 'monitors', 'projectors', 'screens'],                                 hours: 'Tue–Sat 9 AM – 5 PM' },
  { id: 6, name: 'Clean Earth Recycling',    area: 'Thane West',     lat: 19.1970, lng: 72.9634, accepted: ['laptops', 'phones', 'tvs', 'refrigerators', 'batteries', 'printers'],       hours: 'Mon–Fri 8 AM – 4 PM' },
];

const KEYWORD_MAP = {
  laptop: ['laptops', 'desktops'], computer: ['laptops', 'desktops'], desktop: ['desktops'],
  phone: ['phones'], mobile: ['phones'], tablet: ['tablets'], ipad: ['tablets'],
  tv: ['tvs'], television: ['tvs'], monitor: ['monitors'], screen: ['screens', 'monitors'],
  battery: ['batteries'], printer: ['printers'], charger: ['chargers'],
  fridge: ['refrigerators'], refrigerator: ['refrigerators'],
  wearable: ['wearables'], watch: ['wearables'], projector: ['projectors'],
};

function findCenters(query) {
  const lower = query.toLowerCase();
  const matchTags = new Set();
  for (const [keyword, tags] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) tags.forEach((t) => matchTags.add(t));
  }
  if (matchTags.size === 0) return CENTERS;
  return CENTERS.filter((c) => c.accepted.some((a) => matchTags.has(a)));
}

export default function EwasteChat({ onViewMap }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! 👋 Tell me what e-waste item you want to dispose of and I\'ll find the nearest recycling centers in Mumbai.',
      centers: null,
      options: ['Laptop', 'Mobile Phone', 'TV / Monitor', 'Battery'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (overrideQuery) => {
    const q = typeof overrideQuery === 'string' ? overrideQuery : input.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: q, centers: null }]);
    if (typeof overrideQuery !== 'string') setInput('');
    setLoading(true);

    setTimeout(() => {
      const results = findCenters(q);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: results.length > 0
            ? `Found ${results.length} center${results.length > 1 ? 's' : ''} that accept "${q}":`
            : `No specific match for "${q}". Here are all available centers:`,
          centers: results.length > 0 ? results : CENTERS,
        },
      ]);
      setLoading(false);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-background via-white to-[#1D9E75]/5 flex flex-col relative overflow-hidden">
      <div className="px-6 py-5 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm z-10 w-full">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#147a59] flex items-center justify-center shadow-lg shadow-[#1D9E75]/20">
            <span className="text-2xl">♻️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text font-display tracking-tight">E-Waste Finder</h1>
            <p className="text-[13px] text-text-muted mt-0.5 font-medium">Search for nearby e-waste recycling centers in Mumbai</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mr-3 mt-1 shrink-0">
                  <span className="text-sm">🤖</span>
                </div>
              )}

              <div className={`max-w-[85%] rounded-[20px] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all
                ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-[#1D9E75] to-[#147a59] text-white rounded-br-sm shadow-md'
                  : 'bg-white/90 backdrop-blur-md border border-white/60 text-gray-800 rounded-tl-sm'
                }`}>
                <p className={msg.role === 'user' ? 'text-white' : 'text-gray-800 font-medium'}>{msg.text}</p>

                {msg.centers && (
                  <div className="mt-4 space-y-3">
                    {msg.centers.map((c) => (
                      <div key={c.id} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-gray-900 text-[15px] font-display">{c.name}</p>
                            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1">
                              📍 <span>{c.area}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => onViewMap?.(c)}
                            className="text-[11px] bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            View Map
                          </button>
                        </div>
                        <div className="mt-3 bg-white rounded-xl p-2.5 shadow-sm border border-gray-100">
                          <p className="text-[12px] text-gray-600 font-medium">
                            <span className="text-gray-400 mr-1">📦 Accepts:</span>
                            {c.accepted.map(a => <span key={a} className="inline-block bg-gray-100 px-2 py-0.5 rounded-md mr-1 mb-1">{a}</span>)}
                          </p>
                          <p className="text-[12px] text-gray-600 mt-1.5 font-medium flex items-center gap-1.5">
                            <span className="text-gray-400">🕐</span> {c.hours}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.options && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSend(opt)}
                        disabled={loading}
                        className="text-[13px] font-semibold bg-white/60 text-[#1D9E75] border border-[#1D9E75]/30 hover:bg-[#1D9E75] hover:text-white px-3.5 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mr-3 mt-1 shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div className="bg-white/90 backdrop-blur-md border border-white/60 text-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#1D9E75]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-[#1D9E75]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-[#1D9E75] rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} className="h-4" />
        </div>
      </div>

      <div className="px-4 py-5 bg-white/70 backdrop-blur-xl border-t border-white/50 z-10 w-full relative">
        <div className="max-w-2xl mx-auto flex items-center gap-3 relative">
          <input
            type="text"
            placeholder="Type your e-waste item here... (e.g. broken phone, CRT TV)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-sm text-[15px] font-medium text-text placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#1D9E75]/15 focus:border-[#1D9E75] shadow-sm transition-all duration-300 disabled:opacity-50 pr-16"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#147a59] text-white flex items-center justify-center hover:shadow-lg hover:-translate-y-0.5 shadow-md shadow-[#1D9E75]/30 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
