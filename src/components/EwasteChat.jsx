import { useState, useRef, useEffect } from 'react';
import { Bot, Recycle, MapPin, Package, Clock, Lightbulb, Leaf } from 'lucide-react';

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

const ITEM_INFO = {
  laptops:       { tip: 'Remove and separately recycle the battery before drop-off. Wipe data with a factory reset.', impact: '🌍 One laptop contains up to 60 toxic metals including lead & mercury — recycling prevents soil contamination.' },
  phones:        { tip: 'Back up your data, perform a factory reset, and remove the SIM card before drop-off.', impact: '🌍 A single phone can contain gold, silver & cobalt. Recycling 1 million phones recovers ~16 kg of gold.' },
  tablets:       { tip: 'Reset to factory settings and remove any cases or accessories before recycling.', impact: '🌍 Tablets contain rare earth elements — mining them destroys ecosystems. Recycling reduces that demand.' },
  tvs:           { tip: 'Do not break the screen — CRT TVs contain lead-laced glass. Transport upright.', impact: '🌍 Old CRT TVs contain 1–4 kg of lead each. Improper disposal contaminates groundwater for decades.' },
  monitors:      { tip: 'LCD monitors contain mercury backlights — handle with care and never landfill.', impact: '🌍 Mercury from one monitor can contaminate 100,000 litres of water if improperly disposed.' },
  batteries:     { tip: 'Never throw in regular bins. Store separately in a cool, dry place before drop-off.', impact: '🌍 Lithium batteries can cause landfill fires. Proper recycling recovers lithium, cobalt & nickel.' },
  printers:      { tip: 'Remove ink cartridges (recycle separately) and clear any paper jams before drop-off.', impact: '🌍 Printer cartridges take 450–1000 years to decompose. Recycling saves ~3.5 oz of oil per cartridge.' },
  chargers:      { tip: 'Coil cables neatly and include all adapters. Most centers accept chargers for free.', impact: '🌍 Cable insulation contains PVC — burning it releases dioxins. Always recycle, never incinerate.' },
  refrigerators: { tip: 'Ensure certified e-waste handlers retrieve refrigerants — DIY removal is illegal & dangerous.', impact: '🌍 Old fridges use HFC refrigerants with a global warming potential 1,430× worse than CO₂.' },
  wearables:     { tip: 'Remove silicone bands (general waste) and recycle only the electronic module.', impact: '🌍 Smartwatch batteries are non-removable — the entire unit must be recycled to prevent leakage.' },
  desktops:      { tip: 'Separate hard drives containing personal data and destroy or wipe them before drop-off.', impact: '🌍 A desktop PC contains ~2 kg of plastic and multiple heavy metals including cadmium and beryllium.' },
  screens:       { tip: 'Transport in original packaging if possible to prevent screen breakage.', impact: '🌍 Broken screens release microplastics and rare-earth phosphors that persist in the environment.' },
  projectors:    { tip: 'Projector lamps contain mercury — always recycle through certified handlers.', impact: '🌍 Projector lamps are hazardous waste. Certified recyclers safely neutralize the mercury content.' },
};

function getItemInfo(query) {
  const lower = query.toLowerCase();
  for (const [keyword, tags] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      const tag = tags[0];
      if (ITEM_INFO[tag]) return ITEM_INFO[tag];
    }
  }
  return null;
}

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
      const info = getItemInfo(q);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: results.length > 0
            ? `Found ${results.length} center${results.length > 1 ? 's' : ''} that accept "${q}":`
            : `No specific match for "${q}". Here are all available centers:`,
          centers: results.length > 0 ? results : CENTERS,
          info,
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
    <div className="w-full h-full bg-[#0a0f0a] flex flex-col relative overflow-hidden pt-36">
      {/* ── Background Thematic Elements ── */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-80">
        <img src="/wastewise-bg-topo.png" alt="" className="w-full h-full object-cover saturate-[1.1] opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] mix-blend-overlay opacity-30" />
      </div>

      <div className="px-6 py-5 liquid-glass-strong border-b border-white/10 shadow-sm z-10 w-full">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#147a59] flex items-center justify-center shadow-lg shadow-[#1D9E75]/20 shrink-0">
            <Recycle size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-display tracking-tight">E-Waste Finder</h1>
            <p className="text-[13px] text-white/50 mt-0.5 font-medium">Search for nearby e-waste recycling centers in Mumbai</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center mr-3 mt-1 shrink-0">
                  <Bot size={16} className="text-[#1D9E75]" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-[20px] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all
                ${msg.role === 'user'
                  ? 'bg-gradient-to-br from-[#1D9E75] to-[#147a59] text-white rounded-br-sm shadow-md'
                  : 'liquid-glass text-white rounded-tl-sm'
                }`}>
                <p className={msg.role === 'user' ? 'text-white' : 'text-white/90 font-medium'}>{msg.text}</p>

                {msg.centers && (
                  <div className="mt-4 space-y-3">
                    {msg.centers.map((c) => (
                      <div key={c.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-white text-[15px] font-display">{c.name}</p>
                            <p className="text-xs text-white/50 mt-1.5 font-medium flex items-center gap-1.5">
                              <MapPin size={12} className="text-[#1D9E75]" /> <span>{c.area}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => onViewMap?.(c)}
                            className="text-[11px] bg-[#1D9E75]/20 text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors cursor-pointer"
                          >
                            View Map
                          </button>
                        </div>
                        <div className="mt-3 bg-white/5 rounded-xl p-2.5 shadow-sm border border-white/5">
                          <div className="text-[12px] text-white/70 font-medium flex items-start sm:items-center flex-wrap gap-1.5">
                            <span className="text-white/40 mr-1 flex items-center gap-1.5 shrink-0"><Package size={14} /> Accepts:</span>
                            {c.accepted.map(a => <span key={a} className="inline-block bg-white/10 px-2 py-0.5 rounded-md mb-1">{a}</span>)}
                          </div>
                          <div className="text-[12px] text-white/70 mt-2 font-medium flex items-center gap-1.5">
                            <Clock size={14} className="text-white/40" /> <span>{c.hours}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {msg.info && (
                  <div className="mt-4 space-y-2">
                    <div className="bg-blue-900/20 rounded-xl p-3 border border-blue-500/20 flex gap-3 items-start">
                      <Lightbulb size={16} className="text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">Disposal Tip</p>
                        <p className="text-xs text-blue-200 leading-relaxed">{msg.info.tip}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-900/20 rounded-xl p-3 border border-emerald-500/20 flex gap-3 items-start">
                      <Leaf size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Environmental Impact</p>
                        <p className="text-xs text-emerald-200 leading-relaxed">{msg.info.impact}</p>
                      </div>
                    </div>
                  </div>
                )}

                {msg.options && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {msg.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSend(opt)}
                        disabled={loading}
                        className="text-[13px] font-semibold bg-white/10 text-white/90 border border-white/20 hover:bg-[#1D9E75] hover:text-white px-3.5 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#1D9E75] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                <Bot size={16} className="text-[#1D9E75]" />
              </div>
              <div className="liquid-glass text-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
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

      <div className="px-4 py-5 liquid-glass-strong border-t border-white/10 z-10 w-full relative">
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
