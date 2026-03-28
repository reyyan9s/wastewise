import { useState, useCallback, useEffect } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ReportForm from './components/ReportForm';
import EwasteChat from './components/EwasteChat';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import UserLogin from './components/UserLogin';
import Gateway from './components/Gateway';
import MyReports from './components/MyReports';
import { INITIAL_REPORTS, enrichReport } from './reportData';
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [focusedCenter, setFocusedCenter] = useState(null);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [user, setUser] = useState(null);
  const [appMode, setAppMode] = useState('gateway'); // gateway, user-login, admin-login, user-workspace, admin-workspace

  useEffect(() => {
    const unsubSnap = onSnapshot(collection(db, 'waste_reports'), (snapshot) => {
      const live = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(prev => {
        let updated = [...prev];
        live.forEach(liveDoc => {
          const idx = updated.findIndex(r => r.id === liveDoc.id);
          if (idx > -1) {
            updated[idx] = { ...updated[idx], ...liveDoc };
          } else {
            updated.push(enrichReport(liveDoc));
          }
        });
        return updated;
      });
    }, (error) => console.error('Snapshot error:', error));

    return () => unsubSnap();
  }, []);

  const handleAddReports = useCallback((newReports) => {
    setReports(prev => {
      const ids = new Set(prev.map(r => r.id));
      const brandNew = newReports.filter(r => !ids.has(r.id));
      return brandNew.length > 0 ? [...prev, ...brandNew] : prev;
    });
  }, []);

  const handleStatusChange = useCallback(async (ids, newStatus) => {
    const idSet = new Set(Array.isArray(ids) ? ids : [ids]);
    setReports(prev => prev.map(r => idSet.has(r.id) ? { ...r, status: newStatus } : r));
    
    for (const id of idSet) {
      if (!id.startsWith('d') && !id.startsWith('sim') && !id.startsWith('local')) {
        try {
          await updateDoc(doc(db, 'waste_reports', id), { status: newStatus });
        } catch (e) { console.error('Failed to persist status:', e); }
      }
    }
  }, []);

  const handleViewMap = (center) => {
    setFocusedCenter(center);
    setActiveTab('map');
  };

  const handleLogout = () => {
    setUser(null);
    setAppMode('gateway');
  };

  if (appMode === 'gateway') return <Gateway onSelectUser={() => setAppMode('user-login')} onSelectAdmin={() => setAppMode('admin-login')} />;
  if (appMode === 'user-login') return <UserLogin onLogin={(u) => { setUser(u); setAppMode('user-workspace'); setActiveTab('map'); }} onBack={() => setAppMode('gateway')} />;
  if (appMode === 'admin-login') return <AdminLogin onLogin={() => { setAppMode('admin-workspace'); setActiveTab('admin'); }} onBack={() => setAppMode('gateway')} />;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isAdmin={appMode === 'admin-workspace'}
        user={user}
        onLogout={handleLogout}
      />
      <main className="absolute inset-0 z-0">
        {(appMode === 'user-workspace' || appMode === 'admin-workspace') && (
          <>
            {activeTab === 'map' && (
              <MapView
                reports={reports}
                onAddReports={handleAddReports}
                onStatusChange={handleStatusChange}
                focusedCenter={focusedCenter}
                onClearFocus={() => setFocusedCenter(null)}
              />
            )}
            {appMode === 'user-workspace' && activeTab === 'myReports' && <MyReports reports={reports} user={user} />}
            {appMode === 'user-workspace' && activeTab === 'report' && <ReportForm user={user} />}
            {appMode === 'user-workspace' && activeTab === 'ewaste' && <EwasteChat onViewMap={handleViewMap} />}
          </>
        )}
        {appMode === 'admin-workspace' && activeTab === 'admin' && (
          <AdminDashboard reports={reports} onStatusChange={handleStatusChange} />
        )}
      </main>
    </div>
  );
}
