
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { AppConfig, User } from '../types';

interface AdminDashboardProps {
  onReset?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onReset }) => {
  // Config state used for the UI elements
  const [config, setConfig] = useState<AppConfig>(db.getConfig());
  // Separate form state for inputs to prevent glitching during typing
  const [formConfig, setFormConfig] = useState<AppConfig>(db.getConfig());
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [isSaved, setIsSaved] = useState(false);
  
  const isEditing = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const latestUsers = db.getUsers();
      const latestConfig = db.getConfig();
      
      setUsers(latestUsers);
      setConfig(latestConfig);
      
      // Only update formConfig from DB if the user isn't actively typing
      if (!isEditing.current) {
        setFormConfig(latestConfig);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveConfig(formConfig);
    setConfig(formConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('CRITICAL: Purge all participant records and reset the allocation matrix? This cannot be undone.')) {
      db.reset();
      setUsers([]);
      if (onReset) {
        onReset();
      } else {
        window.location.reload();
      }
    }
  };

  const toggleApproval = (userEmail: string) => {
    const user = db.getUserByEmail(userEmail);
    if (user) {
      db.updateUser({ ...user, isApproved: !user.isApproved });
      setUsers(db.getUsers());
    }
  };

  const toggleEventStart = () => {
    const newStatus = !config.isEventStarted;
    const updatedConfig = { ...config, isEventStarted: newStatus };
    db.saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setFormConfig(updatedConfig);
  };

  const groupStats = Array.from({ length: config.numberOfGroups }, (_, i) => {
    const groupNum = i + 1;
    const groupUsers = users.filter(u => u.assignedGroup === groupNum && u.isApproved);
    return { num: groupNum, count: groupUsers.length, users: groupUsers };
  });

  const pendingUsers = users.filter(u => u.isRegistered && !u.isApproved);
  const approvedUsers = users.filter(u => u.isApproved);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 bg-[#0a0a0a]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control Panel</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">ZERONE 7.0 Allocation Central Interface</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          {/* Global Start Toggle */}
          <button 
            onClick={toggleEventStart}
            className={`flex-1 md:flex-none px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-lg italic flex items-center gap-4 ${
              config.isEventStarted 
                ? 'bg-red-600 text-white shadow-red-600/20' 
                : 'bg-green-600 text-white shadow-green-600/20 animate-pulse'
            }`}
          >
            <div className={`w-3 h-3 rounded-full bg-white ${config.isEventStarted ? 'animate-pulse' : ''}`}></div>
            {config.isEventStarted ? 'Stop Event Access' : 'Start Global Event'}
          </button>
          
          <button 
            onClick={handleReset} 
            className="px-6 py-3 bg-red-950/20 text-red-500 border border-red-500/40 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
          >
            Purge All Data
          </button>
        </div>
      </div>

      {/* Permission Gate */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="px-10 py-8 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
          <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.4em]">Access Requests</h2>
          <div className="flex items-center gap-4">
            <span className="bg-red-600 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest animate-pulse">
              {pendingUsers.length} Pending
            </span>
          </div>
        </div>
        <div className="p-4 md:p-10">
          {pendingUsers.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600 text-xs font-black uppercase tracking-widest">No pending authorization requests.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingUsers.map(u => (
                <div key={u.email} className="bg-black border border-white/10 p-6 rounded-2xl flex justify-between items-center group hover:border-red-600 transition-colors">
                  <div>
                    <p className="font-black text-white uppercase italic tracking-tight">{u.fullName}</p>
                    <p className="text-[9px] text-red-600 font-black uppercase tracking-widest mt-1">{u.department}</p>
                  </div>
                  <button 
                    onClick={() => toggleApproval(u.email)} 
                    className="bg-green-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110"
                  >
                    Authorize
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Settings Card */}
        <div className="md:col-span-4 bg-white/5 border border-white/10 p-8 rounded-[2rem] relative">
          <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.3em] mb-6">System Config</h2>
          <form onSubmit={handleUpdateConfig} className="space-y-6">
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase mb-2 block tracking-widest">Expected Capacity</label>
              <input 
                type="number" 
                value={formConfig.totalParticipants} 
                onFocus={() => { isEditing.current = true; }}
                onBlur={() => { isEditing.current = false; }}
                onChange={e => setFormConfig({ ...formConfig, totalParticipants: parseInt(e.target.value) || 0 })} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-red-600 transition-colors" 
                placeholder="Ex: 100" 
              />
            </div>
            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase mb-2 block tracking-widest">Squad Count</label>
              <input 
                type="number" 
                value={formConfig.numberOfGroups} 
                onFocus={() => { isEditing.current = true; }}
                onBlur={() => { isEditing.current = false; }}
                onChange={e => setFormConfig({ ...formConfig, numberOfGroups: parseInt(e.target.value) || 0 })} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-red-600 transition-colors" 
                placeholder="Ex: 10" 
              />
            </div>
            <button 
              type="submit" 
              className={`w-full py-4 rounded-xl font-black text-xs uppercase shadow-lg transition-all ${isSaved ? 'bg-green-600' : 'bg-red-600'} text-white`}
            >
              {isSaved ? 'Matrix Synced' : 'Sync Matrix'}
            </button>
          </form>
        </div>

        {/* Real-time Status Card */}
        <div className="md:col-span-8 bg-gradient-to-br from-red-600 to-red-900 p-10 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase mb-4 opacity-80 tracking-[0.3em]">Cleared Registrations</h2>
            <div className="flex items-end">
              <span className="text-8xl font-black italic tracking-tighter">{approvedUsers.length}</span>
              <span className="text-2xl font-light opacity-60 ml-3 mb-3 tracking-widest">/ {config.totalParticipants}</span>
            </div>
          </div>
          <div className="mt-8 w-full bg-black/20 rounded-full h-3 overflow-hidden border border-white/10 relative z-10">
            <div 
              className="bg-white h-full transition-all duration-1000 ease-out" 
              style={{ width: `${Math.min((approvedUsers.length / config.totalParticipants) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Group Distribution Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {groupStats.map(group => (
          <div key={group.num} className="bg-white/5 rounded-3xl border border-white/10 p-6 group hover:border-red-600/30 transition-all">
            <div className="flex justify-between items-center mb-6">
              <span className="font-black text-xs uppercase text-gray-400 italic tracking-widest">Squad {group.num}</span>
              <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded-md">
                {group.count} / {config.participantsPerGroup}
              </span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {group.users.length === 0 ? (
                <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest text-center py-4">No Data</p>
              ) : (
                group.users.map(u => (
                  <div key={u.id} className="flex flex-col border-l-2 border-red-600/30 pl-4 py-1">
                    <span className="text-xs font-black uppercase tracking-tight text-gray-200">{u.fullName}</span>
                    <button 
                      onClick={() => toggleApproval(u.email)} 
                      className="text-[7px] text-red-600 uppercase text-left font-bold hover:underline mt-1"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
