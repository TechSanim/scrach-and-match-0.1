
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
    alert('Config saved!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all user assignments? This will clear all participant data and scratches.')) {
      db.reset();
      setUsers([]);
      if (onReset) {
        onReset();
      } else {
        alert('Data cleared! Please refresh the page.');
      }
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
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <button 
          onClick={handleReset}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
        >
          Reset All Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-1">
          <h2 className="text-lg font-semibold mb-4">Game Settings</h2>
          <form onSubmit={handleUpdateConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Participants</label>
              <input 
                type="number"
                value={config.totalParticipants}
                onChange={e => setConfig({ ...config, totalParticipants: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Groups</label>
              <input 
                type="number"
                value={config.numberOfGroups}
                onChange={e => setConfig({ ...config, numberOfGroups: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max per Group</label>
              <input 
                type="number"
                value={config.participantsPerGroup}
                onChange={e => setConfig({ ...config, participantsPerGroup: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Update Settings
            </button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-80">Overall Progress</h2>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-bold">{users.length}</span>
              <span className="text-xl opacity-60">/ {config.totalParticipants} Registered</span>
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className="w-full bg-indigo-400 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((users.length / config.totalParticipants) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-sm opacity-80">Distribution: {((users.length / config.totalParticipants) * 100).toFixed(1)}% Capacity</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupStats.map(group => (
          <div key={group.num} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-700">Group {group.num}</span>
              <span className={`px-2 py-1 rounded text-xs font-bold ${group.count >= config.participantsPerGroup ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {group.count} / {config.participantsPerGroup}
              </span>
            </div>
            <div className="p-4 max-h-48 overflow-y-auto">
              {group.users.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No participants yet</p>
              ) : (
                <ul className="space-y-2">
                  {group.users.map(u => (
                    <li key={u.id} className="text-sm flex flex-col border-b border-gray-50 pb-2 last:border-0">
                      <span className="font-medium text-gray-900">{u.fullName}</span>
                      <span className="text-gray-500 text-xs">{u.department}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
