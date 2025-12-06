import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Lock, Shirt, Truck, Skull, ShieldAlert, Activity } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';

// --- CONFIGURATION (Must match your other files) ---
const firebaseConfig = {
  apiKey: "AIzaSyAsssP-dGeIbuz29TUKmGMQ51j8GstFlkQ", 
  authDomain: "the-entity-a7c4b.firebaseapp.com",
  projectId: "the-entity-a7c4b",
  storageBucket: "the-entity-a7c4b.firebasestorage.app",
  messagingSenderId: "1038035853632",
  appId: "1:1038035853632:web:5934d566a958282f4d9aa5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'default-app-id';

export default function Store() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(true);
  const [daysSurvived, setDaysSurvived] = useState(0);
  const [goalDays, setGoalDays] = useState(30);

  // CONFIG: Stripe Links
  const LINKS = {
      tee30: "https://buy.stripe.com/test_...", // YOUR T-SHIRT LINK
  };

  // --- 1. AUTH & DATA FETCHING ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Connect to the save file
        const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'game_data', 'main_save');
        
        // Listen for data
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // --- THE VICTORY CALCULATION ---
                const start = new Date(data.startDate);
                const now = new Date();
                const msElapsed = now.getTime() - start.getTime();
                const days = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
                
                // Calculate if caught
                const hoursElapsed = msElapsed / (1000 * 60 * 60);
                const gracePeriodHours = 24;
                const activeHours = Math.max(0, hoursElapsed - gracePeriodHours - (data.totalPausedHours || 0));
                const entityDist = activeHours * ((data.entitySpeed || 3) / 24);
                const userDist = data.totalKmRun || 0;
                const isCaught = (userDist - entityDist) <= 0 && hoursElapsed > gracePeriodHours;

                setDaysSurvived(days);
                setGoalDays(data.duration || 30);

                // GRANT ACCESS IF: Days reached AND Not Caught
                if (days >= (data.duration || 30) && !isCaught) {
                    setAccessDenied(false);
                } else {
                    setAccessDenied(true);
                }
            }
            setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        // If not logged in, try anonymous login or deny
        signInAnonymously(auth).catch(err => console.error(err));
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // --- RENDER: LOADING ---
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 animate-pulse">
        <Activity size={48} className="mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest">Verifying Clearance Level...</p>
    </div>
  );

  // --- RENDER: ACCESS DENIED (LOCKED) ---
  if (accessDenied) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Glitch */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            
            <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-2xl p-8 text-center relative z-10 shadow-2xl shadow-red-900/20">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center border-2 border-red-500/50 text-red-500 animate-pulse">
                        <Lock size={40} />
                    </div>
                </div>
                
                <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Access Denied</h1>
                <div className="inline-block bg-red-950 text-red-500 text-[10px] font-bold px-3 py-1 rounded-full border border-red-900 mb-6">
                    CLEARANCE LEVEL INSUFFICIENT
                </div>

                <div className="text-left bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6 font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between">
                        <span>CURRENT STATUS:</span>
                        <span className="text-red-400 font-bold">ACTIVE / HUNTED</span>
                    </div>
                    <div className="flex justify-between">
                        <span>DAYS SURVIVED:</span>
                        <span className="text-white">{daysSurvived}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 mt-2">
                        <span>REQUIRED:</span>
                        <span className="text-emerald-400 font-bold">{goalDays} DAYS</span>
                    </div>
                </div>

                <p className="text-slate-500 text-sm mb-8">
                    The Armory is only available to operatives who have successfully completed their mission duration. Keep running.
                </p>

                <Link to="/game" className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all border border-slate-700">
                    RETURN TO DASHBOARD
                </Link>
            </div>
        </div>
      );
  }

  // --- RENDER: ACCESS GRANTED (STORE) ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 pb-20">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto p-6 border-b border-slate-900">
        <Link to="/game" className="inline-flex items-center text-emerald-400 hover:text-white mb-6 font-bold text-xs tracking-widest transition-colors">
            <ChevronLeft size={14} /> RETURN TO DASHBOARD
        </Link>
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                    <ShoppingBag className="text-emerald-500" size={32} /> The Armory
                </h1>
                <p className="text-emerald-400/60 mt-2 text-sm font-mono uppercase">
                    <Lock size={12} className="inline mb-1 mr-1"/> Clearance Verified: Survivor Class
                </p>
            </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-2 mb-6 text-slate-500 font-bold uppercase tracking-widest text-xs">
              <Truck size={14} /> Physical Logistics
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* PRODUCT: SURVIVOR TEE */}
              <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all">
                  <div className="h-64 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                      <Shirt size={80} className="text-slate-600 group-hover:text-emerald-400 transition-colors duration-500" />
                      <div className="absolute top-3 right-3 bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded">
                          UNLOCKED
                      </div>
                  </div>
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-white">Survivor Tee (Gen 1)</h3>
                          <span className="font-mono text-emerald-400">$30.00</span>
                      </div>
                      <p className="text-sm text-slate-400 mb-6">
                          Official issue for operatives who survived the 30-day protocol. High-quality print. Prove you beat the algorithm.
                      </p>
                      
                      <a href={LINKS.tee30} target="_blank" rel="noreferrer" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-center py-4 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20">
                          ACQUIRE ASSET
                      </a>
                  </div>
              </div>

              {/* PRODUCT: GHOST HOODIE (STILL LOCKED FOR NOW?) */}
              <div className="group relative bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl overflow-hidden opacity-50">
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-4">
                      <Lock className="text-slate-500 mb-2" />
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Coming Soon</div>
                  </div>
                  <div className="h-64 bg-slate-900 flex items-center justify-center">
                      <Shirt size={80} className="text-slate-700" />
                  </div>
                  <div className="p-6 blur-sm select-none">
                      <h3 className="text-xl font-bold text-white">Ghost Protocol Hoodie</h3>
                      <p className="text-sm text-slate-400 mt-2">Thermal regulation.</p>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}