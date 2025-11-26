import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  Activity, Skull, Settings, Plus, AlertTriangle, MapPin, History, X, Link as LinkIcon, RefreshCw, CheckCircle2, BrainCircuit, Zap, Timer, ShieldCheck, Compass, Map as MapIcon, Shield, ChevronRight, ZapOff, Lock, Rocket, Wrench, Cpu, Disc, Award, ArrowRightLeft, HeartPulse, RotateCcw, ShoppingBag, BarChart3
} from 'lucide-react';

// --- Firebase Config ---
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helpers ---
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// --- Definitions ---
const AVATARS = {
  sprinter: { id: 'sprinter', name: 'The Sprinter', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500', desc: 'Fast and explosive.' },
  ranger:   { id: 'ranger',   name: 'The Ranger',   icon: MapIcon, color: 'text-emerald-400', bg: 'bg-emerald-500', desc: 'Steady and enduring.' },
  survivor: { id: 'survivor', name: 'The Survivor', icon: Shield, color: 'text-blue-400',   bg: 'bg-blue-500',   desc: 'Defensive and tough.' },
  scout:    { id: 'scout',    name: 'The Scout',    icon: Compass, color: 'text-orange-400', bg: 'bg-orange-500', desc: 'Calculated and precise.' },
};

const EMP_PARTS = [
    { id: 'battery', name: 'Ion Battery', icon: Zap, color: 'text-yellow-400' },
    { id: 'emitter', name: 'Wave Emitter', icon: Disc, color: 'text-cyan-400' },
    { id: 'casing',  name: 'Alloy Casing', icon: Cpu, color: 'text-slate-400' }
];

const DIFFICULTIES = {
    easy:   { id: 'easy',   label: 'Standard', multiplier: 0.85, color: 'text-emerald-400', desc: 'Entity matches 85% of your average.' },
    medium: { id: 'medium', label: 'Intense',  multiplier: 0.90, color: 'text-yellow-400',  desc: 'Entity matches 90% of your average.' },
    hard:   { id: 'hard',   label: 'Nightmare',multiplier: 0.95, color: 'text-red-500',     desc: 'Entity matches 95% of your average.' }
};

export default function TheEntity() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Game State
  const [gameState, setGameState] = useState({
    onboardingComplete: false,
    startDate: new Date().toISOString(),
    duration: 365,
    avatarId: 'sprinter',
    difficulty: 'easy',
    entitySpeed: 3, 
    lastSpeedUpdateDay: 0,
    adaptiveMode: true,
    totalKmRun: 0,
    runHistory: [],
    isStravaLinked: false,
    stravaAccessToken: null, 
    stravaRefreshToken: null,
    stravaExpiresAt: null,
    lastSyncTime: null,
    lastEmpUsage: null,
    totalPausedHours: 0,
    empUsageCount: 0,
    boostUsageCount: 0,
    inventory: { battery: 0, emitter: 0, casing: 0 },
    activeQuest: null,
    badges: [], 
    lastQuestGenerationDay: 0,
    continuesUsed: 0
  });

  // Derived State
  const today = new Date();
  const gameStart = new Date(gameState.startDate);
  const daysSinceStart = Math.max(0, Math.floor((today.getTime() - gameStart.getTime()) / (1000 * 3600 * 24))); 
  const EMP_DURATION_HOURS = 25;
  const EMP_COOLDOWN_DAYS = 90;
  const lastEmpDate = gameState.lastEmpUsage ? new Date(gameState.lastEmpUsage) : null;
  const isEmpActive = lastEmpDate && (today.getTime() - lastEmpDate.getTime()) < (EMP_DURATION_HOURS * 60 * 60 * 1000);
  const daysSinceEmp = lastEmpDate ? (today.getTime() - lastEmpDate.getTime()) / (1000 * 3600 * 24) : 999;
  const empCooldownRemaining = Math.max(0, Math.ceil(EMP_COOLDOWN_DAYS - daysSinceEmp));
  const isEmpAvailable = daysSinceEmp >= EMP_COOLDOWN_DAYS;
  const isEmpFree = (gameState.empUsageCount || 0) === 0;
  const isBoostFree = (gameState.boostUsageCount || 0) === 0;
  const isGracePeriod = daysSinceStart < 1;
  const pausedDaysOffset = (gameState.totalPausedHours || 0) / 24;
  const entityActiveDays = Math.max(0, daysSinceStart - 1 - pausedDaysOffset);
  const entityDistance = entityActiveDays * gameState.entitySpeed;
  const userDistance = gameState.totalKmRun;
  const distanceGap = userDistance - entityDistance;
  const isCaught = distanceGap <= 0 && !isGracePeriod;
  const isVictory = daysSinceStart >= gameState.duration && !isCaught;
  const daysUntilCaught = distanceGap > 0 ? Math.floor(distanceGap / gameState.entitySpeed) : 0;
  const daysToNextUpdate = 4 - (daysSinceStart % 4);

  // --- Auth & Data ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { console.error(e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- STRAVA AUTH HANDLER ---
  useEffect(() => {
    if (!user) return;
    
    const params = new URLSearchParams(window.location.search);
    const stravaCode = params.get('code');

    if (stravaCode) {
       const exchangeToken = async () => {
          try {
             const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
             const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
             
             const response = await fetch(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${stravaCode}&grant_type=authorization_code`, { method: 'POST' });
             const data = await response.json();
             
             if (data.access_token) {
                 const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
                 await setDoc(userDocRef, { 
                     isStravaLinked: true,
                     stravaAccessToken: data.access_token,
                     stravaRefreshToken: data.refresh_token,
                     stravaExpiresAt: data.expires_at
                 }, { merge: true });
                 
                 window.history.replaceState({}, document.title, "/");
                 alert("Strava Connected Successfully!");
             }
          } catch (error) {
             console.error("Strava Auth Failed", error);
             alert("Failed to connect Strava.");
          }
       };
       exchangeToken();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState(prev => ({ ...prev, ...data }));
      } else {
        setGameState(prev => ({ ...prev, onboardingComplete: false }));
      }
      setLoading(false);
    });
    return () => unsubscribeSnapshot();
  }, [user]);

  // --- Quest Generation ---
  useEffect(() => {
      if (!user || loading) return;
      if (daysSinceStart > 0 && daysSinceStart % 5 === 0 && daysSinceStart !== gameState.lastQuestGenerationDay) {
          if (!gameState.activeQuest) {
              const parts = ['battery', 'emitter', 'casing'];
              const randomPart = parts[Math.floor(Math.random() * parts.length)];
              const newQuest = { id: Date.now(), title: `Scavenge Mission ${gameState.badges.length + 1}`, distance: Math.floor(Math.random() * 8) + 5, progress: 0, rewardPart: randomPart, status: 'available' };
              setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), { ...gameState, activeQuest: newQuest, lastQuestGenerationDay: daysSinceStart });
          }
      }
  }, [daysSinceStart, user, loading]);

  const calculateAdaptiveSpeed = (totalKm, activeDays, diff) => {
    if (activeDays < 1) return 3;
    const avgDaily = totalKm / activeDays;
    const multiplier = DIFFICULTIES[diff || 'easy'].multiplier;
    return parseFloat(Math.max(3, (avgDaily * multiplier)).toFixed(2));
  };

  // --- Actions ---
  const handleStravaLogin = () => {
      const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
      const redirectUri = window.location.origin; 
      const scope = "activity:read_all";
      window.location.href = `http://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
  };

  const syncStravaActivities = async () => {
      if (!user || !gameState.stravaAccessToken) return;
      setIsSyncing(true);

      try {
          let token = gameState.stravaAccessToken;
          if (gameState.stravaExpiresAt && Date.now() / 1000 > gameState.stravaExpiresAt) {
              const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
              const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
              const refreshRes = await fetch(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${gameState.stravaRefreshToken}`, { method: 'POST' });
              const refreshData = await refreshRes.json();
              token = refreshData.access_token;
              await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), { stravaAccessToken: token, stravaRefreshToken: refreshData.refresh_token, stravaExpiresAt: refreshData.expires_at }, { merge: true });
          }

          const after = gameState.lastSyncTime ? new Date(gameState.lastSyncTime).getTime() / 1000 : new Date(gameState.startDate).getTime() / 1000;
          const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          const activities = await response.json();

          let addedDist = 0;
          const newRuns = activities.map(act => {
              const km = parseFloat((act.distance / 1000).toFixed(2));
              addedDist += km;
              return {
                  id: act.id,
                  date: act.start_date,
                  km: km,
                  notes: act.name,
                  source: 'strava'
              };
          });

          if (newRuns.length > 0) {
              const newTotal = gameState.totalKmRun + addedDist;
              let newSpeed = gameState.entitySpeed;
              let newUpdateDay = gameState.lastSpeedUpdateDay;
              if (gameState.adaptiveMode && daysSinceStart >= 4) {
                   if (daysSinceStart - gameState.lastSpeedUpdateDay >= 4) {
                       const daysForCalc = Math.max(1, daysSinceStart); 
                       newSpeed = calculateAdaptiveSpeed(newTotal, daysForCalc, gameState.difficulty);
                       newUpdateDay = daysSinceStart; 
                   }
              }

              const newState = {
                  ...gameState,
                  totalKmRun: newTotal,
                  entitySpeed: newSpeed,
                  lastSpeedUpdateDay: newUpdateDay,
                  runHistory: [...newRuns, ...gameState.runHistory],
                  lastSyncTime: new Date().toISOString()
              };
              await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
              alert(`Synced ${newRuns.length} runs totaling ${addedDist.toFixed(1)}km.`);
          } else {
              alert("No new runs found on Strava since last sync.");
          }

      } catch (error) {
          console.error("Sync Error", error);
          alert("Error syncing Strava. Please reconnect.");
      }
      setIsSyncing(false);
  };

  const handleAcceptQuest = async () => {
      if (!user || !gameState.activeQuest) return;
      const updatedQuest = { ...gameState.activeQuest, status: 'active' };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), { ...gameState, activeQuest: updatedQuest });
  };

  const handleBuyEMP = async () => {
    if (!user || !isEmpAvailable) return;
    const hasCraftedEmp = gameState.inventory.battery > 0 && gameState.inventory.emitter > 0 && gameState.inventory.casing > 0;
    
    let cost = isEmpFree ? "FREE (First Time Bonus)" : "$1.00";
    if (hasCraftedEmp) cost = "FREE (Crafted)";
    
    if (!confirm(`Deploy EMP Burst?\n\nCost: ${cost}\nEffect: Stops the Entity for ${EMP_DURATION_HOURS} hours.\nCooldown: ${EMP_COOLDOWN_DAYS} days.`)) return;
    
    let newInventory = { ...gameState.inventory };
    if (hasCraftedEmp) {
        newInventory.battery--;
        newInventory.emitter--;
        newInventory.casing--;
    }

    const newState = {
        ...gameState,
        lastEmpUsage: new Date().toISOString(),
        totalPausedHours: (gameState.totalPausedHours || 0) + EMP_DURATION_HOURS,
        empUsageCount: (gameState.empUsageCount || 0) + 1,
        inventory: newInventory
    };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
    alert("EMP DEPLOYED. The Entity is stunned for 25 hours.");
  };

  const handleBuyBoost = async () => {
    if (!user) return;
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const todayRuns = gameState.runHistory.filter(run => new Date(run.date) >= startOfDay);
    const todayKm = todayRuns.reduce((acc, run) => acc + run.km, 0);

    if (todayKm <= 0) {
        alert("System Error: No movement detected today.\n\nYou must log a run today before you can boost it.");
        return;
    }

    const cost = isBoostFree ? "FREE" : "$1.00";
    const boostAmount = parseFloat((todayKm * 0.15).toFixed(2));
    if (!confirm(`Activate Nitrous Boost?\n\nCost: ${cost}\nEffect: Adds 15% (+${boostAmount}km) to today's distance.`)) return;

    const newTotal = gameState.totalKmRun + boostAmount;
    
    const newRun = {
      id: Date.now(),
      date: new Date().toISOString(),
      km: boostAmount,
      notes: 'Nitrous Boost (+15%)',
      type: 'boost'
    };

    const newState = {
        ...gameState,
        totalKmRun: newTotal,
        runHistory: [newRun, ...gameState.runHistory],
        boostUsageCount: (gameState.boostUsageCount || 0) + 1
    };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const handleContinueGame = async () => {
    if (!user) return;
    if (!confirm("ACTIVATE ADRENALINE SHOT?\n\nCost: $1.00\nEffect: Pushes the Entity back by 48 hours. You will survive... for now.")) return;

    const newState = {
        ...gameState,
        totalPausedHours: (gameState.totalPausedHours || 0) + 48,
        continuesUsed: (gameState.continuesUsed || 0) + 1
    };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const handleRestartGame = async () => {
     if (!user || !confirm("CONFIRM RESET?\n\nThis will restart the challenge from Day 1.")) return;
     const newState = {
        onboardingComplete: false, 
        startDate: new Date().toISOString(),
        duration: 365,
        totalKmRun: 0,
        runHistory: [],
        totalPausedHours: 0,
        lastEmpUsage: null,
        empUsageCount: 0,
        boostUsageCount: 0,
        inventory: { battery: 0, emitter: 0, casing: 0 },
        activeQuest: null,
        badges: [],
        continuesUsed: 0,
        entitySpeed: 3,
        lastSpeedUpdateDay: 0,
        difficulty: 'easy'
     };
     await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const handleAddRun = async (km, notes, isQuestRun) => {
    if (!user) return;
    const dist = parseFloat(km);
    let newState = { ...gameState };

    if (isQuestRun && gameState.activeQuest && gameState.activeQuest.status === 'active') {
        const newProgress = gameState.activeQuest.progress + dist;
        let updatedQuest = { ...gameState.activeQuest, progress: newProgress };
        let newInventory = { ...gameState.inventory };
        let newBadges = [...gameState.badges];

        if (newProgress >= gameState.activeQuest.distance) {
            updatedQuest.status = 'completed';
            newInventory[gameState.activeQuest.rewardPart]++;
            newBadges.push({
                id: Date.now(),
                title: gameState.activeQuest.title,
                date: new Date().toISOString()
            });
            alert(`MISSION COMPLETE!\n\nAcquired: 1x ${EMP_PARTS.find(p => p.id === gameState.activeQuest.rewardPart).name}\nAwarded: Mission Badge`);
            updatedQuest = null; 
        }

        const newRun = { id: Date.now(), date: new Date().toISOString(), km: dist, notes: notes || 'Side Quest Run', type: 'quest' };
        newState = { ...gameState, activeQuest: updatedQuest, inventory: newInventory, badges: newBadges, runHistory: [newRun, ...gameState.runHistory] };
    } else {
        const newTotal = gameState.totalKmRun + dist;
        let newSpeed = gameState.entitySpeed;
        let newUpdateDay = gameState.lastSpeedUpdateDay;

        if (gameState.adaptiveMode && daysSinceStart >= 4) {
             if (daysSinceStart - gameState.lastSpeedUpdateDay >= 4) {
                 const daysForCalc = Math.max(1, daysSinceStart); 
                 newSpeed = calculateAdaptiveSpeed(newTotal, daysForCalc, gameState.difficulty);
                 newUpdateDay = daysSinceStart; 
             }
        }

        const newRun = { id: Date.now(), date: new Date().toISOString(), km: dist, notes: notes || 'Manual Log', type: 'survival' };
        newState = { ...gameState, totalKmRun: newTotal, entitySpeed: newSpeed, lastSpeedUpdateDay: newUpdateDay, runHistory: [newRun, ...gameState.runHistory] };
    }

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
    setShowLogModal(false);
  };

  const handleCompleteOnboarding = async (setupData) => {
    if (!user) return;
    const newState = {
      ...gameState,
      startDate: new Date().toISOString(),
      duration: setupData.duration,
      avatarId: setupData.avatarId,
      difficulty: setupData.difficulty,
      entitySpeed: 3,
      lastSpeedUpdateDay: 0,
      totalKmRun: 0,
      runHistory: [],
      onboardingComplete: true,
      totalPausedHours: 0,
      lastEmpUsage: null,
      empUsageCount: 0,
      boostUsageCount: 0,
      inventory: { battery: 0, emitter: 0, casing: 0 },
      activeQuest: null,
      badges: [],
      continuesUsed: 0
    };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const toggleStravaLink = async () => {
    if (!user) return;
    const newState = { ...gameState, isStravaLinked: !gameState.isStravaLinked };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  // --- Sub-Components ---
  
  const GameOverScreen = () => {
      return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 animate-pulse"></div>
                <Skull size={120} className="text-red-600 relative z-10 animate-bounce" />
            </div>
            
            <h1 className="text-5xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px red'}}>CAUGHT</h1>
            <p className="text-red-400 font-bold text-lg mb-8 uppercase tracking-widest">Signal Lost &bull; Day {daysSinceStart}</p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8">
                 <div className="flex justify-between items-center text-slate-400 text-sm mb-4 pb-4 border-b border-slate-800">
                    <span>Distance Run</span>
                    <span className="text-white font-bold">{userDistance.toFixed(1)} km</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-400 text-sm mb-4 pb-4 border-b border-slate-800">
                    <span>Days Survived</span>
                    <span className="text-white font-bold">{daysSinceStart} days</span>
                 </div>
                 <div className="flex justify-between items-center text-slate-400 text-sm">
                    <span>Entity Speed</span>
                    <span className="text-red-400 font-bold">{gameState.entitySpeed} km/day</span>
                 </div>
            </div>

            <div className="w-full max-w-sm space-y-4">
                <button 
                    onClick={handleContinueGame}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105"
                >
                    <HeartPulse size={24} /> CONTINUE ($1.00)
                </button>
                <p className="text-xs text-slate-500">Rewinds the Entity by 48 hours. Resume immediately.</p>

                <button 
                    onClick={handleRestartGame}
                    className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all"
                >
                    <RotateCcw size={18} /> ACCEPT FATE & RESTART
                </button>
            </div>
        </div>
      );
  };

  const VictoryScreen = () => {
    let storeUrl = "#";
    let tierName = "";
    
    switch(gameState.duration) {
        case 30: storeUrl = "https://store.theentity.app/30-day-survivor"; tierName = "30-Day Survivor"; break;
        case 90: storeUrl = "https://store.theentity.app/90-day-veteran"; tierName = "90-Day Veteran"; break;
        case 365: storeUrl = "https://store.theentity.app/year-1-legend"; tierName = "Year 1 Legend"; break;
        default: storeUrl = "https://store.theentity.app/survivor"; tierName = "Survivor";
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-20 animate-pulse"></div>
                <ShieldCheck size={120} className="text-emerald-500 relative z-10 animate-bounce" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px #10b981'}}>MISSION ACCOMPLISHED</h1>
            <p className="text-emerald-400 font-bold text-lg mb-8 uppercase tracking-widest">You are safe.</p>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8">
                 <p className="text-slate-300 mb-4">You have successfully evaded the Entity for {gameState.duration} days.</p>
                 <div className="inline-block bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-4 py-2 rounded-full font-bold uppercase text-sm mb-2">Rank Achieved: {tierName}</div>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105">
                    <ShoppingBag size={24} /> ACCESS {gameState.duration}-DAY STORE
                </a>
                <button onClick={handleRestartGame} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                    <RotateCcw size={18} /> START NEW OPERATION
                </button>
            </div>
        </div>
    );
  };

  const OnboardingWizard = () => {
    const [step, setStep] = useState(1);
    const [duration, setDuration] = useState(30);
    const [difficulty, setDifficulty] = useState('easy');
    const [avatarId, setAvatarId] = useState('sprinter');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black text-white italic uppercase tracking-wider mb-2 flex items-center justify-center gap-2"><Skull className="text-purple-500" /> The Entity</h1>
            <p className="text-slate-500">Setup your escape protocol.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">1. Choose Challenge Duration</h2>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {[30, 90, 365].map(d => (
                    <button key={d} onClick={() => setDuration(d)} className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${duration === d ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                      <div><div className="font-bold text-lg text-white">{d === 365 ? '1 Year' : `${d} Days`}</div><div className="text-sm text-slate-400">Survival Goal</div></div>
                      {duration === d && <CheckCircle2 className="text-purple-500" />}
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">Next Step <ChevronRight size={20} /></button>
              </div>
            )}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">2. Select Difficulty</h2>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {Object.values(DIFFICULTIES).map(diff => (
                    <button key={diff.id} onClick={() => setDifficulty(diff.id)} className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${difficulty === diff.id ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                      <div><div className={`font-bold text-lg ${diff.color}`}>{diff.label}</div><div className="text-sm text-slate-400">{diff.desc}</div></div>
                      {difficulty === diff.id && <CheckCircle2 className="text-purple-500" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                     <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white">Back</button>
                     <button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">Next Step <ChevronRight size={20} /></button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                <h2 className="text-xl font-bold text-white mb-6">3. Select Your Runner</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {Object.values(AVATARS).map((av) => {
                    const Icon = av.icon;
                    const isSelected = avatarId === av.id;
                    return (
                      <button key={av.id} onClick={() => setAvatarId(av.id)} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 ${isSelected ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                         <div className={`p-3 rounded-full ${isSelected ? av.bg : 'bg-slate-700'} text-white transition-colors`}><Icon size={24} /></div>
                         <div><div className="font-bold text-white text-sm">{av.name}</div><div className="text-[10px] text-slate-400 leading-tight mt-1">{av.desc}</div></div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white">Back</button>
                    <button onClick={() => handleCompleteOnboarding({ duration, avatarId, difficulty })} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">Accept Challenge</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const LogRunModal = () => {
    const [km, setKm] = useState('');
    const [notes, setNotes] = useState('');
    const [isQuestRun, setIsQuestRun] = useState(false);
    const hasActiveQuest = gameState.activeQuest && gameState.activeQuest.status === 'active';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Activity className="text-emerald-500" /> Log Activity</h2>
          <div className="space-y-4">
            <div><label className="text-slate-400 text-sm block mb-1">Distance (km)</label><input type="number" step="0.1" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.0" value={km} onChange={(e) => setKm(e.target.value)} autoFocus /></div>
            <div><label className="text-slate-400 text-sm block mb-1">Notes (Optional)</label><input type="text" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            {hasActiveQuest && (
                <div onClick={() => setIsQuestRun(!isQuestRun)} className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${isQuestRun ? 'bg-amber-900/30 border-amber-600' : 'bg-slate-800 border-slate-700'}`}>
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${isQuestRun ? 'bg-amber-500 border-amber-500' : 'border-slate-500'}`}>{isQuestRun && <CheckCircle2 size={14} className="text-black" />}</div>
                    <div><span className={`font-bold text-sm block ${isQuestRun ? 'text-amber-400' : 'text-slate-300'}`}>Side Quest Run</span><p className="text-xs text-slate-500">Apply distance to current mission only. <br/>Warning: Does not increase survival distance.</p></div>
                </div>
            )}
          </div>
          <div className="flex gap-3 mt-6"><button onClick={() => setShowLogModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white">Cancel</button><button onClick={() => handleAddRun(km, notes, isQuestRun)} disabled={!km} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg disabled:opacity-50">Log Run</button></div>
        </div>
      </div>
    );
  };

  const SettingsModal = () => {
    const [speed, setSpeed] = useState(gameState.entitySpeed);
    const [sDate, setSDate] = useState(gameState.startDate.split('T')[0]);
    const [adaptive, setAdaptive] = useState(gameState.adaptiveMode);

    const handleSave = async () => {
        let finalSpeed = parseFloat(speed);
        if (adaptive) {
            const elapsed = Math.max(1, Math.floor((new Date() - new Date(sDate)) / (1000 * 3600 * 24)));
            finalSpeed = calculateAdaptiveSpeed(gameState.totalKmRun, elapsed, gameState.difficulty);
        }