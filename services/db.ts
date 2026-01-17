
import { User, AppConfig } from '../types';

const USERS_KEY = 'scratch_app_users_v2'; // Versioned key to prevent legacy data issues
const CONFIG_KEY = 'scratch_app_config_v2';

export const db = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("DB Error: Failed to parse users", e);
      return [];
    }
  },

  saveUsers: (users: User[]) => {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error("DB Error: Failed to save users", e);
    }
  },

  getUserByEmail: (email: string): User | undefined => {
    if (!email) return undefined;
    return db.getUsers().find(u => u.email === email);
  },

  updateUser: (user: User) => {
    if (!user || !user.email) return;
    const users = db.getUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index > -1) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push(user);
    }
    db.saveUsers(users);
  },

  getConfig: (): AppConfig => {
    try {
      const data = localStorage.getItem(CONFIG_KEY);
      const defaults: AppConfig = {
        totalParticipants: 100,
        numberOfGroups: 10,
        participantsPerGroup: 10
      };
      if (!data) return defaults;
      const parsed = JSON.parse(data);
      return { ...defaults, ...parsed };
    } catch (e) {
      return {
        totalParticipants: 100,
        numberOfGroups: 10,
        participantsPerGroup: 10
      };
    }
  },

  saveConfig: (config: AppConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  reset: () => {
    localStorage.removeItem(USERS_KEY);
    // Note: We intentionally keep the config even after reset
  }
};
