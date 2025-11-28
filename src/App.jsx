import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signOut,
  deleteUser
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

// --- DEFINITIONS ---
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

const formatDate = (date) => {
  if (!date) return 'Unknown';
  try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } 
  catch (e) { return 'Invalid Date'; }
};

// --- SUB-COMPONENTS ---

const OnboardingWizard = ({ onComplete }) => {
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
                        <button disabled={!codename} onClick={() => setStep(4)} className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">Next Step <ChevronRight size={20} /></button>
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
                    <button onClick={() => onComplete({ duration, avatarId, difficulty, username: codename })} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">INITIATE PROTOCOL</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

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

const SettingsModal = ({ onClose, user, gameState, onReset, onSimulateStrava, onDelete }) => {
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
                    <div className="text-xs text-slate-500 truncate">ID: {user?.uid ? user.uid.slice(0,8) : 'Unknown'}...</div>
                </div>
            </div>

            {/* Integrations */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Integrations</label>
                <button onClick={onSimulateStrava} className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${gameState.isStravaLinked ? 'bg-[#FC4C02]/10 border-[#FC4C02] text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <div className="flex items-center gap-3">
                        <LinkIcon size={18} />
                        <span>{gameState.isStravaLinked ? 'Strava Linked (Sim)' : 'Link Strava'}</span>
                    </div>
                    {gameState.isStravaLinked && <CheckCircle2 size={18} className="text-[#FC4C02]" />}
                </button>
                <div className="text-[10px] text-center text-slate-500 mt-2">
                    Powered by Strava. <a href="/support.html" className="underline hover:text-white">Privacy & Support</a>
                </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
                <button onClick={onReset} className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                    <RotateCcw size={16} /> Reset Progress
                </button>
                <button onClick={onDelete} className="w-full py-3 rounded-xl border border-red-900/30 text-red-500 font-bold hover:bg-red-900/10 flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Delete Account
                </button>
            </div>
          </div>
        </div>
      </div>
    );
};

const GameOverScreen = ({ userDistance, daysSinceStart, entitySpeed, onContinue, onRestart }) => (
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
                <span>Entity Speed</span><span className="text-red-400 font-bold">{entitySpeed} km/day</span>
             </div>
        </div>
        <div className="w-full max-w-sm space-y-4">
            <button onClick={onContinue} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105">
                <HeartPulse size={24} /> CONTINUE ($1.00)
            </button>
            <p className="text-xs text-slate-500">Rewinds the Entity by 48 hours. Resume immediately.</p>
            <button onClick={onRestart} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                <RotateCcw size={18} /> ACCEPT FATE & RESTART
            </button>
        </div>
    </div>
);

const VictoryScreen = ({ duration, onRestart }) => (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
        <div className="mb-8 relative">
            <div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-20 animate-pulse"></div>
            <ShieldCheck size={120} className="text-emerald-500 relative z-10 animate-bounce" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px #10b981'}}>MISSION ACCOMPLISHED</h1>
        <p className="text-emerald-400 font-bold text-lg mb-8 uppercase tracking-widest">You are safe.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8">
             <p className="text-slate-300 mb-4">You have successfully evaded the Entity for {duration} days.</p>
             <div className="inline-block bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-4 py-2 rounded-full font-bold uppercase text-sm mb-2">Rank Achieved: Survivor</div>
        </div>
        <div className="w-full max-w-sm space-y-4">
            <a href={`https://store.theentity.app/${duration}-day`} target="_blank" rel="noopener noreferrer" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105">
                <ShoppingBag size={24} /> ACCESS {duration}-DAY STORE
            </a>
            <button onClick={onRestart} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all">
                <RotateCcw size={18} /> START NEW OPERATION
            </button>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export default function TheEntity() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [gameState, setGameState] = useState({
    onboardingComplete: false,
    startDate: new Date().toISOString(),
    duration: 365,
    avatarId: 'sprinter',
    difficulty: 'easy',
    username: 'Runner',
    entitySpeed: 3, 
    totalKmRun: 0,
    runHistory: [],
    isStravaLinked: false,
    inventory: { battery: 0, emitter: 0, casing: 0 },
    activeQuest: null,
    badges: [], 
    totalPausedHours: 0,
    continuesUsed: 0
  });

  // Calculations
  const today = new Date();
  const safeStartDate = gameState.startDate ? new Date(gameState.startDate) : new Date();
  const daysSinceStart = Math.max(0, Math.floor((today - safeStartDate) / (1000 * 60 * 60 * 24)));

  const gracePeriodDays = 1;
  const pausedDays = (gameState.totalPausedHours || 0) / 24;
  const activeDays = Math.max(0, daysSinceStart - gracePeriodDays - pausedDays);
  const entityDistance = activeDays * (gameState.entitySpeed || 3);
  const userDistance = gameState.totalKmRun || 0;
  const distanceGap = userDistance - entityDistance;

  const isCaught = distanceGap <= 0 && daysSinceStart > gracePeriodDays;
  const isVictory = daysSinceStart >= gameState.duration && !isCaught;
  
  // Inventory/Item Safety
  const safeInventory = gameState.inventory || { battery: 0, emitter: 0, casing: 0 };
  const hasCraftedEmp = safeInventory.battery > 0 && safeInventory.emitter > 0 && safeInventory.casing > 0;
  
  // Auth
  useEffect(() => {
    const init = async () => { try { await signInAnonymously(auth); } catch(e){} };
    init();
    return onAuthStateChanged(auth, (u) => { setUser(u); if(!u) setLoading(false); });
  }, []);

  // DB
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) setGameState(prev => ({ ...prev, ...snap.data() }));
        else setGameState(prev => ({ ...prev, onboardingComplete: false }));
        setLoading(false);
    });
  }, [user]);

  // Actions
  const handleOnboard = async (data) => {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), {
          ...gameState, ...data, startDate: new Date().toISOString(), onboardingComplete: true
      });
  };

  const handleAddRun = async (km, notes, isQuest) => {
      const dist = parseFloat(km);
      let newState = { ...gameState };
      
      if (isQuest && newState.activeQuest?.status === 'active') {
          newState.activeQuest.progress += dist;
          if (newState.activeQuest.progress >= newState.activeQuest.distance) {
              newState.activeQuest.status = 'completed';
              newState.inventory[newState.activeQuest.rewardPart]++;
              newState.badges.push({ id: Date.now(), title: newState.activeQuest.title });
              alert(`Mission Complete! Got ${EMP_PARTS.find(p=>p.id===newState.activeQuest.rewardPart).name}`);
          }
          newState.runHistory.unshift({ id: Date.now(), km: dist, notes, type: 'quest', date: new Date().toISOString() });
      } else {
          newState.totalKmRun += dist;
          // Simple AI Update Logic (Every 4 days)
          if (daysSinceStart > 0 && daysSinceStart % 4 === 0) {
             const avg = newState.totalKmRun / daysSinceStart;
             const mult = DIFFICULTIES[gameState.difficulty || 'easy'].multiplier;
             newState.entitySpeed = Math.max(3, parseFloat((avg * mult).toFixed(2)));
          }
          newState.runHistory.unshift({ id: Date.now(), km: dist, notes, type: 'run', date: new Date().toISOString() });
      }
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
      setShowLogModal(false);
  };
  
  // Item Actions
  const handleBuyEMP = async () => {
    if (!confirm("Deploy EMP? Freezes Entity for 25h.")) return;
    let newInv = { ...gameState.inventory };
    if (hasCraftedEmp) { newInv.battery--; newInv.emitter--; newInv.casing--; }
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), {
        ...gameState, inventory: newInv, totalPausedHours: (gameState.totalPausedHours || 0) + 25
    });
  };
  
  const handleBuyBoost = async () => {
      if (!confirm("Boost? +15% distance today.")) return;
      // Simple Boost implementation
      const boost = parseFloat((gameState.totalKmRun * 0.15).toFixed(2));
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), {
          ...gameState, totalKmRun: gameState.totalKmRun + boost
      });
  };

  const handleSimulateStrava = async () => {
      setIsSyncing(true);
      setTimeout(async () => {
          const runs = Math.floor(Math.random() * 2) + 1;
          let added = 0;
          const newRuns = [];
          for(let i=0; i<runs; i++) {
              const dist = parseFloat((Math.random() * 5 + 2).toFixed(2));
              added += dist;
              newRuns.push({ id: Date.now()+i, km: dist, date: new Date().toISOString(), notes: 'Strava (Simulated)', source: 'strava' });
          }
          const newState = { 
              ...gameState, 
              totalKmRun: gameState.totalKmRun + added, 
              runHistory: [...newRuns, ...gameState.runHistory],
              isStravaLinked: true 
          };
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
          setIsSyncing(false);
          alert(`Synced ${runs} runs (${added.toFixed(2)}km)`);
      }, 1000);
  };

  const handleRestart = async () => {
      if(!confirm("Restart?")) return;
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), { onboardingComplete: false });
  };
  
  const handleDeleteAccount = async () => {
      if(!confirm("Delete everything?")) return;
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'));
      await deleteUser(user);
      window.location.reload();
  };
  
  const handleLogout = async () => {
      await signOut(auth);
      window.location.reload();
  };

  // Render
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading...</div>;
  if (!gameState.onboardingComplete) return <OnboardingWizard onComplete={handleOnboard} />;
  if (isCaught) return <GameOverScreen userDistance={userDistance} daysSinceStart={daysSinceStart} entitySpeed={gameState.entitySpeed} onContinue={() => {}} onRestart={handleRestart} />;
  if (isVictory) return <VictoryScreen duration={gameState.duration} onRestart={handleRestart} />;

  const UserAvatar = AVATARS[gameState.avatarId] || AVATARS.sprinter;
  const userPct = Math.min((userDistance / (Math.max(userDistance, entityDistance) * 1.2 + 10)) * 100, 100);
  const entityPct = Math.min((entityDistance / (Math.max(userDistance, entityDistance) * 1.2 + 10)) * 100, 100);
  const diffLabel = (DIFFICULTIES[gameState.difficulty] || DIFFICULTIES.easy).label;
  const getPartIcon = (partId) => { const part = EMP_PARTS.find(p => p.id === partId); return part ? part.icon : Wrench; };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 pb-24">
      {showLogModal && <LogRunModal onClose={() => setShowLogModal(false)} onSave={handleAddRun} activeQuest={gameState.activeQuest} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} gameState={gameState} onLogout={handleLogout} onDelete={handleDeleteAccount} onConnectStrava={handleSimulateStrava} />}

      <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black italic uppercase flex items-center gap-2"><Skull className="text-purple-500"/> The Entity</h1>
          <div className="flex gap-2">
              <button onClick={() => setShowLogModal(true)}><Plus/></button>
              <button onClick={() => setShowSettings(true)}><Settings/></button>
          </div>
      </div>

      <div className="mb-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
           <div className="text-4xl font-black text-white">{distanceGap.toFixed(1)} km</div>
           <p className="text-emerald-400">Ahead</p>
      </div>

      <div className="relative h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700 mb-8 overflow-hidden">
          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700 -translate-y-1/2"></div>
          <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-500" style={{left: `${userPct}%`}}>
              <div className={`absolute -top-8 -left-4 ${UserAvatar.bg} text-white text-xs px-2 rounded`}>YOU</div>
              <div className={`w-4 h-4 ${UserAvatar.bg} rounded-full`}></div>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-500" style={{left: `${entityPct}%`}}>
              <div className="w-4 h-4 bg-red-600 rotate-45"></div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Distance</div>
              <div className="text-xl font-bold text-emerald-400">{userDistance.toFixed(1)}km</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Speed ({diffLabel})</div>
              <div className="text-xl font-bold text-red-500">{gameState.entitySpeed}km/d</div>
          </div>
      </div>

      <button onClick={handleSimulateStrava} disabled={isSyncing} className="w-full bg-[#FC4C02] text-white font-bold py-4 rounded-xl mb-8">
          {isSyncing ? 'Syncing...' : 'Simulate Strava Sync'}
      </button>
      
      {/* Inventory UI */}
      <div className="grid grid-cols-2 gap-2 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3"><h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Components</h3><div className="flex justify-between items-center px-1">{EMP_PARTS.map(part => {const count = safeInventory[part.id]; const hasPart = count > 0; const Icon = part.icon; return (<div key={part.id} className={`flex flex-col items-center gap-1 ${hasPart ? 'text-white' : 'text-slate-700'}`}><div className={`w-8 h-8 rounded-full border flex items-center justify-center relative ${hasPart ? `bg-slate-800 ${part.color||'text-white'} border-slate-600` : 'bg-slate-950 border-slate-800'}`}><Icon size={16} />{count > 1 && <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] w-3 h-3 flex items-center justify-center rounded-full font-bold">{count}</span>}</div></div>)})}</div></div>
            <div className="space-y-2">
                 <button onClick={handleBuyEMP} className="w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 bg-slate-800 text-slate-400"><ZapOff size={14}/> EMP</button>
                <button onClick={handleBuyBoost} className="w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 bg-slate-800 text-slate-400"><Rocket size={14}/> Boost</button>
            </div>
      </div>

      <div className="mb-8">
          <h3 className="text-slate-400 text-sm font-bold mb-4">History</h3>
          <div className="space-y-2">
              {(gameState.runHistory || []).slice(0,5).map(run => (
                  <div key={run.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between">
                      <div>
                          <div className="font-bold">{run.km} km</div>
                          <div className="text-xs text-slate-500">{formatDate(run.date)} • {run.notes}</div>
                      </div>
                      {run.source === 'strava' && <Activity size={16} className="text-[#FC4C02]"/>}
                  </div>
              ))}
          </div>
      </div>
      
      <div className="text-center text-xs text-slate-600">Day {daysSinceStart} of {gameState.duration} • {gameState.username}</div>
    </div>
  );
}