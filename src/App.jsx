import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';

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
const appId = 'default-app-id';

export default function App() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("Initializing System...");
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus("Attempting Anonymous Auth...");
    
    signInAnonymously(auth)
      .then((userCredential) => {
        setUser(userCredential.user);
        setStatus(`✅ Ready. Authenticated as: ${userCredential.user.uid.slice(0, 6)}...`);
      })
      .catch((error) => {
        console.error(error);
        setStatus("❌ Auth Failed.");
        setError(error.message);
      });
  }, []);

  const handleWipe = async () => {
      if (!user) {
          alert("Please wait for authentication to finish.");
          return;
      }

      setStatus("⏳ Wiping Data...");
      
      try {
          // Force overwrite the save file with a blank object
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'game_data', 'main_save'), {
              onboardingComplete: false,
              wipedAt: new Date().toISOString()
          });
          
          alert("SUCCESS: Data Wiped. You can now install the game code.");
          setStatus("✅ Data Wiped. Ready for Game Code.");
      } catch (e) {
          console.error(e);
          alert("Error wiping data: " + e.message);
          setStatus("❌ Error Wiping Data");
      }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-6 font-mono text-center">
        <h1 className="text-3xl text-red-600 font-black uppercase tracking-widest border-b border-red-900 pb-2">
            Emergency Console
        </h1>
        
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 w-full max-w-md">
            <p className="text-xs text-slate-500 uppercase mb-1">System Status</p>
            <p className="text-emerald-400 font-bold">{status}</p>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>

        <div className="max-w-md text-sm text-slate-400">
            <p className="mb-2">This tool fixes the "White Screen" crash by forcing your save file to reset.</p>
        </div>

        <button 
            onClick={handleWipe} 
            disabled={!user}
            className={`px-8 py-4 rounded-xl font-black text-lg transition-all 
                ${user ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
        >
            {user ? "NUCLEAR WIPE SAVE DATA" : "WAITING FOR AUTH..."}
        </button>
    </div>
  );
}