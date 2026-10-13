import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';
import { coolBox } from './src/services';
import { Navigator } from './src/navigation/Navigator';

export default function App() {
  // The service is the single source of device state; start/stop its simulation with the app.
  useEffect(() => {
    coolBox.start();
    return () => coolBox.stop();
  }, []);

  return (
    <SafeAreaProvider>
      {/* The door/camera sequence is the product experience: keep it even if the OS has Reduce Motion on. */}
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <StatusBar style="dark" />
      <Navigator />
    </SafeAreaProvider>
  );
}
