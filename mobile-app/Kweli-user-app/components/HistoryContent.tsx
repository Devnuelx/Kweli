import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { getHistory } from '../services/storage';
import { HistoryItem } from '../types';

const EMERALD_GREEN = '#10b981';
const BRIGHT_RED = '#EF4444';

export default function HistoryContent() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const loadHistory = async () => {
        const historyData = await getHistory();
        setHistory(historyData);
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
            });
        }
    };

    if (history.length === 0) {
        return (
            <View className="py-12">
                <BlurView intensity={30} tint="dark" className="rounded-3xl p-12 border border-white/10 items-center">
                    <View className="w-20 h-20 bg-white/10 rounded-full items-center justify-center mb-6">
                        <Ionicons name="file-tray-outline" size={40} color="rgba(255,255,255,0.3)" />
                    </View>
                    <Text className="text-white text-xl font-bold mb-2">No History Yet</Text>
                    <Text className="text-white/60 text-center">
                        Your verifications will appear here
                    </Text>
                </BlurView>
            </View>
        );
    }

    return (
        <View className="pb-8">
            <Text className="text-white/60 text-sm mb-4">
                {history.length} verification{history.length !== 1 ? 's' : ''}
            </Text>

            {history.slice(0, 10).map((item) => (
                <View key={item.id} className="mb-3">
                    <BlurView intensity={30} tint="dark" className="rounded-2xl p-4 border border-white/5">
                        {/* Status */}
                        <View className="flex-row items-center justify-between mb-3">
                            <View
                                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                                    item.verified ? 'bg-green-500/20' : 'bg-red-500/20'
                                }`}
                            >
                                <Ionicons
                                    name={item.verified ? 'checkmark-circle' : 'close-circle'}
                                    size={14}
                                    color={item.verified ? EMERALD_GREEN : BRIGHT_RED}
                                />
                                <Text
                                    className={`ml-2 text-xs font-semibold ${
                                        item.verified ? 'text-green-400' : 'text-red-400'
                                    }`}
                                >
                                    {item.verified ? 'Verified' : 'Failed'}
                                </Text>
                            </View>
                            <View className="flex-row items-center">
                                <Ionicons
                                    name={item.verificationType === 'qr' ? 'qr-code' : 'camera'}
                                    size={14}
                                    color="rgba(255,255,255,0.4)"
                                />
                                <Text className="text-white/40 text-xs ml-2">
                                    {item.verificationType === 'qr' ? 'QR' : 'AI'}
                                </Text>
                            </View>
                        </View>

                        {/* Product */}
                        <View className="mb-3">
                            <Text className="text-white font-bold text-base mb-1">
                                {item.product.name}
                            </Text>
                            <Text className="text-white/60 text-sm">{item.product.brand}</Text>
                        </View>

                        {/* Footer */}
                        <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                            <Text className="text-white/50 text-xs">
                                {formatDate(item.date)}
                            </Text>
                            {item.verified && item.points > 0 && (
                                <View className="flex-row items-center bg-blue-500/20 rounded-full px-3 py-1">
                                    <Ionicons name="trophy" size={12} color="#3B82F6" />
                                    <Text className="text-blue-400 text-xs font-bold ml-1">
                                        +{item.points}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </BlurView>
                </View>
            ))}
        </View>
    );
}

