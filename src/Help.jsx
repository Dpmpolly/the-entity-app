import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Mail, ChevronLeft, HelpCircle } from 'lucide-react';

export default function Help() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6">
      
      {/* HEADER */}
      <div className="max-w-2xl mx-auto mb-8">
        <Link to="/" className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mb-6 font-bold text-sm">
            <ChevronLeft size={16} /> RETURN TO BASE
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <ShieldAlert className="text-emerald-500" size={32} /> Operator Support
        </h1>
        <p className="text-slate-500 mt-2">Technical assistance and mission protocols.</p>
      </div>

      {/* CONTACT CARD */}
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Mail size={18} className="text-emerald-400"/> Direct Comms
          </h2>
          <p className="text-sm text-slate-400 mb-6">
              Encountering sync errors or payment issues? Contact command immediately.
          </p>
          <a href="mailto:russellpollard77@gmail.com" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center font-bold py-4 rounded-xl transition-all">
              OPEN TICKET (EMAIL)
          </a>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-4">Field Manual (FAQ)</h3>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle size={16} className="text-slate-500"/> How does the Entity move?</h4>
              <p className="text-sm text-slate-400">The Entity calculates a speed based on your average daily pace. If you stop running, it keeps moving. If the distance gap hits 0km, your save is wiped.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle size={16} className="text-slate-500"/> Strava Sync Not Working?</h4>
              <p className="text-sm text-slate-400">Go to the Game Dashboard, click Settings (Top Right), and click "Repair Connection". This forces a manual sync of your last 30 runs.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h4 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle size={16} className="text-slate-500"/> Payment Issues?</h4>
              <p className="text-sm text-slate-400">Transactions can take up to 60 seconds to verify. If it fails, use the Email button above with your receipt ID.</p>
          </div>
      </div>

    </div>
  );
}