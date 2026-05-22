import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../global.css";
import { initializeAchievements, initializeUser } from "../services/storage";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Initialize user data and achievements on app start
    const initialize = async () => {
      try {
        console.log('Starting initialization...');
        
        // Add timeout to prevent hanging
        const initPromise = Promise.all([
          initializeUser(),
          initializeAchievements()
        ]);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        );
        
        await Promise.race([initPromise, timeoutPromise]);
        console.log('Initialization complete');
      } catch (e) {
        console.warn('Initialization error:', e);
        // Continue anyway - don't block the app
      } finally {
        // Always hide splash screen
        if (fontsLoaded) {
          console.log('Hiding splash screen');
          await SplashScreen.hideAsync();
        }
      }
    };
    
    if (fontsLoaded) {
      initialize();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            presentation: "modal",
            animation: "slide_from_bottom"
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}