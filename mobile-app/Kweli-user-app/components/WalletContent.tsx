import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { getAchievements, getRecentTransactions, getUser, initializeAchievements } from '../services/storage';
import { Achievement, Transaction, User } from '../types';

const PRIMARY_BLUE = '#3B82F6';
const EMERALD_GREEN = '#10b981';

export default function WalletContent() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

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

        const transactionsData = await getRecentTransactions(3);
        setTransactions(transactionsData);
    };

    const getProgressPercentage = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    if (!user?.isLoggedIn) {
        return (
            <View className="py-12">
                <BlurView intensity={40} tint="dark" className="rounded-3xl p-8 border border-white/10 items-center">
                    <View className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mb-6">
                        <Ionicons name="lock-closed" size={40} color={PRIMARY_BLUE} />
                    </View>
                    <Text className="text-white text-2xl font-bold mb-3">Login Required</Text>
                    <Text className="text-white/70 text-center mb-6">
                        Sign in to earn VFY tokens and track rewards
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push('/auth/login')}
                        className="rounded-xl px-8 py-3 w-full"
                        style={{ backgroundColor: PRIMARY_BLUE }}
                    >
                        <Text className="text-white font-semibold text-center text-base">
                            Sign In
                        </Text>
                    </TouchableOpacity>
                </BlurView>
            </View>
        );
    }

    return (
        <View className="pb-8">
            {/* Balance */}
            <BlurView intensity={40} tint="dark" className="rounded-2xl p-6 mb-6 border border-white/10">
                <Text className="text-white/60 text-sm mb-2">Total Balance</Text>
                <Text className="text-white text-5xl font-bold mb-1">
                    {user.points.toLocaleString()}
                </Text>
                <Text className="text-white/60 text-lg">VFY Tokens</Text>

                <View className="mt-6 pt-4 border-t border-white/10 flex-row justify-between">
                    <View>
                        <Text className="text-white/60 text-xs mb-1">Scans</Text>
                        <Text className="text-white text-xl font-bold">{user.totalScans}</Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-white/60 text-xs mb-1">Rank</Text>
                        <Text className="text-white text-xl font-bold">
                            {user.totalScans < 10 ? 'R' : user.totalScans < 50 ? '' : 'Expert'}
                        </Text>
                    </View>
                </View>
            </BlurView>

            {/* Achievements */}
            <Text className="text-white text-lg font-bold mb-4">Achievements</Text>
            {achievements.slice(0, 2).map((achievement) => (
                <View key={achievement.id} className="mb-3">
                    <BlurView intensity={30} tint="dark" className="rounded-xl p-4 border border-white/5">
                        <View className="flex-row items-center">
                            <Text className="text-3xl mr-3">{achievement.icon}</Text>
                            <View className="flex-1">
                                <View className="flex-row items-center justify-between mb-1">
                                    <Text className="text-white font-bold">{achievement.title}</Text>
                                    {achievement.completed && (
                                        <Ionicons name="checkmark-circle" size={18} color={EMERALD_GREEN} />
                                    )}
                                </View>
                                <View className="flex-row items-center mt-2">
                                    <View className="flex-1 h-2 bg-white/10 rounded-full mr-2">
                                        <View
                                            className="h-2 bg-blue-500 rounded-full"
                                            style={{
                                                width: `${getProgressPercentage(achievement.current, achievement.target)}%`,
                                            }}
                                        />
                                    </View>
                                    <Text className="text-white/60 text-xs">
                                        {achievement.current}/{achievement.target}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </BlurView>
                </View>
            ))}

            {/* Recent Transactions */}
            {transactions.length > 0 && (
                <>
                    <Text className="text-white text-lg font-bold mb-4 mt-4">Recent</Text>
                    {transactions.map((transaction) => (
                        <View key={transaction.id} className="mb-3">
                            <BlurView intensity={20} tint="dark" className="rounded-xl p-4 border border-white/5">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1">
                                        <Text className="text-white font-semibold mb-1">
                                            {transaction.description}
                                        </Text>
                                        <Text className="text-white/50 text-xs">
                                            {new Date(transaction.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </Text>
                                    </View>
                                    <Text className="text-green-400 text-lg font-bold">
                                        +{transaction.amount}
                                    </Text>
                                </View>
                            </BlurView>
                        </View>
                    ))}
                </>
            )}
        </View>
    );
}

