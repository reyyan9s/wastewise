import { useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ReportForm from './components/ReportForm';
import EwasteChat from './components/EwasteChat';
import AdminDashboard from './components/AdminDashboard';
import { INITIAL_REPORTS } from './reportData';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [focusedCenter, setFocusedCenter] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [reports, setReports] = useState(INITIAL_REPORTS);

  const handleAddReports = useCallback((newReports) => {
    setReports(prev => {
      const ids = new Set(prev.map(r => r.id));
      const brandNew = newReports.filter(r => !ids.has(r.id));
      return brandNew.length > 0 ? [...prev, ...brandNew] : prev;
    });
  }, []);

  const handleStatusChange = useCallback((ids, newStatus) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setReports(prev => prev.map(r => idSet.has(r.id) ? { ...r, status: newStatus } : r));
  }, []);

  const handleViewMap = (center) => {
    setFocusedCenter(center);
    setActiveTab('map');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(a => !a)}
      />
      <main className="absolute inset-0 z-0">
        {!isAdmin && activeTab === 'map' && (
          <MapView
            reports={reports}
            onAddReports={handleAddReports}
            onStatusChange={handleStatusChange}
            focusedCenter={focusedCenter}
            onClearFocus={() => setFocusedCenter(null)}
          />
        )}
        {!isAdmin && activeTab === 'report' && <ReportForm />}
        {!isAdmin && activeTab === 'ewaste' && <EwasteChat onViewMap={handleViewMap} />}
        {isAdmin && (
          <AdminDashboard
            reports={reports}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
    </div>
  );
}
