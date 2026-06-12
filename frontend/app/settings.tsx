import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, responsiveFont } from '../utils/layout';
import { ArrowLeft, Languages, Moon, ShieldCheck, Info, Sliders } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, setTheme } = useTheme();
  const { palette } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { soundEnabled, setSoundEnabled, hapticEnabled, setHapticEnabled, playSuccessSound, triggerHapticFeedback, telemetryEnabled, setTelemetryEnabled } = useSettings();

  const handleLanguageToggle = async () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    await setLanguage(newLang);
  };

  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    await setTheme(newTheme);
  };

  // FIX: Sound AND ONLY sound plays, ONLY when turning ON
  const handleSoundToggle = async () => {
    const nextState = !soundEnabled; 
    await setSoundEnabled(nextState);
    
    if (nextState) {
      await playSuccessSound();
    }
  };

  // FIX: Vibration AND ONLY vibration triggers, ONLY when turning ON
  const handleHapticToggle = async () => {
    const nextState = !hapticEnabled; 
    await setHapticEnabled(nextState);
    
    if (nextState) {
      await triggerHapticFeedback();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: palette.background }]}>
      
      {/* 1. COMPACT FIXED HEADER BAR */}
        <View style={[styles.header, { backgroundColor: palette.card }] }>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={scale(20)} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>{t('applicationSettings')}</Text>
        {/* Layout balancer */}
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView style={styles.scrollCanvas} showsVerticalScrollIndicator={false}>
        
        {/* 2. CORE PREFERENCES SECTION */}
        <Text style={styles.sectionHeader}>{t('preferences')}</Text>
        
        <View style={[styles.cardContainer, { backgroundColor: palette.card, borderColor: palette.subtitle }] }>
          {/* LANGUAGE TOGGLE ROW */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Languages size={scale(18)} color="#10B981" />
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>{t('localization')}</Text>
                <Text style={[styles.rowSubtitle, { color: palette.subtitle }]}> {language === 'en' ? t('englishActive') : t('frenchActive')}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.togglePillBtn} 
              onPress={handleLanguageToggle}
            >
              <Text style={styles.togglePillText}>{language.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {/* THEME SELECTOR CONTAINER BLOCK */}
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#374151', marginTop: verticalScale(12), paddingTop: verticalScale(12) }]}>
            <View style={styles.rowLeft}>
              <Moon size={scale(18)} color="#10B981" />
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>{t('displayTheme')}</Text>
                <Text style={[styles.rowSubtitle, { color: palette.subtitle }]}>{t('chooseAppearance')}</Text>
              </View>
            </View>
          </View>
          
          <View style={[styles.themeSelectorRow, { backgroundColor: palette.background }] }>
            {(['system', 'light', 'dark'] as const).map((t_name) => (
              <TouchableOpacity
                key={t_name}
                style={[styles.themeBtn, theme === t_name && styles.themeBtnActive]}
                onPress={() => handleThemeChange(t_name)}
              >
                <Text style={[styles.themeBtnText, theme === t_name && styles.themeBtnTextActive, { color: theme === t_name ? '#FFF' : palette.subtitle }]}>
                  {t(t_name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. HARDWARE CUES GRANULAR CONFIGURATION OVERRIDES */}
        <Text style={[styles.sectionHeader, { color: palette.subtitle }]}>{t('hardwareFeedbackCues')}</Text>
        <View style={styles.cardContainer}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Sliders size={scale(18)} color="#10B981" />
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>{t('successChimeSound')}</Text>
                <Text style={[styles.rowSubtitle, { color: palette.subtitle }]}>{t('playAudioAlerts')}</Text>
              </View>
            </View>
            <Switch 
              value={soundEnabled} 
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: '#374151', marginTop: verticalScale(12), paddingTop: verticalScale(12) }]}>
            <View style={styles.rowLeft}>
              <Sliders size={scale(18)} color="#10B981" />
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>{t('physicalHapticMotor')}</Text>
                <Text style={[styles.rowSubtitle, { color: palette.subtitle }]}>{t('triggerVibration')}</Text>
              </View>
            </View>
            <Switch 
              value={hapticEnabled} 
              onValueChange={handleHapticToggle}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: palette.subtitle, marginTop: verticalScale(12), paddingTop: verticalScale(12) }]}>
            <View style={styles.rowLeft}>
              <ShieldCheck size={scale(18)} color="#10B981" />
              <View style={styles.textStack}>
                <Text style={[styles.rowLabel, { color: palette.text }]}>{t('telemetryInSettings')}</Text>
                <Text style={[styles.rowSubtitle, { color: palette.subtitle }]}>{t('telemetryInSettingsSubtitle')}</Text>
              </View>
            </View>
            <Switch
              value={telemetryEnabled === true}
              onValueChange={async (val) => await setTelemetryEnabled(val)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* 4. LEGAL SECURITY SECURITY DISCLAIMER CARD */}
        <Text style={styles.sectionHeader}>{t('legalDisclaimer')}</Text>
        <View style={styles.cardContainer}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <ShieldCheck size={scale(18)} color="#F59E0B" />
            <Text style={styles.disclaimerTitle}>{t('verificationNotice')}</Text>
          </View>
          <Text style={styles.disclaimerText}>
            {t('disclaimerText')}
          </Text>
        </View>

        {/* 6. APP METADATA SYSTEM DIAGNOSTICS FOOTER */}
        <View style={styles.footerContainer}>
          <Info size={scale(14)} color="#4B5563" />
          <Text style={styles.footerText}>{t('version')}</Text>
        </View>
        
        <View style={{ height: verticalScale(40) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: verticalScale(56), paddingHorizontal: scale(16), borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  backBtn: { width: scale(40), height: scale(40), justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: scale(20) },
  headerTitle: { color: '#FFF', fontSize: responsiveFont(18), fontWeight: '700' },
  scrollCanvas: { flex: 1, paddingHorizontal: scale(16) },
  sectionHeader: { color: '#9CA3AF', fontSize: responsiveFont(12), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: verticalScale(20), marginBottom: verticalScale(8), paddingLeft: scale(4) },
  cardContainer: { backgroundColor: '#1F2937', borderRadius: scale(14), padding: scale(16), borderWidth: 1, borderColor: '#2D3748', marginBottom: verticalScale(4) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  textStack: { flex: 1 },
  rowLabel: { color: '#FFF', fontSize: responsiveFont(14), fontWeight: '600' },
  rowSubtitle: { color: '#9CA3AF', fontSize: responsiveFont(11), fontWeight: '500', marginTop: 2 },
  togglePillBtn: { backgroundColor: '#10B981', paddingHorizontal: scale(14), paddingVertical: verticalScale(6), borderRadius: scale(20) },
  togglePillText: { color: '#FFF', fontSize: responsiveFont(12), fontWeight: '700' },
  themeSelectorRow: { flexDirection: 'row', gap: 8, marginTop: verticalScale(14), backgroundColor: '#111827', padding: scale(4), borderRadius: scale(10) },
  themeBtn: { flex: 1, height: verticalScale(36), justifyContent: 'center', alignItems: 'center', borderRadius: scale(8) },
  themeBtnActive: { backgroundColor: '#10B981' },
  themeBtnText: { color: '#6B7280', fontSize: responsiveFont(11), fontWeight: '700' },
  themeBtnTextActive: { color: '#FFF' },
  disclaimerTitle: { color: '#F59E0B', fontSize: responsiveFont(14), fontWeight: '700' },
  disclaimerText: { color: '#9CA3AF', fontSize: responsiveFont(12), lineHeight: 18 },
  footerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: verticalScale(30), opacity: 0.5 },
  footerText: { color: '#4B5563', fontSize: responsiveFont(11), fontWeight: '600' }
});
