function deterministicVolume(id) {
  const n = parseInt(id.replace(/\D/g, '') || '5');
  return 50 + (n * 73 % 450);
}

const RAW = [
  { id: 'd1',  location: 'Lokhandwala Market',      lat: 19.1395, lng: 72.8310, level: 'critical', ward: 'K-West', notes: 'Overflowing bins — 3 days uncollected' },
  { id: 'd2',  location: 'DN Nagar Metro Station',  lat: 19.1268, lng: 72.8358, level: 'critical', ward: 'K-West', notes: 'Construction debris blocking sidewalk' },
  { id: 'd3',  location: 'Versova Fish Market',     lat: 19.1340, lng: 72.8155, level: 'critical', ward: 'K-West', notes: 'Wet waste — requires urgent pickup' },
  { id: 'd4',  location: 'Four Bungalows Junction', lat: 19.1432, lng: 72.8265, level: 'critical', ward: 'K-West', notes: 'Mixed waste pile-up near junction' },
  { id: 'd5',  location: 'Gilbert Hill Road',       lat: 19.1285, lng: 72.8420, level: 'critical', ward: 'K-West', notes: 'E-waste dumped near residential area' },
  { id: 'd6',  location: 'Yari Road',               lat: 19.1480, lng: 72.8230, level: 'high',     ward: 'K-West', notes: '80% full — pickup by evening' },
  { id: 'd7',  location: 'Amboli Naka',             lat: 19.1360, lng: 72.8440, level: 'high',     ward: 'K-West', notes: 'Large bin nearing capacity' },
  { id: 'd8',  location: 'Juhu Tara Road',          lat: 19.1060, lng: 72.8275, level: 'high',     ward: 'K-West', notes: 'Plastic waste accumulating' },
  { id: 'd9',  location: 'Oshiwara Bus Depot',      lat: 19.1510, lng: 72.8355, level: 'high',     ward: 'K-West', notes: 'Bins 75% full' },
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

export const FALLBACK_IDS = new Set(RAW.map(r => r.id));

export const INITIAL_REPORTS = RAW.map(r => ({
  ...r,
  status: 'pending',
  density: (r.level === 'critical' || r.level === 'high') ? 'high' : 'low',
  wasteVolume: deterministicVolume(r.id),
}));

export function enrichReport(r) {
  return {
    status: 'pending',
    density: (r.level === 'critical' || r.level === 'high') ? 'high' : 'low',
    wasteVolume: Math.floor(50 + Math.random() * 450),
    ...r,
  };
}
