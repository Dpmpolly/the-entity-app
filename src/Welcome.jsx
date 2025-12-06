import React from 'react';
import { Link } from 'react-router-dom';
import { Skull, Activity, Shield, Zap, ChevronRight, AlertTriangle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30 overflow-hidden relative">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
      
      {/* NAV */}
      <nav className="relative z-10 max-w-6xl mx-auto p-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-emerald-400 font-black tracking-widest text-xl">
            <Skull size={24} /> THE ENTITY
        </div>
        <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">INTEL</a>
            <Link to="/store" className="hover:text-white transition-colors">ARMORY</Link>
            <Link to="/game" className="text-emerald-400 hover:text-emerald-300">LOGIN</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-900/50 bg-red-900/10 text-red-500 text-[10px] font-bold uppercase tracking-widest mb-6 animate-pulse">
              <AlertTriangle size={12} /> Threat Level: Critical
          </div>

          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-tight">
              It <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Learns.</span><br/>
              It <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">Adapts.</span><br/>
              It <span className="text-red-600 glitch-text">Hunts.</span>
          </h1>

          <p className="max-w-xl text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
              The first fitness tracker with <strong className="text-white">Permadeath.</strong><br/>
              The Entity chases you based on your real-world pace.<br/>
              If it catches you, your save file is deleted. Forever.
          </p>

          <Link to="/game" className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-1">
              <span className="flex items-center gap-3">
                  Initialize Protocol <ChevronRight className="group-hover:translate-x-1 transition-transform" />
              </span>
          </Link>

          <p className="mt-6 text-xs text-slate-600 font-mono">
              AVAILABLE ON IOS & ANDROID // POWERED BY STRAVA
          </p>
      </div>

      {/* FEATURES GRID */}
      <div id="features" className="relative z-10 bg-slate-900 border-t border-slate-800 py-24">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="p-8 border border-slate-800 rounded-2xl bg-slate-950/50 hover:border-emerald-500/50 transition-colors">
                  <Activity className="text-emerald-400 mb-4" size={32} />
                  <h3 className="text-xl font-bold text-white mb-2">Adaptive AI</h3>
                  <p className="text-slate-400 text-sm">The Entity studies your running history. If you get faster, it gets faster. You can never outrun it, you can only survive it.</p>
              </div>

              <div className="p-8 border border-slate-800 rounded-2xl bg-slate-950/50 hover:border-amber-500/50 transition-colors">
                  <Shield className="text-amber-400 mb-4" size={32} />
                  <h3 className="text-xl font-bold text-white mb-2">Real Stakes</h3>
                  <p className="text-slate-400 text-sm">No do-overs. If the distance gap hits zero, your account, badges, and progress are permanently wiped.</p>
              </div>

              <div className="p-8 border border-slate-800 rounded-2xl bg-slate-950/50 hover:border-purple-500/50 transition-colors">
                  <Zap className="text-purple-400 mb-4" size={32} />
                  <h3 className="text-xl font-bold text-white mb-2">Tactical Store</h3>
                  <p className="text-slate-400 text-sm">Use strategy. Craft EMPs to stun the Entity or buy Nitrous Boosts to gain distance when you can't run.</p>
              </div>

          </div>
      </div>

      {/* FOOTER */}
      <footer className="py-12 text-center text-slate-600 text-xs font-mono relative z-10">
          <p>&copy; {new Date().getFullYear()} THE ENTITY PROJECT. ALL RIGHTS RESERVED.</p>
          <div className="flex justify-center gap-4 mt-4">
              <Link to="/support" className="hover:text-white">SUPPORT</Link>
              {/* Use target="_blank" to force browser to load the static HTML file */}
<a 
  href="/privacy.html" 
  target="_blank" 
  rel="noopener noreferrer" 
  className="hover:text-white"
>
  PRIVACY POLICY
</a>
          </div>
      </footer>

    </div>
  );
}