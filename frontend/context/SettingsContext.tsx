import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, createAudioPlayer } from 'expo-audio'; // Removed AudioPlayer from state
import * as Haptics from 'expo-haptics';

interface SettingsContextType {
  isLoading: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => Promise<void>;
  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => Promise<void>;
  telemetryEnabled: boolean | null;
  setTelemetryEnabled: (enabled: boolean) => Promise<void>;
  playSuccessSound: () => Promise<void>;
  triggerHapticFeedback: (type?: Haptics.NotificationFeedbackType) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Reference the local asset resource statically
const successSoundSource = require('../assets/sounds/authentic.mp3');

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticEnabled, setHapticEnabledState] = useState(true);
  const [telemetryEnabled, setTelemetryEnabledState] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings and initialize the audio player session routing
  useEffect(() => {
    const initializeSettingsAndAudio = async () => {
      try {
        const savedSound = await AsyncStorage.getItem('app_sound_enabled');
        const savedHaptic = await AsyncStorage.getItem('app_haptic_enabled');
        const savedTelemetry = await AsyncStorage.getItem('app_telemetry_enabled');

        if (savedSound !== null) setSoundEnabledState(savedSound === 'true');
        if (savedHaptic !== null) setHapticEnabledState(savedHaptic === 'true');
        if (savedTelemetry !== null) setTelemetryEnabledState(savedTelemetry === 'true');

        // Configure global audio session routing rules once
        await setAudioModeAsync({
          playsInSilentMode: true,
          interruptionMode: 'mixWithOthers', 
        });

      } catch (error) {
        console.warn('Failed to initialize settings or audio mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSettingsAndAudio();
  }, []);

  const setSoundEnabled = async (enabled: boolean) => {
    try {
      setSoundEnabledState(enabled);
      await AsyncStorage.setItem('app_sound_enabled', String(enabled));
    } catch (error) {
      console.warn('Failed to save sound preference:', error);
    }
  };

  const setHapticEnabled = async (enabled: boolean) => {
    try {
      setHapticEnabledState(enabled);
      await AsyncStorage.setItem('app_haptic_enabled', String(enabled));
    } catch (error) {
      console.warn('Failed to save haptic preference:', error);
    }
  };

  const setTelemetryEnabled = async (enabled: boolean) => {
    try {
      setTelemetryEnabledState(enabled);
      await AsyncStorage.setItem('app_telemetry_enabled', String(enabled));
    } catch (error) {
      console.warn('Failed to save telemetry preference:', error);
    }
  };

  // FIX: Create a clean instance, play it, then let it auto-release 
  const playSuccessSound = async () => {
    if (!soundEnabled) return;

    try {
      // Create a fresh, unreleased player object reference every time sound is triggered
      const nativePlayer = createAudioPlayer(successSoundSource);
      nativePlayer.play();
      
      // Auto-cleanup native memory after the chime completes to prevent leaks
      setTimeout(() => {
        try {
          nativePlayer.release();
        } catch (e) {
          // Guard against rapid multi-clicks
        }
      }, 2000); // Adjust this delay to match the actual duration of authentic.mp3

    } catch (error) {
      console.warn('Failed to execute sound playback:', error);
      // CRITICAL: Extracted the old triggerHapticFeedback fallback loop out completely!
    }
  };

  const triggerHapticFeedback = async (
    type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success
  ) => {
    if (!hapticEnabled) return;

    try {
      await Haptics.notificationAsync(type);
    } catch (error) {
      console.warn('Failed to trigger haptic:', error);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        isLoading,
        soundEnabled,
        setSoundEnabled,
        hapticEnabled,
        setHapticEnabled,
        telemetryEnabled,
        setTelemetryEnabled,
        playSuccessSound,
        triggerHapticFeedback,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
