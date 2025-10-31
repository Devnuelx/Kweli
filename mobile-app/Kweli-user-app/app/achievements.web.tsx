import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
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
import { getAchievements } from '../services/storage';
import { Achievement } from '../types';

// Modern Web Color Constants
const PRIMARY_LIGHT_BG = '#F4F6F8';
const NEUMORPHIC_BG = '#E8EBF0';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';
const UNLOCKED_GLOW_START = '#FFC107';
const UNLOCKED_GLOW_END = '#FF9800';

// Web-optimized styles (typed as any to allow CSS-only props used by react-native-web)
const webStyles: Record<string, any> = {
    glassCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        padding: 24,
        boxShadow: '0 8px 32px rgba(31, 41, 55, 0.08)',
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

export type AchievementTier = 'rookie' | 'sheriff' | 'detective' | 'chief';

// Badge image mapping
const getBadgeImage = (achievementId: string) => {
    const imageMap: Record<string, any> = {
        first_scan: require('../assets/badges/1.png'), 
        ten_scans: require('../assets/badges/2.png'), 
        fifty_scans: require('../assets/badges/3.png'), 
        hundred_scans: require('../assets/badges/4.png'), 
        streak_7: require('../assets/badges/5.png'), 
        streak_30: require('../assets/badges/6.png'), 
        streak_100: require('../assets/badges/4.png'), 
        default: require('../assets/badges/6.png'),
    };
    return imageMap[achievementId] || imageMap.default;
};

// Web-optimized Achievement Icon Component
const AchievementIcon = ({
    achievementId,
    size = 120,
    isCompleted = false,
}: {
    achievementId: string;
    size?: number;
    isCompleted?: boolean;
}) => {
    const imageSource = getBadgeImage(achievementId);

    return (
        <View
            // cast to any so TypeScript doesn't complain about web-only CSS props
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: NEUMORPHIC_BG,
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow:
                    'inset -4px -4px 8px rgba(255,255,255,0.9), ' +
                    'inset 4px 4px 8px rgba(160,174,192,0.2), ' +
                    '-4px -4px 8px rgba(255,255,255,0.9), ' +
                    '4px 4px 8px rgba(160,174,192,0.2)',
            } as any}
        >
            <View
                style={{
                    width: size * 0.85,
                    height: size * 0.85,
                    borderRadius: (size * 0.85) / 2,
                    backgroundColor: NEUMORPHIC_BG,
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow:
                        'inset -3px -3px 6px rgba(255,255,255,0.9), ' +
                        'inset 3px 3px 6px rgba(160,174,192,0.2)',
                } as any}
            >
                <Image
                    source={imageSource}
                    style={{
                        width: size * 0.65,
                        height: size * 0.65,
                        opacity: isCompleted ? 1 : 0.4,
                        borderRadius: (size * 0.65) / 2,
                        filter: isCompleted ? 'none' : 'grayscale(100%)',
                    } as any}
                />

                {isCompleted && (
                    <View
                        style={{
                            position: 'absolute',
                            top: -6,
                            right: -6,
                            backgroundColor: UNLOCKED_GLOW_END,
                            borderRadius: 12,
                            width: 24,
                            height: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 3,
                            borderColor: NEUMORPHIC_BG,
                            boxShadow: '0 2px 6px rgba(255, 152, 0, 0.4)',
                        } as any}
                    >
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                )}
            </View>
        </View>
    );
};

export default function AchievementsWeb() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const insets = useSafeAreaInsets();

    const loadAchievements = async () => {
        const achievementsList = await getAchievements();
        setAchievements(achievementsList);
    };

    React.useEffect(() => {
        loadAchievements();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadAchievements();
        setRefreshing(false);
    }, []);

    const handleAchievementPress = (achievement: Achievement) => {
        setSelectedAchievement(achievement);
        setShowDetailModal(true);
    };

    const getProgressPercentage = (current: number, target: number): number => {
        return Math.min((current / target) * 100, 100);
    };

    const getTierBadgeColor = (tier: AchievementTier | string) => {
        const tierColors: Record<AchievementTier | string, string> = {
            rookie: '#CD7F32',
            sheriff: '#C0C0C0',
            detective: '#FFD700',
            chief: '#3B82F6',
            default: '#9CA3AF',
        };
        return tierColors[tier] || tierColors.default;
    };

    const completedCount = achievements.filter((a) => a.completed).length;
    const totalRewards = achievements
        .filter((a) => a.completed)
        .reduce((sum, a) => sum + a.reward, 0);

    const engagementAchievements = achievements.filter((a) =>
        ['first_scan', 'ten_scans', 'fifty_scans', 'hundred_scans'].includes(a.id),
    );
    const otherAchievements = achievements.filter(
        (a) => !['first_scan', 'ten_scans', 'fifty_scans', 'hundred_scans'].includes(a.id),
    );

    return (
        <View style={{ flex: 1, backgroundColor: PRIMARY_LIGHT_BG }}>
            <View style={{ paddingTop: insets.top, backgroundColor: PRIMARY_LIGHT_BG }}>
                <View className="px-6 pb-6 pt-4">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity onPress={() => router.back()} className="p-2">
                            <Ionicons name="arrow-back" size={24} color={TEXT_DARK} />
                        </TouchableOpacity>
                        <Text style={{ color: TEXT_DARK }} className="text-2xl font-bold">
                            Achievements
                        </Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Stats Cards */}
                    <View className="flex-row gap-3">
                        <View style={webStyles.neumorphicCard} className="flex-1 p-4">
                            <Ionicons name="trophy" size={28} color={TEXT_DARK} />
                            <Text style={{ color: TEXT_DARK }} className="text-2xl font-bold mt-2">
                                {completedCount}/{achievements.length}
                            </Text>
                            <Text style={{ color: TEXT_MUTED }} className="text-xs">Completed</Text>
                        </View>

                        <View style={webStyles.neumorphicCard} className="flex-1 p-4">
                            <Ionicons name="star" size={28} color={TEXT_DARK} />
                            <Text style={{ color: TEXT_DARK }} className="text-2xl font-bold mt-2">
                                {totalRewards}
                            </Text>
                            <Text style={{ color: TEXT_MUTED }} className="text-xs">VFY Earned</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={TEXT_DARK} />
                }
            >
                {engagementAchievements.length > 0 && (
                    <>
                        <Text style={{ color: TEXT_DARK }} className="text-lg font-bold mb-4">
                            Verification Milestones
                        </Text>

                        {engagementAchievements.map((achievement) => (
                            <TouchableOpacity
                                key={achievement.id}
                                onPress={() => handleAchievementPress(achievement)}
                                activeOpacity={0.7}
                                className="mb-4"
                            >
                                <View style={webStyles.neumorphicCard} className="p-5">
                                    <View className="flex-row items-center">
                                        <View className="mr-4">
                                            <AchievementIcon
                                                achievementId={achievement.id}
                                                size={80}
                                                isCompleted={achievement.completed}
                                            />
                                        </View>

                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text style={{ color: TEXT_DARK }} className="text-base font-bold">
                                                    {achievement.title}
                                                </Text>
                                                <Text style={{ color: TEXT_MUTED }} className="text-sm font-semibold">
                                                    {achievement.current}/{achievement.target}
                                                </Text>
                                            </View>

                                            <Text style={{ color: TEXT_MUTED }} className="text-xs mb-3">
                                                {achievement.description}
                                            </Text>

                                            <View 
                                                style={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                                    overflow: 'hidden',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                                } as any}
                                            >
                                                <View
                                                    style={{
                                                        width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                                                        height: '100%',
                                                        background: achievement.completed 
                                                            ? `linear-gradient(to right, ${UNLOCKED_GLOW_START}, ${UNLOCKED_GLOW_END})`
                                                            : 'linear-gradient(to right, #3B82F6, #60A5FA)',
                                                    } as any}
                                                />
                                            </View>

                                            {achievement.completed && achievement.reward > 0 && (
                                                <View className="flex-row items-center mt-2">
                                                    <Ionicons name="star" size={14} color={UNLOCKED_GLOW_END} />
                                                    <Text style={{ color: TEXT_DARK }} className="text-xs font-bold ml-1">
                                                        +{achievement.reward} VFY
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <View className="ml-3">
                                            <Ionicons
                                                name={achievement.completed ? 'checkmark-circle' : 'chevron-forward'}
                                                size={28}
                                                color={achievement.completed ? UNLOCKED_GLOW_END : TEXT_MUTED}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {otherAchievements.length > 0 && (
                    <>
                        <Text style={{ color: TEXT_DARK }} className="text-lg font-bold mb-4 mt-6">
                            Learning Journey
                        </Text>

                        {otherAchievements.map((achievement) => (
                            <TouchableOpacity
                                key={achievement.id}
                                onPress={() => handleAchievementPress(achievement)}
                                activeOpacity={0.7}
                                className="mb-4"
                            >
                                <View style={webStyles.neumorphicCard} className="p-5">
                                    <View className="flex-row items-center">
                                        <View className="mr-4">
                                            <AchievementIcon
                                                achievementId={achievement.id}
                                                size={80}
                                                isCompleted={achievement.completed}
                                            />
                                        </View>

                                        <View className="flex-1">
                                            <View className="flex-row items-center justify-between mb-1">
                                                <Text style={{ color: TEXT_DARK }} className="text-base font-bold">
                                                    {achievement.title}
                                                </Text>
                                                <Text style={{ color: TEXT_MUTED }} className="text-sm font-semibold">
                                                    {achievement.current}/{achievement.target}
                                                </Text>
                                            </View>

                                            <Text style={{ color: TEXT_MUTED }} className="text-xs mb-3">
                                                {achievement.description}
                                            </Text>

                                            <View 
                                                style={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                                    overflow: 'hidden',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                                } as any}
                                            >
                                                <View
                                                    style={{
                                                        width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                                                        height: '100%',
                                                        background: achievement.completed 
                                                            ? `linear-gradient(to right, ${UNLOCKED_GLOW_START}, ${UNLOCKED_GLOW_END})`
                                                            : 'linear-gradient(to right, #3B82F6, #60A5FA)',
                                                    } as any}
                                                />
                                            </View>

                                            {achievement.completed && achievement.reward > 0 && (
                                                <View className="flex-row items-center mt-2">
                                                    <Ionicons name="star" size={14} color={UNLOCKED_GLOW_END} />
                                                    <Text style={{ color: TEXT_DARK }} className="text-xs font-bold ml-1">
                                                        +{achievement.reward} VFY
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <View className="ml-3">
                                            <Ionicons
                                                name={achievement.completed ? 'checkmark-circle' : 'chevron-forward'}
                                                size={28}
                                                color={achievement.completed ? UNLOCKED_GLOW_END : TEXT_MUTED}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Achievement Detail Modal */}
            <Modal
                visible={showDetailModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <Pressable
                    onPress={() => setShowDetailModal(false)}
                    className="flex-1 bg-white/70 justify-center items-center px-4"
                    style={{ backdropFilter: 'blur(8px)' } as any}
                >
                    <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-md">
                        {selectedAchievement && (
                            <View 
                                style={{
                                    ...webStyles.glassCard,
                                    borderColor: selectedAchievement.completed 
                                        ? UNLOCKED_GLOW_START + '80' 
                                        : 'rgba(0,0,0,0.1)',
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setShowDetailModal(false)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 items-center justify-center z-10"
                                    style={{ 
                                        backdropFilter: 'blur(4px)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)', 
                                    } as any}
                                >
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>

                                <View className="p-8">
                                    <View className="mx-auto mb-6">
                                        <AchievementIcon
                                            achievementId={selectedAchievement.id}
                                            size={120}
                                            isCompleted={selectedAchievement.completed}
                                        />
                                    </View>

                                    <View className="flex-row justify-center items-center mb-4">
                                        {selectedAchievement.completed ? (
                                            <View 
                                                className="px-4 py-2 rounded-full"
                                                style={{
                                                    background: 'linear-gradient(to right, #10B981, #059669)',
                                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                                                } as any}
                                            >
                                                <Text className="text-white text-sm font-bold">UNLOCKED</Text>
                                            </View>
                                        ) : (
                                            selectedAchievement.tier && (
                                                <View
                                                    className="px-4 py-2 rounded-full"
                                                    style={{
                                                        backgroundColor: getTierBadgeColor(selectedAchievement.tier) + '20',
                                                        borderWidth: 1,
                                                        borderColor: getTierBadgeColor(selectedAchievement.tier),
                                                        boxShadow: `0 2px 6px ${getTierBadgeColor(selectedAchievement.tier)}30`,
                                                    }}
                                                >
                                                    <Text style={{ color: TEXT_DARK }} className="text-sm font-bold uppercase">
                                                        {selectedAchievement.tier}
                                                    </Text>
                                                </View>
                                            )
                                        )}
                                    </View>

                                    <Text style={{ color: TEXT_DARK }} className="text-3xl font-bold text-center mb-3">
                                        {selectedAchievement.title}
                                    </Text>

                                    <Text style={{ color: TEXT_MUTED }} className="text-center mb-6">
                                        {selectedAchievement.description}
                                    </Text>

                                    <View className="flex-row gap-4 mb-6">
                                        <View style={webStyles.neumorphicCard} className="flex-1 p-4">
                                            <Text style={{ color: TEXT_DARK }} className="text-3xl font-bold text-center mb-1">
                                                {selectedAchievement.current}
                                            </Text>
                                            <Text style={{ color: TEXT_MUTED }} className="text-sm text-center">
                                                Progress
                                            </Text>
                                        </View>

                                        <View style={webStyles.neumorphicCard} className="flex-1 p-4">
                                            <Text style={{ color: TEXT_DARK }} className="text-3xl font-bold text-center mb-1">
                                                {selectedAchievement.reward}
                                            </Text>
                                            <Text style={{ color: TEXT_MUTED }} className="text-sm text-center">
                                                VFY Reward
                                            </Text>
                                        </View>
                                    </View>

                                    {!selectedAchievement.completed && (
                                        <>
                                            <View className="flex-row justify-between mb-2">
                                                <Text style={{ color: TEXT_MUTED }} className="text-sm">Progress</Text>
                                                <Text style={{ color: TEXT_DARK }} className="font-bold text-sm">
                                                    {Math.round(
                                                        getProgressPercentage(
                                                            selectedAchievement.current,
                                                            selectedAchievement.target,
                                                        ),
                                                    )}
                                                    %
                                                </Text>
                                            </View>
                                            <View
                                                style={{
                                                    height: 12,
                                                    borderRadius: 6,
                                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                                    overflow: 'hidden',
                                                    marginBottom: 24,
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: `${getProgressPercentage(
                                                            selectedAchievement.current,
                                                            selectedAchievement.target,
                                                        )}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(to right, #3B82F6, #60A5FA)',
                                                    } as any}
                                                />
                                            </View>
                                        </>
                                    )}

                                    <TouchableOpacity
                                        onPress={() => setShowDetailModal(false)}
                                        className="py-4 rounded-2xl items-center"
                                        style={{
                                            background: selectedAchievement.completed 
                                                ? `linear-gradient(to right, ${UNLOCKED_GLOW_START}, ${UNLOCKED_GLOW_END})`
                                                : 'linear-gradient(to right, #3B82F6, #60A5FA)',
                                            boxShadow: selectedAchievement.completed
                                                ? '0 4px 12px rgba(255, 152, 0, 0.3)'
                                                : '0 4px 12px rgba(59, 130, 246, 0.3)',
                                        } as any}
                                    >
                                        <Text className="font-bold text-base text-white">
                                            {selectedAchievement.completed ? 'Claimed!' : 'View Progress'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
