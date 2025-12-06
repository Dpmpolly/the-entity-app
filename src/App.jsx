import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your pages
import LandingPage from './Welcome'; 
import TheEntity from './TheEntity'; 
import Help from './Help';  
import Store from './Store';   

function App() {
  return (
    <Router>
      <Routes>
        {/* SCENARIO 1: User visits the root domain */}
        <Route path="/" element={<LandingPage />} />

        {/* SCENARIO 2: User clicks Initialize */}
        <Route path="/game" element={<TheEntity />} />

        {/* SCENARIO 3: User needs help */}
        <Route path="/support" element={<Help />} />

        {/* Future Pages */}
        <Route path="/store" element={<Store />} />
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;