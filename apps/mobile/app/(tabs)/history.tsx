import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAchievements, getHistory } from '../../services/storage';
import { Achievement, HistoryItem } from '../../types';

// Modern Color Constants
const PRIMARY_LIGHT_BG = '#F0F2F5'; // Lighter, flatter background for Neumorphism
const SHADOW_LIGHT = '#FFFFFF';
const SHADOW_DARK = '#D1D9E6';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';

// Neumorphism Style Definition
const createNeumorphicStyle = (isPressed = false) => ({
  borderRadius: 16,
  backgroundColor: PRIMARY_LIGHT_BG,
  // Extruded (Raised) Style - default
  shadowColor: SHADOW_DARK,
  shadowOffset: { width: 6, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 10, // For Android
  // Light side shadow for highlight
  borderWidth: 1,
  borderColor: isPressed ? SHADOW_DARK : SHADOW_LIGHT, // Subtle border helps define the shape
  ...(isPressed && {
    // Impressed (Pressed) Style
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  }),
});

// A style for 'impressed' containers, like an input field or a pressed button
const createImpressedNeumorphicStyle = () => ({
  borderRadius: 16,
  backgroundColor: PRIMARY_LIGHT_BG,
  // Impressed (Inner Shadow) Style
  shadowColor: SHADOW_DARK,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 5,
  elevation: 5, // For Android
  // Inner shadow simulation (requires using a lighter overlay or specific iOS trickery)
  // For simplicity and cross-platform use, we'll use a mild drop shadow and rely on the background color.
});

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

// --- Custom Neumorphic Components for reusability ---

const NeumorphicCard = ({ children, style = {}, isPressed = false }: { children: React.ReactNode, style: any, isPressed: boolean }) => (
  <View style={[createNeumorphicStyle(isPressed), style]}>
    {children}
  </View>
);

const NeumorphicTouchableCard = ({ children, onPress, style = {} }: { children: React.ReactNode, onPress: () => void, style: any }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <View style={[createNeumorphicStyle(isPressed), style]}>
        {children}
      </View>
    </TouchableOpacity>
  );
};
// ---------------------------------------------------


export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [historyData, achievementsData] = await Promise.all([
      getHistory(),
      getAchievements()
    ]);
    setHistory(historyData);
    setAchievements(achievementsData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getVerificationIcon = (type: 'qr' | 'ai') => {
    return type === 'qr' ? 'qr-code' : 'camera';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const completedCount = achievements.filter((a) => a.completed).length;
  const totalRewards = achievements
    .filter((a) => a.completed)
    .reduce((sum, a) => sum + a.reward, 0);

  // Get 2 achievements: 1 completed + 1 next in line
  const completedAchievements = achievements.filter((a) => a.completed);
  const incompleteAchievements = achievements.filter((a) => !a.completed);
  const displayAchievements = [
    ...(completedAchievements.length > 0 ? [completedAchievements[completedAchievements.length - 1]] : []),
    ...(incompleteAchievements.length > 0 ? [incompleteAchievements[0]] : []),
  ].slice(0, 2);

  return (
    // Updated Background Color
    <View style={{ flex: 1, backgroundColor: PRIMARY_LIGHT_BG }}>

      {/* REMOVED LinearGradient: Neumorphism works best on a consistent flat background */}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Modern Header */}
        <View className="mb-6">
          <Text style={{ color: TEXT_DARK }} className="text-4xl font-bold mb-2">
            Activity
          </Text>
          <Text style={{ color: TEXT_MUTED }} className="text-base">
            Your verification journey and achievements
          </Text>
        </View>

        {/* Neumorphic Stats Cards */}
        <View className="flex-row gap-3 mb-6">
          <NeumorphicCard style={{ flex: 1, padding: 16 }} isPressed={false}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={{ color: TEXT_DARK }} className="text-2xl font-bold mt-2">
              {history.filter((item) => item.verified).length}
            </Text>
            <Text style={{ color: TEXT_MUTED }} className="text-xs">Verified</Text>
          </NeumorphicCard>

          <NeumorphicCard style={{ flex: 1, padding: 16 }} isPressed={false}>
            <Ionicons name="trophy" size={24} color="#FBBF24" />
            <Text style={{ color: TEXT_DARK }} className="text-2xl font-bold mt-2">
              {completedCount}
            </Text>
            <Text style={{ color: TEXT_MUTED }} className="text-xs">Achievements</Text>
          </NeumorphicCard>

          <NeumorphicCard style={{ flex: 1, padding: 16 }} isPressed={false}>
            <Ionicons name="star" size={24} color="#3B82F6" />
            <Text style={{ color: TEXT_DARK }} className="text-2xl font-bold mt-2">
              {totalRewards}
            </Text>
            <Text style={{ color: TEXT_MUTED }} className="text-xs">VFY Points</Text>
          </NeumorphicCard>
        </View>

        {/* Achievements Section - Neumorphic Badges */}
        {displayAchievements.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text style={{ color: TEXT_DARK }} className="text-lg font-bold">
                Achievements
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/achievements')}
                className="flex-row items-center bg-blue-50 px-3 py-2 rounded-full"
              >
                <Text className="text-blue-600 text-sm mr-1 font-semibold">View All</Text>
                <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
              {displayAchievements.map((achievement) => (
                <NeumorphicTouchableCard
                  key={achievement.id}
                  onPress={() => router.push('/achievements')}
                  style={{ 
                    flex: 1, 
                    borderRadius: 20, 
                    padding: 20, 
                    alignItems: 'center',
                    // Override default style to be a larger Neumorphic shape
                    shadowOffset: { width: 8, height: 8 },
                    shadowRadius: 15,
                  }}
                >
                  {/* Content inside the Neumorphic Card */}
                  <Image
                    className='rounded-full'
                    source={getBadgeImage(achievement.id)}
                    style={{
                      width: 120,
                      height: 120,
                      opacity: achievement.completed ? 1 : 0.4,
                      marginBottom: 12,
                    }}
                  />

                  <Text
                    style={{ color: TEXT_DARK }}
                    className="text-sm font-bold text-center"
                    numberOfLines={2}
                  >
                    {achievement.title}
                  </Text>

                  {/* Completion Badge */}
                  {achievement.completed && (
                    <View className="absolute top-2 right-2">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                  )}
                </NeumorphicTouchableCard>
              ))}
            </View>
          </View>
        )}

        {/* Recent Activity Section */}
        <View className="mb-4">
          <Text style={{ color: TEXT_DARK }} className="text-lg font-bold">
            Recent Activity
          </Text>
        </View>

        {/* History List - Neumorphic Style */}
        {history.length > 0 ? (
          <View className="space-y-3">
            {history.slice(0, 10).map((item) => (
              <NeumorphicTouchableCard
                key={item.id}
                onPress={() => { /* Navigate to history detail */ }}
                style={{ padding: 16 }}
              >
                {/* Product Info with Status */}
                <View className="flex-row items-center mb-3">
                  <View className="w-12 h-12 bg-gray-100 rounded-xl mr-3 items-center justify-center">
                    <Ionicons name="cube-outline" size={24} color={TEXT_MUTED} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text
                        style={{ color: TEXT_DARK }}
                        className="font-bold text-base flex-1"
                        numberOfLines={1}
                      >
                        {item.product.name}
                      </Text>
                      <View
                        className={`flex-row items-center px-2.5 py-1 rounded-full ml-2 ${
                          item.verified ? 'bg-green-100' : 'bg-red-100'
                        }`}
                      >
                        <Ionicons
                          name={item.verified ? 'checkmark-circle' : 'close-circle'}
                          size={14}
                          color={item.verified ? '#10B981' : '#EF4444'}
                        />
                        <Text
                          className="text-xs font-semibold ml-1"
                          style={{ color: item.verified ? '#10B981' : '#EF4444' }}
                        >
                          {item.verified ? 'Verified' : 'Failed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: TEXT_MUTED }} className="text-xs" numberOfLines={1}>
                      {item.product.brand}
                    </Text>
                  </View>
                </View>

                {/* Additional Info - A slightly 'impressed' look would work here */}
                {item.product.info && (
                  <View 
                    style={[
                      createNeumorphicStyle(true), // Use 'isPressed' state for an impressed/inset look
                      { padding: 12, marginBottom: 10, borderRadius: 12 }
                    ]}
                  >
                    <Text style={{ color: TEXT_MUTED }} className="text-xs leading-4" numberOfLines={2}>
                      {item.product.info}
                    </Text>
                  </View>
                )}

                {/* Footer */}
                <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color={TEXT_MUTED} />
                    <Text style={{ color: TEXT_MUTED }} className="text-xs ml-1.5">
                      {formatDate(item.date)}
                    </Text>
                    <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                    <Ionicons
                      name={getVerificationIcon(item.verificationType)}
                      size={14}
                      color={TEXT_MUTED}
                    />
                    <Text style={{ color: TEXT_MUTED }} className="text-xs ml-1.5">
                      {item.verificationType === 'qr' ? 'QR Scan' : 'AI Scan'}
                    </Text>
                  </View>
                  {item.verified && item.points > 0 && (
                    <View className="flex-row items-center bg-blue-100 rounded-full px-3 py-1.5">
                      <Ionicons name="star" size={14} color="#3B82F6" />
                      <Text className="text-blue-600 text-xs font-bold ml-1">
                        +{item.points} VFY
                      </Text>
                    </View>
                  )}
                </View>
              </NeumorphicTouchableCard>
            ))}

            {history.length > 10 && (
              <NeumorphicTouchableCard
                onPress={() => { /* View all history */ }}
                style={{ padding: 16, alignItems: 'center' }}
              >
                <Text className="text-blue-600 font-semibold text-sm">
                  View All {history.length} Verifications
                </Text>
              </NeumorphicTouchableCard>
            )}
          </View>
        ) : (
          /* Empty State - Neumorphic */
          <NeumorphicCard
            style={{
              borderRadius: 24,
              padding: 48,
              alignItems: 'center',
              shadowOffset: { width: 10, height: 10 },
              shadowRadius: 20,
            }}
            isPressed={false}
          >
            <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="rocket-outline" size={48} color="#3B82F6" />
            </View>
            <Text style={{ color: TEXT_DARK }} className="text-xl font-bold mb-2">
              Start Your Journey
            </Text>
            <Text style={{ color: TEXT_MUTED }} className="text-center mb-6 text-base">
              Verify your first product to unlock achievements and earn rewards
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)')}
              className="bg-blue-600 rounded-xl px-8 py-4"
            >
              <Text className="text-white font-semibold text-base">Verify Now</Text>
            </TouchableOpacity>
          </NeumorphicCard>
        )}
      </ScrollView>
    </View>
  );
}