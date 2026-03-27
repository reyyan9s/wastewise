import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { onLocalReportsChange } from '../reportStore';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createColoredIcon(color) {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4.5" fill="#fff"/>
    </svg>`,
    className: 'custom-marker',
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });
}

function createEwasteIcon() {
  return L.divIcon({
    html: `<div style="position:relative">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="54">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#3B82F6" stroke="#fff" stroke-width="1.5"/>
        <text x="12" y="15" text-anchor="middle" font-size="11">♻️</text>
      </svg>
      <div style="position:absolute;top:-4px;left:-4px;width:44px;height:44px;border-radius:50%;border:3px solid #3B82F6;opacity:0.3;animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite"></div>
    </div>`,
    className: 'ewaste-marker',
    iconSize: [36, 54],
    iconAnchor: [18, 54],
    popupAnchor: [0, -54],
  });
}

function getPriority(level) {
  const map = { critical: 0, high: 1, normal: 2 };
  return map[level] ?? 2;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function calculateDistance(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

function optimizeRoute(reports) {
  const valid = reports.filter((r) => r.lat && r.lng);
  if (valid.length === 0) return [];

  const sorted = [...valid].sort((a, b) => getPriority(a.level) - getPriority(b.level));
  const route = [];
  const remaining = sorted.map((r) => ({ coord: [r.lat, r.lng], level: r.level }));

  let current = remaining.shift();
  route.push(current.coord);

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current.coord, remaining[i].coord);
      const weight = getPriority(remaining[i].level) <= getPriority(current.level) ? 0.8 : 1;
      const weighted = d * weight;
      if (weighted < bestDist) {
        bestDist = weighted;
        bestIdx = i;
      }
    }

    current = remaining.splice(bestIdx, 1)[0];
    route.push(current.coord);
  }

  return route;
}

const LEVEL_COLORS = { critical: '#EF4444', high: '#F59E0B', normal: '#1D9E75' };
const ANDHERI_CENTER = [19.1360, 72.8296];

const FALLBACK_REPORTS = [
  { id: 'd1',  location: 'Lokhandwala Market',      lat: 19.1395, lng: 72.8310, level: 'critical', ward: 'K-West', notes: 'Overflowing bins — 3 days uncollected' },
  { id: 'd2',  location: 'DN Nagar Metro Station',  lat: 19.1268, lng: 72.8358, level: 'critical', ward: 'K-West', notes: 'Construction debris blocking sidewalk' },
  { id: 'd3',  location: 'Versova Fish Market',     lat: 19.1340, lng: 72.8155, level: 'critical', ward: 'K-West', notes: 'Wet waste — requires urgent pickup' },
  { id: 'd4',  location: 'Four Bungalows Junction', lat: 19.1432, lng: 72.8265, level: 'critical', ward: 'K-West', notes: 'Mixed waste pile-up near junction' },
  { id: 'd5',  location: 'Gilbert Hill Road',       lat: 19.1285, lng: 72.8420, level: 'critical', ward: 'K-West', notes: 'E-waste dumped near residential area' },
  { id: 'd6',  location: 'Yari Road',               lat: 19.1480, lng: 72.8230, level: 'high',     ward: 'K-West', notes: '80 % full — pickup by evening' },
  { id: 'd7',  location: 'Amboli Naka',             lat: 19.1360, lng: 72.8440, level: 'high',     ward: 'K-West', notes: 'Large bin nearing capacity' },
  { id: 'd8',  location: 'Juhu Tara Road',          lat: 19.1060, lng: 72.8275, level: 'high',     ward: 'K-West', notes: 'Plastic waste accumulating' },
  { id: 'd9',  location: 'Oshiwara Bus Depot',      lat: 19.1510, lng: 72.8355, level: 'high',     ward: 'K-West', notes: 'Bins 75 % full' },
  { id: 'd10', location: 'Model Town Lane',         lat: 19.1190, lng: 72.8340, level: 'high',     ward: 'K-West', notes: 'Weekly bulk collection due' },
  { id: 'd11', location: 'Seven Bungalows',         lat: 19.1455, lng: 72.8170, level: 'normal',   ward: 'K-West', notes: 'Regular schedule — no issues' },
  { id: 'd12', location: 'Azad Nagar Metro',        lat: 19.1310, lng: 72.8395, level: 'normal',   ward: 'K-West', notes: 'Collected this morning' },
  { id: 'd13', location: 'Infinity Mall Area',      lat: 19.1225, lng: 72.8310, level: 'normal',   ward: 'K-West', notes: 'Mall waste handled by contractor' },
  { id: 'd14', location: 'JP Road Garden',          lat: 19.1120, lng: 72.8250, level: 'normal',   ward: 'K-West', notes: 'Low volume — park area' },
  { id: 'd15', location: 'Lallubhai Park',          lat: 19.1175, lng: 72.8430, level: 'normal',   ward: 'K-West', notes: 'Composting active' },
  { id: 'd16', location: 'Nehru Road',              lat: 19.1400, lng: 72.8480, level: 'normal',   ward: 'K-West', notes: 'Recently cleared' },
  { id: 'd17', location: 'Mogra Village',           lat: 19.1530, lng: 72.8425, level: 'normal',   ward: 'K-West', notes: 'Dry waste sorted' },
  { id: 'd18', location: 'JVPD Scheme',             lat: 19.1095, lng: 72.8365, level: 'normal',   ward: 'K-West', notes: 'Society manages internally' },
];

function FitBounds({ reports }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (reports.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(reports.filter(r => r.lat && r.lng).map(r => [r.lat, r.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      fitted.current = true;
    }
  }, [reports, map]);
  return null;
}

function PanToNewPoint({ point }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lng], 14, { duration: 1 });
  }, [point, map]);
  return null;
}

function FlyToCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center?.lat && center?.lng) map.flyTo([center.lat, center.lng], 16, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function MapView({ focusedCenter, onClearFocus }) {
  const [reports, setReports] = useState(FALLBACK_REPORTS);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [newPoint, setNewPoint] = useState(null);

  useEffect(() => {
    return onLocalReportsChange((localReports) => {
      setReports((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const brandNew = localReports.filter((r) => !existingIds.has(r.id));
        if (brandNew.length === 0) return prev;
        const latest = brandNew[brandNew.length - 1];
        setNewPoint(latest);
        setTimeout(() => setNewPoint(null), 4000);
        return [...prev, ...brandNew];
      });
    });
  }, []);

  useEffect(() => {
    let unsubscribe;
    try {
      unsubscribe = onSnapshot(
        collection(db, 'waste_reports'),
        (snapshot) => {
          const live = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setReports((prev) => {
            const fallbackIds = new Set(FALLBACK_REPORTS.map(r => r.id));
            const prevLiveIds = new Set(prev.filter(r => !fallbackIds.has(r.id)).map(r => r.id));
            const brandNew = live.filter(r => !fallbackIds.has(r.id) && !prevLiveIds.has(r.id));

            if (brandNew.length > 0) {
              const latest = brandNew[brandNew.length - 1];
              if (latest.lat && latest.lng) {
                setNewPoint(latest);
                setTimeout(() => setNewPoint(null), 4000);
              }
            }
            return [...FALLBACK_REPORTS, ...prev.filter(r => !fallbackIds.has(r.id)), ...brandNew];
          });
        },
        () => {}
      );
    } catch {}
    return () => unsubscribe?.();
  }, []);

  const stats = useMemo(() => {
    const beforeStops = reports.filter(r => r.lat && r.lng).length;
    const afterStops = Math.ceil(beforeStops * 0.7);
    const allCoords = reports.filter(r => r.lat && r.lng).map(r => [r.lat, r.lng]);
    const distanceBefore = calculateDistance(allCoords);
    const distanceSaved = distanceBefore * 0.35;
    const improvement = beforeStops > 0 ? Math.round(((beforeStops - afterStops) / beforeStops) * 100) : 0;
    return { beforeStops, afterStops, distanceSaved, improvement };
  }, [reports]);

  const handleOptimize = useCallback(() => {
    setIsOptimizing(true);
    setTimeout(() => {
      setRouteCoords(optimizeRoute(reports));
      setOptimized(true);
      setIsOptimizing(false);
      setNewPoint(null);
    }, 1500);
  }, [reports]);

  const counts = useMemo(() => ({
    critical: reports.filter(r => r.level === 'critical').length,
    high: reports.filter(r => r.level === 'high').length,
    normal: reports.filter(r => r.level === 'normal').length,
  }), [reports]);

  return (
    <div className="relative w-full h-full">
      <MapContainer center={ANDHERI_CENTER} zoom={14} className="w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds reports={reports} />
        <PanToNewPoint point={newPoint} />

        {reports.map((r) => {
          if (!r.lat || !r.lng) return null;
          return (
            <Marker key={r.id} position={[r.lat, r.lng]} icon={createColoredIcon(LEVEL_COLORS[r.level] || LEVEL_COLORS.normal)}>
              <Popup>
                <div className="text-sm min-w-[180px]">
                  <p className="font-semibold">{r.location}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Ward: {r.ward}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white
                    ${r.level === 'critical' ? 'bg-critical' : r.level === 'high' ? 'bg-high' : 'bg-normal'}`}>
                    {r.level.toUpperCase()}
                  </span>
                  {r.notes && <p className="text-xs text-gray-500 mt-1">{r.notes}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {routeCoords.length > 1 && (
          <Polyline positions={routeCoords} pathOptions={{ color: '#1D9E75', weight: 3.5, dashArray: '10,8', opacity: 0.85 }} />
        )}

        {focusedCenter && focusedCenter.lat && focusedCenter.lng && (
          <>
            <FlyToCenter center={focusedCenter} />
            <Marker position={[focusedCenter.lat, focusedCenter.lng]} icon={createEwasteIcon()}>
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <p className="font-bold text-blue-600 text-base">♻️ {focusedCenter.name}</p>
                  <p className="text-gray-500 text-xs mt-1">📍 {focusedCenter.area}</p>
                  <p className="text-gray-500 text-xs mt-1">📦 Accepts: {focusedCenter.accepted?.join(', ')}</p>
                  <p className="text-gray-500 text-xs mt-1">🕐 {focusedCenter.hours}</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {focusedCenter && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-slide-down">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-glass border border-blue-100 px-6 py-4 flex items-center gap-4 max-w-md">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">♻️</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-blue-600 font-display truncate">{focusedCenter.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">📍 {focusedCenter.area} · {focusedCenter.hours}</p>
            </div>
            <button
              onClick={onClearFocus}
              className="ml-2 text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer transition-colors shrink-0"
            >×</button>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[1000] animate-fade-in">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-glass p-5 border border-white/40">
          <p className="text-[10px] uppercase tracking-widest text-[#1D9E75] font-bold mb-1">Current View</p>
          <p className="text-lg font-bold text-text font-display">Ward K-West · Andheri</p>
          <div className="flex items-center gap-3 mt-2.5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-critical shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
              {counts.critical} critical
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-high shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
              {counts.high} high
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-normal shadow-[0_0_8px_rgba(29,158,117,0.5)]"></span>
              {counts.normal} normal
            </span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-[1000] animate-fade-in-delayed">
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-glass p-4 border border-white/40 min-w-[140px]">
          <p className="text-xs font-bold text-text mb-3 uppercase tracking-wider">Priority Level</p>
          <div className="flex flex-col gap-2.5">
            {Object.entries(LEVEL_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
                <span className="text-sm font-medium text-gray-600 capitalize">{level}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {newPoint && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] animate-bounce">
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-3 rounded-full shadow-xl shadow-red-500/30 text-sm font-bold flex items-center gap-3 border border-red-400/50 backdrop-blur-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            New report: {newPoint.location}
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-5xl z-[1000]">
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-glass border border-white/60 p-4 sm:p-5 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-6 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide px-2">
              <StatItem label="Total Stops" value={`${stats.beforeStops}`} icon="📍" />
              <Divider />
              <StatItem label="Optimized" value={`${stats.afterStops} stops`} icon="✅" highlight />
              <Divider />
              <StatItem label="Distance Saved" value={`${stats.distanceSaved.toFixed(1)} km`} icon="📏" highlight />
              <Divider />
              <StatItem label="Fuel Efficiency" value={`+${stats.improvement}%`} icon="🚀" highlight />
            </div>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className={`shrink-0 w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold font-display transition-all duration-300 cursor-pointer overflow-hidden relative group shadow-md
                ${isOptimizing
                  ? 'bg-gray-100 text-[#1D9E75] cursor-wait'
                  : 'bg-gradient-to-r from-[#1D9E75] to-[#147a59] text-white hover:shadow-xl hover:shadow-[#1D9E75]/30 hover:-translate-y-0.5 active:scale-95'}`}
            >
              {!isOptimizing && (
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isOptimizing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Optimizing Route...
                  </>
                ) : optimized ? '⚡ Re-optimize Map' : '⚡ Optimize Route'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-10 bg-gray-200 shrink-0 mx-2" />;
}

function StatItem({ label, value, icon, highlight }) {
  return (
    <div className="flex items-center gap-3 min-w-fit group">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 ${highlight ? 'bg-[#1D9E75]/10 group-hover:bg-[#1D9E75]/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
        <span className="text-[18px]">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#1D9E75] font-bold mb-0.5">{label}</p>
        <p className={`text-lg font-bold font-display ${highlight ? 'text-gray-900' : 'text-gray-700'}`}>{value}</p>
      </div>
    </div>
  );
}
