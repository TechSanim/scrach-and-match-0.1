
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { AppConfig, User } from '../types';

interface AdminDashboardProps {
  onReset?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onReset }) => {
  const [config, setConfig] = useState<AppConfig>(db.getConfig());
  const [users, setUsers] = useState<User[]>(db.getUsers());

  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(db.getUsers());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateConfig = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveConfig(config);
    alert('System Configuration Synchronized.');
  };

  const handleReset = () => {
    if (confirm('CRITICAL: Purge all participant records and reset allocation matrix?')) {
      db.reset();
      setUsers([]);
      if (onReset) onReset();
    }
  };

  const groupStats = Array.from({ length: config.numberOfGroups }, (_, i) => {
    const groupNum = i + 1;
    const groupUsers = users.filter(u => u.assignedGroup === groupNum);
    return {
      num: groupNum,
      count: groupUsers.length,
      users: groupUsers
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 bg-[#0a0a0a]">
      <div className="flex justify-between items-end border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control Panel</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">ZERONE 7.0 Allocation Central Interface</p>
        </div>
        <button 
          onClick={handleReset}
          className="px-6 py-3 bg-red-950/30 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
        >
          Purge Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Settings Card */}
        <div className="md:col-span-4 bg-white/5 border border-white/10 p-8 rounded-[2rem] shadow-2xl">
          <h2 className="text-xs font-black text-red-500 uppercase tracking-[0.3em] mb-6">System Config</h2>
          <form onSubmit={handleUpdateConfig} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Expected Capacity</label>
              <input 
                type="number"
                value={config.totalParticipants}
                onChange={e => setConfig({ ...config, totalParticipants: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-1 focus:ring-red-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Squad Count</label>
              <input 
                type="number"
                value={config.numberOfGroups}
                onChange={e => setConfig({ ...config, numberOfGroups: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-1 focus:ring-red-600 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Density Limit</label>
              <input 
                type="number"
                value={config.participantsPerGroup}
                onChange={e => setConfig({ ...config, participantsPerGroup: parseInt(e.target.value) || 0 })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-1 focus:ring-red-600 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-red-600 text-white py-4 rounded-xl hover:brightness-110 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-red-900/20"
            >
              Sync Matrix
            </button>
          </form>
        </div>

        {/* Real-time Status */}
        <div className="md:col-span-8 bg-gradient-to-br from-red-600 to-red-900 p-10 rounded-[2.5rem] shadow-2xl text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-80">Active Node Status</h2>
            <div className="flex items-end gap-3">
              <span className="text-8xl font-black tracking-tighter italic">{users.length}</span>
              <span className="text-2xl font-light opacity-60 mb-3 tracking-widest">/ {config.totalParticipants}</span>
            </div>
            <p className="text-sm font-black uppercase tracking-widest mt-2 opacity-90 italic">Verified Registrations</p>
          </div>
          <div className="mt-12 space-y-4 relative z-10">
            <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm overflow-hidden border border-white/10">
              <div 
                className="bg-white h-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min((users.length / config.totalParticipants) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
               <span>Matrix Saturation</span>
               <span>{((users.length / config.totalParticipants) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Group Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {groupStats.map(group => (
          <div key={group.num} className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden hover:border-red-600/30 transition-colors group">
            <div className="bg-white/[0.03] px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <span className="font-black text-xs uppercase tracking-widest text-gray-400 group-hover:text-red-500 transition-colors italic">Squad {group.num}</span>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${group.count >= config.participantsPerGroup ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                {group.count} / {config.participantsPerGroup}
              </span>
            </div>
            <div className="p-6 max-h-60 overflow-y-auto space-y-4 scrollbar-thin">
              {group.users.length === 0 ? (
                <div className="py-8 text-center">
                   <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Awaiting Data...</p>
                </div>
              ) : (
                group.users.map(u => (
                  <div key={u.id} className="flex flex-col border-l-2 border-red-600/30 pl-4 py-1">
                    <span className="text-xs font-black text-gray-200 uppercase tracking-tight">{String(u.fullName)}</span>
                    <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">{String(u.department).split(' ')[0]} Sector</span>
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
