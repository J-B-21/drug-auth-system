import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { SettingsProvider, useSettings } from '../context/SettingsContext';
import { AlertsProvider } from '../context/AlertsContext';

// Freeze the initial native application launch view
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isLoading: themeLoading } = useTheme();
  const { isLoading: languageLoading } = useLanguage();
  const { isLoading: settingsLoading } = useSettings();

  useEffect(() => {
    // Only dismiss the launcher splash screen when ALL contexts have resolved
    const appIsReady = !themeLoading && !languageLoading && !settingsLoading;
    
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [themeLoading, languageLoading, settingsLoading]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={{ flex: 1, backgroundColor: useTheme().palette.background }}>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Verification Result',
            headerStyle: { backgroundColor: '#1F2937' },
            headerTitleStyle: { color: '#FFF', fontWeight: '700' },
            headerTintColor: '#10B981'
          }} 
        />
      </Stack>
      </View>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SettingsProvider>
          <AlertsProvider>
            <RootLayoutContent />
          </AlertsProvider>
        </SettingsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
