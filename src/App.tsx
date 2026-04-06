import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import Workbench from './Workbench';
import { LogIn, Terminal, Loader2 } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            lastLogin: serverTimestamp()
          });
        } else {
          await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled. Please try again.');
      } else {
        setError('Login failed. Please check your connection.');
        console.error("Login failed:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Initializing System...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-950 overflow-hidden relative">
      <Workbench user={user} onLogin={handleLogin} />
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 text-red-500 px-6 py-3 rounded-xl backdrop-blur-md z-[200] flex items-center gap-3"
          >
            <Terminal size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 hover:text-white transition-colors">
              <LogIn size={16} className="rotate-180" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
