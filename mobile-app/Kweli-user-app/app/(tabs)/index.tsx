import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import VerificationModal from '../../components/VerificationModal';
import { associateToken, creditTokens, takeProductPhoto, verifyQRCode, verifyWithAI } from '../../services/api';
import { addPoints, getHistory, getUser, incrementScans, isCodeScanned, markCodeAsScanned, saveHistoryItem, saveTransaction, updateAchievements } from '../../services/storage';

const { width, height } = Dimensions.get('window');

// Original constants
const DEEP_RICH_BLACK = '#0A0A0A'; 
const SHAZAM_BG_COLOR = '#0096ff'; 
const SHAZAM_SHADOW_COLOR = '#495761';
const PRIMARY_BLUE = '#3B82F6';
const EMERALD_GREEN = '#10b981';
const BRIGHT_RED = '#EF4444';

export default function HomeScreen() {
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showResultSheet, setShowResultSheet] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showAIScanner, setShowAIScanner] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [showInitialText, setShowInitialText] = useState(true);
    const [isHolding, setIsHolding] = useState(false);

    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const textFadeAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const tiltAnim = useRef(new Animated.Value(0)).current;
    const holdScaleAnim = useRef(new Animated.Value(1)).current;

    const texts = [
        "Tap to Kweli", 
        "Scan QR Code",
        "Press and hold to use AI",
    ];

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        requestCameraPermission();
        startAnimations();
        
        // Show "Tap to Kweli" initially, then switch to "Scan QR Code" after 5 seconds
        const initialTimer = setTimeout(() => {
            setShowInitialText(false);
            setCurrentTextIndex(1); // Switch to "Scan QR Code"
            
            // Start the rotation between texts every 30 seconds
            const rotationTimer = setInterval(() => {
                // Fade out
                Animated.timing(textFadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => {
                    // Change text
                    setCurrentTextIndex((prev) => (prev + 1) % texts.length);
                    // Fade in
                    Animated.timing(textFadeAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }).start();
                });
            }, 30000); // Rotate every 30 seconds

            return () => clearInterval(rotationTimer);
        }, 0); 

        return () => clearTimeout(initialTimer);
    }, []);

    const loadData = async () => {
        const userData = await getUser();
        setUser(userData);
        const historyData = await getHistory();
        setHistory(historyData.slice(0, 10));
    };

    const startAnimations = () => {
        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Scanning line animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1.3,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Shimmer animation for top border (Shazam-style)
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 2500,
                useNativeDriver: true,
            })
        ).start();
    };

    const requestCameraPermission = async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
    };

    const handleMainAction = () => {
        if (hasPermission) {
            setShowScanner(true);
        } else {
            Alert.alert(
                'Camera Permission Required',
                'Please grant camera permission to scan QR codes',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: requestCameraPermission },
                ]
            );
        }
    };

    const handlePressIn = () => {
        setIsHolding(true);
        Animated.timing(holdScaleAnim, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        setIsHolding(false);
        Animated.timing(holdScaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const handleLongPress = () => {
        // Haptic feedback
        Vibration.vibrate(50);
        setShowAIScanner(true);
    };

    const handleQRScan = async (data: string) => {
        if (scanning) return;
        
        setScanning(true);
        setShowScanner(false);
        setLoading(true);

        let hash = data;
        
        try {
            if (data.includes('http://') || data.includes('https://')) {
                const url = new URL(data);
                const hashParam = url.searchParams.get('hash');
                if (hashParam) {
                    hash = hashParam;
                } else {
                    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
                    hash = pathParts[pathParts.length - 1];
                }
            } else if (data.includes('?hash=')) {
                const hashMatch = data.match(/[?&]hash=([^&]+)/);
                if (hashMatch && hashMatch[1]) {
                    hash = hashMatch[1];
                }
            } else if (data.includes('/')) {
                const pathParts = data.split('/').filter(part => part.length > 0);
                hash = pathParts[pathParts.length - 1];
            }
            
            console.log('QR Code Data:', data);
            console.log('Extracted Hash:', hash);
        } catch (error) {
            console.error('Error parsing QR code:', error);
            hash = data;
        }

        const response = await verifyQRCode(hash);

        if (response.success && response.data) {
            const verificationResult = response.data;
            const alreadyScanned = await isCodeScanned(hash);
            verificationResult.alreadyScanned = alreadyScanned;
            verificationResult.codeHash = hash;

            if (alreadyScanned) {
                console.log('⚠️ This code has already been scanned. No reward will be given.');
                verificationResult.reward = 0;
                verificationResult.message = '⚠️ This product has already been verified. No additional rewards.';
                
                setLoading(false);
                setResult(verificationResult);
                setShowResultSheet(true);
            } else {
                const defaultReward = 10;
                const actualReward = verificationResult.verified ? (verificationResult.reward || defaultReward) : 0;
                
                await saveHistoryItem({
                    id: Date.now().toString(),
                    product: verificationResult.product!,
                    verified: verificationResult.verified,
                    points: actualReward,
                    date: new Date().toISOString(),
                    verificationType: 'qr',
                });

                const totalScans = await incrementScans();
                await updateAchievements(totalScans);

                if (verificationResult.verified && actualReward > 0) {
                    await markCodeAsScanned(hash);
                    console.log(`✅ Awarding ${actualReward} points for successful verification`);

                    // Always award locally so login is optional
                    const updatedUser = await addPoints(actualReward);
                    setUser(updatedUser);
                    
                    await saveTransaction({
                        id: Date.now().toString(),
                        type: 'verification',
                        amount: actualReward,
                        description: `Verified ${verificationResult.product?.name || 'Product'}`,
                        date: new Date().toISOString(),
                        productName: verificationResult.product?.name,
                    });
                    
                    console.log(`💰 New balance: ${updatedUser.points} VFY`);
                    
                    // Sync to Hedera only if user has an account id
                    if (user?.hederaAccountId) {
                        try {
                            console.log(`🔄 Syncing with Hedera account ${user.hederaAccountId}...`);
                            const associateResponse = await associateToken(user.hederaAccountId);
                            const creditResponse = await creditTokens(user.hederaAccountId, actualReward);
                            
                            if (creditResponse.success) {
                                console.log('✅ Hedera tokens credited successfully');
                            } else {
                                console.log('⚠️ Hedera sync failed (points still awarded locally):', creditResponse.error);
                            }
                        } catch (error) {
                            console.log('⚠️ Hedera sync error (points still awarded locally):', error);
                        }
                    }
                    
                    verificationResult.reward = actualReward;
                }

                loadData();
                setLoading(false);
                setResult(verificationResult);
                setShowResultSheet(true);
            }
        } else {
            // Save failed verification to history
            await saveHistoryItem({
                id: Date.now().toString(),
                product: {
                    name: 'Unknown Product',
                    brand: 'Unknown',
                    info: 'Verification failed',
                },
                verified: false,
                points: 0,
                date: new Date().toISOString(),
                verificationType: 'qr',
            });

            const totalScans = await incrementScans();
            await updateAchievements(totalScans);

            setLoading(false);
            setResult({
                verified: false,
                message: response.error || 'Unable to verify product',
                verificationType: 'qr',
            });
            setShowResultSheet(true);
        }

        setScanning(false);
    };

    const handleAIVerification = async () => {
        setShowAIScanner(false);
        
        // Take photo first (this will show the camera)
        const photoResult = await takeProductPhoto();
        
        if (!photoResult.success) {
            Alert.alert('Error', photoResult.error || 'Failed to capture photo');
            return;
        }

        // Now show loading after photo is taken
        setLoading(true);

        // Use the correct /verify-ai endpoint
        const response = await verifyWithAI(photoResult.uri!);

        if (response.success && response.data) {
            const verificationResult = response.data;
            const brandName = verificationResult.product?.brand || verificationResult.product?.companyName || '';
            const productName = verificationResult.product?.name || '';
            const uniqueId = brandName && productName 
                ? `ai_${brandName}_${productName}`.toLowerCase().replace(/\s+/g, '_')
                : `ai_${Date.now()}`;
            
            const alreadyScanned = await isCodeScanned(uniqueId);
            verificationResult.alreadyScanned = alreadyScanned;
            verificationResult.codeHash = uniqueId;

            if (alreadyScanned) {
                console.log('⚠️ This product has already been verified via AI. No reward will be given.');
                verificationResult.reward = 0;
                verificationResult.message = '⚠️ This product has already been verified. No additional rewards.';
                
                setLoading(false);
                setResult(verificationResult);
                setShowResultSheet(true);
            } else {
                const defaultReward = 15;
                const actualReward = verificationResult.verified ? (verificationResult.reward || defaultReward) : 0;
                
                await saveHistoryItem({
                    id: Date.now().toString(),
                    product: verificationResult.product!,
                    verified: verificationResult.verified,
                    points: actualReward,
                    date: new Date().toISOString(),
                    verificationType: 'ai',
                });

                const totalScans = await incrementScans();
                await updateAchievements(totalScans);

                if (verificationResult.verified && actualReward > 0) {
                    await markCodeAsScanned(uniqueId);
                    console.log(`✅ Awarding ${actualReward} points for successful AI verification`);

                    // Always award locally so login is optional
                    const updatedUser = await addPoints(actualReward);
                    setUser(updatedUser);
                    
                    await saveTransaction({
                        id: Date.now().toString(),
                        type: 'verification',
                        amount: actualReward,
                        description: `AI Verified ${verificationResult.product?.name || 'Product'}`,
                        date: new Date().toISOString(),
                        productName: verificationResult.product?.name,
                    });
                    
                    console.log(`💰 New balance: ${updatedUser.points} VFY`);
                    
                    // Sync to Hedera only if user has an account id
                    if (user?.hederaAccountId) {
                        try {
                            console.log(`🔄 Syncing with Hedera account ${user.hederaAccountId}...`);
                            const associateResponse = await associateToken(user.hederaAccountId);
                            const creditResponse = await creditTokens(user.hederaAccountId, actualReward);
                            
                            if (creditResponse.success) {
                                console.log('✅ Hedera tokens credited successfully');
                            } else {
                                console.log('⚠️ Hedera sync failed (points still awarded locally):', creditResponse.error);
                            }
                        } catch (error) {
                            console.log('⚠️ Hedera sync error (points still awarded locally):', error);
                        }
                    }
                    
                    verificationResult.reward = actualReward;
                }

                loadData();
                setLoading(false);
                setResult(verificationResult);
                setShowResultSheet(true);
            }
        } else {
            // Save failed verification to history
            await saveHistoryItem({
                id: Date.now().toString(),
                product: {
                    name: 'Unknown Product',
                    brand: 'Unknown',
                    info: 'AI verification failed',
                },
                verified: false,
                points: 0,
                date: new Date().toISOString(),
                verificationType: 'ai',
            });

            const totalScans = await incrementScans();
            await updateAchievements(totalScans);

            setLoading(false);
            setResult({
                verified: false,
                message: response.error || 'Unable to verify product',
                verificationType: 'ai',
            });
            setShowResultSheet(true);
        }
    };

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        handleQRScan(data);
    };

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const tilt = tiltAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-5deg', '5deg'],
    });

    const scanLinePosition = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
    });

    const shimmerTranslate = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-250, 250],
    });

    return (
        <View className="flex-1">
            <LinearGradient
                colors={['#f0f8ff', '#e0f6ff', '#ffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: .95 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            
            <View 
                style={{ 
                    position: 'absolute', 
                    left: 0, 
                    right: 0, 
                    top: 0, 
                    bottom: 0,
                    backgroundColor: 'transparent',
                    opacity: 0.6,
                }}
            >
                <View style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'transparent',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 1,
                }} />
            </View>

            <View className="flex-1 justify-center items-center px-6 ">
                <Animated.View 
                    style={{ opacity: textFadeAnim }}
                    className="items-center mb-10"
                >
                    <Text className="text-gray-800 text-2xl font-bold tracking-tight">
                        {showInitialText ? texts[0] : texts[currentTextIndex]}
                    </Text>
                    <Text className="text-gray-500 text-[10px] mt-2 tracking-widest uppercase">
                        {showInitialText || currentTextIndex === 0 ? 'Click, Verify, Earn' : 'TAP TO SCAN'}
                    </Text>
                </Animated.View>

                <View className="relative">
                    <Animated.View
                        style={{
                            transform: [
                                { scale: Animated.multiply(pulseAnim, holdScaleAnim) }
                            ],
                            shadowColor: SHAZAM_SHADOW_COLOR, 
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.4, 
                            shadowRadius: 24,
                            elevation: 15,
                        }}
                    >
                        <TouchableOpacity
                            onPress={handleMainAction}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            onLongPress={handleLongPress}
                            delayLongPress={1000}
                            activeOpacity={0.85}
                            className="relative w-56 h-56 rounded-full justify-center items-center overflow-hidden"
                            style={{ 
                                backgroundColor: SHAZAM_BG_COLOR,
                            }}
                        >
                            {/* Shimmer overlay - MOVED BEHIND */}
                            <View 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    overflow: 'hidden',
                                    borderRadius: 224,
                                    zIndex: 0, // Behind everything
                                }}
                            >
                                <Animated.View
                                    style={{
                                        width: '200%',
                                        height: '100%',
                                        transform: [{ translateX: shimmerTranslate }],
                                    }}
                                >
                                    <LinearGradient
                                        colors={[
                                            'rgba(255,255,255,0)',
                                            'rgba(255,255,255,0.05)', 
                                            'rgba(255,255,255,0.15)', 
                                            'rgba(255,255,255,0.05)',
                                            'rgba(255,255,255,0)',
                                        ]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                        }}
                                    />
                                </Animated.View>
                            </View>

                            {/* Inner glow ring */}
                            <View 
                                style={{
                                    position: 'absolute',
                                    width: '98%',
                                    height: '98%',
                                    borderRadius: 224,
                                    borderWidth: 2,
                                    borderColor: 'rgba(255,255,255,0.15)',
                                    zIndex: 1,
                                }}
                            />

                            {/* Kweli Logo */}
                            <Animated.View
                                style={{
                                    width: '75%', 
                                    height: '75%',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 2, // In front
                                }}
                            >
                                <Image 
                                    source={require('../../assets/images/nnn.png')} 
                                    style={{ width: '100%', height: '100%', tintColor: 'white' }} 
                                    contentFit="contain"
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>

            {/* QR Scanner Modal */}
            <Modal visible={showScanner} animationType="fade">
                <View className="flex-1" style={{ backgroundColor: DEEP_RICH_BLACK }}>
                    {hasPermission ? (
                        <>
                            <CameraView
                                style={{ flex: 1 }}
                                facing="back"
                                onBarcodeScanned={handleBarCodeScanned}
                                barcodeScannerSettings={{
                                    barcodeTypes: ['qr'],
                                }}
                            />
                            
                            <View className="absolute inset-0 justify-center items-center">
                                <View 
                                    className="w-72 h-72 border-4 rounded-3xl"
                                    style={{ borderColor: PRIMARY_BLUE }}
                                >
                                    <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-3xl" style={{ borderColor: EMERALD_GREEN }} />
                                    <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-3xl" style={{ borderColor: EMERALD_GREEN }} />
                                    <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-3xl" style={{ borderColor: EMERALD_GREEN }} />
                                    <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-3xl" style={{ borderColor: EMERALD_GREEN }} />
                                </View>
                            </View>

                            <View className="absolute top-0 left-0 right-0 pt-16 px-6">
                                <View className="bg-white/95 rounded-2xl p-4 border border-gray-200 shadow-lg">
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-1">
                                            <Text className="text-gray-900 text-lg font-bold">Align QR Code</Text>
                                            <Text className="text-gray-600 text-sm mt-1">Point camera at product QR code</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setShowScanner(false)}
                                            className="w-10 h-10 rounded-full justify-center items-center bg-gray-100"
                                        >
                                            <Ionicons name="close" size={24} color="#374151" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </>
                    ) : (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-white text-lg">No camera access</Text>
                        </View>
                    )}
                </View>
            </Modal>

            {/* AI Scanner Modal */}
            <Modal visible={showAIScanner} animationType="fade" transparent>
                <View className="flex-1 bg-black/50 justify-center items-center px-6">
                    <View className="bg-white rounded-3xl p-8 border border-gray-200 w-full shadow-lg">
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 rounded-full bg-emerald-100 justify-center items-center mb-4">
                                <Ionicons name="camera" size={40} color={EMERALD_GREEN} />
                            </View>
                            <Text className="text-gray-900 text-2xl font-bold mb-2">AI Photo Verification</Text>
                            <Text className="text-gray-600 text-center text-sm leading-6 mb-4">
                                Take a clear photo of the product focusing on the branding, labels, and packaging details
                            </Text>
                            
                            <View className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mt-2">
                                <Text className="text-yellow-700 text-xs text-center font-medium">
                                    ⚠️ AI MODEL IN TRAINING: Our AI is still learning and may make mistakes. 
                                    For best results, ensure clear photos of product branding and labels.
                                </Text>
                            </View>
                        </View>

                        <View className="mb-6">
                            <Text className="text-gray-900 font-semibold mb-2 text-center">📸 Photo Guidelines:</Text>
                            <View className="space-y-2">
                                <Text className="text-gray-600 text-xs text-center">• Focus on product branding and labels</Text>
                                <Text className="text-gray-600 text-xs text-center">• Ensure good lighting and clear focus</Text>
                                <Text className="text-gray-600 text-xs text-center">• Capture the front of the packaging</Text>
                                <Text className="text-gray-600 text-xs text-center">• Avoid blurry or dark photos</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleAIVerification}
                            activeOpacity={0.8}
                            className="w-full py-4 rounded-2xl mb-4"
                            style={{ backgroundColor: EMERALD_GREEN }}
                        >
                            <Text className="text-white text-center font-bold text-lg">Take Photo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowAIScanner(false)}
                            className="w-full py-4 rounded-2xl border border-gray-300"
                            style={{ backgroundColor: 'rgba(249,250,251,1)' }}
                        >
                            <Text className="text-gray-900 text-center font-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            {loading && (
                <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
                    <View className="bg-white rounded-3xl p-12 items-center border border-gray-200 shadow-lg">
                        <ActivityIndicator size="large" color={EMERALD_GREEN} />
                        <Text className="text-gray-900 text-lg mt-6 font-light tracking-widest">
                            {result?.verificationType === 'ai' ? 'AI VERIFYING...' : 'VERIFYING...'}
                        </Text>
                        {result?.verificationType === 'ai' && (
                            <Text className="text-gray-600 text-sm mt-2 text-center">
                                Analyzing product image with AI
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Verification Result Modal */}
            <VerificationModal
                visible={showResultSheet}
                onClose={() => {
                    setShowResultSheet(false);
                    setResult(null);
                }}
                result={result}
            />
        </View>
    );
}