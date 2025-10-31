import { Redirect } from 'expo-router';
import React from 'react';

// Web entrypoint — static export needs an index page. Redirect to the app tabs route.
export default function IndexWeb() {
  return <Redirect href="/(tabs)" />;
}
