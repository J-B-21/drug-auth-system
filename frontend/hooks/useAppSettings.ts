import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Custom hook to access all app settings at once
 * Useful for components that need multiple settings
 */
export const useAppSettings = () => {
  const theme = useTheme();
  const language = useLanguage();
  const settings = useSettings();

  return {
    theme,
    language,
    settings,
  };
};

/**
 * Custom hook for triggering app feedback (sound + haptics)
 * Respects user preferences for both
 */
export const useFeedback = () => {
  const { playSuccessSound, triggerHapticFeedback } = useSettings();

  const feedback = async (hapticType?: any) => {
    await Promise.all([
      playSuccessSound(),
      triggerHapticFeedback(hapticType),
    ]);
  };

  return { feedback };
};

/**
 * Custom hook to check if dark mode is active
 * Useful for theme-dependent styling
 */
export const useDarkMode = () => {
  const { isDark } = useTheme();
  return isDark;
};

/**
 * Custom hook for translations
 * Simpler API when you only need the translation function
 */
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};
