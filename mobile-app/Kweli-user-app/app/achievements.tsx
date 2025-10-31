import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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

// Color Constants
const PRIMARY_LIGHT_BG = '#F4F6F8';
const NEUMORPHIC_BG = '#E8EBF0';
const TEXT_DARK = '#1F2937';
const TEXT_MUTED = '#6B7280';
const UNLOCKED_GLOW_START = '#FFC107';
const UNLOCKED_GLOW_END = '#FF9800';

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

// Neumorphic Achievement Icon Component
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
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: NEUMORPHIC_BG,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#FFFFFF',
                shadowOffset: { width: -4, height: -4 },
                shadowOpacity: 1,
                shadowRadius: 8,
                elevation: 8,
            }}
        >
            <View
                style={{
                    position: 'absolute',
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    shadowColor: '#A0AEC0',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                }}
            />

            <View
                style={{
                    width: size * 0.85,
                    height: size * 0.85,
                    borderRadius: (size * 0.85) / 2,
                    backgroundColor: NEUMORPHIC_BG,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#A0AEC0',
                    shadowOffset: { width: 3, height: 3 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                }}
            >
                <View
                    style={{
                        position: 'absolute',
                        width: size * 0.85,
                        height: size * 0.85,
                        borderRadius: (size * 0.85) / 2,
                        shadowColor: '#FFFFFF',
                        shadowOffset: { width: -2, height: -2 },
                        shadowOpacity: 0.8,
                        shadowRadius: 4,
                    }}
                />

                <Image
                    source={imageSource}
                    style={{
                        width: size * 0.65,
                        height: size * 0.65,
                        opacity: isCompleted ? 1 : 0.4,
                        borderRadius: (size * 0.65) / 2,
                    }}
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
                            shadowColor: UNLOCKED_GLOW_END,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.6,
                            shadowRadius: 4,
                        }}
                    >
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                    </View>
                )}
            </View>
        </View>
    );
};

export default function AchievementsScreen() {
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

                    {/* Stats Cards - Neumorphic */}
                    <View className="flex-row gap-3">
                        <View
                            style={{
                                flex: 1,
                                borderRadius: 16,
                                padding: 16,
                                backgroundColor: NEUMORPHIC_BG,
                                shadowColor: '#FFFFFF',
                                shadowOffset: { width: -4, height: -4 },
                                shadowOpacity: 1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <View
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    shadowColor: '#A0AEC0',
                                    shadowOffset: { width: 4, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            />
                            <Ionicons name="trophy" size={28} color={TEXT_DARK} style={{ zIndex: 10 }} />
                            <Text style={{ color: TEXT_DARK, zIndex: 10 }} className="text-2xl font-bold mt-2">
                                {completedCount}/{achievements.length}
                            </Text>
                            <Text style={{ color: TEXT_MUTED, zIndex: 10 }} className="text-xs">Completed</Text>
                        </View>

                        <View
                            style={{
                                flex: 1,
                                borderRadius: 16,
                                padding: 16,
                                backgroundColor: NEUMORPHIC_BG,
                                shadowColor: '#FFFFFF',
                                shadowOffset: { width: -4, height: -4 },
                                shadowOpacity: 1,
                                shadowRadius: 8,
                                elevation: 4,
                            }}
                        >
                            <View
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    shadowColor: '#A0AEC0',
                                    shadowOffset: { width: 4, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            />
                            <Ionicons name="star" size={28} color={TEXT_DARK} style={{ zIndex: 10 }} />
                            <Text style={{ color: TEXT_DARK, zIndex: 10 }} className="text-2xl font-bold mt-2">
                                {totalRewards}
                            </Text>
                            <Text style={{ color: TEXT_MUTED, zIndex: 10 }} className="text-xs">VFY Earned</Text>
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
                                <View
                                    style={{
                                        borderRadius: 24,
                                        padding: 20,
                                        backgroundColor: NEUMORPHIC_BG,
                                        shadowColor: '#FFFFFF',
                                        shadowOffset: { width: -6, height: -6 },
                                        shadowOpacity: 1,
                                        shadowRadius: 12,
                                        elevation: 6,
                                    }}
                                >
                                    <View
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: 24,
                                            shadowColor: '#A0AEC0',
                                            shadowOffset: { width: 6, height: 6 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 12,
                                        }}
                                    />

                                    <View className="flex-row items-center" style={{ zIndex: 10 }}>
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
                                                    backgroundColor: NEUMORPHIC_BG,
                                                    overflow: 'hidden',
                                                    shadowColor: '#A0AEC0',
                                                    shadowOffset: { width: 2, height: 2 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 3,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                                                        height: '100%',
                                                        backgroundColor: achievement.completed ? UNLOCKED_GLOW_END : '#3B82F6',
                                                        borderRadius: 4,
                                                    }}
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
                                <View
                                    style={{
                                        borderRadius: 24,
                                        padding: 20,
                                        backgroundColor: NEUMORPHIC_BG,
                                        shadowColor: '#FFFFFF',
                                        shadowOffset: { width: -6, height: -6 },
                                        shadowOpacity: 1,
                                        shadowRadius: 12,
                                        elevation: 6,
                                    }}
                                >
                                    <View
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: 24,
                                            shadowColor: '#A0AEC0',
                                            shadowOffset: { width: 6, height: 6 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 12,
                                        }}
                                    />

                                    <View className="flex-row items-center" style={{ zIndex: 10 }}>
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
                                                    backgroundColor: NEUMORPHIC_BG,
                                                    overflow: 'hidden',
                                                    shadowColor: '#A0AEC0',
                                                    shadowOffset: { width: 2, height: 2 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 3,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                                                        height: '100%',
                                                        backgroundColor: achievement.completed ? UNLOCKED_GLOW_END : '#3B82F6',
                                                        borderRadius: 4,
                                                    }}
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

            <Modal
                visible={showDetailModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <Pressable
                    onPress={() => setShowDetailModal(false)}
                    className="flex-1 bg-white/70 justify-center items-center px-4"
                >
                    <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-md">
                        {selectedAchievement && (
                            <BlurView
                                intensity={30}
                                tint="light"
                                style={{
                                    borderRadius: 32,
                                    overflow: 'hidden',
                                    borderWidth: 2,
                                    borderColor: selectedAchievement.completed ? UNLOCKED_GLOW_START + '80' : 'rgba(0,0,0,0.1)',
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setShowDetailModal(false)}
                                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 items-center justify-center z-10"
                                >
                                    <Ionicons name="close" size={24} color={"white"} />
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
                                            <View className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                                                <Text className="text-green-800 text-sm font-bold">UNLOCKED</Text>
                                            </View>
                                        ) : (
                                            selectedAchievement.tier && (
                                                <View
                                                    className="px-4 py-2 rounded-full"
                                                    style={{
                                                        backgroundColor: getTierBadgeColor(selectedAchievement.tier) + '20',
                                                        borderWidth: 1,
                                                        borderColor: getTierBadgeColor(selectedAchievement.tier),
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
                                        <View
                                            style={{
                                                flex: 1,
                                                borderRadius: 16,
                                                padding: 16,
                                                backgroundColor: NEUMORPHIC_BG,
                                                shadowColor: '#FFFFFF',
                                                shadowOffset: { width: -3, height: -3 },
                                                shadowOpacity: 1,
                                                shadowRadius: 6,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: 16,
                                                    shadowColor: '#A0AEC0',
                                                    shadowOffset: { width: 3, height: 3 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 6,
                                                }}
                                            />
                                            <Text style={{ color: TEXT_DARK, zIndex: 10 }} className="text-3xl font-bold text-center mb-1">
                                                {selectedAchievement.current}
                                            </Text>
                                            <Text style={{ color: TEXT_MUTED, zIndex: 10 }} className="text-sm text-center">
                                                Progress
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                flex: 1,
                                                borderRadius: 16,
                                                padding: 16,
                                                backgroundColor: NEUMORPHIC_BG,
                                                shadowColor: '#FFFFFF',
                                                shadowOffset: { width: -3, height: -3 },
                                                shadowOpacity: 1,
                                                shadowRadius: 6,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: 16,
                                                    shadowColor: '#A0AEC0',
                                                    shadowOffset: { width: 3, height: 3 },
                                                    shadowOpacity: 0.3,
                                                    shadowRadius: 6,
                                                }}
                                            />
                                            <Text style={{ color: TEXT_DARK, zIndex: 10 }} className="text-3xl font-bold text-center mb-1">
                                                {selectedAchievement.reward}
                                            </Text>
                                            <Text style={{ color: TEXT_MUTED, zIndex: 10 }} className="text-sm text-center">
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
                                                    backgroundColor: NEUMORPHIC_BG,
                                                    overflow: 'hidden',
                                                    marginBottom: 24,
                                                    shadowColor: '#A0AEC0',
                                                    shadowOffset: { width: 2, height: 2 },
                                                    shadowOpacity: 0.4,
                                                    shadowRadius: 4,
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        width: `${getProgressPercentage(
                                                            selectedAchievement.current,
                                                            selectedAchievement.target,
                                                        )}%`,
                                                        height: '100%',
                                                        backgroundColor: '#3B82F6',
                                                        borderRadius: 6,
                                                    }}
                                                />
                                            </View>
                                        </>
                                    )}

                                    <TouchableOpacity
                                        onPress={() => setShowDetailModal(false)}
                                        className="py-4 rounded-2xl items-center"
                                        style={{
                                            backgroundColor: selectedAchievement.completed ? UNLOCKED_GLOW_END : '#3B82F6',
                                        }}
                                    >
                                        <Text className="font-bold text-base text-white">
                                            {selectedAchievement.completed ? 'Claimed!' : 'View Progress'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </BlurView>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}