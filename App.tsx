
import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User } from './types';
import ScratchCard from './components/ScratchCard';
import AdminDashboard from './components/AdminDashboard';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('session_email');
    if (savedEmail) {
      const user = db.getUserByEmail(savedEmail);
      if (user) setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const triggerCelebration = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 100, zIndex: 99 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 60 * (timeLeft / duration);
      const colors = ['#dc2626', '#ffffff', '#7f1d1d', '#171717'];
      
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors });
    }, 250);
  };

  const handleGoogleLogin = () => {
    setIsAuthenticating(true);
    // Simulate Google Sign-In Delay and Popup feel
    setTimeout(() => {
      const mockEmail = "participant@gmail.com";
      const existingUser = db.getUserByEmail(mockEmail);
      
      let user: User;
      if (existingUser) {
        user = existingUser;
      } else {
        user = {
          id: Math.random().toString(36).substr(2, 9),
          email: mockEmail,
          isRegistered: false,
          isScratched: false
        };
        db.updateUser(user);
      }
      
      localStorage.setItem('session_email', mockEmail);
      setCurrentUser(user);
      setIsAuthenticating(false);
    }, 1200);
  };

  const handleRegistration = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get('fullName') || '');
    const department = String(formData.get('department') || '');

    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        fullName,
        department,
        isRegistered: true
      };
      db.updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }
  };

  const handleScratchComplete = () => {
    if (currentUser && !currentUser.isScratched) {
      const config = db.getConfig();
      const allUsers = db.getUsers();
      const scratchedUsers = allUsers.filter(u => u.isScratched).length;
      
      // Safety guard for division by zero
      const numGroups = Math.max(1, config.numberOfGroups);
      const groupNum = (scratchedUsers % numGroups) + 1;

      const updatedUser: User = {
        ...currentUser,
        isScratched: true,
        assignedGroup: groupNum
      };
      
      db.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      triggerCelebration();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session_email');
    setCurrentUser(null);
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
            <span className="font-black text-xs uppercase tracking-widest text-red-500">Mainframe Override</span>
          </div>
          <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black text-gray-400 hover:text-white transition uppercase tracking-[0.2em]">Close Access</button>
        </nav>
        <AdminDashboard onReset={() => window.location.reload()} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-poster flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated ambient background element */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-950/20 blur-[120px] rounded-full animate-pulse-slow"></div>

        <div className="max-w-md w-full bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center shadow-[0_0_120px_-20px_rgba(220,38,38,0.3)] animate-pop-in relative z-10">
          <div className="mb-10 inline-block p-6 rounded-[2rem] bg-gradient-to-br from-red-600/20 to-transparent border border-red-500/30">
             <div className="w-16 h-16 text-red-500 flex items-center justify-center">
                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
             </div>
          </div>
          <h1 className="text-3xl font-extralight text-gray-400 mb-1 tracking-[0.4em] uppercase">Initialize</h1>
          <h2 className="text-5xl font-black text-white mb-8 italic tracking-tighter uppercase drop-shadow-xl">Scratch & Match</h2>
          <div className="h-[2px] w-16 bg-red-600 mx-auto mb-10"></div>
          
          <button 
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className={`w-full flex items-center justify-center gap-4 bg-white text-black px-8 py-5 rounded-[1.8rem] hover:bg-gray-100 transition-all font-black shadow-2xl transform active:scale-95 group ${isAuthenticating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isAuthenticating ? (
               <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="Google" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => setIsAdmin(true)}
            className="mt-16 text-[8px] text-white/5 hover:text-white/40 uppercase tracking-[0.6em] font-black transition-colors"
          >
            Terminal Access
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser.isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-poster">
        <div className="max-w-md w-full bg-black/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl p-12 animate-pop-in">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic">REGISTRATION</h2>
          <p className="text-gray-500 mb-10 text-xs font-bold uppercase tracking-widest">Identify yourself to the network.</p>
          <form onSubmit={handleRegistration} className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-red-500/60 uppercase tracking-[0.3em] mb-3 ml-1">Full Identity Name</label>
              <input 
                name="fullName"
                autoComplete="off"
                required
                className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all font-bold placeholder:text-gray-700" 
                placeholder="Ex: Alan Turing"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-red-500/60 uppercase tracking-[0.3em] mb-3 ml-1">Department Sector</label>
              <div className="relative">
                <select 
                  name="department"
                  required
                  className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all appearance-none cursor-pointer font-bold"
                >
                  <option value="" className="bg-neutral-900">Select Department</option>
                  <option value="Computer Science and Engineering" className="bg-neutral-900">Computer Science and Engineering</option>
                  <option value="Electrical and Computer Engineering" className="bg-neutral-900">Electrical and Computer Engineering</option>
                  <option value="Electrical and Electronics Engineering" className="bg-neutral-900">Electrical and Electronics Engineering</option>
                  <option value="Electronics & Communication Engineering" className="bg-neutral-900">Electronics & Communication Engineering</option>
                  <option value="Electronics & Instrumentation Engineering" className="bg-neutral-900">Electronics & Instrumentation Engineering</option>
                  <option value="Civil Engineering" className="bg-neutral-900">Civil Engineering</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-red-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-br from-red-600 to-red-900 text-white py-6 rounded-[1.5rem] hover:brightness-110 transition-all font-black text-lg tracking-[0.2em] shadow-xl shadow-red-900/20 transform active:scale-95 uppercase italic"
            >
              Confirm Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-inter">
      <nav className="bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center text-xl font-black border border-white/10 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            {String(currentUser.fullName || '?').charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-sm tracking-tight uppercase leading-none mb-1">{String(currentUser.fullName)}</span>
            <span className="text-[10px] text-red-600 uppercase font-black tracking-widest opacity-90">{String(currentUser.department)}</span>
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <button onClick={() => setIsAdmin(true)} className="text-[9px] font-black text-gray-600 hover:text-white transition uppercase tracking-[0.4em]">Mainframe</button>
          <button onClick={handleLogout} className="text-[10px] font-black text-red-500 hover:text-red-400 transition uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-full">Terminate</button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-10 space-y-20 max-w-2xl mx-auto w-full relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[180px] rounded-full pointer-events-none"></div>

        <div className="text-center space-y-6 relative">
          <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase">The Reveal</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-xs mx-auto leading-loose opacity-70">Scratch the card surface to find your designated group assignment for ZERONE 7.0</p>
        </div>

        <div className="relative z-10 w-full flex justify-center transform scale-100 md:scale-[1.3] transition-transform duration-700">
          <ScratchCard 
            revealValue={currentUser.assignedGroup ?? '??'} 
            onComplete={handleScratchComplete}
            isAlreadyRevealed={currentUser.isScratched}
          />
        </div>

        {currentUser.isScratched ? (
          <div className="text-center bg-white/5 border border-white/10 p-12 rounded-[3.5rem] animate-pop-in w-full shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
            <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.6em] mb-6">Access Granted • Verified</p>
            <p className="text-gray-200 text-4xl font-black tracking-tighter mb-4 uppercase italic">Squad: <span className="text-white bg-red-600 px-6 py-1 rounded-2xl shadow-lg shadow-red-900/40">{String(currentUser.assignedGroup)}</span></p>
            <div className="w-12 h-[2px] bg-gray-800 mx-auto mt-8 mb-6"></div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] opacity-80">Permanent Allocation Complete</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-4 text-red-600/60 animate-pulse-slow bg-red-950/20 px-10 py-4 rounded-full border border-red-500/10 backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              <span className="text-[11px] font-black uppercase tracking-[0.5em]">Swipe to Initialize</span>
            </div>
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-2">Surface scan required</p>
          </div>
        )}
      </main>

      <footer className="p-12 text-center text-[9px] text-gray-800 border-t border-white/5 font-black uppercase tracking-[1em] opacity-40">
        IEEE CE KIDANGOOR • ZERONE 7.0 • MMXXIV
      </footer>
    </div>
  );
};

export default App;
