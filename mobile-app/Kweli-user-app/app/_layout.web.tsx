// import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
// import { Ionicons } from '@expo/vector-icons';
// import { Stack } from 'expo-router';
// import * as SplashScreen from 'expo-splash-screen';
// import { useEffect, useState } from 'react';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import '../global.css';
// import { initializeAchievements, initializeUser } from '../services/storage';

// // Keep the splash screen visible while we fetch resources
// SplashScreen.preventAutoHideAsync();

// export default function WebRootLayout() {
//   const [fontsLoaded] = useFonts({
//     Inter_400Regular,
//     Inter_500Medium,
//     Inter_600SemiBold,
//     Inter_700Bold,
//   });

//   useEffect(() => {
//     // Load icon fonts on web explicitly to ensure icons render correctly
//     const load = async () => {
//       try {
//         await Ionicons.loadFont();
//       } catch (e) {
//         // Non-fatal: continue even if icon font fails to load
//         console.warn('Ionicons font failed to load on web:', e);
//       }
//     };

//     load();
//   }, []);
//   // If fonts can't load (network/CSP issue on hosting), we should not block the entire app
//   // indefinitely. Add a small timeout fallback so the app proceeds even when Google fonts
//   // or icon fonts fail to load on the hosted environment.
//   const [fontFallbackReady, setFontFallbackReady] = useState(false);

//   useEffect(() => {
//     const t = setTimeout(() => setFontFallbackReady(true), 1500);
//     return () => clearTimeout(t);
//   }, []);

//   useEffect(() => {
//     // Initialize user data and achievements on app start once either fonts are loaded
//     // or the fallback timer has fired.
//     const initialize = async () => {
//       try {
//         const initPromise = Promise.all([
//           initializeUser(),
//           initializeAchievements(),
//         ]);

//         const timeoutPromise = new Promise((_, reject) =>
//           setTimeout(() => reject(new Error('Initialization timeout')), 5000)
//         );

//         await Promise.race([initPromise, timeoutPromise]);
//       } catch (e) {
//         console.warn('Initialization error:', e);
//       } finally {
//         // Hide the native splash screen once we're ready to render the app UI.
//         try {
//           await SplashScreen.hideAsync();
//         } catch (err) {
//           console.warn('Failed to hide splash screen:', err);
//         }
//       }
//     };

//     if (fontsLoaded || fontFallbackReady) {
//       initialize();
//     }
//   }, [fontsLoaded, fontFallbackReady]);

//   // Proceed to render once either fonts loaded or fallback timer elapsed
//   if (!fontsLoaded && !fontFallbackReady) {
//     return null;
//   }

//   return (
//     <GestureHandlerRootView style={{ flex: 1 }}>
//       <Stack screenOptions={{ headerShown: false }}>
//         <Stack.Screen name="index" options={{ headerShown: false }} />
//         <Stack.Screen
//           name="auth/login"
//           options={{
//             presentation: 'modal',
//             animation: 'slide_from_bottom',
//           }}
//         />
//       </Stack>
//     </GestureHandlerRootView>
//   );
// }



import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { initializeAchievements, initializeUser } from '../services/storage';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function WebRootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load web fonts via Google Fonts CDN
    if (typeof document !== 'undefined') {
      // Add Google Fonts link
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Add fallback font CSS
      const style = document.createElement('style');
      style.textContent = `
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
        }
        
        /* Ensure proper font rendering on web */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `;
      document.head.appendChild(style);

      console.log('✅ Web fonts loaded via CDN');
    }
  }, []);

  useEffect(() => {
    // Initialize user data and achievements
    const initialize = async () => {
      try {
        console.log('🔄 Initializing app data...');
        
        const initPromise = Promise.all([
          initializeUser(),
          initializeAchievements(),
        ]);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        );

        await Promise.race([initPromise, timeoutPromise]);
        
        console.log('✅ App initialization complete');
      } catch (e) {
        console.warn('⚠️ Initialization error:', e);
        // Continue anyway - don't block the app
      } finally {
        setIsReady(true);
        // Hide the splash screen
        try {
          await SplashScreen.hideAsync();
        } catch (err) {
          console.warn('Failed to hide splash screen:', err);
        }
      }
    };

    // Small delay to let fonts load
    const timer = setTimeout(() => {
      initialize();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show nothing while initializing
  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/login"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
