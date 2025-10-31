import AsyncStorage from '@react-native-async-storage/async-storage';
import { Achievement, HistoryItem, Transaction, User } from '../types';

const STORAGE_KEYS = {
  USER: '@kweli_user',
  HISTORY: '@kweli_history',
  ACHIEVEMENTS: '@kweli_achievements',
  TRANSACTIONS: '@kweli_transactions',
  SCANNED_CODES: '@kweli_scanned_codes',
};

// User Storage
export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const updateUserPoints = async (points: number): Promise<void> => {
  try {
    const user = await getUser();
    if (user) {
      user.points = points;
      await saveUser(user);
    }
  } catch (error) {
    console.error('Error updating points:', error);
  }
};

export const incrementScans = async (): Promise<number> => {
  try {
    const user = await getUser();
    if (user) {
      user.totalScans += 1;
      await saveUser(user);
      return user.totalScans;
    }
    return 0;
  } catch (error) {
    console.error('Error incrementing scans:', error);
    return 0;
  }
};

export const addPoints = async (points: number): Promise<User> => {
  try {
    const user = await getUser();
    if (user) {
      user.points += points;
      await saveUser(user);
      return user;
    }
    return {
      id: '',
      points: 0,
      totalScans: 0,
      isLoggedIn: false,
    };
  } catch (error) {
    console.error('Error adding points:', error);
    return {
      id: '',
      points: 0,
      totalScans: 0,
      isLoggedIn: false,
    };
  }
};

export const logout = async (): Promise<void> => {
  try {
    const user = await getUser();
    if (user) {
      user.isLoggedIn = false;
      user.id = '';
      user.name = undefined;
      user.email = undefined;
      await saveUser(user);
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// History Storage
export const saveHistoryItem = async (item: HistoryItem): Promise<void> => {
  try {
    const history = await getHistory();
    history.unshift(item); // Add to beginning
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving history item:', error);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const history = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing history:', error);
  }
};

// Achievements Storage
export const initializeAchievements = async (): Promise<void> => {
  try {
    const existing = await getAchievements();
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
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(defaultAchievements));
    }
  } catch (error) {
    console.error('Error initializing achievements:', error);
  }
};

export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const achievements = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    return achievements ? JSON.parse(achievements) : [];
  } catch (error) {
    console.error('Error getting achievements:', error);
    return [];
  }
};

export const updateAchievements = async (totalScans: number): Promise<Achievement[]> => {
  try {
    const achievements = await getAchievements();
    const updatedAchievements = achievements.map(achievement => ({
      ...achievement,
      current: Math.min(totalScans, achievement.target),
      completed: totalScans >= achievement.target,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(updatedAchievements));
    return updatedAchievements;
  } catch (error) {
    console.error('Error updating achievements:', error);
    return [];
  }
};

// Transactions Storage
export const saveTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const transactions = await getTransactions();
    transactions.unshift(transaction);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transaction:', error);
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return transactions ? JSON.parse(transactions) : [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

export const getRecentTransactions = async (limit: number = 5): Promise<Transaction[]> => {
  try {
    const transactions = await getTransactions();
    return transactions.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    return [];
  }
};

// Initialize default user
export const initializeUser = async (): Promise<User> => {
  try {
    let user = await getUser();
    if (!user) {
      user = {
        id: '',
        points: 0,
        totalScans: 0,
        isLoggedIn: false,
      };
      await saveUser(user);
    }
    return user;
  } catch (error) {
    console.error('Error initializing user:', error);
    return {
      id: '',
      points: 0,
      totalScans: 0,
      isLoggedIn: false,
    };
  }
};

// Scanned Codes Storage (prevent duplicate rewards)
export const isCodeScanned = async (codeHash: string): Promise<boolean> => {
  try {
    const scannedCodes = await AsyncStorage.getItem(STORAGE_KEYS.SCANNED_CODES);
    if (!scannedCodes) return false;
    const codes: string[] = JSON.parse(scannedCodes);
    return codes.includes(codeHash);
  } catch (error) {
    console.error('Error checking scanned code:', error);
    return false;
  }
};

export const markCodeAsScanned = async (codeHash: string): Promise<void> => {
  try {
    const scannedCodes = await AsyncStorage.getItem(STORAGE_KEYS.SCANNED_CODES);
    let codes: string[] = scannedCodes ? JSON.parse(scannedCodes) : [];
    if (!codes.includes(codeHash)) {
      codes.push(codeHash);
      await AsyncStorage.setItem(STORAGE_KEYS.SCANNED_CODES, JSON.stringify(codes));
    }
  } catch (error) {
    console.error('Error marking code as scanned:', error);
  }
};

export const getScannedCodesCount = async (): Promise<number> => {
  try {
    const scannedCodes = await AsyncStorage.getItem(STORAGE_KEYS.SCANNED_CODES);
    if (!scannedCodes) return 0;
    const codes: string[] = JSON.parse(scannedCodes);
    return codes.length;
  } catch (error) {
    console.error('Error getting scanned codes count:', error);
    return 0;
  }
};

