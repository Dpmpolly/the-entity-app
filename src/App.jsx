import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your pages
import LandingPage from './LandingPage';
import TheEntity from './TheEntity'; // This loads your game logic

function App() {
  return (
    <Router>
      <Routes>
        {/* SCENARIO 1: User visits the root domain (/) -> Show Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* SCENARIO 2: User clicks "Initialize" (/game) -> Show The Game */}
        <Route path="/game" element={<TheEntity />} />

        {/* Future Pages (Placeholders for now) */}
        <Route path="/store" element={<div className="bg-slate-950 min-h-screen text-white p-10 flex items-center justify-center font-mono">ARMORY UNDER CONSTRUCTION</div>} />
        <Route path="/support" element={<div className="bg-slate-950 min-h-screen text-white p-10 flex items-center justify-center font-mono">SECURE CHANNEL OPEN</div>} />

        {/* Catch-all: If they type a weird URL, send them back to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;