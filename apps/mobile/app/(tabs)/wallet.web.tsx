import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearAuthToken } from '../../services/api';
import { getAchievements, getRecentTransactions, getUser, initializeAchievements, saveUser } from '../../services/storage';
import { Achievement, Transaction, User } from '../../types';

// Modern Web Color Constants
const PRIMARY_LIGHT_BG = '#F4F6F8';
const NEUMORPHIC_BG = '#E8EBF0';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';

// Web-optimized styles
const webStyles = {
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 24,
    style: {
      boxShadow: '0 8px 32px rgba(31, 41, 55, 0.08)',
    },
  },
  gradientCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.7)',
  },
  neumorphicCard: {
    backgroundColor: NEUMORPHIC_BG,
    borderRadius: 24,
    boxShadow: 
      'inset -8px -8px 12px rgba(255,255,255,0.9), ' +
      'inset 8px 8px 12px rgba(160,174,192,0.2), ' +
      '-8px -8px 12px rgba(255,255,255,0.9), ' +
      '8px 8px 12px rgba(160,174,192,0.2)',
  },
  pressedNeumorphic: {
    boxShadow: 
      'inset -4px -4px 8px rgba(255,255,255,0.9), ' +
      'inset 4px 4px 8px rgba(160,174,192,0.2)',
  },
};

// Rank thresholds based on points
const RANK_THRESHOLDS = {
  rookie: { min: 0, max: 99, name: 'Rookie', color: '#CD7F32', icon: 'shield' },
  sheriff: { min: 100, max: 499, name: 'Sheriff', color: '#C0C0C0', icon: 'shield-checkmark' },
  detective: { min: 500, max: 999, name: 'Detective', color: '#FFD700', icon: 'shield-half' },
  chief: { min: 1000, max: Infinity, name: 'Chief', color: '#3B82F6', icon: 'ribbon' },
};

// Get user rank based on points
const getUserRank = (points: number) => {
  if (points >= RANK_THRESHOLDS.chief.min) return RANK_THRESHOLDS.chief;
  if (points >= RANK_THRESHOLDS.detective.min) return RANK_THRESHOLDS.detective;
  if (points >= RANK_THRESHOLDS.sheriff.min) return RANK_THRESHOLDS.sheriff;
  return RANK_THRESHOLDS.rookie;
};

// Get next rank
const getNextRank = (points: number) => {
  if (points < RANK_THRESHOLDS.sheriff.min) return RANK_THRESHOLDS.sheriff;
  if (points < RANK_THRESHOLDS.detective.min) return RANK_THRESHOLDS.detective;
  if (points < RANK_THRESHOLDS.chief.min) return RANK_THRESHOLDS.chief;
  return null; // Max rank reached
};

// Badge image mapping
const getBadgeImage = (achievementId: string) => {
  const imageMap: Record<string, any> = {
    first_scan: require('../../assets/badges/1.png'),
    ten_scans: require('../../assets/badges/2.png'),
    fifty_scans: require('../../assets/badges/3.png'),
    hundred_scans: require('../../assets/badges/4.png'),
    streak_7: require('../../assets/badges/5.png'),
    streak_30: require('../../assets/badges/6.png'),
    default: require('../../assets/badges/1.png'),
  };
  return imageMap[achievementId] || imageMap.default;
};

// Web-optimized glass/gradient button
const GlassButton = ({ 
  icon, 
  color, 
  label, 
  onPress 
}: { 
  icon: any; 
  color: string; 
  label: string; 
  onPress: () => void;
}) => (
  <TouchableOpacity className="items-center" onPress={onPress}>
    <View 
      style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: `${color}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        boxShadow: `0 4px 12px ${color}20`,
      }}
    >
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text className="text-black text-xs font-semibold">{label}</Text>
  </TouchableOpacity>
);

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<{ title: string; unlockAt: number; icon: string }>({
    title: '',
    unlockAt: 0,
    icon: '',
  });

  const loadWalletData = async () => {
    const userData = await getUser();
    setUser(userData);

    await initializeAchievements();
    const achievementsData = await getAchievements();
    setAchievements(achievementsData);

    const transactionsData = await getRecentTransactions(5);
    setTransactions(transactionsData);
  };

  React.useEffect(() => {
    loadWalletData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleComingSoon = (feature: { title: string; unlockAt: number; icon: string }) => {
    setComingSoonFeature(feature);
    setShowComingSoonModal(true);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get current and next rank
  const currentRank = user ? getUserRank(user.points) : RANK_THRESHOLDS.rookie;
  const nextRank = user ? getNextRank(user.points) : RANK_THRESHOLDS.sheriff;
  const rankProgress = nextRank
    ? ((user?.points || 0) - currentRank.min) / (nextRank.min - currentRank.min) * 100
    : 100;

  // Get achievements to display (1 completed + 1 next)
  const completedAchievements = achievements.filter((a) => a.completed);
  const incompleteAchievements = achievements.filter((a) => !a.completed);
  const displayAchievements = [
    ...(completedAchievements.length > 0 ? [completedAchievements[completedAchievements.length - 1]] : []),
    ...(incompleteAchievements.length > 0 ? [incompleteAchievements[0]] : []),
  ].slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: PRIMARY_LIGHT_BG }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.push('/')}>
              <Ionicons name="qr-code" size={28} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          {user?.isLoggedIn ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Profile', `Logged in as: ${user.email || user.name}`, [
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                      await clearAuthToken();
                      await saveUser({
                        id: '',
                        points: user.points,
                        totalScans: user.totalScans,
                        isLoggedIn: false,
                      });
                      loadWalletData();
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
              style={{ boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)' }}
            >
              <Text className="text-white text-base font-bold">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
              style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)' }}
            >
              <Ionicons name="person-outline" size={22} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {user ? (
          <>
            {/* Wallet Card */}
            <View className="mb-6">
              <View 
                style={{
                  ...webStyles.glassCard,
                  ...webStyles.gradientCard
                }}
              >
                {/* Header Row */}
                <View className="flex-row justify-between items-center mb-6">
                  <View className="w-8 h-8 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="wallet" size={18} color="#3B82F6" />
                  </View>

                  {/* Rank Badge */}
                  <View
                    className="flex-row items-center px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: currentRank.color + '20',
                      borderWidth: 1.5,
                      borderColor: currentRank.color,
                      boxShadow: `0 2px 8px ${currentRank.color}30`,
                    }}
                  >
                    <Ionicons name={currentRank.icon as any} size={18} color={currentRank.color} />
                    <Text
                      className="ml-2 font-bold text-sm"
                      style={{ color: currentRank.color }}
                    >
                      {currentRank.name}
                    </Text>
                  </View>
                </View>

                {/* Balance */}
                <Text className="text-gray-500 text-sm mb-1">Total Balance</Text>
                <Text className="text-black text-4xl font-bold mb-6">
                  {user?.points || 0} VFY
                </Text>

                {/* Rank Progress */}
                {nextRank && (
                  <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 text-xs">
                        Progress to {nextRank.name}
                      </Text>
                      <Text className="text-gray-600 text-xs font-bold">
                        {user.points}/{nextRank.min} VFY
                      </Text>
                    </View>
                    <View 
                      className="h-2 rounded-full overflow-hidden"
                      style={{ 
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <View
                        style={{
                          width: `${rankProgress}%`,
                          height: '100%',
                          backgroundColor: nextRank.color,
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Stats Row */}
                <View className="flex-row justify-between pt-4 border-t border-gray-200/30">
                  <View>
                    <Text className="text-gray-500 text-xs mb-1">Total Scans</Text>
                    <Text className="text-black text-lg font-bold">{user.totalScans}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-500 text-xs mb-1">Achievements</Text>
                    <Text className="text-black text-lg font-bold">
                      {completedAchievements.length}/{achievements.length}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-around mb-6 px-4">
              <GlassButton
                icon="add"
                color="#EC4899"
                label="Receive"
                onPress={() => handleComingSoon({ title: 'Receive', unlockAt: 100, icon: 'add-circle' })}
              />
              <GlassButton
                icon="send"
                color="#3B82F6"
                label="Send"
                onPress={() => handleComingSoon({ title: 'Send', unlockAt: 150, icon: 'send' })}
              />
              <GlassButton
                icon="card"
                color="#EF4444"
                label="Pay Bills"
                onPress={() => handleComingSoon({ title: 'Pay Bills', unlockAt: 200, icon: 'card' })}
              />
            </View>

            {/* Achievements Section */}
            <View style={webStyles.neumorphicCard} className="p-6 mb-6">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Achievements</Text>
                <button
                  onPress={() => router.push('/achievements')}
                  className="flex-row items-center px-3 py-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
                  }}
                >
                  <Text className="text-blue-600 text-sm mr-1 font-semibold">View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                </button>
              </View>

              {/* Achievements Grid */}
              <View className="flex-row gap-4">
                {displayAchievements.map((achievement) => (
                  <TouchableOpacity
                    key={achievement.id}
                    onPress={() => router.push('/achievements')}
                    style={{ flex: 1 }}
                  >
                    <View 
                      style={webStyles.neumorphicCard}
                      className="p-4 items-center"
                    >
                      <View 
                        style={{
                          width: 110,
                          height: 110,
                          borderRadius: 55,
                          marginBottom: 12,
                          ...webStyles.neumorphicCard,
                        }}
                        className="items-center justify-center"
                      >
                        <Image
                          source={getBadgeImage(achievement.id)}
                          style={{
                            width: 80,
                            height: 80,
                            opacity: achievement.completed ? 1 : 0.4,
                            borderRadius: 40,
                          }}
                        />

                        {achievement.completed && (
                          <View
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              backgroundColor: '#10B981',
                              borderRadius: 14,
                              width: 28,
                              height: 28,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 3,
                              borderColor: NEUMORPHIC_BG,
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <Ionicons name="checkmark" size={16} color="#FFF" />
                          </View>
                        )}
                      </View>

                      <Text
                        className="text-gray-800 text-sm font-bold mb-1 text-center"
                        numberOfLines={1}
                      >
                        {achievement.title}
                      </Text>

                      <Text className="text-gray-500 text-xs mb-3">
                        {achievement.current}/{achievement.target}
                      </Text>

                      {/* Progress Bar */}
                      <View 
                        className="w-full h-2 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        <View
                          style={{
                            width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                            height: '100%',
                            backgroundColor: achievement.completed ? '#FF9800' : '#3B82F6',
                          }}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Transactions */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-black text-xl font-bold">Recent Transactions</Text>
              {transactions.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/history')}
                  style={webStyles.neumorphicCard}
                  className="flex-row items-center px-3 py-2 rounded-full"
                >
                  <Text className="text-blue-600 text-sm mr-1 font-semibold">See More</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>

            {transactions.length > 0 ? (
              <View className="space-y-3">
                {transactions.slice(0, 5).map((transaction, index) => (
                  <TouchableOpacity key={`transaction-${index}`} activeOpacity={0.7}>
                    <View 
                      style={webStyles.glassCard} 
                      className="p-4"
                    >
                      <View className="flex-row items-center">
                        <View
                          style={webStyles.neumorphicCard}
                          className={`w-12 h-12 rounded-full items-center justify-center mr-4`}
                        >
                          <Ionicons
                            name={
                              transaction.type === 'verification'
                                ? 'checkmark-circle'
                                : transaction.type === 'redemption'
                                ? 'arrow-up'
                                : 'gift'
                            }
                            size={24}
                            color={transaction.type === 'redemption' ? '#DC2626' : '#10B981'}
                          />
                        </View>

                        <View className="flex-1">
                          <Text className="text-black font-bold text-base mb-1" numberOfLines={1}>
                            {transaction.description}
                          </Text>
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                            <Text className="text-gray-500 text-xs ml-1">
                              {formatDate(transaction.date)}
                            </Text>
                          </View>
                        </View>

                        <View className="items-end">
                          <Text
                            className={`text-xl font-bold ${
                              transaction.type === 'redemption' ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {transaction.type === 'redemption' ? '-' : '+'}
                            {transaction.amount}
                          </Text>
                          <Text className="text-gray-500 text-xs">VFY</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View 
                style={webStyles.glassCard}
                className="p-8"
              >
                <View className="items-center">
                  <View 
                    style={webStyles.neumorphicCard}
                    className="w-16 h-16 rounded-full items-center justify-center mb-4"
                  >
                    <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-900 text-base font-bold mb-2">
                    No Transactions Yet
                  </Text>
                  <Text className="text-gray-500 text-sm text-center">
                    Start scanning products to earn VFY tokens
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoonModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoonModal(false)}
      >
        <Pressable
          onPress={() => setShowComingSoonModal(false)}
          className="flex-1 bg-white/70 justify-center items-center px-6"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <View style={webStyles.glassCard}>
              <View className="p-8">
                {/* Icon */}
                <View 
                  className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mx-auto mb-6"
                  style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
                >
                  <Ionicons name={comingSoonFeature.icon as any} size={40} color="#3B82F6" />
                </View>

                {/* Title */}
                <Text className="text-black text-2xl font-bold text-center mb-3">
                  {comingSoonFeature.title}
                </Text>

                {/* Description */}
                <Text className="text-gray-600 text-center mb-6">
                  This feature is coming soon! Unlock at{' '}
                  <Text className="font-bold text-blue-600">{comingSoonFeature.unlockAt} scans</Text>
                </Text>

                {/* Progress */}
                <View className="mb-6">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500 text-sm">Your Progress</Text>
                    <Text className="text-gray-900 text-sm font-bold">
                      {user?.totalScans || 0}/{comingSoonFeature.unlockAt}
                    </Text>
                  </View>
                  <View 
                    className="h-3 rounded-full overflow-hidden"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.min(((user?.totalScans || 0) / comingSoonFeature.unlockAt) * 100, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, #3B82F6, #60A5FA)',
                      }}
                    />
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setShowComingSoonModal(false)}
                  className="bg-blue-600 py-4 rounded-2xl"
                  style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
                >
                  <Text className="text-white text-center font-bold text-base">Got it!</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
