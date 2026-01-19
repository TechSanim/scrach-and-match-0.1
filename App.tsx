
import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User, AppConfig } from './types';
import ScratchCard from './components/ScratchCard';
import AdminDashboard from './components/AdminDashboard';
import confetti from 'canvas-confetti';

const ADMIN_CREDENTIALS = {
  username: "zerone7.0",
  password: "gamelaunch2026"
};

interface AdminAuthModalProps {
  isOpen: boolean;
  username: string;
  password: string;
  onUsernameChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onVerify: (e: React.FormEvent) => void;
  onClose: () => void;
  error: boolean;
}

const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen, username, password, onUsernameChange, onPasswordChange, onVerify, onClose, error
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
      <div className="max-w-md w-full bg-neutral-900 border border-red-600/30 p-10 rounded-[2.5rem] shadow-[0_0_80px_rgba(220,38,38,0.25)] animate-pop-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse"></div>
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-black text-white text-center tracking-tight mb-2 uppercase italic">Admin Console</h2>
        <p className="text-[10px] text-gray-500 text-center font-black uppercase tracking-[0.4em] mb-10 opacity-70">Initialize Dual-Factor Handshake</p>
        <form onSubmit={onVerify} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-red-600/60 uppercase tracking-[0.3em] ml-1">Terminal ID</label>
            <input type="text" autoFocus value={username} onChange={(e) => onUsernameChange(e.target.value)}
              className={`w-full bg-black border ${error ? 'border-red-600 animate-shake' : 'border-white/10'} rounded-2xl px-6 py-4 text-white font-mono text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-red-600 transition-all placeholder:text-gray-800`}
              placeholder="IDENTITY" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-red-600/60 uppercase tracking-[0.3em] ml-1">Access Core Key</label>
            <input type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)}
              className={`w-full bg-black border ${error ? 'border-red-600 animate-shake' : 'border-white/10'} rounded-2xl px-6 py-4 text-white font-mono text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-red-600 transition-all placeholder:text-gray-800`}
              placeholder="••••••••••••" />
          </div>
          {error && (
            <div className="bg-red-600/10 border border-red-600/20 py-3 rounded-xl text-center">
              <p className="text-[9px] text-red-500 font-black uppercase tracking-widest animate-pulse">Verification Failed: Protocol Breach</p>
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white transition-colors">Abort</button>
            <button type="submit" className="flex-1 bg-gradient-to-br from-red-600 to-red-900 text-white px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-125 transition-all shadow-lg shadow-red-900/30 italic">Sync</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>(db.getConfig());
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('session_email');
      if (savedEmail) {
        const user = db.getUserByEmail(savedEmail);
        if (user) setCurrentUser(user);
        else {
          localStorage.removeItem('session_email');
        }
      }
      const adminSession = sessionStorage.getItem('admin_verified');
      if (adminSession === 'true') setIsAdmin(true);
    } catch (e) { console.warn("Session restore failed", e); }
    setLoading(false);
  }, []);

  useEffect(() => {
    const poll = setInterval(() => {
      const latestConfig = db.getConfig();
      setAppConfig(latestConfig);
      
      if (currentUser) {
        const updated = db.getUserByEmail(currentUser.email);
        if (updated) {
          if (updated.isApproved !== currentUser.isApproved || 
              updated.isScratched !== currentUser.isScratched ||
              updated.assignedGroup !== currentUser.assignedGroup) {
            setCurrentUser(updated);
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('session_email');
        }
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [currentUser]);

  const triggerCelebration = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 60 * (timeLeft / duration);
      const colors = ['#dc2626', '#ffffff', '#7f1d1d'];
      confetti({ particleCount, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 }, colors });
      confetti({ particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 }, colors });
    }, 250);
  };

  const handleGoogleLoginInitiate = () => {
    setShowEmailPrompt(true);
  };

  const handleGoogleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes('@')) return;
    
    setIsAuthenticating(true);
    setTimeout(() => {
      const existingUser = db.getUserByEmail(emailInput);
      let user: User;
      if (existingUser) user = existingUser;
      else {
        user = { id: Math.random().toString(36).substr(2, 9), email: emailInput, isRegistered: false, isApproved: false, isScratched: false };
        db.updateUser(user);
      }
      localStorage.setItem('session_email', emailInput);
      setCurrentUser(user);
      setIsAuthenticating(false);
      setShowEmailPrompt(false);
    }, 800);
  };

  const verifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsernameInput === ADMIN_CREDENTIALS.username && adminPasswordInput === ADMIN_CREDENTIALS.password) {
      setIsAdmin(true);
      setShowAdminAuth(false);
      setAdminUsernameInput("");
      setAdminPasswordInput("");
      setAuthError(false);
      sessionStorage.setItem('admin_verified', 'true');
    } else {
      setAuthError(true);
      setTimeout(() => setAuthError(false), 2000);
    }
  };

  const handleRegistration = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (currentUser) {
      const updatedUser: User = { 
        ...currentUser, 
        fullName: String(formData.get('fullName')), 
        department: String(formData.get('department')), 
        isRegistered: true, 
        isApproved: false 
      };
      db.updateUser(updatedUser);
      setCurrentUser(updatedUser);
    }
  };

  const handleScratchComplete = () => {
    if (currentUser && !currentUser.isScratched && currentUser.isApproved && appConfig.isEventStarted) {
      const config = db.getConfig();
      const allUsers = db.getUsers();
      const scratchedUsers = allUsers.filter(u => u.isScratched).length;
      const numGroups = Math.max(1, config.numberOfGroups);
      const groupNum = (scratchedUsers % numGroups) + 1;
      const updatedUser: User = { ...currentUser, isScratched: true, assignedGroup: groupNum };
      db.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      triggerCelebration();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session_email');
    sessionStorage.removeItem('admin_verified');
    setCurrentUser(null);
    setIsAdmin(false);
    setEmailInput("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (isAdmin) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="bg-black border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
          <span className="font-black text-xs uppercase tracking-widest text-red-500">Mainframe Override</span>
        </div>
        <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black text-gray-400 hover:text-white transition uppercase tracking-[0.2em]">Close Access</button>
      </nav>
      <AdminDashboard onReset={() => { 
        setCurrentUser(null); 
        setIsAdmin(false); 
        window.location.reload(); 
      }} />
    </div>
  );

  if (!currentUser) return (
    <div className="min-h-screen bg-poster flex items-center justify-center p-4 relative overflow-hidden">
      <AdminAuthModal isOpen={showAdminAuth} username={adminUsernameInput} password={adminPasswordInput} onUsernameChange={setAdminUsernameInput} onPasswordChange={setAdminPasswordInput} onVerify={verifyAdmin} onClose={() => setShowAdminAuth(false)} error={authError} />
      <div className="max-w-md w-full bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center shadow-[0_0_120px_-20px_rgba(220,38,38,0.3)] animate-pop-in relative z-10">
        <div className="mb-10 inline-block p-6 rounded-[2rem] bg-gradient-to-br from-red-600/20 to-transparent border border-red-500/30">
           <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h1 className="text-3xl font-extralight text-gray-400 mb-1 tracking-[0.4em] uppercase">Initialize</h1>
        <h2 className="text-5xl font-black text-white mb-8 italic tracking-tighter uppercase drop-shadow-xl">Scratch & Match</h2>
        
        {!showEmailPrompt ? (
          <button onClick={handleGoogleLoginInitiate} className="w-full flex items-center justify-center gap-4 bg-white text-black px-8 py-5 rounded-[1.8rem] hover:bg-gray-100 transition-all font-black shadow-2xl transform active:scale-95 group">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-6 h-6 group-hover:scale-110 transition-transform" alt="G" />
            <span>Continue with Google</span>
          </button>
        ) : (
          <form onSubmit={handleGoogleLoginSubmit} className="space-y-4 animate-pop-in">
            <div className="relative">
              <input 
                type="email" 
                required 
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your Gmail address"
                className="w-full bg-black/60 border border-white/20 rounded-2xl px-6 py-5 text-white font-bold focus:border-red-600 outline-none transition-all placeholder:text-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setShowEmailPrompt(false)}
                className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isAuthenticating}
                className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-900/40"
              >
                {isAuthenticating ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}
        
        <button onClick={() => setShowAdminAuth(true)} className="mt-16 text-[8px] text-white/5 hover:text-white/40 uppercase tracking-[0.6em] font-black transition-colors">Terminal Access</button>
      </div>
    </div>
  );

  if (!currentUser.isRegistered) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-poster">
      <AdminAuthModal isOpen={showAdminAuth} username={adminUsernameInput} password={adminPasswordInput} onUsernameChange={setAdminUsernameInput} onPasswordChange={setAdminPasswordInput} onVerify={verifyAdmin} onClose={() => setShowAdminAuth(false)} error={authError} />
      <div className="max-w-md w-full bg-black/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl p-12 animate-pop-in">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic">REGISTRATION</h2>
        <form onSubmit={handleRegistration} className="space-y-8 mt-10">
          <input name="fullName" required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-white font-bold" placeholder="Full Identity Name" />
          <select name="department" required className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-white appearance-none cursor-pointer font-bold">
            <option value="" className="bg-neutral-900">Select Department</option>
            <option value="CSE" className="bg-neutral-900">CSE</option>
            <option value="ECE" className="bg-neutral-900">ECE</option>
            <option value="EEE" className="bg-neutral-900">EEE</option>
            <option value="Civil" className="bg-neutral-900">Civil</option>
            <option value="Mechanical" className="bg-neutral-900">Mechanical</option>
          </select>
          <button type="submit" className="w-full bg-gradient-to-br from-red-600 to-red-900 text-white py-6 rounded-[1.5rem] hover:brightness-110 transition-all font-black text-lg tracking-[0.2em] shadow-xl uppercase italic">Confirm Access</button>
        </form>
      </div>
    </div>
  );

  if (!currentUser.isApproved) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-12 text-center overflow-hidden">
      <div className="relative z-10 space-y-10 animate-pop-in">
        <div className="w-32 h-32 rounded-full border border-red-600/30 mx-auto flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 11V7a4 4 0 00-8 0v4h8zM6 11h2v4h4v2h2v-6h4a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" /></svg>
        </div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Clearance Pending</h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] leading-relaxed max-w-sm mx-auto">Awaiting mainframe authorization for <span className="text-white">"{currentUser.fullName}"</span></p>
        </div>
        <button onClick={handleLogout} className="text-[9px] font-black text-gray-700 hover:text-white transition uppercase tracking-[0.3em] pb-1 border-b border-transparent hover:border-white">Cancel</button>
      </div>
    </div>
  );

  if (!appConfig.isEventStarted && !currentUser.isScratched) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-12 text-center overflow-hidden">
      <div className="relative z-10 space-y-10 animate-pop-in">
        <div className="w-40 h-40 rounded-full border-4 border-dashed border-red-600/40 flex items-center justify-center mx-auto animate-spin-slow">
           <span className="text-2xl font-black text-red-600 animate-pulse">LOCK</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">Standby</h2>
          <div className="flex items-center justify-center gap-3"><div className="w-2 h-2 rounded-full bg-red-600 animate-ping"></div><p className="text-gray-400 text-[11px] font-black uppercase tracking-[0.5em]">Awaiting Global Start Signal...</p></div>
        </div>
      </div>
      <div className="absolute bottom-12 w-full flex justify-center"><button onClick={() => setShowAdminAuth(true)} className="text-[6px] text-white/10 uppercase tracking-[1em] font-black">Admin Node</button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-inter">
      <AdminAuthModal isOpen={showAdminAuth} username={adminUsernameInput} password={adminPasswordInput} onUsernameChange={setAdminUsernameInput} onPasswordChange={setAdminPasswordInput} onVerify={verifyAdmin} onClose={() => setShowAdminAuth(false)} error={authError} />
      <nav className="bg-black/80 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center text-xl font-black border border-white/10">{String(currentUser.fullName || '?').charAt(0)}</div>
          <div className="flex flex-col"><span className="font-black text-sm tracking-tight uppercase leading-none mb-1">{String(currentUser.fullName)}</span><span className="text-[10px] text-red-600 uppercase font-black tracking-widest">{String(currentUser.department)}</span></div>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-black text-red-500 hover:text-red-400 transition uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-full">Terminate</button>
      </nav>
      <main className="flex-1 flex flex-col items-center justify-center p-10 space-y-20 max-w-2xl mx-auto w-full relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 blur-[180px] rounded-full pointer-events-none"></div>
        <div className="text-center space-y-6 relative"><h2 className="text-6xl font-black text-white tracking-tighter italic uppercase">The Reveal</h2><p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] max-w-xs mx-auto leading-loose opacity-70">Scratch the card surface to find your designated group assignment for ZERONE 7.0</p></div>
        <div className="relative z-10 w-full flex justify-center transform scale-100 md:scale-[1.3] transition-transform duration-700">
          <ScratchCard revealValue={currentUser.assignedGroup ?? '??'} onComplete={handleScratchComplete} isAlreadyRevealed={currentUser.isScratched} />
        </div>
        {currentUser.isScratched ? (
          <div className="text-center bg-white/5 border border-white/10 p-12 rounded-[3.5rem] animate-pop-in w-full shadow-2xl relative overflow-hidden group">
            <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.6em] mb-6">Access Granted • Verified</p>
            <p className="text-gray-200 text-4xl font-black tracking-tighter mb-4 uppercase italic">Squad: <span className="text-white bg-red-600 px-6 py-1 rounded-2xl shadow-lg shadow-red-900/40">{String(currentUser.assignedGroup)}</span></p>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-red-600/60 animate-pulse-slow bg-red-950/20 px-10 py-4 rounded-full border border-red-500/10 backdrop-blur-md">
            <span className="text-[11px] font-black uppercase tracking-[0.5em]">Swipe to Initialize Reveal</span>
          </div>
        )}
      </main>
      <footer className="p-12 text-center flex flex-col items-center gap-4"><p className="text-[9px] text-gray-800 font-black uppercase tracking-[1em] opacity-40">IEEE CE KIDANGOOR • ZERONE 7.0</p></footer>
    </div>
  );
};

export default App;
