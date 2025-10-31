import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { associateToken, login, signup } from '../../services/api';
import { saveUser } from '../../services/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateInputs = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (!password) {
      setError('Password is required');
      return false;
    }
    
    if (isSignUp) {
      if (!name.trim()) {
        setError('Name is required');
        return false;
      }
      if (name.trim().length < 2) {
        setError('Name must be at least 2 characters long');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return false;
      }
      
      // Phone validation (optional but if provided, validate format)
      if (phone.trim() && !/^\+?[\d\s-()]+$/.test(phone.trim())) {
        setError('Please enter a valid phone number');
        return false;
      }
    }
    
    return true;
  };

  const handleAuthError = (response: any, isSignUp: boolean) => {
    const status = response.status;
    const errorMessage = response.error?.toLowerCase() || '';
    
    if (status === 401) {
      setError('Invalid email or password');
    } else if (status === 409) {
      // Handle unique constraint violations
      if (errorMessage.includes('phone') || errorMessage.includes('user_phone_key')) {
        setError('This phone number is already registered. Please use a different number or login with your email.');
      } else if (errorMessage.includes('email')) {
        setError('An account with this email already exists. Please login instead.');
      } else {
        setError('An account with these details already exists.');
      }
    } else if (status === 400) {
      setError(isSignUp ? 'Invalid registration data' : 'Invalid login data');
    } else if (status === 404) {
      setError('No account found with this email');
    } else if (status >= 500) {
      setError('Server error. Please try again later.');
    } else {
      setError(response.error || `${isSignUp ? 'Registration' : 'Login'} failed`);
    }
  };

  const handleTokenAssociation = async (hederaAccountId: string) => {
    try {
      console.log('Associating token for user:', hederaAccountId);
      const associateResponse = await associateToken(hederaAccountId);
      
      if (!associateResponse.success) {
        console.warn('⚠️ Token association failed:', associateResponse.error);
      } else {
        console.log('✅ Token association successful');
      }
    } catch (e: any) {
      console.error('❌ Token association error:', e);
    }
  };

  const handleUnexpectedError = (error: any) => {
    if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
      setError('Network error. Please check your internet connection.');
    } else if (error.message?.includes('timeout')) {
      setError('Request timeout. Please try again.');
    } else {
      setError('An unexpected error occurred. Please try again.');
    }
    console.error('Authentication error:', error);
  };

  const handleAuth = async () => {
    if (isSubmitting) return;
    
    if (!validateInputs()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (isSignUp) {
        // Send phone as null if empty to avoid unique constraint issues
        response = await signup(name.trim(), email.trim(), password, phone.trim() || String(null));
        
        if (!response.success || !response.data) {
          handleAuthError(response, true);
          setIsSubmitting(false);
          setLoading(false);
          return;
        }

        try {
          await saveUser(response.data.user);
        } catch (storageError) {
          console.error('Failed to save user data:', storageError);
          setError('Failed to save user data locally. Please try again.');
          setIsSubmitting(false);
          setLoading(false);
          return;
        }

        if (response.data.user.hederaAccountId) {
          await handleTokenAssociation(response.data.user.hederaAccountId);
        } else {
          console.log('⚠️ No Hedera account ID returned from signup. Token association skipped.');
        }

      } else {
        response = await login(email.trim(), password);
        
        if (!response.success || !response.data) {
          handleAuthError(response, false);
          setIsSubmitting(false);
          setLoading(false);
          return;
        }

        try {
          await saveUser(response.data.user);
        } catch (storageError) {
          console.error('Failed to save user data:', storageError);
          setError('Failed to save user data locally. Please try again.');
          setIsSubmitting(false);
          setLoading(false);
          return;
        }

        if (response.data.user.hederaAccountId) {
          await handleTokenAssociation(response.data.user.hederaAccountId);
        } else {
          console.log('⚠️ No Hedera account ID in user data. Token association skipped.');
        }
      }

      try {
        router.replace('/(tabs)');
      } catch (navError) {
        console.error('Navigation error:', navError);
        setError('Authentication successful! Please navigate manually.');
      }

    } catch (error: any) {
      handleUnexpectedError(error);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleToggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setPhone('');
  };

  return (
    <View className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-12 pt-16">
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => {
                try {
                  router.back();
                } catch (error) {
                  // Fallback for iOS or when back doesn't work
                  router.replace('/(tabs)');
                }
              }}
              className="self-end mb-8"
              disabled={loading}
            >
              <Ionicons name="close" size={28} color="#999" />
            </TouchableOpacity>

            {/* Logo/Icon */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 items-center justify-center mb-6">
                <LinearGradient
                  colors={['#3B82F6', '#60A5FA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="key" size={48} color="white" />
                </LinearGradient>
              </View>
              <Text 
                className="text-white text-3xl mb-2"
                style={{ fontFamily: 'Manrope_700Bold' }}
              >
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text className="text-gray-400 text-sm">
                {isSignUp ? 'Create your account to get started' : 'Sign in to continue'}
              </Text>
            </View>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-white text-sm mb-3">
                Email Address *
              </Text>
              <View className={`bg-gray-900 rounded-xl px-4 py-4 flex-row items-center border ${
                error && !email.trim() ? 'border-red-500' : 'border-gray-800'
              }`}>
                <TextInput
                  placeholder="test@gmail.com"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  className="flex-1 text-white"
                  style={{ fontFamily: 'Manrope_400Regular' }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!loading}
                />
                {email && email.includes('@') && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
            </View>

            {/* Name Input (Signup only) */}
            {isSignUp && (
              <View className="mb-4">
                <Text className="text-white text-sm mb-3">
                  Nickname *
                </Text>
                <View className={`bg-gray-900 rounded-xl px-4 py-4 flex-row items-center border ${
                  error && !name.trim() ? 'border-red-500' : 'border-gray-800'
                }`}>
                  <TextInput
                    placeholder="Johny"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      if (error) setError('');
                    }}
                    className="flex-1 text-white"
                    style={{ fontFamily: 'Manrope_400Regular' }}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!loading}
                  />
                </View>
              </View>
            )}

            {/* Phone Input (Signup only - Optional) */}
            {isSignUp && (
              <View className="mb-4">
                <Text className="text-white text-sm mb-3">
                  Phone Number (Optional)
                </Text>
                <View className="bg-gray-900 rounded-xl px-4 py-4 flex-row items-center border border-gray-800">
                  <TextInput
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor="#666"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      if (error) setError('');
                    }}
                    className="flex-1 text-white"
                    style={{ fontFamily: 'Manrope_400Regular' }}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    editable={!loading}
                  />
                </View>
                <Text className="text-gray-500 text-xs mt-2">
                  Optional - used for account recovery
                </Text>
              </View>
            )}

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-white text-sm mb-3">
                Password *
              </Text>
              <View className={`bg-gray-900 rounded-xl px-4 py-4 flex-row items-center border ${
                error && !password ? 'border-red-500' : 'border-gray-800'
              }`}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError('');
                  }}
                  className="flex-1 text-white"
                  style={{ fontFamily: 'Manrope_400Regular' }}
                  secureTextEntry
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  editable={!loading}
                />
              </View>
              {isSignUp && (
                <Text className="text-gray-500 text-xs mt-2">
                  Password must be at least 6 characters long
                </Text>
              )}
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={16} color="#EF4444" />
                  <Text className="text-red-400 text-sm ml-2 flex-1">
                    {error}
                  </Text>
                </View>
                {error.includes('phone number is already registered') && (
                  <TouchableOpacity 
                    onPress={() => setIsSignUp(false)}
                    className="mt-2"
                  >
                    <Text className="text-blue-400 text-sm">
                      Click here to login instead
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              className="mb-4"
            >
              <LinearGradient
                colors={loading ? ['#6B7280', '#4B5563'] : ['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text 
                    className="text-white text-base"
                    style={{ fontFamily: 'Manrope_600SemiBold' }}
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Toggle Signup/Login */}
            <View className="flex-row justify-center items-center mb-6">
              <Text className="text-gray-500 text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity 
                onPress={handleToggleAuthMode}
                disabled={loading}
              >
                <Text 
                  className="text-blue-500 text-sm ml-2"
                  style={{ fontFamily: 'Manrope_600SemiBold' }}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Skip */}
            <TouchableOpacity
              onPress={() => {
                try {
                  router.back();
                } catch (error) {
                  // Fallback for iOS or when back doesn't work
                  router.replace('/(tabs)');
                }
              }}
              className="items-center"
              disabled={loading}
            >
              <Text 
                className="text-gray-600 text-sm"
                style={{ fontFamily: 'Manrope_400Regular' }}
              >
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}