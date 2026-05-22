import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Dimensions, Modal, Pressable, Text, View } from 'react-native';
import { Achievement } from '../types';

const { height } = Dimensions.get('window');

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
}

const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({ visible, onClose, achievement }) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!fontsLoaded || !achievement) {
    return null;
  }

  // Gradient colors based on completion status
  const gradientColors = achievement.completed
    ? ['#F59E0B', '#F97316', '#EF4444'] // Orange to red gradient
    : ['#6B7280', '#4B5563', '#374151']; // Gray gradient

  const iconBackgroundGradient = achievement.completed
    ? ['#FBBF24', '#F59E0B'] // Gold gradient
    : ['#9CA3AF', '#6B7280']; // Gray gradient

  return (
    <Modal visible={visible} animationType="fade">
      {/* Background overlay */}
      <Pressable onPress={onClose} className="absolute inset-0 bg-black/50" />
      
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          position: 'absolute',
          top: height * 0.15,
          left: 20,
          right: 20,
          alignItems: 'center',
        }}
      >
        {/* Achievement Card */}
        <View className="w-full max-w-sm">
          <View
            className="bg-white rounded-3xl p-8 items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            {/* Progress indicator at top */}
            <View className="absolute top-6 right-6">
              <Text
                className="text-gray-700 text-sm"
                style={{ fontFamily: 'Manrope_600SemiBold' }}
              >
                {achievement.current}/{achievement.target}
              </Text>
            </View>

            {/* Icon with gradient background */}
            <View className="mb-6 mt-4">
              <View
                className={`w-32 h-32 rounded-full items-center justify-center ${
                  achievement.completed ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300'
                }`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: 10,
                  backgroundColor: achievement.completed ? '#FBBF24' : '#D1D5DB',
                }}
              >
                <Text className="text-6xl">{achievement.icon}</Text>
                {achievement.completed && (
                  <View className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                    <Ionicons name="checkmark" size={20} color="white" />
                  </View>
                )}
              </View>
            </View>

            {/* Title */}
            <Text
              className="text-gray-900 text-3xl text-center mb-3"
              style={{ fontFamily: 'Manrope_700Bold' }}
            >
              {achievement.title}
            </Text>

            {/* Description */}
            <Text
              className="text-gray-600 text-center text-base mb-6 px-4 leading-6"
              style={{ fontFamily: 'Manrope_400Regular' }}
            >
              {achievement.description}
            </Text>

            {/* Progress Bar */}
            <View className="w-full mb-6">
              <View className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${(achievement.current / achievement.target) * 100}%`,
                    backgroundColor: achievement.completed ? '#10B981' : '#3B82F6',
                  }}
                />
              </View>
            </View>

            {/* Reward Badge */}
            <View className="bg-yellow-50 rounded-2xl px-6 py-3 flex-row items-center border-2 border-yellow-200">
              <Ionicons name="trophy" size={24} color="#F59E0B" />
              <Text
                className="text-gray-900 text-lg ml-2"
                style={{ fontFamily: 'Manrope_700Bold' }}
              >
                {achievement.reward} VFY Reward
              </Text>
            </View>

            {/* Status */}
            {achievement.completed && (
              <View className="mt-4 bg-green-50 border-2 border-green-400 rounded-xl px-4 py-2">
                <Text
                  className="text-green-700 text-sm"
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                >
                  ✅ Completed!
                </Text>
              </View>
            )}
          </View>

          {/* Close button */}
          <Pressable
            onPress={onClose}
            className="mt-8 bg-gray-100 rounded-2xl py-4 items-center border border-gray-300"
          >
            <Text
              className="text-gray-900 text-base"
              style={{ fontFamily: 'Manrope_600SemiBold' }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default AchievementDetailModal;

