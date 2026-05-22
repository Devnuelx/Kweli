import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearAuthToken } from '../../services/api';
import { getAchievements, getRecentTransactions, getUser, initializeAchievements, saveUser } from '../../services/storage';
import { Achievement, Transaction, User } from '../../types';

// Modern Color Constants
const PRIMARY_LIGHT_BG = '#F4F6F8';
const NEUMORPHIC_BG = '#E8EBF0';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';

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

  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [])
  );

  const loadWalletData = async () => {
    const userData = await getUser();
    setUser(userData);

    await initializeAchievements();
    const achievementsData = await getAchievements();
    setAchievements(achievementsData);

    const transactionsData = await getRecentTransactions(5);
    setTransactions(transactionsData);
  };

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
      <View style={{ paddingTop: insets.top }}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120, paddingHorizontal: 20 }}
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
            >
              <Text className="text-white text-base font-bold">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
            >
              <Ionicons name="person-outline" size={22} color="#000" />
            </TouchableOpacity>
          )}
        </View>

        {user ? (
          <>
            {/* Modern Glass Wallet Card */}
            <View className="mb-6">
              <BlurView
                intensity={50}
                tint="light"
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <LinearGradient
                  colors={['rgba(59, 130, 246, 0.7)', 'rgba(147, 197, 253, 0.8)', 'rgba(255,255,255,0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.8, y: 0.8 }}
                  style={{ padding: 24 }}
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
                      <View className="h-2 bg-gray-200/50 rounded-full overflow-hidden">
                        <LinearGradient
                          colors={[currentRank.color, nextRank.color]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: `${rankProgress}%`,
                            height: '100%',
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
                </LinearGradient>
              </BlurView>
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-around mb-6 px-4">
              <TouchableOpacity
                className="items-center"
                onPress={() =>
                  handleComingSoon({ title: 'Receive', unlockAt: 100, icon: 'add-circle' })
                }
              >
                <View className="w-14 h-14 bg-pink-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="add" size={24} color="#EC4899" />
                </View>
                <Text className="text-black text-xs font-semibold">Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="items-center"
                onPress={() =>
                  handleComingSoon({ title: 'Send', unlockAt: 150, icon: 'send' })
                }
              >
                <View className="w-14 h-14 bg-blue-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="send" size={24} color="#3B82F6" />
                </View>
                <Text className="text-black text-xs font-semibold">Send</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="items-center"
                onPress={() =>
                  handleComingSoon({ title: 'Pay Bills', unlockAt: 200, icon: 'card' })
                }
              >
                <View className="w-14 h-14 bg-red-100 rounded-full items-center justify-center mb-2">
                  <Ionicons name="card" size={24} color="#EF4444" />
                </View>
                <Text className="text-black text-xs font-semibold">Pay Bills</Text>
              </TouchableOpacity>
            </View>

            {/* Achievements Section - Light Neumorphic Container */}
            <View
              style={{
                backgroundColor: NEUMORPHIC_BG,
                borderRadius: 24,
                padding: 20,
                marginBottom: 24,
                // Light shadow (top-left) - creates raised effect
                shadowColor: '#FFFFFF',
                shadowOffset: { width: -8, height: -8 },
                shadowOpacity: 1,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {/* Dark shadow layer (bottom-right) */}
              <View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: 24,
                  shadowColor: '#A0AEC0',
                  shadowOffset: { width: 8, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                }}
              />

              {/* Header */}
              <View className="flex-row items-center justify-between mb-6 relative z-10">
                <Text className="text-gray-800 text-xl font-bold">Achievements</Text>
                <TouchableOpacity
                  onPress={() => router.push('/achievements')}
                  className="flex-row items-center px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: NEUMORPHIC_BG,
                    shadowColor: '#FFFFFF',
                    shadowOffset: { width: -2, height: -2 },
                    shadowOpacity: 1,
                    shadowRadius: 4,
                  }}
                >
                  <View
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: 999,
                      shadowColor: '#A0AEC0',
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    }}
                  />
                  <Text className="text-blue-600 text-sm mr-1 font-semibold relative z-10">View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3B82F6" style={{ zIndex: 10 }} />
                </TouchableOpacity>
              </View>

              {/* 2-Card Achievement Grid */}
              <View className="flex-row gap-4 relative z-10">
                {displayAchievements.map((achievement) => (
                  <TouchableOpacity
                    key={achievement.id}
                    onPress={() => router.push('/achievements')}
                    activeOpacity={0.7}
                    style={{ flex: 1 }}
                  >
                    <View className="items-center">
                      {/* Neumorphic Inscribed Badge Container */}
                      <View
                        style={{
                          width: 110,
                          height: 110,
                          borderRadius: 55,
                          backgroundColor: NEUMORPHIC_BG,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginBottom: 12,
                          // Light shadow (top-left)
                          shadowColor: '#FFFFFF',
                          shadowOffset: { width: -6, height: -6 },
                          shadowOpacity: 1,
                          shadowRadius: 12,
                          elevation: 8,
                        }}
                      >
                        {/* Dark shadow overlay (bottom-right) */}
                        <View
                          style={{
                            position: 'absolute',
                            width: 110,
                            height: 110,
                            borderRadius: 55,
                            shadowColor: '#A0AEC0',
                            shadowOffset: { width: 6, height: 6 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                          }}
                        />
                        
                        {/* Inner inscribed depression */}
                        <View
                          style={{
                            width: 95,
                            height: 95,
                            borderRadius: 47.5,
                            backgroundColor: NEUMORPHIC_BG,
                            justifyContent: 'center',
                            alignItems: 'center',
                            // Inner dark shadow (creates pressed-in effect)
                            shadowColor: '#A0AEC0',
                            shadowOffset: { width: 4, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 8,
                          }}
                        >
                          {/* Inner light shadow for depth */}
                          <View
                            style={{
                              position: 'absolute',
                              width: 95,
                              height: 95,
                              borderRadius: 47.5,
                              shadowColor: '#FFFFFF',
                              shadowOffset: { width: -3, height: -3 },
                              shadowOpacity: 0.8,
                              shadowRadius: 6,
                            }}
                          />
                          
                          {/* Badge Image */}
                          <Image
                            source={getBadgeImage(achievement.id)}
                            style={{
                              width: 75,
                              height: 75,
                              opacity: achievement.completed ? 1 : 0.4,
                              borderRadius: 37.5,
                            }}
                          />
                          
                          {/* Completion Check */}
                          {achievement.completed && (
                            <View
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                backgroundColor: '#10B981',
                                borderRadius: 14,
                                width: 28,
                                height: 28,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 3,
                                borderColor: NEUMORPHIC_BG,
                                shadowColor: '#10B981',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.5,
                                shadowRadius: 6,
                              }}
                            >
                              <Ionicons name="checkmark" size={16} color="#FFF" />
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Title */}
                      <Text
                        className="text-gray-800 text-sm font-bold mb-1 text-center"
                        numberOfLines={1}
                        style={{ width: '100%' }}
                      >
                        {achievement.title}
                      </Text>

                      {/* Progress Text */}
                      <Text className="text-gray-500 text-xs mb-3 text-center">
                        {achievement.current}/{achievement.target}
                      </Text>

                      {/* Neumorphic Progress Bar Container */}
                      <View
                        style={{
                          width: '100%',
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: NEUMORPHIC_BG,
                          overflow: 'hidden',
                          // Inner shadow for inscribed effect
                          shadowColor: '#A0AEC0',
                          shadowOffset: { width: 2, height: 2 },
                          shadowOpacity: 0.4,
                          shadowRadius: 4,
                        }}
                      >
                        {/* Progress fill */}
                        <LinearGradient
                          colors={
                            achievement.completed
                              ? ['#FFC107', '#FF9800']
                              : ['#3B82F6', '#60A5FA']
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{
                            width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                            height: '100%',
                            borderRadius: 4,
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
                  className="flex-row items-center bg-blue-50 px-3 py-2 rounded-full"
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
                    <BlurView
                      intensity={40}
                      tint="light"
                      style={{
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <View className="flex-row items-center">
                        <View
                          className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                            transaction.type === 'redemption' ? 'bg-red-100' : 'bg-green-100'
                          }`}
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
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <BlurView
                intensity={40}
                tint="light"
                style={{
                  borderRadius: 20,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                }}
              >
                <View className="items-center">
                  <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                    <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-900 text-base font-bold mb-2">
                    No Transactions Yet
                  </Text>
                  <Text className="text-gray-500 text-sm text-center">
                    Start scanning products to earn VFY tokens
                  </Text>
                </View>
              </BlurView>
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
        >
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm">
            <BlurView
              intensity={80}
              tint="light"
              style={{
                borderRadius: 32,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <View className="p-8">
                {/* Icon */}
                <View className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mx-auto mb-6">
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
                  <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <LinearGradient
                      colors={['#3B82F6', '#60A5FA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: `${Math.min(((user?.totalScans || 0) / comingSoonFeature.unlockAt) * 100, 100)}%`,
                        height: '100%',
                      }}
                    />
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  onPress={() => setShowComingSoonModal(false)}
                  className="bg-blue-600 py-4 rounded-2xl"
                >
                  <Text className="text-white text-center font-bold text-base">Got it!</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}