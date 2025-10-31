import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { AppRegistry } from 'react-native';

export default function Layout() {
  useEffect(() => {
    AppRegistry.registerComponent('main', () => Layout);
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

// Extend base app settings with web-specific config
export const unstable_settings = {
  initialRouteName: 'index',
  initialRouteConfig: {
    web: {
      baseHref: '/',
    },
  },
};