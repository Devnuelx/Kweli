import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ResultModal({ result, onClose }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const { verified, product, message, reward, confidence } = result;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View className="flex-1 bg-black/50 justify-center p-5">
        <Animated.View
          className="bg-white rounded-3xl p-8 max-h-4/5"
          style={{
            transform: [{ scale: scaleAnim }],
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Status Icon */}
            <View
              className={`w-20 h-20 rounded-full justify-center items-center self-center mb-6 ${
                verified ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <Text className="text-5xl font-bold text-white">
                {verified ? '✓' : '✗'}
              </Text>
            </View>

            {/* Title */}
            <Text
              className={`text-3xl font-bold text-center mb-3 ${
                verified ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {verified ? 'Verified' : 'Counterfeit'}
            </Text>

            <Text className="text-base text-gray-600 text-center mb-6">
              {message}
            </Text>

            {/* AI Confidence Score */}
            {confidence !== undefined && (
              <View className="w-full mb-6">
                <Text className="text-sm text-gray-600 mb-2 text-center">
                  AI Confidence
                </Text>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <View
                    className={`h-full rounded-full ${
                      confidence > 70
                        ? 'bg-green-500'
                        : confidence > 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </View>
                <Text className="text-xl font-bold text-gray-900 text-center">
                  {confidence}%
                </Text>
              </View>
            )}

            {/* Product Details */}
            {verified && product && (
              <View className="bg-gray-50 rounded-2xl p-5 mb-5 border border-gray-200">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  {product.name}
                </Text>

                <View className="gap-3">
                  <DetailRow label="Batch" value={product.batchNumber} />
                  <DetailRow
                    label="Expires"
                    value={
                      product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString()
                        : 'N/A'
                    }
                  />
                  <DetailRow label="Company" value={product.companyName} />
                </View>
              </View>
            )}

            {/* Reward */}
            {reward > 0 && (
              <View className="bg-blue-600 rounded-xl p-4 mb-5 items-center">
                <Text className="text-white text-lg font-bold">
                  +{reward} Points
                </Text>
              </View>
            )}

            {/* Actions */}
            <TouchableOpacity
              className="bg-blue-600 rounded-xl p-4 items-center active:bg-blue-700"
              onPress={onClose}
            >
              <Text className="text-white text-base font-semibold">Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm text-gray-900 font-medium">{value}</Text>
    </View>
  );
}