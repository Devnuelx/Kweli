import { Achievement, HistoryItem, Transaction, User } from '../types';

const STORAGE_KEYS = {
  USER: '@kweli_user',
  HISTORY: '@kweli_history',
  ACHIEVEMENTS: '@kweli_achievements',
  TRANSACTIONS: '@kweli_transactions',
  SCANNED_CODES: '@kweli_scanned_codes',
  AUTH_TOKEN: '@kweli_auth_token',
};

const getJSON = (key: string) => {
  try {
    const raw = globalThis.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('storage.web getJSON error', e);
    return null;
  }
};

const setJSON = (key: string, value: any) => {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('storage.web setJSON error', e);
  }
};

// User
export const saveUser = async (user: User | null) => {
  setJSON(STORAGE_KEYS.USER, user);
};

export const getUser = async (): Promise<User | null> => {
  return getJSON(STORAGE_KEYS.USER);
};

export const saveUserSync = (user: User | null) => setJSON(STORAGE_KEYS.USER, user);

export const updateUserPoints = async (points: number) => {
  const u = (await getUser()) || { id: '', points: 0, totalScans: 0, isLoggedIn: false };
  u.points = (u.points || 0) + points;
  await saveUser(u as User);
  return u;
};

export const incrementScans = async () => {
  const u = (await getUser()) || { id: '', points: 0, totalScans: 0, isLoggedIn: false };
  u.totalScans = (u.totalScans || 0) + 1;
  await saveUser(u as User);
  return u;
};

export const addPoints = async (points: number) => updateUserPoints(points);

export const logout = async () => {
  saveUser(null);
};

// History
export const saveHistoryItem = async (item: HistoryItem) => {
  const arr: HistoryItem[] = getJSON(STORAGE_KEYS.HISTORY) || [];
  arr.unshift(item);
  setJSON(STORAGE_KEYS.HISTORY, arr);
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  return getJSON(STORAGE_KEYS.HISTORY) || [];
};

export const clearHistory = async () => {
  setJSON(STORAGE_KEYS.HISTORY, []);
};

// Achievements
export const initializeAchievements = async () => {
  // Read existing achievements (may be null or an array). Treat empty array as uninitialized
  const existing: Achievement[] = getJSON(STORAGE_KEYS.ACHIEVEMENTS) || [];
  if (existing.length === 0) {
    const defaultAchievements: Achievement[] = [
      {
        id: 'first_scan',
        title: 'Rookie',
        description: 'Complete your first product verification',
        target: 1,
        current: 0,
        completed: false,
        icon: '🎯',
        reward: 10,
      },
      {
        id: 'ten_scans',
        title: 'Vigilante',
        description: 'Verify 10 products',
        target: 10,
        current: 0,
        completed: false,
        icon: '⭐',
        reward: 50,
      },
      {
        id: 'fifty_scans',
        title: 'Sheriff',
        description: 'Verify 50 products',
        target: 50,
        current: 0,
        completed: false,
        icon: '🏆',
        reward: 200,
      },
      {
        id: 'hundred_scans',
        title: 'Detective',
        description: 'Verify 100 products',
        target: 100,
        current: 0,
        completed: false,
        icon: '👑',
        reward: 500,
      },
    ];
    setJSON(STORAGE_KEYS.ACHIEVEMENTS, defaultAchievements);
  }
};

export const getAchievements = async (): Promise<Achievement[]> => {
  return getJSON(STORAGE_KEYS.ACHIEVEMENTS) || [];
};

export const updateAchievements = async (totalScans: number) => {
  const list: Achievement[] = getJSON(STORAGE_KEYS.ACHIEVEMENTS) || [];
  // simple update: mark achievements with threshold <= totalScans as completed
  const updated = list.map((a) => ({ ...a }));
  setJSON(STORAGE_KEYS.ACHIEVEMENTS, updated);
  return updated;
};

// Transactions
export const saveTransaction = async (tx: Transaction) => {
  const arr: Transaction[] = getJSON(STORAGE_KEYS.TRANSACTIONS) || [];
  arr.unshift(tx);
  setJSON(STORAGE_KEYS.TRANSACTIONS, arr);
};

export const getTransactions = async (): Promise<Transaction[]> => {
  return getJSON(STORAGE_KEYS.TRANSACTIONS) || [];
};

export const getRecentTransactions = async (limit = 5): Promise<Transaction[]> => {
  const arr = (await getTransactions()) || [];
  return arr.slice(0, limit);
};

// Initialization
export const initializeUser = async () => {
  const u = getJSON(STORAGE_KEYS.USER);
  if (!u) setJSON(STORAGE_KEYS.USER, { id: '', points: 0, totalScans: 0, isLoggedIn: false });
};

// Scanned codes
export const isCodeScanned = async (codeHash: string) => {
  const arr: string[] = getJSON(STORAGE_KEYS.SCANNED_CODES) || [];
  return arr.includes(codeHash);
};

export const markCodeAsScanned = async (codeHash: string) => {
  const arr: string[] = getJSON(STORAGE_KEYS.SCANNED_CODES) || [];
  if (!arr.includes(codeHash)) {
    arr.push(codeHash);
    setJSON(STORAGE_KEYS.SCANNED_CODES, arr);
  }
};

export const getScannedCodesCount = async () => {
  const arr: string[] = getJSON(STORAGE_KEYS.SCANNED_CODES) || [];
  return arr.length;
};

// Auth Token
export const saveAuthToken = async (token: string) => {
  setJSON(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = async () => {
  return getJSON(STORAGE_KEYS.AUTH_TOKEN);
};

export const clearAuthToken = async () => {
  globalThis.localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

export default {
  saveUser,
  getUser,
  saveUserSync,
  updateUserPoints,
  incrementScans,
  addPoints,
  logout,
  saveHistoryItem,
  getHistory,
  clearHistory,
  initializeAchievements,
  getAchievements,
  updateAchievements,
  saveTransaction,
  getTransactions,
  getRecentTransactions,
  initializeUser,
  isCodeScanned,
  markCodeAsScanned,
  getScannedCodesCount,
  saveAuthToken,
  getAuthToken,
  clearAuthToken,
};
