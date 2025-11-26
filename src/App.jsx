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
  Activity, 
  Skull, 
  Settings, 
  Plus, 
  AlertTriangle,
  MapPin,
  History,
  X,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
  BrainCircuit,
  Zap,
  Timer,
  ShieldCheck,
  Compass,
  Map as MapIcon,
  Shield,
  ChevronRight,
  ZapOff,
  Lock,
  Rocket,
  Wrench,
  Cpu,
  Disc,
  Award,
  ArrowRightLeft,
  HeartPulse,
  RotateCcw,
  ShoppingBag,
  BarChart3
} from 'lucide-react';

// --- Firebase Initialization ---
// Corrected Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsssP-dGeIbuz29TUKmGMQ51j8GstFlkQ",
  authDomain: "the-entity-a7c4b.firebaseapp.com",
  projectId: "the-entity-a7c4b",
  storageBucket: "the-entity-a7c4b.firebasestorage.app",
  messagingSenderId: "1038035853632",
  appId: "1:1038035853632:web:5934d566a958282f4d9aa5"
};
// -------------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Helpers ---
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

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

// --- Main Component ---
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
  const timeDiff = today.getTime() - gameStart.getTime();
  const daysSinceStart = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24))); 
  
  // EMP Logic
  const EMP_DURATION_HOURS = 25;
  const EMP_COOLDOWN_DAYS = 90;
  const lastEmpDate = gameState.lastEmpUsage ? new Date(gameState.lastEmpUsage) : null;
  const isEmpActive = lastEmpDate && (today.getTime() - lastEmpDate.getTime()) < (EMP_DURATION_HOURS * 60 * 60 * 1000);
  const daysSinceEmp = lastEmpDate ? (today.getTime() - lastEmpDate.getTime()) / (1000 * 3600 * 24) : 999;
  const empCooldownRemaining = Math.max(0, Math.ceil(EMP_COOLDOWN_DAYS - daysSinceEmp));
  const isEmpAvailable = daysSinceEmp >= EMP_COOLDOWN_DAYS;
  const isEmpFree = (gameState.empUsageCount || 0) === 0;
  const isBoostFree = (gameState.boostUsageCount || 0) === 0;

  // Grace Period
  const isGracePeriod = daysSinceStart < 1;
  
  // Entity Calculation
  const pausedDaysOffset = (gameState.totalPausedHours || 0) / 24;
  const entityActiveDays = Math.max(0, daysSinceStart - 1 - pausedDaysOffset);
  const entityDistance = entityActiveDays * gameState.entitySpeed;
  const userDistance = gameState.totalKmRun;
  const distanceGap = userDistance - entityDistance;
  
  // Conditions
  const isCaught = distanceGap <= 0 && !isGracePeriod;
  const isVictory = daysSinceStart >= gameState.duration && !isCaught;
  const daysUntilCaught = distanceGap > 0 ? Math.floor(distanceGap / gameState.entitySpeed) : 0;
  
  // AI Cycle
  const daysToNextUpdate = 4 - (daysSinceStart % 4);

  // --- Auth & Data ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to sign in with the environment's token first
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        // If the token fails (because it doesn't match your custom firebaseConfig),
        // fallback to anonymous sign-in so the app still works.
        console.log("Auth mismatch detected, falling back to anonymous login:", error);
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');

    const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGameState({
          onboardingComplete: data.onboardingComplete !== undefined ? data.onboardingComplete : true,
          startDate: data.startDate || new Date().toISOString(),
          duration: data.duration || 365,
          avatarId: data.avatarId || 'sprinter',
          difficulty: data.difficulty || 'easy',
          entitySpeed: data.entitySpeed || 3,
          lastSpeedUpdateDay: data.lastSpeedUpdateDay || 0,
          adaptiveMode: data.adaptiveMode !== undefined ? data.adaptiveMode : true,
          totalKmRun: data.totalKmRun || 0,
          runHistory: data.runHistory || [],
          isStravaLinked: data.isStravaLinked || false,
          lastSyncTime: data.lastSyncTime || null,
          lastEmpUsage: data.lastEmpUsage || null,
          totalPausedHours: data.totalPausedHours || 0,
          empUsageCount: data.empUsageCount || 0,
          boostUsageCount: data.boostUsageCount || 0,
          inventory: data.inventory || { battery: 0, emitter: 0, casing: 0 },
          activeQuest: data.activeQuest || null,
          badges: data.badges || [],
          lastQuestGenerationDay: data.lastQuestGenerationDay || 0,
          continuesUsed: data.continuesUsed || 0
        });
      } else {
        setGameState(prev => ({ ...prev, onboardingComplete: false }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching game data:", error);
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
              const randomDist = Math.floor(Math.random() * 8) + 5; 
              const newQuest = {
                  id: Date.now(),
                  title: `Scavenge Mission ${gameState.badges.length + 1}`,
                  distance: randomDist,
                  progress: 0,
                  rewardPart: randomPart,
                  status: 'available'
              };
              const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
              setDoc(userDocRef, {
                  ...gameState,
                  activeQuest: newQuest,
                  lastQuestGenerationDay: daysSinceStart
              });
          }
      }
  }, [daysSinceStart, user, loading]);

  // --- Helper Functions ---
  const calculateAdaptiveSpeed = (totalKm, activeDays, diff) => {
    if (activeDays < 1) return 3;
    const avgDaily = totalKm / activeDays;
    const multiplier = DIFFICULTIES[diff || 'easy'].multiplier;
    return parseFloat(Math.max(3, (avgDaily * multiplier)).toFixed(2));
  };

  const getPartIcon = (partId) => {
      const part = EMP_PARTS.find(p => p.id === partId);
      return part ? part.icon : Wrench;
  };

  // --- Core Actions ---
  const handleAcceptQuest = async () => {
      if (!user || !gameState.activeQuest) return;
      const updatedQuest = { ...gameState.activeQuest, status: 'active' };
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
      await setDoc(userDocRef, { ...gameState, activeQuest: updatedQuest });
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
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    await setDoc(userDocRef, newState);
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
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    await setDoc(userDocRef, newState);
  };

  const handleContinueGame = async () => {
    if (!user) return;
    if (!confirm("ACTIVATE ADRENALINE SHOT?\n\nCost: $1.00\nEffect: Pushes the Entity back by 48 hours. You will survive... for now.")) return;

    const newState = {
        ...gameState,
        totalPausedHours: (gameState.totalPausedHours || 0) + 48,
        continuesUsed: (gameState.continuesUsed || 0) + 1
    };
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    await setDoc(userDocRef, newState);
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
     const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
     await setDoc(userDocRef, newState);
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

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    await setDoc(userDocRef, newState);
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
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    await setDoc(userDocRef, newState);
  };

  const toggleStravaLink = async () => {
    if (!user) return;
    const newState = { ...gameState, isStravaLinked: !gameState.isStravaLinked };
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    await setDoc(userDocRef, newState);
  };

  const syncStravaActivities = async () => {
      if (!user) return;
      setIsSyncing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const numNewRuns = Math.floor(Math.random() * 2) + 1; 
      const newRuns = [];
      let addedDist = 0;
      for(let i=0; i<numNewRuns; i++) {
          const dist = (Math.random() * 5 + 3).toFixed(2);
          addedDist += parseFloat(dist);
          newRuns.push({
              id: Date.now() + i,
              date: new Date().toISOString(),
              km: parseFloat(dist),
              notes: 'Strava Activity (Simulated)',
              source: 'strava'
          });
      }
      
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
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
      await setDoc(userDocRef, newState);
      setIsSyncing(false);
  };

  // --- Screens ---
  
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

    const handleSave = () => {
        let finalSpeed = parseFloat(speed);
        if (adaptive) {
            const elapsed = Math.max(1, Math.floor((new Date() - new Date(sDate)) / (1000 * 3600 * 24)));
            finalSpeed = calculateAdaptiveSpeed(gameState.totalKmRun, elapsed, gameState.difficulty);
        }
        const newState = { ...gameState, entitySpeed: finalSpeed, startDate: new Date(sDate).toISOString(), adaptiveMode: adaptive };
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
        setDoc(userDocRef, newState);
        setShowSettings(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-slate-400" /> Settings</h2><button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white"><X size={24} /></button></div>
          <div className="space-y-6">
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700"><h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Strava_Logo.svg" alt="Strava" className="h-4" style={{filter: 'brightness(0) invert(1)'}} /> Integration</h3>{gameState.isStravaLinked ? (<div className="space-y-3"><div className="flex items-center gap-2 text-emerald-400 text-sm"><CheckCircle2 size={16} /> Connected</div><button onClick={toggleStravaLink} className="text-xs text-red-400 underline">Disconnect</button></div>) : (<button onClick={toggleStravaLink} className="w-full bg-[#FC4C02] text-white font-bold py-2 rounded text-sm">Connect Strava</button>)}</div>
            <div className="flex items-start gap-3 p-3 bg-purple-900/20 border border-purple-800/50 rounded-lg"><div className="mt-1"><BrainCircuit size={20} className="text-purple-400" /></div><div className="flex-1"><label className="flex items-center justify-between cursor-pointer mb-1"><span className="font-bold text-white">The Entity AI</span><div className={`w-10 h-5 rounded-full relative transition-colors ${adaptive ? 'bg-purple-500' : 'bg-slate-700'}`} onClick={() => setAdaptive(!adaptive)}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${adaptive ? 'left-6' : 'left-1'}`}></div></div></label><p className="text-xs text-slate-400">{adaptive ? `The Entity is learning (${gameState.difficulty} mode).` : "Manual mode enabled."}</p></div></div>
            <div className={adaptive ? "opacity-50 pointer-events-none grayscale" : ""}><label className="text-slate-400 text-sm block mb-1">Entity Speed (km/day)</label><div className="flex items-center gap-4"><input type="range" min="1" max="15" step="0.1" value={speed} onChange={(e) => setSpeed(e.target.value)} className="w-full accent-red-500" /><span className="text-red-400 font-mono font-bold w-12 text-right">{speed}k</span></div></div>
            <div><label className="text-slate-400 text-sm block mb-1">Chase Start Date</label><input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white"/></div>
             <div className="pt-4 border-t border-slate-800"><button onClick={handleRestartGame} className="w-full py-2 text-red-500 text-sm hover:text-red-400 hover:bg-red-950/30 rounded transition-colors">Reset Progress & Setup</button></div>
          </div>
          <div className="mt-6"><button onClick={handleSave} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all">Save Changes</button></div>
        </div>
      </div>
    );
  };

  const VisualMap = () => {
    const UserAvatar = AVATARS[gameState.avatarId || 'sprinter'];
    const UserIcon = UserAvatar.icon;
    const maxDist = Math.max(userDistance, entityDistance) * 1.2 + 10; 
    const userPct = Math.min((userDistance / maxDist) * 100, 100);
    const entityPct = Math.min((entityDistance / maxDist) * 100, 100);

    return (
      <div className="relative h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700 mb-6 overflow-hidden">
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-0 bottom-0 right-0 w-8 bg-stripes-slate opacity-20 border-l border-slate-600"></div>
        <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-20" style={{ left: `${userPct}%` }}>
          <div className="relative"><div className={`absolute -top-10 -left-6 ${UserAvatar.bg} text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap`}>YOU</div><div className={`w-6 h-6 ${UserAvatar.bg} rounded-full shadow-[0_0_15px_currentColor] border-2 border-slate-900 flex items-center justify-center text-white z-20 relative`}><UserIcon size={14} /></div></div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out z-10" style={{ left: `${entityPct}%` }}>
          <div className="relative">
             {isGracePeriod ? <div className="absolute top-6 -left-6 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 opacity-75"><Timer size={10} /> INITIALISING</div> : isEmpActive ? <div className="absolute top-6 -left-6 bg-cyan-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 animate-pulse"><ZapOff size={10} /> STUNNED</div> : <div className="absolute top-6 -left-6 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1"><Skull size={10} /> IT</div>}
             <div className={`w-5 h-5 rotate-45 border-2 border-slate-900 transition-colors ${isGracePeriod ? 'bg-slate-600' : isEmpActive ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]'}`}></div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 animate-pulse"><Activity size={48} className="mb-4" /><p>Syncing with satellite...</p></div>;
  if (!gameState.onboardingComplete) return <OnboardingWizard />;
  if (isVictory) return <VictoryScreen />;
  if (isCaught) return <GameOverScreen />;

  let BannerContent;
  if (isEmpActive) {
      BannerContent = (<><div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none"></div><span className="text-cyan-400 uppercase text-xs font-bold tracking-widest mb-1 block flex items-center justify-center gap-1"><ZapOff size={12} /> Countermeasure Active</span><div className="text-2xl font-black text-white mb-1 uppercase tracking-wider">ENTITY STUNNED</div><p className="text-cyan-200 font-medium text-sm">The Entity is frozen. It will not move for the duration.</p></>);
  } else if (isGracePeriod) {
    BannerContent = (<><div className="absolute inset-0 bg-emerald-600/5 pointer-events-none"></div><span className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1 block flex items-center justify-center gap-1"><ShieldCheck size={12} /> Status</span><div className="text-2xl font-black text-white mb-1 uppercase tracking-wider">ENTITY INITIALISATION</div><p className="text-slate-400 font-medium text-sm">The Entity is dormant. It starts moving in 24h.</p></>);
  } else {
    BannerContent = (<><span className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1 block">Current Status</span><div className="text-4xl font-black text-white mb-1">{Math.abs(distanceGap).toFixed(1)} <span className="text-xl text-slate-500">km</span></div><p className="text-emerald-400 font-medium flex items-center justify-center gap-1">Ahead of the Entity</p>{daysUntilCaught < 10 && (<div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-900/30 text-orange-400 rounded-full text-xs font-bold border border-orange-900/50"><AlertTriangle size={12} />{daysUntilCaught === 0 ? "Catch imminent (< 24h)" : `${daysUntilCaught} days of safety remaining`}</div>)}</>);
  }
  const hasCraftedEmp = gameState.inventory.battery > 0 && gameState.inventory.emitter > 0 && gameState.inventory.casing > 0;
  const diffLabel = DIFFICULTIES[gameState.difficulty]?.label || 'Standard';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30">
      <style jsx global>{`.bg-stripes-slate {background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 50%, #1e293b 50%, #1e293b 75%, transparent 75%, transparent);background-size: 10px 10px;}`}</style>
      {showLogModal && <LogRunModal />}
      {showSettings && <SettingsModal />}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800"><div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center shadow-lg shadow-purple-900/50"><Skull className="text-white" size={20} /></div><h1 className="text-xl font-black tracking-wider uppercase italic">The Entity</h1></div><div className="flex items-center gap-1"><button onClick={() => setShowLogModal(true)} className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"><Plus size={20} /></button><button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button></div></div></div>
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div className={`mb-8 p-6 rounded-2xl border ${isCaught ? 'bg-red-900/20 border-red-800' : isEmpActive ? 'bg-cyan-900/20 border-cyan-800' : 'bg-slate-900 border-slate-800'} text-center shadow-2xl relative overflow-hidden`}>{BannerContent}</div>
        <VisualMap />
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><MapPin size={12} /> Your Distance</div><div className="text-2xl font-bold text-emerald-400">{userDistance.toFixed(1)}k</div></div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden"><div className="absolute -right-4 -top-4 text-purple-900/20"><Skull size={64} /></div><div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10"><Zap size={12} /> Entity Speed</div><div className="text-2xl font-bold text-purple-400 relative z-10">{gameState.entitySpeed}k<span className="text-sm text-slate-500">/day</span></div><div className="text-xs text-slate-500 mt-1 relative z-10 flex items-center gap-1"><BarChart3 size={10} /> {diffLabel} Mode</div></div>
        </div>
        {gameState.adaptiveMode && (
             <div className="text-center text-xs text-slate-600 mb-8 flex items-center justify-center gap-1">
                <Timer size={10} /> Next evolution in {daysToNextUpdate} days
             </div>
        )}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Award size={16} /> Current Mission</h3>{gameState.badges.length > 0 && <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{gameState.badges.length} Badges</span>}</div>
            {!gameState.activeQuest ? (<div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">No signals detected. Next mission available in {5 - (daysSinceStart % 5)} days.</div>) : (<div className={`bg-gradient-to-r from-slate-900 to-slate-900 border rounded-xl p-4 relative overflow-hidden ${gameState.activeQuest.status === 'active' ? 'border-amber-600' : 'border-slate-700'}`}>{gameState.activeQuest.status === 'active' && <div className="absolute top-0 right-0 bg-amber-600 text-black text-[10px] font-bold px-2 py-1 rounded-bl">ACTIVE</div>}<div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-white flex items-center gap-2"><ArrowRightLeft className="text-amber-500" size={16} /> {gameState.activeQuest.title}</h4><p className="text-xs text-slate-400 mt-1 max-w-[80%]">Run {gameState.activeQuest.distance}km off-track to recover parts. Entity continues moving.</p></div><div className="flex flex-col items-end"><span className="text-xs text-slate-500 uppercase tracking-wide">Reward</span><div className="flex items-center gap-1 text-amber-400 text-sm font-bold">{React.createElement(getPartIcon(gameState.activeQuest.rewardPart), {size: 14})}{EMP_PARTS.find(p => p.id === gameState.activeQuest.rewardPart).name}</div></div></div>{gameState.activeQuest.status === 'active' ? (<div className="mt-4"><div className="flex justify-between text-xs text-slate-400 mb-1"><span>Progress</span><span>{gameState.activeQuest.progress.toFixed(1)} / {gameState.activeQuest.distance} km</span></div><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{width: `${(gameState.activeQuest.progress / gameState.activeQuest.distance) * 100}%`}}></div></div></div>) : (<button onClick={handleAcceptQuest} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700 font-bold py-2 rounded-lg text-sm transition-colors">Accept Mission</button>)}</div>)}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3"><h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">EMP Components</h3><div className="flex justify-between items-center px-1">{EMP_PARTS.map(part => {const count = gameState.inventory[part.id]; const hasPart = count > 0; const Icon = part.icon; return (<div key={part.id} className={`flex flex-col items-center gap-1 ${hasPart ? part.color : 'text-slate-700'}`}><div className={`w-8 h-8 rounded-full border flex items-center justify-center relative ${hasPart ? `bg-slate-800 ${part.color} border-slate-600` : 'bg-slate-900 border-slate-800'}`}><Icon size={16} />{count > 1 && <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] w-3 h-3 flex items-center justify-center rounded-full font-bold">{count}</span>}</div></div>)})}</div>{hasCraftedEmp && <div className="mt-2 text-center text-[10px] text-emerald-400 animate-pulse font-bold">COMPONENTS ASSEMBLED</div>}</div>
            <div className="space-y-2">
                 <button onClick={handleBuyEMP} disabled={!isEmpAvailable || isGracePeriod} className={`w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${!isEmpAvailable || isGracePeriod ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-950 text-cyan-400 hover:bg-cyan-900'}`}>{isEmpAvailable ? (<><div className="flex items-center gap-1"><ZapOff size={14} /> EMP Burst</div><span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800 uppercase tracking-wider">{hasCraftedEmp ? "CRAFTED" : isEmpFree ? "FREE" : "$1.00"}</span></>) : (<><Lock size={14} /> <span className="text-[9px]">{empCooldownRemaining}d Left</span></>)}</button>
                <button onClick={handleBuyBoost} className="w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all bg-yellow-950 text-yellow-400 hover:bg-yellow-900"><div className="flex items-center gap-1"><Rocket size={14} /> Boost 15%</div><span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800 uppercase tracking-wider">{isBoostFree ? "FREE" : "$1.00"}</span></button>
            </div>
        </div>
        {gameState.isStravaLinked ? (<button onClick={syncStravaActivities} disabled={isSyncing} className="w-full bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-70 transition-all py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 mb-8">{isSyncing ? "Syncing..." : "Sync Strava"}</button>) : (<button onClick={() => setShowSettings(true)} className="w-full bg-slate-800 hover:bg-slate-700 transition-all py-4 rounded-xl font-bold text-lg text-white border border-slate-700 flex items-center justify-center gap-2 mb-8"><LinkIcon size={20} className="text-slate-400" /> Connect Strava</button>)}
        <div className="mb-8"><h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><History size={16} /> Recent Logs</h3><div className="space-y-3">{gameState.runHistory.length === 0 ? (<div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">No runs logged yet. Start running.</div>) : (gameState.runHistory.slice(0, 5).map((run) => (<div key={run.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center"><div><div className="text-white font-bold flex items-center gap-2">{run.km} km{run.source === 'strava' && <span className="text-[10px] bg-[#FC4C02]/20 text-[#FC4C02] px-1.5 py-0.5 rounded border border-[#FC4C02]/30">STRAVA</span>}{run.type === 'boost' && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">BOOST</span>}{run.type === 'quest' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">QUEST</span>}</div><div className="text-slate-500 text-xs">{formatDate(new Date(run.date))} &bull; {run.notes}</div></div><div className="bg-slate-800 p-2 rounded-lg text-slate-400">{run.type === 'boost' ? <Rocket size={16} className="text-yellow-400" /> : run.type === 'quest' ? <Award size={16} className="text-amber-400" /> : <Activity size={16} />}</div></div>)))}</div></div>
        <div className="text-center text-slate-600 text-xs">Start Date: {formatDate(gameStart)} &bull; Day {daysSinceStart} of {gameState.duration}</div>
      </div>
    </div>
  );
}