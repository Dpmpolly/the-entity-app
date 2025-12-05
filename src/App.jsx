import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  deleteUser,
  signOut,
  GoogleAuthProvider,
  linkWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { 
  Activity, Skull, Settings, Plus, AlertTriangle, MapPin, History, X, 
  Link as LinkIcon, CheckCircle2, Zap, Timer, RefreshCw, 
  ShieldCheck, Compass, Map as MapIcon, Shield, ChevronRight, ZapOff, 
  Lock, Rocket, Wrench, Cpu, Disc, Award, ArrowRightLeft, HeartPulse, 
  RotateCcw, ShoppingBag, BarChart3, User, Trash2, LogOut, Footprints,
  Smartphone
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

// --- GAME BALANCE SETTINGS ---
const MIN_ENTITY_SPEED = 3.0; 

// --- HELPER FUNCTIONS ---
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDuration = (ms) => {
    if (ms <= 0) return "00:00:00";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const pad = (n) => n.toString().padStart(2, '0');
    
    if (days > 0) return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

// --- SUB-COMPONENTS ---

// 1. Cyberpunk Digital Clock
const CyberClock = ({ ms, label, color = "text-white" }) => {
    if (ms <= 0) ms = 0;
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const s = Math.floor((ms / 1000) % 60);
    const pad = (n) => n.toString().padStart(2, '0');

    const isPanic = ms < 3600000; 

    return (
      <div className={`flex flex-col items-center w-full ${isPanic ? 'animate-pulse' : ''}`}>
         <div className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${isPanic ? 'text-red-500' : color} opacity-80`}>
             {isPanic ? "⚠️ IMMINENT CONTACT ⚠️" : label}
         </div>
         
         <div className="flex items-center justify-center gap-1 sm:gap-2 font-mono">
            {d > 0 && (
                <>
                <div className="flex flex-col items-center">
                    <div className="bg-slate-950 border border-slate-800 rounded px-2 sm:px-3 py-2 text-2xl sm:text-4xl font-black tracking-widest text-white shadow-lg">{pad(d)}</div>
                    <span className="text-[8px] uppercase text-slate-500 mt-1 tracking-wider">Day</span>
                </div>
                <span className="text-xl text-slate-700 pb-4 mx-1">:</span>
                </>
            )}

             <div className="flex flex-col items-center">
                <div className={`bg-slate-950 border ${isPanic ? 'border-red-500 text-red-500' : 'border-slate-800 text-white'} rounded px-2 sm:px-3 py-2 text-2xl sm:text-4xl font-black tracking-widest shadow-lg`}>{pad(h)}</div>
                <span className="text-[8px] uppercase text-slate-500 mt-1 tracking-wider">Hr</span>
            </div>
            <span className={`text-xl pb-4 mx-1 ${isPanic ? 'text-red-600 animate-ping' : 'text-slate-700 animate-pulse'}`}>:</span>

             <div className="flex flex-col items-center">
                <div className={`bg-slate-950 border ${isPanic ? 'border-red-500 text-red-500' : 'border-slate-800 text-white'} rounded px-2 sm:px-3 py-2 text-2xl sm:text-4xl font-black tracking-widest shadow-lg`}>{pad(m)}</div>
                <span className="text-[8px] uppercase text-slate-500 mt-1 tracking-wider">Min</span>
            </div>
            <span className={`text-xl pb-4 mx-1 ${isPanic ? 'text-red-600 animate-ping' : 'text-slate-700 animate-pulse'}`}>:</span>

             <div className="flex flex-col items-center">
                <div className={`border rounded px-2 sm:px-3 py-2 text-2xl sm:text-4xl font-black tracking-widest shadow-lg ${isPanic ? 'bg-red-600 border-red-600 text-black' : 'bg-slate-950 border-slate-800 text-white'}`}>
                    {pad(s)}
                </div>
                <span className="text-[8px] uppercase text-slate-500 mt-1 tracking-wider">Sec</span>
            </div>
         </div>
      </div>
    );
};

// 2. Secret Store
const SecretStore = ({ duration, onClose }) => {
    const LINKS = {
        tee30: "#", sticker: "#", hoodie90: "#", cap: "#", jacket: "#", medal: "#",
    };

    let theme = {
        title: "SURVIVOR SUPPLY", color: "text-emerald-400", border: "border-emerald-500/50", bg: "bg-emerald-950",
        items: [
            { id: 1, name: "Survivor Tee", price: "$28.00", icon: "Shirt", desc: "Moisture-wicking. 'I Survived' back print.", link: LINKS.tee30 },
            { id: 2, name: "Entity Decal Pack", price: "$8.00", icon: "Sticker", desc: "Reflective vinyl for night runs.", link: LINKS.sticker }
        ]
    };

    if (duration === 90) {
        theme = {
            title: "OPERATIVE ARMORY", color: "text-amber-400", border: "border-amber-500/50", bg: "bg-amber-950",
            items: [
                { id: 3, name: "Tech-Fleece Hoodie", price: "$65.00", icon: "Hoodie", desc: "Thermal regulation. Stealth black.", link: LINKS.hoodie90 },
                { id: 4, name: "5-Panel Mission Cap", price: "$30.00", icon: "Cap", desc: "Water-resistant. Embroidered logo.", link: LINKS.cap },
                { id: 1, name: "Survivor Tee", price: "$28.00", icon: "Shirt", desc: "Unlocked from previous tier.", link: LINKS.tee30 }
            ]
        };
    } else if (duration === 365) {
        theme = {
            title: "GHOST PROTOCOL", color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-950",
            items: [
                { id: 5, name: "Alpha Bomber Jacket", price: "$120.00", icon: "Jacket", desc: "Ballistic nylon. Limited Edition.", link: LINKS.jacket },
                { id: 6, name: "1-Year Medal", price: "$45.00", icon: "Coin", desc: "Heavy brass. Engraved with completion date.", link: LINKS.medal },
                { id: 3, name: "Tech-Fleece Hoodie", price: "$65.00", icon: "Hoodie", desc: "Unlocked from previous tier.", link: LINKS.hoodie90 }
            ]
        };
    }

    const ItemIcon = ({ type }) => {
        if (type === 'Shirt') return <svg className={`w-8 h-8 ${theme.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.38 3.4a2 2 0 0 0-1.79-1.11c-.55 0-1.07.25-1.41.66L15 6 12 3 9 6 6.82 2.95A2.03 2.03 0 0 0 3.62 4.5v15a2 2 0 0 0 2 2h12.76a2 2 0 0 0 2-2v-15a2 2 0 0 0-.05-.33z"/></svg>;
        if (type === 'Hoodie') return <svg className={`w-8 h-8 ${theme.color}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a9 9 0 0 1 9 9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a9 9 0 0 1 9-9z"/><path d="M12 14v-4"/><path d="M12 14h4"/><path d="M12 14H8"/></svg>;
        if (type === 'Coin') return <div className={`w-8 h-8 rounded-full border-2 ${theme.border} flex items-center justify-center font-black ${theme.color}`}>365</div>;
        return <ShoppingBag className={`w-8 h-8 ${theme.color}`} />;
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <div className={`p-6 border-b border-slate-800 flex justify-between items-center ${theme.bg}`}>
                <div>
                    <div className={`text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1`}>Clearance Level: {duration} Days</div>
                    <h2 className={`text-2xl font-black uppercase tracking-wider ${theme.color} flex items-center gap-2`}>
                        <Lock size={20} className="mb-1" /> {theme.title}
                    </h2>
                </div>
                <button onClick={onClose} className="p-2 bg-black/30 rounded-full text-white hover:bg-white/10 transition-colors">
                    <X size={24}/>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                <div className="grid grid-cols-1 gap-4">
                    {theme.items.map(item => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 group hover:border-slate-600 transition-all">
                            <div className={`w-16 h-16 rounded-lg ${theme.bg} ${theme.border} border flex items-center justify-center shrink-0`}>
                                <ItemIcon type={item.icon} />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-white font-bold uppercase tracking-wide">{item.name}</h3>
                                    <span className="text-slate-400 font-mono text-sm">{item.price}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                            </div>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className={`px-4 py-2 rounded-lg font-bold text-xs uppercase bg-slate-800 text-white hover:${theme.bg} transition-colors border border-slate-700 flex flex-col items-center justify-center`}>
                                BUY
                            </a>
                        </div>
                    ))}
                </div>
                <div className="mt-8 p-6 rounded-xl border border-dashed border-slate-800 text-center">
                    <p className="text-slate-500 text-xs mb-2">ACCESS CODE: ENTITY-{duration}-VICTOR</p>
                    <p className="text-slate-600 text-[10px]">This store is hidden from the public. Only survivors with verified completion logs can access these items.</p>
                </div>
            </div>
        </div>
    );
};

// 3. Onboarding Wizard
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
              <h1 className="text-3xl font-black text-white italic uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                  <Skull className="text-purple-500" /> The Entity
              </h1>
              <p className="text-slate-500">Setup your escape protocol.</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">1. Choose Challenge Duration</h2>
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {[30, 90, 365].map(d => (
                            <button key={d} onClick={() => setDuration(d)} className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${duration === d ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                <div>
                                    <div className="font-bold text-lg text-white">{d === 365 ? '1 Year' : `${d} Days`}</div>
                                    <div className="text-sm text-slate-400">Survival Goal</div>
                                </div>
                                {duration === d && <CheckCircle2 className="text-purple-500" />}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setStep(2)} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                        Next Step <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                    <h2 className="text-xl font-bold text-white mb-6">2. Select Difficulty</h2>
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {Object.values(DIFFICULTIES).map(diff => (
                            <button key={diff.id} onClick={() => setDifficulty(diff.id)} className={`p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${difficulty === diff.id ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                <div>
                                    <div className={`font-bold text-lg ${diff.color}`}>{diff.label}</div>
                                    <div className="text-sm text-slate-400">{diff.desc}</div>
                                </div>
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
                    <input type="text" value={codename} onChange={(e) => setCodename(e.target.value)} placeholder="Enter your alias..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white text-center text-lg focus:ring-2 focus:ring-purple-500 outline-none mb-8 uppercase tracking-widest" />
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
                        {Object.values(AVATARS).map((av) => {const Icon = av.icon; const isSelected = avatarId === av.id; return (<button key={av.id} onClick={() => setAvatarId(av.id)} className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 ${isSelected ? 'border-purple-500 bg-purple-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}><div className={`p-3 rounded-full ${isSelected ? av.bg : 'bg-slate-700'} text-white transition-colors`}><Icon size={24} /></div><div><div className="font-bold text-white text-sm">{av.name}</div><div className="text-[10px] text-slate-400 leading-tight mt-1">{av.desc}</div></div></button>)})}</div><div className="flex gap-3"><button onClick={() => setStep(3)} className="px-6 py-4 rounded-xl font-bold text-slate-400 hover:text-white">Back</button><button onClick={() => onComplete({ duration, avatarId, difficulty, username: codename })} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">INITIATE PROTOCOL</button></div></div>)}
          </div></div></div>
    );
};

// 4. Log Run Modal
const LogRunModal = ({ onClose, onSave, activeQuest }) => {
    const [km, setKm] = useState('');
    const [notes, setNotes] = useState('');
    const [isQuestRun, setIsQuestRun] = useState(false);
  
    const handleSubmit = () => {
      if (!km || parseFloat(km) <= 0) return alert("Please enter a valid distance.");
      onSave(km, notes, isQuestRun);
      onClose();
    };
  
    const isQuestActive = activeQuest && activeQuest.status === 'active' && activeQuest.title;

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
            {isQuestActive && (
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
            <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-2">SAVE LOG</button>
          </div>
        </div>
      </div>
    );
};
  
// 5. Settings Modal
const SettingsModal = ({ onClose, user, gameState, onLogout, onDelete, onConnectStrava, onLinkGoogle }) => {
    const isAndroid = /Android/i.test(navigator.userAgent);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6 animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
            <h3 className="font-bold text-white flex items-center gap-2"><Settings size={18} className="text-slate-400"/> Settings</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><User size={20}/></div>
                <div className="overflow-hidden"><div className="text-white font-bold truncate">{gameState.username || 'Agent'}</div><div className="text-xs text-slate-500 truncate">ID: {user?.uid.slice(0,8)}...</div></div>
            </div>

            {/* ANDROID ONLY - SAVE PROGRESS SECTION */}
            {isAndroid && user?.isAnonymous && (
                <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <Smartphone size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">Android Secure</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3">
                        Link a Google Account to save your progress across devices.
                    </p>
                    <button 
                        onClick={onLinkGoogle}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-all"
                    >
                        {/* Simple Google G Icon */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                        Link Google Account
                    </button>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data Source</label>
                {gameState.isStravaLinked ? (
                    <div className="space-y-2">
                        <div className="w-full p-4 rounded-xl border bg-[#FC4C02]/10 border-[#FC4C02] text-[#FC4C02] flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(252,76,2,0.15)]">
                            <CheckCircle2 size={18} />
                            <span className="font-bold text-sm">Strava Connected</span>
                        </div>
                        <button onClick={onConnectStrava} className="w-full text-[10px] text-slate-500 hover:text-amber-400 flex items-center justify-center gap-1 transition-colors">
                            <RefreshCw size={10} /> Sync issues? Repair Connection
                        </button>
                    </div>
                ) : (
                    <button onClick={onConnectStrava} className="w-full bg-[#FC4C02] hover:bg-[#E34402] transition-all py-3 rounded-lg flex items-center justify-center gap-3 shadow-lg group">
                        <svg role="img" viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                        </svg>
                        <span className="text-white font-bold text-sm">Connect with Strava</span>
                    </button>
                )}
            </div>

            <div className="pt-2 space-y-3">
                <a href="mailto:russellpollard77@gmail.com?subject=The Entity Support" className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                    <HeartPulse size={16} /> Contact Support
                </a>
                <button onClick={onLogout} className="w-full py-3 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center gap-2">
                    <LogOut size={16} /> Disconnect (Logout)
                </button>
                <button onClick={onDelete} className="w-full py-3 rounded-xl border border-red-900/30 text-red-500 font-bold hover:bg-red-900/10 flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Burn Identity (Delete)
                </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col items-center justify-center gap-1 opacity-60">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered by</span>
              <div className="flex items-center gap-1.5">
                  <svg role="img" viewBox="0 0 24 24" className="w-4 h-4 fill-[#FC4C02]" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                  </svg>
                  <span className="text-sm font-black text-slate-300 tracking-tight leading-none">STRAVA</span>
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
  const [showStore, setShowStore] = useState(false);
  const [viewMode, setViewMode] = useState('clock');
  const hasExchangedCode = useRef(false);
  
  // Game Data State
  const [gameState, setGameState] = useState({
    onboardingComplete: false,
    startDate: new Date().toISOString(),
    duration: 365,
    avatarId: 'sprinter',
    difficulty: 'easy',
    username: 'Runner',
    entitySpeed: MIN_ENTITY_SPEED, 
    lastSpeedUpdateDay: 0,
    adaptiveMode: true,
    totalKmRun: 0,
    runHistory: [],
    isStravaLinked: false,
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

  // --- REAL TIME CALCULATIONS ---
  const [now, setNow] = useState(new Date()); 
  useEffect(() => { 
      const timer = setInterval(() => { setNow(new Date()); }, 1000); 
      return () => clearInterval(timer); 
  }, []);
  
  const today = now;
  const gameStart = new Date(gameState.startDate);
  const msElapsed = today.getTime() - gameStart.getTime();
  const hoursElapsed = msElapsed / (1000 * 60 * 60); 
  const daysSinceStart = Math.floor(hoursElapsed / 24);

  // Entity Movement Logic
  const gracePeriodHours = 24;
  const activeEntityHours = Math.max(0, hoursElapsed - gracePeriodHours - gameState.totalPausedHours);
  const speedPerHour = gameState.entitySpeed / 24;
  const entityDistance = activeEntityHours * speedPerHour;
  const userDistance = gameState.totalKmRun;
  const distanceGap = userDistance - entityDistance;
  
  const isGracePeriod = hoursElapsed < gracePeriodHours;
  const isCaught = distanceGap <= 0 && !isGracePeriod;
  const isVictory = daysSinceStart >= gameState.duration && !isCaught;
  
  const EMP_DURATION_HOURS = 25;
  const lastEmpDate = gameState.lastEmpUsage ? new Date(gameState.lastEmpUsage) : null;
  const isEmpActive = lastEmpDate && (today.getTime() - lastEmpDate.getTime()) < (EMP_DURATION_HOURS * 3600000);
  
  // --- UNLIMITED SHOP LOGIC ---
  const isEmpFree = (gameState.empUsageCount || 0) === 0;
  const isBoostFree = (gameState.boostUsageCount || 0) === 0;
  const isEmpAvailable = true; // Always available
  const empCooldownRemaining = 0; 
  
  const daysUntilCaught = distanceGap > 0 ? Math.floor(distanceGap / gameState.entitySpeed) : 0;
  const hoursUntilCatch = distanceGap > 0 ? (distanceGap / speedPerHour) : 0;
  const msUntilCatch = hoursUntilCatch * 60 * 60 * 1000;

  const gracePeriodMs = 24 * 60 * 60 * 1000;
  const timeUntilActive = Math.max(0, gracePeriodMs - msElapsed);

  const daysToNextUpdate = 4 - (daysSinceStart % 4);

  // --- AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { console.error("Auth failed", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- ACCOUNT LINKING (Upgrade Anonymous to Google) ---
  const handleLinkGoogle = async () => {
      if (!user) return;
      const provider = new GoogleAuthProvider();
      try { 
          await linkWithPopup(user, provider); 
          alert("IDENTITY SECURED. Your progress is now saved to your Google Account."); 
          setGameState(prev => ({ ...prev })); 
      } catch (error) { 
          if (error.code === 'auth/credential-already-in-use') { 
             alert("Error: That Google account is already used by another player."); 
          } else { 
             console.error("Linking Error:", error); 
             alert("Failed to link account: " + error.message); 
          } 
      }
  };

  // --- STRAVA TOKEN EXCHANGE & BACKFILL (Safe & Bulletproof) ---
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
             
             const response = await fetch(`https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${stravaCode}&grant_type=authorization_code`, { method: 'POST' });
             const data = await response.json();
             
             if (data.access_token) {
                 // 1. FETCH THE TRUTH (Read DB directly)
                 const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
                 const docSnap = await getDoc(userDocRef);
                 
                 const currentData = docSnap.exists() ? docSnap.data() : gameState;
                 const currentHistory = currentData.runHistory || [];
                 const currentTotal = currentData.totalKmRun || 0;

                 // 2. Fetch Strava History
                 const historyResponse = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=30`, {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                 });
                 const historyData = await historyResponse.json();
                 
                 let recoveredRuns = [];
                 let addedDistance = 0;
                 
                 if (Array.isArray(historyData)) {
                     const recentRuns = historyData.filter(act => act.type === 'Run');
                     
                     // "Start of Day" Logic: Allow runs from the morning of the start date
                     const rawStartDate = currentData.startDate || new Date().toISOString();
                     const gameStartDate = new Date(rawStartDate);
                     gameStartDate.setHours(0,0,0,0);

                     recentRuns.forEach(act => {
                         const runDate = new Date(act.start_date);
                         if (runDate < gameStartDate) return; 

                         const alreadyExists = currentHistory.some(r => r.stravaId === act.id || r.id === act.id);
                         if (!alreadyExists) {
                             const runKm = parseFloat((act.distance / 1000).toFixed(2));
                             recoveredRuns.push({
                                 id: Date.now() + Math.random(), 
                                 date: act.start_date,
                                 km: runKm,
                                 notes: act.name,
                                 type: 'survival', 
                                 source: 'strava_backfill',
                                 stravaId: act.id
                             });
                             addedDistance += runKm;
                         }
                     });
                 }

                 // 3. SAVE SAFELY
                 const mergedHistory = [...recoveredRuns, ...currentHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

                 await setDoc(userDocRef, { 
                     isStravaLinked: true,
                     stravaAccessToken: data.access_token,
                     stravaRefreshToken: data.refresh_token,
                     stravaExpiresAt: data.expires_at,
                     runHistory: mergedHistory,
                     totalKmRun: currentTotal + addedDistance
                 }, { merge: true });

                 await setDoc(doc(db, 'strava_mappings', data.athlete.id.toString()), {
                    firebaseUid: user.uid,
                    appId: appId
                 });
                 
                 window.history.replaceState({}, document.title, "/");
                 
                 if (recoveredRuns.length > 0) {
                     alert(`SYNC COMPLETE.\n\nFound ${recoveredRuns.length} new runs totaling ${addedDistance.toFixed(2)}km.`);
                 } else {
                     alert("Strava Connected! No missing runs found.");
                 }
                 window.location.reload();
             }
          } catch (error) {
             console.error("Strava Auth Failed", error);
          }
       };
       exchangeToken();
    }
  }, [user]);

  // --- PAYMENT LISTENER (Safe & Bulletproof) ---
  useEffect(() => {
      if (loading || !user) return; 
      
      const params = new URLSearchParams(window.location.search);
      const purchaseType = params.get('purchase');

      if (purchaseType) {
          const handlePurchase = async () => {
              // 1. Get the latest data from DB
              const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
              const docSnap = await getDoc(userDocRef);
              
              let currentSave = docSnap.exists() ? docSnap.data() : { ...gameState };
              let message = "";

              if (purchaseType === 'emp_success') {
                  currentSave.lastEmpUsage = new Date().toISOString();
                  currentSave.totalPausedHours = (currentSave.totalPausedHours || 0) + 25;
                  currentSave.empUsageCount = (currentSave.empUsageCount || 0) + 1;
                  message = "PAYMENT CONFIRMED. EMP DEPLOYED. Entity Stunned for 25h.";
              } 
              else if (purchaseType === 'boost_success') {
                  const boostKm = 3.0; 
                  currentSave.totalKmRun = (currentSave.totalKmRun || 0) + boostKm;
                  currentSave.runHistory = [{ 
                      id: Date.now(), 
                      date: new Date().toISOString(), 
                      km: boostKm, 
                      notes: 'Nitrous Boost (Paid)', 
                      type: 'boost' 
                  }, ...(currentSave.runHistory || [])];
                  currentSave.boostUsageCount = (currentSave.boostUsageCount || 0) + 1;
                  message = `PAYMENT CONFIRMED. NITROUS INJECTED (+${boostKm}km).`;
              }

              if (message) {
                  // Save the merge
                  await setDoc(userDocRef, currentSave, { merge: true });
                  window.history.replaceState({}, document.title, window.location.pathname);
                  alert(message);
                  setGameState(prev => ({ ...prev, ...currentSave }));
              }
          };
          handlePurchase();
      }
  }, [user, loading]);

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

  // --- GAME LOOP & CLEANUP ---
  useEffect(() => {
      if (!user || loading) return;
      
      // 1. CLEANUP: Kill zombie quests
      if (daysSinceStart < 5 && gameState.activeQuest) {
          const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
          setDoc(userDocRef, { ...gameState, activeQuest: null });
          return;
      }

      if (daysSinceStart > 0 && daysSinceStart % 5 === 0 && daysSinceStart !== gameState.lastQuestGenerationDay) {
          if (!gameState.activeQuest) {
              const parts = ['battery', 'emitter', 'casing'];
              const randomPart = parts[Math.floor(Math.random() * parts.length)];
              const randomDist = Math.floor(Math.random() * 8) + 5; 
              const newQuest = { id: Date.now(), title: `Scavenge Mission ${gameState.badges.length + 1}`, distance: randomDist, progress: 0, rewardPart: randomPart, status: 'available' };
              const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save');
              setDoc(userDocRef, { ...gameState, activeQuest: newQuest, lastQuestGenerationDay: daysSinceStart });
          }
      }
  }, [daysSinceStart, user, loading, gameState.activeQuest, gameState.lastQuestGenerationDay]);

  // --- FUNCTIONS ---
  const calculateAdaptiveSpeed = (totalKm, activeDays, diff) => {
    if (activeDays < 1) return MIN_ENTITY_SPEED;
    const avgDaily = totalKm / activeDays;
    const multiplier = DIFFICULTIES[diff || 'easy'].multiplier;
    const calculatedSpeed = avgDaily * multiplier;
    return parseFloat(Math.max(MIN_ENTITY_SPEED, calculatedSpeed).toFixed(2));
  };
  const getPartIcon = (partId) => { const part = EMP_PARTS.find(p => p.id === partId); return part ? part.icon : Wrench; };
  const handleLogout = async () => { await signOut(auth); window.location.reload(); };
  const handleDeleteAccount = async () => {
      if (!confirm("DELETE ACCOUNT?\n\nThis will permanently erase your progress. This cannot be undone.")) return;
      try { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save')); await deleteUser(user); window.location.reload(); } catch (error) { alert("Error deleting data: " + error.message); }
  };
  const handleStravaLogin = () => {
      const clientId = import.meta.env.VITE_STRAVA_CLIENT_ID;
      const redirectUri = window.location.origin; 
      const scope = "activity:read_all";
      window.location.href = `http://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}`;
  };

  const handleConvertRunToQuest = async (runId) => {
      if (!user || !gameState.activeQuest || gameState.activeQuest.status !== 'active') {
          alert("No active mission to assign this run to.");
          return;
      }
      const runIndex = gameState.runHistory.findIndex(r => r.id === runId);
      if (runIndex === -1) return;
      const run = gameState.runHistory[runIndex];
      if (run.type === 'quest') return; 
      if (!confirm(`REROUTE SUPPLIES?\n\nConvert this ${run.km}km run to the Scavenge Mission?\n\nWARNING: This distance will be removed from your escape total. The Entity will get closer.`)) return;

      const newTotalKm = gameState.totalKmRun - run.km; 
      const newQuestProgress = gameState.activeQuest.progress + run.km;
      let updatedQuest = { ...gameState.activeQuest, progress: newQuestProgress };
      let newInventory = { ...gameState.inventory };
      let newBadges = [...gameState.badges];

      if (newQuestProgress >= gameState.activeQuest.distance) {
          updatedQuest.status = 'completed';
          newInventory[gameState.activeQuest.rewardPart]++;
          newBadges.push({ id: Date.now(), title: gameState.activeQuest.title, date: new Date().toISOString() });
          alert(`MISSION COMPLETE!\n\nAcquired: 1x ${EMP_PARTS.find(p => p.id === gameState.activeQuest.rewardPart).name}\nAwarded: Mission Badge`);
          updatedQuest = null; 
      }
      const newRunHistory = [...gameState.runHistory];
      newRunHistory[runIndex] = { ...run, type: 'quest', notes: `${run.notes} (Re-routed)` };
      const newState = { ...gameState, totalKmRun: newTotalKm, activeQuest: updatedQuest, inventory: newInventory, badges: newBadges, runHistory: newRunHistory };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const handleDeleteRun = async (runId) => {
      if (!user) return;
      const runToDelete = gameState.runHistory.find(r => r.id === runId);
      if (!runToDelete) return;
      if (!confirm(`DELETE ACTIVITY?\n\nRemove this ${runToDelete.km}km run?\n\nNOTE: This will reduce your total distance. The Entity will get closer.`)) return;

      let newTotalKm = gameState.totalKmRun;
      let newActiveQuest = gameState.activeQuest ? { ...gameState.activeQuest } : null;
      
      if (runToDelete.type === 'quest' || runToDelete.type === 'quest_partial') {
          if (newActiveQuest && newActiveQuest.status === 'active') {
              newActiveQuest.progress = Math.max(0, newActiveQuest.progress - runToDelete.km);
          }
      } else if (runToDelete.type === 'quest_complete') {
          alert("Note: This run completed a mission. The reward item will remain in your inventory.");
      } else {
          newTotalKm = Math.max(0, newTotalKm - runToDelete.km);
      }

      const newRunHistory = gameState.runHistory.filter(r => r.id !== runId);
      const newState = { ...gameState, totalKmRun: newTotalKm, activeQuest: newActiveQuest, runHistory: newRunHistory };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  // NEW: handleBuyEMP (Unlimited Version)
  const handleBuyEMP = async () => {
    if (!user) return;

    const hasCraftedEmp = gameState.inventory.battery > 0 && gameState.inventory.emitter > 0 && gameState.inventory.casing > 0;
    
    if (hasCraftedEmp || isEmpFree) {
        // FREE PATH
        if (!confirm(`Deploy EMP Burst?\n\nCost: ${hasCraftedEmp ? "FREE (Crafted)" : "FREE (Bonus)"}\nEffect: Stuns Entity for 25h.`)) return;
        
        let newInventory = { ...gameState.inventory };
        if (hasCraftedEmp) { newInventory.battery--; newInventory.emitter--; newInventory.casing--; }
        
        const newState = { 
            ...gameState, 
            lastEmpUsage: new Date().toISOString(), 
            totalPausedHours: (gameState.totalPausedHours || 0) + EMP_DURATION_HOURS, 
            empUsageCount: (gameState.empUsageCount || 0) + 1, 
            inventory: newInventory 
        };
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
        alert("EMP DEPLOYED. The Entity is stunned.");
    } else {
        // PAID PATH - UNLIMITED
        if (!confirm("PURCHASE EMP BURST?\n\nCost: $1.00\n\nYou will be redirected to secure checkout.")) return;
        window.location.href = "https://buy.stripe.com/test_5kQ6oG8c0fk5cLZ8UA5J600"; 
    }
  };

  // NEW: handleBuyBoost (Unlimited Version)
  const handleBuyBoost = async () => {
    if (!user) return;
    
    if (isBoostFree) {
        // FREE PATH
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const todayRuns = gameState.runHistory.filter(run => new Date(run.date) >= startOfDay);
        const todayKm = todayRuns.reduce((acc, run) => acc + run.km, 0);
        
        if (todayKm <= 0) return alert("Free Boost Error: You must log a run today to claim your free 15% boost.");
        
        const boostAmount = parseFloat((todayKm * 0.15).toFixed(2));
        if (!confirm(`Activate Nitrous Boost?\n\nCost: FREE (First Time)\nEffect: +${boostAmount}km`)) return;
        
        const newRun = { id: Date.now(), date: new Date().toISOString(), km: boostAmount, notes: 'Nitrous Boost (Free)', type: 'boost' };
        const newState = { ...gameState, totalKmRun: gameState.totalKmRun + boostAmount, runHistory: [newRun, ...gameState.runHistory], boostUsageCount: 1 };
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
    } else {
        // PAID PATH
        if (!confirm("PURCHASE NITROUS BOOST?\n\nCost: $1.00\nEffect: Instant +3km distance.\n\nYou will be redirected to secure checkout.")) return;
        window.location.href = "https://buy.stripe.com/test_6oU7sK77Wb3PdQ3c6M5J601"; 
    }
  };

  const handleContinueGame = async () => {
    if (!user) return;
    if (!confirm("ACTIVATE ADRENALINE SHOT?\n\nCost: $1.00\nEffect: Pushes the Entity back by 48 hours. You will survive... for now.")) return;
    const newState = { ...gameState, totalPausedHours: (gameState.totalPausedHours || 0) + 48, continuesUsed: (gameState.continuesUsed || 0) + 1 };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const handleRestartGame = async () => {
     if (!user || !confirm("CONFIRM RESET?\n\nThis will restart the challenge from Day 1.")) return;
     const newState = { onboardingComplete: false, startDate: new Date().toISOString(), duration: 365, totalKmRun: 0, runHistory: [], totalPausedHours: 0, lastEmpUsage: null, empUsageCount: 0, boostUsageCount: 0, inventory: { battery: 0, emitter: 0, casing: 0 }, activeQuest: null, badges: [], continuesUsed: 0, entitySpeed: MIN_ENTITY_SPEED, lastSpeedUpdateDay: 0, difficulty: 'easy' };
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
            newBadges.push({ id: Date.now(), title: gameState.activeQuest.title, date: new Date().toISOString() });
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
    const newState = { ...gameState, startDate: new Date().toISOString(), duration: setupData.duration, avatarId: setupData.avatarId, difficulty: setupData.difficulty, username: setupData.username, entitySpeed: MIN_ENTITY_SPEED, lastSpeedUpdateDay: 0, totalKmRun: 0, runHistory: [], onboardingComplete: true, totalPausedHours: 0, lastEmpUsage: null, empUsageCount: 0, boostUsageCount: 0, inventory: { battery: 0, emitter: 0, casing: 0 }, activeQuest: null, badges: [], continuesUsed: 0 };
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), newState);
  };

  const handleAcceptQuest = async () => {
      if (!user || !gameState.activeQuest) return;
      const updatedQuest = { ...gameState.activeQuest, status: 'active', progress: gameState.activeQuest.progress || 0, distance: gameState.activeQuest.distance || 5 };
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), { ...gameState, activeQuest: updatedQuest });
  };

  // --- UI RENDER: LOADING ---
  if (loading) return (<div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-500 animate-pulse"><Activity size={48} className="mb-4" /><p>Syncing with satellite...</p></div>);

  // --- UI RENDER: ONBOARDING ---
  if (!gameState.onboardingComplete) {
      return <OnboardingWizard onComplete={handleCompleteOnboarding} />;
  }

  // --- UI RENDER: GAME OVER ---
  if (isCaught) return (<div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000"><div className="mb-8 relative"><div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 animate-pulse"></div><Skull size={120} className="text-red-600 relative z-10 animate-bounce" /></div><h1 className="text-5xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px red'}}>CAUGHT</h1><p className="text-red-400 font-bold text-lg mb-8 uppercase tracking-widest">Signal Lost &bull; Day {daysSinceStart}</p><div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8"><div className="flex justify-between items-center text-slate-400 text-sm mb-4 pb-4 border-b border-slate-800"><span>Distance Run</span><span className="text-white font-bold">{userDistance.toFixed(1)} km</span></div><div className="flex justify-between items-center text-slate-400 text-sm mb-4 pb-4 border-b border-slate-800"><span>Days Survived</span><span className="text-white font-bold">{daysSinceStart} days</span></div><div className="flex justify-between items-center text-slate-400 text-sm"><span>Entity Speed</span><span className="text-red-400 font-bold">{gameState.entitySpeed} km/day</span></div></div><div className="w-full max-w-sm space-y-4"><button onClick={handleContinueGame} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105"><HeartPulse size={24} /> CONTINUE ($1.00)</button><p className="text-xs text-slate-500">Rewinds the Entity by 48 hours. Resume immediately.</p><button onClick={handleRestartGame} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all"><RotateCcw size={18} /> ACCEPT FATE & RESTART</button></div></div>);

  // --- UI RENDER: VICTORY ---
  if (isVictory) return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
        <style>{`.bg-stripes-slate {background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 50%, #1e293b 50%, #1e293b 75%, transparent 75%, transparent);background-size: 10px 10px;}`}</style>
        {showStore && <SecretStore duration={gameState.duration} onClose={() => setShowStore(false)} />}
        <div className="mb-8 relative"><div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-20 animate-pulse"></div><ShieldCheck size={120} className="text-emerald-500 relative z-10 animate-bounce" /></div><h1 className="text-4xl font-black text-white uppercase tracking-widest mb-2" style={{textShadow: '0 0 20px #10b981'}}>MISSION ACCOMPLISHED</h1><p className="text-emerald-400 font-bold text-lg mb-8 uppercase tracking-widest">You are safe.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm mb-8"><p className="text-slate-300 mb-4">You have successfully evaded the Entity for {gameState.duration} days.</p><div className="inline-block bg-emerald-900/30 text-emerald-400 border border-emerald-900 px-4 py-2 rounded-full font-bold uppercase text-sm mb-2">Rank Achieved: Survivor</div></div>
        <div className="w-full max-w-sm space-y-4"><button onClick={() => setShowStore(true)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all transform hover:scale-105"><ShoppingBag size={24} /> ACCESS {gameState.duration}-DAY STORE</button><button onClick={handleRestartGame} className="w-full bg-transparent border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition-all"><RotateCcw size={18} /> START NEW OPERATION</button></div>
    </div>
  );

  // --- UI RENDER: DASHBOARD ---
  const UserAvatar = AVATARS[gameState.avatarId || 'sprinter'];
  const maxDist = Math.max(userDistance, entityDistance) * 1.2 + 10; 
  const userPct = Math.min((userDistance / maxDist) * 100, 100);
  const entityPct = Math.min((entityDistance / maxDist) * 100, 100);
  const hasCraftedEmp = gameState.inventory.battery > 0 && gameState.inventory.emitter > 0 && gameState.inventory.casing > 0;
  const diffLabel = DIFFICULTIES[gameState.difficulty]?.label || 'Standard';
  const activeQuestName = gameState.activeQuest?.rewardPart ? (EMP_PARTS.find(p => p.id === gameState.activeQuest.rewardPart)?.name || 'Unknown Part') : 'Unknown Part';

  // DYNAMIC BANNER WITH CYBER CLOCK
  let BannerContent;
  if (isEmpActive) { 
    BannerContent = (<><div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none"></div><span className="text-cyan-400 uppercase text-xs font-bold tracking-widest mb-1 block flex items-center justify-center gap-1"><ZapOff size={12} /> Countermeasure Active</span><div className="text-2xl font-black text-white mb-1 uppercase tracking-wider">ENTITY STUNNED</div><p className="text-cyan-200 font-medium text-sm">The Entity is frozen. It will not move for the duration.</p></>);
  } else if (isGracePeriod) { 
    BannerContent = (<><div className="absolute inset-0 bg-emerald-600/5 pointer-events-none"></div><span className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1 block flex items-center justify-center gap-1"><ShieldCheck size={12} /> SAFETY PROTOCOL</span><CyberClock ms={timeUntilActive} label="ACTIVATION IN" color="text-emerald-400" /><p className="text-slate-400 font-medium text-sm mt-2">Time until Entity activation.</p></>);
  } else { 
    // ACTIVE MODE: Toggle between Clock and Distance
    if (viewMode === 'clock') {
        BannerContent = (
            <>
                <CyberClock ms={msUntilCatch} label="INTERCEPTION ESTIMATE" color={daysUntilCaught < 1 ? "text-red-500" : "text-slate-400"} />
                <div className="flex items-center justify-center gap-2 text-xs mt-2">
                    <span className="text-emerald-400 font-bold">{distanceGap.toFixed(2)}km Gap</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Speed: {gameState.entitySpeed}km/d</span>
                </div>
                <div className="mt-2 text-[9px] text-slate-600 uppercase tracking-widest">Tap to switch view</div>
                {daysUntilCaught < 1 && (<div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-bold border border-red-900/50 animate-pulse"><AlertTriangle size={12} /> CRITICAL PROXIMITY</div>)}
            </>
        );
    } else {
        BannerContent = (<><span className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1 block">Current Status</span><div className="text-4xl font-black text-white mb-1">{Math.abs(distanceGap).toFixed(3)} <span className="text-xl text-slate-500">km</span></div><p className="text-emerald-400 font-medium flex items-center justify-center gap-1">Ahead of the Entity</p><div className="mt-2 text-[9px] text-slate-600 uppercase tracking-widest">Tap to switch view</div></>);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-500/30">
      <style>{`.bg-stripes-slate {background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%, transparent 50%, #1e293b 50%, #1e293b 75%, transparent 75%, transparent);background-size: 10px 10px;}`}</style>
      
      {showLogModal && <LogRunModal onClose={() => setShowLogModal(false)} onSave={handleAddRun} activeQuest={gameState.activeQuest} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} user={user} gameState={gameState} onLogout={handleLogout} onDelete={handleDeleteAccount} onConnectStrava={handleStravaLogin} onLinkGoogle={handleLinkGoogle} />}
      {showStore && <SecretStore duration={gameState.duration} onClose={() => setShowStore(false)} />}
      
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
          <div className="max-w-xl mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2"><div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center shadow-lg shadow-purple-900/50"><Skull className="text-white" size={20} /></div><h1 className="text-xl font-black tracking-wider uppercase italic">The Entity</h1></div>
              <div className="flex items-center gap-1"><button onClick={() => setShowLogModal(true)} className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors"><Plus size={20} /></button><button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button></div>
          </div>
      </div>
      
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div onClick={() => setViewMode(prev => prev === 'clock' ? 'distance' : 'clock')} className={`mb-8 p-6 rounded-2xl border cursor-pointer transition-all hover:border-slate-600 ${isCaught ? 'bg-red-900/20 border-red-800' : isEmpActive ? 'bg-cyan-900/20 border-cyan-800' : 'bg-slate-900 border-slate-800'} text-center shadow-2xl relative overflow-hidden`}>{BannerContent}</div>
        
        {/* VISUAL MAP */}
        <div className="relative h-24 w-full bg-slate-800/50 rounded-xl border border-slate-700 mb-6 overflow-hidden">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700 -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-0 bottom-0 right-0 w-8 bg-stripes-slate opacity-20 border-l border-slate-600"></div>
            <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-20" style={{ left: `${userPct}%` }}><div className="relative"><div className={`absolute -top-10 -left-6 ${UserAvatar.bg} text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap`}>YOU</div><div className={`w-6 h-6 ${UserAvatar.bg} rounded-full shadow-[0_0_15px_currentColor] border-2 border-slate-900 flex items-center justify-center text-white z-20 relative`}><UserAvatar.icon size={14} /></div></div></div>
            <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear z-10" style={{ left: `${entityPct}%` }}><div className="relative">{isGracePeriod ? <div className="absolute top-6 -left-6 bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 opacity-75"><Timer size={10} /> INITIALISING</div> : isEmpActive ? <div className="absolute top-6 -left-6 bg-cyan-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1 animate-pulse"><ZapOff size={10} /> STUNNED</div> : <div className="absolute top-6 -left-6 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1"><Skull size={10} /> IT</div>}<div className={`w-5 h-5 rotate-45 border-2 border-slate-900 transition-colors ${isGracePeriod ? 'bg-slate-600' : isEmpActive ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.8)]' : 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]'}`}></div></div></div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800"><div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><MapPin size={12} /> Your Distance</div><div className="text-2xl font-bold text-emerald-400">{userDistance.toFixed(1)}k</div></div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 relative overflow-hidden"><div className="absolute -right-4 -top-4 text-purple-900/20"><Skull size={64} /></div><div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-bold uppercase tracking-wider relative z-10"><Zap size={12} /> Entity Speed</div><div className="text-2xl font-bold text-purple-400 relative z-10">{gameState.entitySpeed}k<span className="text-sm text-slate-500">/day</span></div><div className="text-xs text-slate-500 mt-1 relative z-10 flex items-center gap-1"><BarChart3 size={10} /> {diffLabel} Mode</div></div>
        </div>
        {gameState.adaptiveMode && (<div className="text-center text-xs text-slate-600 mb-8 flex items-center justify-center gap-1"><Timer size={10} /> Next evolution in {daysToNextUpdate} days</div>)}

        {/* QUESTS */}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-4"><h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Award size={16} /> Current Mission</h3>{gameState.badges.length > 0 && <span className="text-xs bg-slate-800 px-2 py-1 rounded-full text-slate-400">{gameState.badges.length} Badges</span>}</div>
            
            {/* Quest Card (Safe Render) */}
            {!gameState.activeQuest ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-6 text-center text-slate-500 text-sm">No signals detected. Next mission available in {5 - (daysSinceStart % 5)} days.</div>
            ) : (
                <div className={`bg-gradient-to-r from-slate-900 to-slate-900 border rounded-xl p-4 relative overflow-hidden ${gameState.activeQuest.status === 'active' ? 'border-amber-600' : 'border-slate-700'}`}>
                    {gameState.activeQuest.status === 'active' && <div className="absolute top-0 right-0 bg-amber-600 text-black text-[10px] font-bold px-2 py-1 rounded-bl">ACTIVE</div>}
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-white flex items-center gap-2"><ArrowRightLeft className="text-amber-500" size={16} /> {gameState.activeQuest.title || "Unknown Mission"}</h4>
                            <p className="text-xs text-slate-400 mt-1 max-w-[80%]">Run {gameState.activeQuest.distance}km off-track to recover parts. Entity continues moving.</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-500 uppercase tracking-wide">Reward</span>
                            <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                                {React.createElement(getPartIcon(gameState.activeQuest.rewardPart), {size: 14})}
                                {activeQuestName}
                            </div>
                        </div>
                    </div>
                    {gameState.activeQuest.status === 'active' ? (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                {/* SAFETY FIX: Use optional chaining (?) and default values */}
                                <span>Progress</span>
                                <span>{(gameState.activeQuest.progress || 0).toFixed(1)} / {gameState.activeQuest.distance} km</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 transition-all" style={{width: `${((gameState.activeQuest.progress || 0) / gameState.activeQuest.distance) * 100}%`}}></div>
                            </div>
                        </div>
                    ) : (
                        <button onClick={handleAcceptQuest} className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-amber-500 border border-slate-700 font-bold py-2 rounded-lg text-sm transition-colors">Accept Mission</button>
                    )}
                </div>
            )}
        </div>

        {/* INVENTORY / ACTIONS */}
        <div className="grid grid-cols-2 gap-2 mb-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3"><h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">EMP Components</h3><div className="flex justify-between items-center px-1">{EMP_PARTS.map(part => {const count = gameState.inventory[part.id]; const hasPart = count > 0; const Icon = part.icon; return (<div key={part.id} className={`flex flex-col items-center gap-1 ${hasPart ? 'text-white' : 'text-slate-700'}`}><div className={`w-8 h-8 rounded-full border flex items-center justify-center relative ${hasPart ? `bg-slate-800 ${part.color||'text-white'} border-slate-600` : 'bg-slate-950 border-slate-800'}`}><Icon size={16} />{count > 1 && <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] w-3 h-3 flex items-center justify-center rounded-full font-bold">{count}</span>}</div></div>)})}</div>{hasCraftedEmp && <div className="mt-2 text-center text-[10px] text-emerald-400 animate-pulse font-bold">COMPONENTS ASSEMBLED</div>}</div>
            <div className="space-y-2">
                 {/* EMP BUTTON */}
                 <button 
                    onClick={handleBuyEMP} 
                    disabled={isGracePeriod} 
                    className={`w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${isGracePeriod ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-950 text-cyan-400 hover:bg-cyan-900'}`}
                 >
                    <div className="flex items-center gap-1"><ZapOff size={14} /> EMP Burst</div>
                    <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800 uppercase tracking-wider">
                        {hasCraftedEmp ? "CRAFTED" : isEmpFree ? "FREE" : "$1.00"}
                    </span>
                 </button>

                {/* BOOST BUTTON */}
                <button 
                    onClick={handleBuyBoost} 
                    className="w-full p-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all bg-yellow-950 text-yellow-400 hover:bg-yellow-900"
                >
                    <div className="flex items-center gap-1"><Rocket size={14} /> Nitrous Boost</div>
                    <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 border border-slate-800 uppercase tracking-wider">
                        {isBoostFree ? "FREE" : "$1.00"}
                    </span>
                </button>
            </div>
        </div>

        {/* SYNC / STRAVA STATUS SECTION */}
        {gameState.isStravaLinked ? (
            <div className="w-full bg-[#FC4C02]/10 border border-[#FC4C02] text-[#FC4C02] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 mb-8 shadow-[0_0_15px_rgba(252,76,2,0.15)]">
                <svg role="img" viewBox="0 0 24 24" className="w-6 h-6 fill-[#FC4C02]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
                </svg>
                <span>Strava Active</span>
                <div className="animate-pulse w-2 h-2 rounded-full bg-[#FC4C02] ml-1"></div>
            </div>
        ) : (
            <div className="flex gap-2 mb-8">
                <button onClick={handleStravaLogin} className="flex-1 bg-[#FC4C02] hover:bg-[#E34402] transition-all py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg group">
                    <svg role="img" viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
                    <span className="text-white font-bold text-sm">Connect Strava</span>
                </button>
                <button onClick={() => setShowLogModal(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition-all py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg">
                    <Footprints size={20} className="text-white" />
                    <span className="text-white font-bold text-sm">Manual Log</span>
                </button>
            </div>
        )}
        
        {/* RECENT LOGS */}
        <div className="mb-8">
            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><History size={16} /> Recent Logs</h3>
            <div className="space-y-3">
                {gameState.runHistory.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">No runs logged yet. Start running.</div>
                ) : (
                    gameState.runHistory.slice(0, 5).map((run) => (
                        <div key={run.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center group relative overflow-hidden">
                            <div>
                                <div className="text-white font-bold flex items-center gap-2">
                                    {run.km} km
                                    {run.source?.includes('strava') && <span className="text-[10px] bg-[#FC4C02]/20 text-[#FC4C02] px-1.5 py-0.5 rounded border border-[#FC4C02]/30">STRAVA</span>}
                                    {run.type === 'boost' && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">BOOST</span>}
                                    {run.type === 'quest' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">QUEST</span>}
                                </div>
                                <div className="text-slate-500 text-xs">{formatDate(new Date(run.date))} &bull; {run.notes}</div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDeleteRun(run.id)} className="p-2 rounded-lg text-slate-600 hover:bg-red-900/20 hover:text-red-500 transition-all" title="Delete Activity"><Trash2 size={16} /></button>
                                {run.type !== 'quest' && run.type !== 'boost' && gameState.activeQuest?.status === 'active' && (
                                    <button 
                                        onClick={() => handleConvertRunToQuest(run.id)}
                                        className="p-2 rounded-lg bg-slate-800 text-slate-500 hover:bg-amber-900/30 hover:text-amber-500 transition-colors"
                                        title="Assign to Mission"
                                    >
                                        <ArrowRightLeft size={16} />
                                    </button>
                                )}
                                
                                <div className="bg-slate-800 p-2 rounded-lg text-slate-400">
                                    {run.type === 'boost' ? <Rocket size={16} className="text-yellow-400" /> : run.type === 'quest' ? <Award size={16} className="text-amber-400" /> : <Activity size={16} />}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
        
        <div className="text-center text-slate-600 text-xs">Start Date: {formatDate(gameStart)} &bull; Day {daysSinceStart} of {gameState.duration} &bull; Agent: {gameState.username}</div>
      </div>
    </div>
  );
}