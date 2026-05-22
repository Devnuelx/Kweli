import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

interface VerificationModalProps {
    visible: boolean;
    onClose: () => void;
    result: {
        verified: boolean;
        message?: string;
        product?: {
            name: string;
            brand?: string;
            companyName?: string;
            companyLocation?: string;
            info?: string;
            description?: string;
            manufacturingDate?: string;
            manufactureDate?: string;
            expiryDate?: string;
            batchNumber?: string;
            serialNumber?: string;
        };
        reward?: number;
        confidence?: number;
        verificationType?: 'qr' | 'ai';
        alreadyScanned?: boolean;
    } | null;
}

export default function VerificationModal({ visible, onClose, result }: VerificationModalProps) {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (visible && result) {
            // Slide up animation
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();

            // Auto-dismiss after 20 seconds
            autoCloseTimer.current = setTimeout(() => {
                handleClose();
            }, 20000);
        } else {
            // Slide down animation
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }

        return () => {
            if (autoCloseTimer.current) {
                clearTimeout(autoCloseTimer.current);
            }
        };
    }, [visible, result]);

    const handleClose = () => {
        if (autoCloseTimer.current) {
            clearTimeout(autoCloseTimer.current);
        }
        Animated.timing(slideAnim, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    if (!result) return null;

    const isVerified = result.verified;
    const primaryColor = isVerified ? '#10B981' : '#EF4444';
    const bgColor = isVerified ? 'bg-green-500/10' : 'bg-red-500/10';
    const borderColor = isVerified ? 'border-green-500/30' : 'border-red-500/30';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                <Animated.View
                    style={{
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <View className="bg-white rounded-t-3xl">
                        <ScrollView className="px-6 pt-6 pb-8" showsVerticalScrollIndicator={false}>
                            {/* Handle */}
                            <View className="items-center mb-6">
                                <View className="w-12 h-1 bg-gray-300 rounded-full" />
                            </View>

                            {/* Status Icon */}
                            <View className="items-center mb-6">
                                <View 
                                    className={`w-24 h-24 rounded-full items-center justify-center mb-4 ${bgColor} border-2 ${borderColor}`}
                                >
                                    <Ionicons 
                                        name={isVerified ? 'checkmark-circle' : 'close-circle'} 
                                        size={60} 
                                        color={primaryColor} 
                                    />
                                </View>
                                <Text 
                                    className="text-3xl font-bold mb-2"
                                    style={{ 
                                        color: primaryColor,
                                        fontFamily: 'Manrope_700Bold'
                                    }}
                                >
                                    {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                                </Text>
                         <Text
                           className="text-gray-600 text-center text-base px-4"
                           style={{ fontFamily: 'Manrope_400Regular' }}
                         >
                           {result.message || (isVerified ? 'Product is authentic' : 'Could not verify product')}
                         </Text>
                         
                         {/* Already Scanned Warning */}
                         {result.alreadyScanned && (
                           <View className="mt-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl px-4 py-3">
                             <Text
                               className="text-yellow-700 text-sm text-center"
                               style={{ fontFamily: 'Manrope_600SemiBold' }}
                             >
                               ⚠️ Already Scanned - No Reward
                             </Text>
                           </View>
                         )}
                       </View>

                            {/* Product Details */}
                            {result.product && (
                                <View className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200">
                                    <View className="flex-row items-start mb-3">
                                        <View className="flex-1">
                                            <Text 
                                                className="text-gray-900 text-xl font-bold mb-1"
                                                style={{ fontFamily: 'Manrope_700Bold' }}
                                            >
                                                {result.product.name}
                                            </Text>
                                            {(result.product.companyName || result.product.brand) && (
                                                <Text 
                                                    className="text-gray-600 text-sm mb-1"
                                                    style={{ fontFamily: 'Manrope_400Regular' }}
                                                >
                                                    {result.product.companyName || result.product.brand}
                                                </Text>
                                            )}
                                            {result.product.companyLocation && (
                                                <Text 
                                                    className="text-gray-500 text-xs"
                                                    style={{ fontFamily: 'Manrope_400Regular' }}
                                                >
                                                    📍 {result.product.companyLocation}
                                                </Text>
                                            )}
                                        </View>
                                        {result.verificationType && (
                                            <View className="bg-blue-100 rounded-lg px-3 py-1">
                                                <Text className="text-blue-700 text-xs font-semibold">
                                                    {result.verificationType.toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Manufacturing and Expiry Dates */}
                                    {(result.product.manufacturingDate || result.product.manufactureDate || result.product.expiryDate) && (
                                        <View className="mt-4 pt-4 border-t border-gray-200">
                                            <View className="flex-row justify-between">
                                                {(result.product.manufacturingDate || result.product.manufactureDate) && (
                                                    <View className="flex-1">
                                                        <Text 
                                                            className="text-gray-500 text-xs mb-1"
                                                            style={{ fontFamily: 'Manrope_600SemiBold' }}
                                                        >
                                                            Manufacturing Date
                                                        </Text>
                                                        <Text 
                                                            className="text-gray-900 text-sm"
                                                            style={{ fontFamily: 'Manrope_600SemiBold' }}
                                                        >
                                                            {new Date(result.product.manufacturingDate || result.product.manufactureDate || '').toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </Text>
                                                    </View>
                                                )}
                                                {result.product.expiryDate && (
                                                    <View className="flex-1 items-end">
                                                        <Text 
                                                            className="text-gray-500 text-xs mb-1"
                                                            style={{ fontFamily: 'Manrope_600SemiBold' }}
                                                        >
                                                            Expiry Date
                                                        </Text>
                                                        <Text 
                                                            className="text-gray-900 text-sm"
                                                            style={{ fontFamily: 'Manrope_600SemiBold' }}
                                                        >
                                                            {new Date(result.product.expiryDate).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    {/* Additional Product Info */}
                                    {(result.product.info || result.product.description) && (
                                        <View className="mt-4">
                                            <Text 
                                                className="text-gray-600 text-sm leading-5"
                                                style={{ fontFamily: 'Manrope_400Regular' }}
                                            >
                                                {result.product.info || result.product.description}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Batch/Serial Numbers */}
                                    {(result.product.batchNumber || result.product.serialNumber) && (
                                        <View className="mt-4 flex-row gap-2 flex-wrap">
                                            {result.product.batchNumber && (
                                                <View className="bg-gray-200 rounded-lg px-3 py-1">
                                                    <Text className="text-gray-700 text-xs">
                                                        <Text>Batch: </Text>{result.product.batchNumber}
                                                    </Text>
                                                </View>
                                            )}
                                            {result.product.serialNumber && (
                                                <View className="bg-gray-200 rounded-lg px-3 py-1">
                                                    <Text className="text-gray-700 text-xs">
                                                        <Text>Serial: </Text>{result.product.serialNumber}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Confidence (AI only) */}
                            {result.confidence !== undefined && (
                                <View className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                                    <Text 
                                        className="text-gray-700 text-xs mb-2"
                                        style={{ fontFamily: 'Manrope_600SemiBold' }}
                                    >
                                        AI Confidence
                                    </Text>
                                    <View className="flex-row items-center">
                                        <View className="flex-1 h-2 bg-gray-200 rounded-full mr-3">
                                            <View
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${result.confidence}%`,
                                                    backgroundColor: primaryColor,
                                                }}
                                            />
                                        </View>
                                        <Text 
                                            className="text-gray-900 font-bold"
                                            style={{ fontFamily: 'Manrope_700Bold' }}
                                        >
                                            {result.confidence}%
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Reward */}
                            {result.reward && isVerified && (
                                <View className="mb-6">
                                    <LinearGradient
                                        colors={['#10B981', '#059669']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            borderRadius: 16,
                                            padding: 20,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Text 
                                            className="text-white/80 text-sm mb-1"
                                            style={{ fontFamily: 'Manrope_600SemiBold' }}
                                        >
                                            Tokens Earned
                                        </Text>
                                        <Text 
                                            className="text-white text-5xl font-bold"
                                            style={{ fontFamily: 'Manrope_700Bold' }}
                                        >
                                            +{result.reward}
                                        </Text>
                                        <Text 
                                            className="text-white/80 text-sm"
                                            style={{ fontFamily: 'Manrope_400Regular' }}
                                        >
                                            VFY Tokens
                                        </Text>
                                    </LinearGradient>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={handleClose}
                                    className="flex-1"
                                >
                                    <View className="bg-gray-100 rounded-xl py-4 items-center border border-gray-300">
                                        <Text 
                                            className="text-gray-900 font-semibold"
                                            style={{ fontFamily: 'Manrope_600SemiBold' }}
                                        >
                                            Close
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {!isVerified && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            handleClose();
                                            // You can add retry logic here
                                        }}
                                        className="flex-1"
                                    >
                                        <LinearGradient
                                            colors={['#3B82F6', '#2563EB']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{
                                                borderRadius: 12,
                                                paddingVertical: 16,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Text 
                                                className="text-white font-semibold"
                                                style={{ fontFamily: 'Manrope_600SemiBold' }}
                                            >
                                                Try Again
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Auto-close indicator */}
                            <Text 
                                className="text-gray-400 text-xs text-center mt-4"
                                style={{ fontFamily: 'Manrope_400Regular' }}
                            >
                                Auto-closes in 20 seconds
                            </Text>
                        </ScrollView>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}