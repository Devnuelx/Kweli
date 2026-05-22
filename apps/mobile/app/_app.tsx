import { Stack } from 'expo-router';

export default function Layout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

// Ensure paths are treated as relative to root
export const unstable_settings = {
  initialRouteName: 'index',
};