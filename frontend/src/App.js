import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SubtitleProvider } from './context/SubtitleContext';
import Dashboard from './components/Dashboard';
import SubtitleOverlay from './components/SubtitleOverlay';
import SettingsPanel from './components/SettingsPanel';
import './App.css';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <SubtitleProvider>
      <div className="App min-h-screen bg-[#050505]">
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard onOpenSettings={() => setIsSettingsOpen(true)} />
              }
            />
          </Routes>
        </BrowserRouter>

        {/* Subtitle Overlay (rendered globally) */}
        <SubtitleOverlay />

        {/* Settings Panel */}
        <SettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </div>
    </SubtitleProvider>
  );
}

export default App;
