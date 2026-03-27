import { useState } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import ReportForm from './components/ReportForm';
import EwasteChat from './components/EwasteChat';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [focusedCenter, setFocusedCenter] = useState(null);

  const handleViewMap = (center) => {
    setFocusedCenter(center);
    setActiveTab('map');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden font-sans">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="absolute inset-0 z-0">
        {activeTab === 'map' && <MapView focusedCenter={focusedCenter} onClearFocus={() => setFocusedCenter(null)} />}
        {activeTab === 'report' && <ReportForm />}
        {activeTab === 'ewaste' && <EwasteChat onViewMap={handleViewMap} />}
      </main>
    </div>
  );
}
