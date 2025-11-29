import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// RE-PASTE YOUR FIREBASE CONFIG HERE
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

  useEffect(() => {
    signInAnonymously(auth).then((u) => setUser(u.user));
  }, []);

  const handleWipe = async () => {
      if (!user) return;
      // Overwrite the save file with a clean slate
      await setDoc(doc(db, 'artifacts', appId, 'users', user.user.uid, 'game_data', 'main_save'), {
          onboardingComplete: false
      });
      alert("Database Wiped. You can now reinstall the main game code.");
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl text-red-500 font-bold">EMERGENCY MODE</h1>
        <p>If you can see this, the app structure is fine.</p>
        <p>The crash was caused by Bad Data.</p>
        <button onClick={handleWipe} className="bg-red-600 px-6 py-3 rounded font-bold">
            WIPE SAVE DATA
        </button>
    </div>
  );
}