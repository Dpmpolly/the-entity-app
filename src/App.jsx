import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged,
  deleteUser,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { 
  Activity, Skull, Settings, Plus, AlertTriangle, MapPin, History, X, 
  Link as LinkIcon, RefreshCw, CheckCircle2, BrainCircuit, Zap, Timer, 
  ShieldCheck, Compass, Map as MapIcon, Shield, ChevronRight, ZapOff, 
  Lock, Rocket, Wrench, Cpu, Disc, Award, ArrowRightLeft, HeartPulse, 
  RotateCcw, ShoppingBag, BarChart3, User, Trash2, LogOut
} from 'lucide-react';

// --- CONFIGURATION ---
// Fixed Syntax Error Here
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

// --- GAME DEFINITIONS ---
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
    easy:   { id: 'easy',   label: 'Standard', multiplier: 0.85, color: 'text-emerald-400', desc: 'Entity matches 85% of Avg.' },
    medium: { id: 'medium', label: 'Intense',  multiplier: 0.90, color: 'text-yellow-400',  desc: 'Entity matches 90% of Avg.' },
    hard:   { id: 'hard',   label: 'Nightmare',multiplier: 0.95, color: 'text-red-500',     desc: 'Entity matches 95% of Avg.' }
};

// --- HELPER FUNCTIONS ---
const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// --- SUB-COMPONENTS ---

const LogRunModal = ({ onClose, onSave, activeQuest }) => {
    const [km, setKm] = useState('');
    const [notes, setNotes] = useState('');
    const [isQuestRun, setIsQuestRun] = useState(false);
  
    const handleSubmit = () => {
      if (!km || parseFloat(km) <= 0) return alert("Please enter a valid distance.");
      onSave(km, notes, isQuestRun);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h3 className="font-bold text-white flex items-center gap-2"><Plus size={18} className="text-emerald-400"/> Manual Log</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Distance (km)</label>
              <input type="number" step="0.01" value={km} onChange={(e) => setKm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white text-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mission Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Morning run..." />
            </div>
            
            {activeQuest && activeQuest.status === 'active' && (
                <div className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${isQuestRun ? 'bg-amber-900/20 border-amber-500/50' : 'bg-slate-950 border-slate-800'}`} onClick={() => setIsQuestRun(!isQuestRun)}>
                    <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isQuestRun ? 'bg-amber-500 border-amber-500 text-black' : 'border-slate-600'}`}>
                            {isQuestRun && <CheckCircle2 size={14} />}
                        </div>
                        <div className="text-sm text-slate-300">Apply to Quest?</div>
                    </div>
                    <Award size={16} className={isQuestRun ? 'text-amber-500' : 'text-slate-600'} />
                </div>
            )}
  
            <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-2">
              SAVE LOG
            </button>
          </div>
        </div>
      </div>
    );
  };
  
const SettingsModal = ({ onClose, user, gameState, onLogout, onDelete, onConnectStrava }) => {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-white flex items-center gap-2"><Settings size={18} className="text-slate-400"/> Settings</h3>
              <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              
              {/* User Info */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><User size={20}/></div>
                  <div className="overflow-hidden">
                      <div className="text-white font-bold truncate">{gameState.username || 'Agent'}</div>
                      <div className="text-xs text-slate-500 truncate">ID: {user?.uid.slice(0,8)}...</div>
                  </div>
              </div>
  
              {/* Integrations */}
              <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Integrations</label>
                  <button onClick={onConnectStrava} className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${gameState.isStravaLinked ? 'bg-[#FC4C02]/10 border-[#FC4C02] text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                      <div className="flex items-center gap-3">
                          <LinkIcon size={18} />
                          <span>{gameState.isStravaLinked ? 'Strava Connected' : 'Connect Strava'}</span>
                      </div>
                      {gameState.isStravaLinked && <CheckCircle2 size={18} className="text-[#FC4C02]" />}
                  </button>
                  <div className="text-[10px] text-center text-slate-500 mt-2">
                      Powered by Strava. <a href="/support.html" className="underline hover:text-white">Privacy & Support</a>
                  </div>
              </div>
  
              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                  <button onClick={onLogout} className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                      <LogOut size={16} /> Disconnect (Logout)
                  </button>
                  <button onClick={onDelete} className="w-full py-3 rounded-xl border border-red-900/30 text-red-500 font-bold hover:bg-red-900/10 flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Burn Identity (Delete)
                  </button>
              </div>
            </div>
          </div>
        </div>
      );
  };

// --- MAIN COMPONENT ---
export default function TheEntity() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Logic Guards
  const hasExchangedCode = useRef(false);
  
  // Game Data State
  const [gameState, setGameState] = useState({
    onboardingComplete: false,
    startDate: new Date().toISOString(),
    duration: 365,
    avatarId: 'sprinter',
    difficulty: 'easy',
    username: 'Runner',
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

  // --- REAL TIME CALCULATIONS (The Engine) ---
  const today = new Date();
  const safeStartDate = gameState.startDate ? new Date(gameState.startDate) : new Date();
  
  const msElapsed = today.getTime() - safeStartDate.getTime();
  const hoursElapsed = msElapsed / (1000 * 60 * 60); 
  const daysSinceStart = Math.floor(hoursElapsed / 24);

  const gracePeriodHours = 24;
  const activeEntityHours = Math.max(0, hoursElapsed - gracePeriodHours - (gameState.totalPausedHours || 0));
  const speedPerHour = gameState.entitySpeed / 24;
  const entityDistance = activeEntityHours * speedPerHour;

  const userDistance = gameState.totalKmRun;
  const distanceGap = userDistance - entityDistance;
  
  const isGracePeriod = hoursElapsed < gracePeriodHours;
  const isCaught = distanceGap <= 0 && !isGracePeriod;
  const isVictory = daysSinceStart >= gameState.duration && !isCaught;
  
  const EMP_DURATION_HOURS = 25;
  const EMP_COOLDOWN_DAYS = 90;
  const lastEmpDate = gameState.lastEmpUsage ? new Date(gameState.lastEmpUsage) : null;
  const isEmpActive = lastEmpDate && (today.getTime() - lastEmpDate.getTime()) < (EMP_DURATION_HOURS * 3600000);
  const daysSinceEmp = lastEmpDate ? (today.getTime() - lastEmpDate.getTime()) / 86400000 : 999;
  const isEmpAvailable = daysSinceEmp >= EMP_COOLDOWN_DAYS;
  const empCooldownRemaining = Math.max(0, Math.ceil(EMP_COOLDOWN_DAYS - daysSinceEmp));
  const isEmpFree = (gameState.empUsageCount || 0) === 0;
  const isBoostFree = (gameState.boostUsageCount || 0) === 0;
  
  const daysUntilCaught = distanceGap > 0 ? Math.floor(distanceGap / gameState.entitySpeed) : 0;
  const daysToNextUpdate = 4 - (daysSinceStart % 4);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth failed", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- STRAVA TOKEN HANDLING ---
  useEffect(() => {
    if (!user) return;
    
    const params = new URLSearchParams(window.location.search);
    const stravaCode = params.get('code');

    if (stravaCode && !hasExchangedCode.current) {
       hasExchangedCode.current = true;
       const exchangeToken = async () => {
          try {
             const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
             const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;

             if (!clientId) {
                 alert("Setup Error: VITE_STRAVA_CLIENT_ID missing in Vercel.");
                 return;
             }
             
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
          }
       };
       exchangeToken();
    }
  }, [user]);

  // --- DATABASE LISTENER ---
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

  // --- GAME LOOP: QUEST GENERATION ---
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

  // --- CORE FUNCTIONS ---
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

  const handleStravaLogin = () => {
      const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
      if (!clientId) {
          alert("Error: VITE_STRAVA_CLIENT_ID not found.");
          return;
      }
      const redirectUri = window.location.origin; 
      const scope = "activity:read_all";
      window.location.href = `http://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
      if (!confirm("DELETE ACCOUNT?\n\nThis will permanently erase your progress and disconnect Strava. This cannot be undone.")) return;
      
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'));
          await deleteUser(user);
          window.location.reload();
      } catch (error) {
          alert("Error deleting data: " + error.message);
      }
  };

  const syncStravaActivities = async () => {
      if (!user || !gameState.stravaAccessToken) {
          alert("Please connect Strava first.");
          return;
      }

      const COOLDOWN_MINUTES = 15;
      if (gameState.lastSyncTime) {
          const lastSync = new Date(gameState.lastSyncTime).getTime();
          const now = new Date().getTime();
          const diffMinutes = (now - lastSync) / (1000 * 60);
          
          if (diffMinutes < COOLDOWN_MINUTES) {
              const waitTime = Math.ceil(COOLDOWN_MINUTES - diffMinutes);
              alert(`SATELLITE RECHARGING.\n\nPlease wait ${waitTime} minutes before syncing again to avoid detection.`);
              return; 
          }
      }

      setIsSyncing(true);

      try {
          let token = gameState.stravaAccessToken;
          
          if (gameState.stravaExpiresAt && Date.now() / 1000 > gameState.stravaExpiresAt) {
              const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
              const clientSecret = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
              const refreshRes = await fetch(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${gameState.stravaRefreshToken}`, { method: 'POST' });
              const refreshData = await refreshRes.json();
              
              if (refreshData.access_token) {
                  token = refreshData.access_token;
                  await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), { 
                      stravaAccessToken: token, 
                      stravaRefreshToken: refreshData.refresh_token, 
                      stravaExpiresAt: refreshData.expires_at 
                  }, { merge: true });
              }
          }

          const afterTime = gameState.lastSyncTime ? new Date(gameState.lastSyncTime).getTime() / 1000 : new Date(gameState.startDate).getTime() / 1000;
          
          const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${afterTime}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const activities = await response.json();

          if (!Array.isArray(activities) || activities.length === 0) {
              alert("No new runs found on Strava since last sync.");
              setIsSyncing(false);
              return;
          }

          let addedDist = 0;
          const newRuns = activities
            .filter(act => act.type === 'Run') 
            .map(act => {
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
              alert(`Synced ${newRuns.length} runs totaling ${addedDist.toFixed(2)}km.`);
          } else {
              alert("No 'Run' activities found.");
          }

      } catch (error) {
          console.error("Sync Error", error);
          alert("Error syncing Strava. Please check connection.");
      }
      setIsSyncing(false);
  };

  // --- ITEM HANDLERS ---
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

  // --- UI RENDER: LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 animate-pulse">
        <Activity size={48} className="mb-4" />
        <p>Syncing with satellite...</p>
      </div>
    );
  }

  // --- UI RENDER: ONBOARDING ---
  if (!gameState.onboardingComplete) {
    const OnboardingWizard = () => {
        const [step, setStep] = useState(1);
        const [duration, setDuration] = useState(30);
        const [difficulty, setDifficulty] = useState('easy');
        const [avatarId, setAvatarId] = useState('sprinter');
        const [codename, setCodename] = useState('');

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
                        <h2 className="text-xl font-bold text-white mb-6">3. Operative Codename</h2>
                        <input 
                            type="text" 
                            value={codename}
                            onChange={(e) => setCodename(e.target.value)}
                            placeholder="Enter your alias..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-center text-lg focus:ring-2 focus:ring-purple-500 outline-none mb-8 uppercase tracking-widest"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setStep(2)} className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white">Back</button>
                            <button 
                                disabled={!codename}
                                onClick={() => setStep(4)} 
                                className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                            >
                                Next Step <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
                {step === 4 && (
                  <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">4. Select Your Runner</h2>
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
                        <button onClick={() => setStep(3)} className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white">Back</button>
                        <button onClick={() => handleCompleteOnboarding({ duration, avatarId, difficulty, username: codename })} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">INITIATE PROTOCOL</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    };
    return <OnboardingWizard />;
  }

  // --- UI RENDER: GAME OVER ---
  if (isCaught) return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
        <div className="mb-8 relative">
            <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 animate-pulse"></div>
            <Skull size={120} className="text-red-600 relative z-10 animate-bounce" />
        </div>
        <h1 className="text-5xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px red'}}>CAUGHT</h1>
        <p className="text-red-400 font-bold text-lg mb-8 uppercase tracking-widest">Signal Lost &bull; Day {daysSinceStart}</p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8">
             <div className="flex justify-between items-center text-slate-400 text-sm mb-4 pb-4 border-b border-slate-800">
                <span>Distance Run</span><span className="text-white font-bold">{userDistance.toFixed(1)} km</span>
             </div>
             <div className="flex justify-between items-center text-slate-400 text-sm mb-4 pb-4 border-b border-slate-800">
                <span>Days Survived</span><span className="text-white font-bold">{daysSinceStart} days</span>
             </div>
             <div className="flex justify-between items-center text-slate-400 text-sm">
                <span>Entity Speed</span><span className="text-red-400 font-bold">{gameState.entitySpeed} km/day</span>
             </div>
        </div>
        <div className="w-full max-w-sm space-y-4">
            <button onClick={handleContinueGame} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105">
                <HeartPulse size={24} /> CONTINUE ($1.00)
            </button>
            <p className="text-xs text-slate-500">Rewinds the Entity by 48 hours. Resume immediately.</p>
            <button onClick={handleRestartGame} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                <RotateCcw size={18} /> ACCEPT FATE & RESTART
            </button>
        </div>
    </div>
  );

  // --- UI RENDER: VICTORY ---
  if (isVictory) return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
        <div className="mb-8 relative">
            <div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-20 animate-pulse"></div>
            <ShieldCheck size={120} className="text-emerald-500 relative z-10 animate-bounce" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px #10b981'}}>MISSION ACCOMPLISHED</h1>
        <p className="text-emerald-400 font-bold text-lg mb-8 uppercase tracking-widest">You are safe.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8">
             <p className="text-slate-300 mb-4">You have successfully evaded the Entity for {gameState.duration} days.</p>
             <div className="inline-block bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-4 py-2 rounded-full font-bold uppercase text-sm mb-2">Rank Achieved: Survivor</div>
        </div>
        <div className="w-full max-w-sm space-y-4">
            <a href={`https://store.theentity.app/${gameState.duration}-day`} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105">
                <ShoppingBag size={24} /> ACCESS {gameState.duration}-DAY STORE
            </a>
            <button onClick={handleRestartGame} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                <RotateCcw size={18} /> START NEW OPERATION
            </button>
        </div>
    </div>
  );

  // --- UI RENDER: DASHBOARD ---
  const UserAvatar = AVATARS[gameState.avatarId || 'sprinter'];
  const maxDist = Math.max(userDistance, entityDistance) * 1.2 + 10; 
  const userPct = Math.min((userDistance / maxDist) * 100, 100);
  const entityPct = Math.min((entityDistance / maxDist) * 100, 100);
  const hasCraftedEmp = gameState.inventory.battery > 0 && gameState.inventory.emitter > 0 && gameState.inventory.casing > 0;
  const diffLabel = DIFFICULTIES[gameState.difficulty]?.label || 'Standard';

  let BannerContent;
  if (isEmpActive) {
      BannerContent = (<><div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none"></div><span className="text-cyan-400 uppercase text-xs font-bold tracking-widest mb-1 block flex items-center justify-center gap-1"><ZapOff size={12} /> Countermeasure Active</span><div className="text-2xl font-black text-white mb-1 uppercase tracking-wider">ENTITY STUNNED</div><p className="text-cyan-200 font-medium text-sm">The Entity is frozen. It will not move for the duration.</p></>);
  } else if (isGracePeriod) {
    BannerContent = (<><div className="absolute inset-0 bg-emerald-600/5 pointer-events-none"></div><span className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1 block flex items-center justify-center gap-1"><ShieldCheck size={12} /> Status</span><div className="text-2xl font-black text-white mb-1 uppercase tracking-wider">ENTITY INITIALISATION</div><p className="text-slate-400 font-medium text-sm">The Entity is dormant. It starts moving in 24h.</p></>);
  } else {
    BannerContent = (<><span className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1 block">Current Status</span><div className="text-4xl font-black text-white mb-1">{Math.abs(distanceGap).toFixed(3)} <span className="text-xl text-slate-500">km</span></div><p className="text-emerald-400 font-medium flex items-center justify-center gap-1">Ahead of the Entity</p>{daysUntilCaught < 10 && (<div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-900/30 text-orange-400 rounded-full text-xs font-bold border border-orange-900/50"><AlertTriangle size={12} />{daysUntilCaught === 0 ? "Catch imminent (< 24h)" : `${daysUntilCaught} days of safety remaining`}</div>)}</>);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30">
      <style jsx global>{`.bg-stripes-slate {background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 50%, #1e293b 50%, #1e293b 75%, transparent 75%, transparent);background-size: 10px 10px;}`}</style>
      
      {showLogModal && <LogRunModal onClose={() => setShowLogModal(false)} onSave={handleAddRun} activeQuest={gameState.activeQuest} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} gameState={gameState} onLogout={handleLogout} onDelete={handleDeleteAccount} onConnectStrava={handleStravaLogin} />}
      
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center shadow-lg shadow-purple-900/50"><Skull className="text-white" size={20} /></div><h1 className="text-xl font-black tracking-wider uppercase italic">The Entity</h1></div>
              <div className="flex items-center gap-1"><button onClick={() => setShowLogModal(true)} className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"><Plus size={20} /></button><button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button></div>
          </div>
      </div>
      
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div className={`mb-8 p-6 rounded-2xl border ${isCaught ? 'bg-red-900/20 border-red-800' : isEmpActive ? 'bg-cyan-900/20 border-cyan-800' : 'bg-slate-900 border-slate-800'} text-center shadow-2xl relative overflow-hidden`}>{BannerContent}</div>
        
        {/* VISUAL MAP */}
        <div className="relative h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700 mb-6 overflow-hidden">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700 -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-0 bottom-0 right-0 w-8 bg-stripes-slate opacity-20 border-l border-slate-600"></div>
            <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-20" style={{ left: `${userPct}%` }}>
              <div className="relative"><div className={`absolute -top-10 -left-6 ${UserAvatar.bg} text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap`}>YOU</div><div className={`w-6 h-6 ${UserAvatar.bg} rounded-full shadow-[0_0_15px_currentColor] border-2 border-slate-900 flex items-center justify-center text-white z-20 relative`}><UserAvatar.icon size={14} /></div></div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-10" style={{ left: `${entityPct}%` }}>
              <div className="relative">
                 {isGracePeriod ? <div className="absolute top-6 -left-6 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 opacity-75"><Timer size={10} /> INITIALISING</div> : isEmpActive ? <div className="absolute top-6 -left-6 bg-cyan-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 animate-pulse"><ZapOff size={10} /> STUNNED</div> : <div className="absolute top-6 -left-6 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1"><Skull size={10} /> IT</div>}
                 <div className={`w-5 h-5 rotate-45 border-2 border-slate-900 transition-colors ${isGracePeriod ? 'bg-slate-600' : isEmpActive ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]'}`}></div>
              </div>
            </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><MapPin size={12} /> Your Distance</div><div className="text-2xl font-bold text-emerald-400">{userDistance.toFixed(1)}k</div></div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden"><div className="absolute -right-4 -top-4 text-purple-900/20"><Skull size={64} /></div><div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10"><Zap size={12} /> Entity Speed</div><div className="text-2xl font-bold text-purple-400 relative z-10">{gameState.entitySpeed}k<span className="text-sm text-slate-500">/day</span></div><div className="text-xs text-slate-500 mt-1 relative z-10 flex items-center gap-1"><BarChart3 size={10} /> {diffLabel} Mode</div></div>
        </div>
        {gameState.adaptiveMode && (
             <div className="text-center text-xs text-slate-600 mb-8 flex items-center justify-center gap-1">
                <Timer size={10} /> Next evolution in {daysToNextUpdate} days
             </div>
        )}

        {/* QUESTS */}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Award size={16} /> Current Mission</h3>{gameState.badges.length > 0 && <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{gameState.badges.length} Badges</span>}</div>
            {!gameState.activeQuest ? (<div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">No signals detected. Next mission available in {5 - (daysSinceStart % 5)} days.</div>) : (<div className={`bg-gradient-to-r from-slate-900 to-slate-900 border rounded-xl p-4 relative overflow-hidden ${gameState.activeQuest.status === 'active' ? 'border-amber-600' : 'border-slate-700'}`}>{gameState.activeQuest.status === 'active' && <div className="absolute top-0 right-0 bg-amber-600 text-black text-[10px] font-bold px-2 py-1 rounded-bl">ACTIVE</div>}<div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-white flex items-center gap-2"><ArrowRightLeft className="text-amber-500" size={16} /> {gameState.activeQuest.title}</h4><p className="text-xs text-slate-400 mt-1 max-w-[80%]">Run {gameState.activeQuest.distance}km off-track to recover parts. Entity continues moving.</p></div><div className="flex flex-col items-end"><span className="text-xs text-slate-500 uppercase tracking-wide">Reward</span><div className="flex items-center gap-1 text-amber-400 text-sm font-bold">{React.createElement(getPartIcon(gameState.activeQuest.rewardPart), {size: 14})}{EMP_PARTS.find(p => p.id === gameState.activeQuest.rewardPart).name}</div></div></div>{gameState.activeQuest.status === 'active' ? (<div className="mt-4"><div className="flex justify-between text-xs text-slate-400 mb-1"><span>Progress</span><span>{gameState.activeQuest.progress.toFixed(1)} / {gameState.activeQuest.distance} km</span></div><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-amber-500 transition-all" style={{width: `${(gameState.activeQuest.progress / gameState.activeQuest.distance) * 100}%`}}></div></div></div>) : (<button onClick={handleAcceptQuest} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700 font-bold py-2 rounded-lg text-sm transition-colors">Accept Mission</button>)}</div>)}
        </div>

        {/* INVENTORY / ACTIONS */}
        <div className="grid grid-cols-2 gap-2 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3"><h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">EMP Components</h3><div className="flex justify-between items-center px-1">{EMP_PARTS.map(part => {const count = gameState.inventory[part.id]; const hasPart = count > 0; const Icon = part.icon; return (<div key={part.id} className={`flex flex-col items-center gap-1 ${hasPart ? 'text-white' : 'text-slate-700'}`}><div className={`w-8 h-8 rounded-full border flex items-center justify-center relative ${hasPart ? `bg-slate-800 ${part.color||'text-white'} border-slate-600` : 'bg-slate-900 border-slate-800'}`}><Icon size={16} />{count > 1 && <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] w-3 h-3 flex items-center justify-center rounded-full font-bold">{count}</span>}</div></div>)})}</div>{hasCraftedEmp && <div className="mt-2 text-center text-[10px] text-emerald-400 animate-pulse font-bold">COMPONENTS ASSEMBLED</div>}</div>
            <div className="space-y-2">
                 <button onClick={handleBuyEMP} disabled={!isEmpAvailable || isGracePeriod} className={`w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${!isEmpAvailable || isGracePeriod ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-950 text-cyan-400 hover:bg-cyan-900'}`}>{isEmpAvailable ? (<><div className="flex items-center gap-1"><ZapOff size={14} /> EMP Burst</div><span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800 uppercase tracking-wider">{hasCraftedEmp ? "CRAFTED" : isEmpFree ? "FREE" : "$1.00"}</span></>) : (<><Lock size={14} /> <span className="text-[9px]">{empCooldownRemaining}d Left</span></>)}</button>
                <button onClick={handleBuyBoost} className="w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all bg-yellow-950 text-yellow-400 hover:bg-yellow-900"><div className="flex items-center gap-1"><Rocket size={14} /> Boost 15%</div><span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800 uppercase tracking-wider">{isBoostFree ? "FREE" : "$1.00"}</span></button>
            </div>
        </div>

        {/* SYNC BUTTON */}
        {gameState.isStravaLinked ? (<button onClick={syncStravaActivities} disabled={isSyncing} className="w-full bg-[#FC4C02] hover:bg-[#E34402] disabled:opacity-70 transition-all py-4 rounded-xl font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 mb-8">{isSyncing ? "Syncing..." : "Sync Strava"}</button>) : (<button onClick={() => setShowSettings(true)} className="w-full bg-slate-800 hover:bg-slate-700 transition-all py-4 rounded-xl font-bold text-lg text-white border border-slate-700 flex items-center justify-center gap-2 mb-8"><LinkIcon size={20} className="text-slate-400" /> Connect Strava</button>)}
        
        {/* RECENT LOGS */}
        <div className="mb-8"><h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><History size={16} /> Recent Logs</h3><div className="space-y-3">{gameState.runHistory.length === 0 ? (<div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">No runs logged yet. Start running.</div>) : (gameState.runHistory.slice(0, 5).map((run) => (<div key={run.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center"><div><div className="text-white font-bold flex items-center gap-2">{run.km} km{run.source === 'strava' && <span className="text-[10px] bg-[#FC4C02]/20 text-[#FC4C02] px-1.5 py-0.5 rounded border border-[#FC4C02]/30">STRAVA</span>}{run.type === 'boost' && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">BOOST</span>}{run.type === 'quest' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">QUEST</span>}</div><div className="text-slate-500 text-xs">{formatDate(new Date(run.date))} &bull; {run.notes}</div></div><div className="bg-slate-800 p-2 rounded-lg text-slate-400">{run.type === 'boost' ? <Rocket size={16} className="text-yellow-400" /> : run.type === 'quest' ? <Award size={16} className="text-amber-400" /> : <Activity size={16} />}</div></div>)))}</div></div>
        
        <div className="text-center text-slate-600 text-xs">Start Date: {formatDate(gameStart)} &bull; Day {daysSinceStart} of {gameState.duration} &bull; Agent: {gameState.username}</div>
      </div>
    </div>
  );
}