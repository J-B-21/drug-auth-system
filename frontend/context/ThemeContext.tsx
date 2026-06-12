import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  isDark: boolean;
  isLoading: boolean; // Added flag
  palette: {
    background: string;
    card: string;
    text: string;
    subtitle: string;
    accent: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('app_theme');
        if (saved) {
          setThemeState(saved as ThemeType);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();

    const listener = ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      setSystemScheme(colorScheme);
    };

    const sub = Appearance.addChangeListener(listener);
    return () => sub.remove();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const isDark = theme === 'dark';

  // Resolve effective scheme when 'system' is selected
  const effectiveScheme = theme === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : theme;

  const palette =
    effectiveScheme === 'light'
      ? { background: '#FFFFFF', card: '#F3F4F6', text: '#0F172A', subtitle: '#6B7280', accent: '#10B981' }
      : { background: '#000000', card: '#111827', text: '#FFFFFF', subtitle: '#9CA3AF', accent: '#10B981' };

  // REMOVED: if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, isLoading, palette }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
