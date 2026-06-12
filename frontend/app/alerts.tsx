import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, verticalScale, responsiveFont } from '../utils/layout';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAlerts } from '../context/AlertsContext';

export default function AlertsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { alerts, markRead, removeAlert } = useAlerts();

  const handleLongPress = (id: string) => {
    Alert.alert(t('deleteAlert'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => removeAlert(id) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: palette.background }]}>
      <View style={[styles.header, { backgroundColor: palette.card }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={scale(20)} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: palette.text }]}>{t('alerts')}</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <ScrollView style={styles.scrollCanvas} showsVerticalScrollIndicator={false}>
        {alerts.length === 0 && (
          <View style={styles.emptyState}><Text style={{ color: palette.subtitle }}>{t('noAlerts')}</Text></View>
        )}

        {alerts.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={[styles.card, { backgroundColor: a.read ? palette.card : '#3F1A1A', borderColor: a.read ? palette.subtitle : '#EF4444' }]}
            onPress={() => { markRead(a.id); router.push({ pathname: '/modal', params: { ...a.payload, suspicious: 'true' } }); }}
            onLongPress={() => handleLongPress(a.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: '#FFF' }]} numberOfLines={1}>{a.title}</Text>
              <Text style={[styles.cardSubtitle, { color: '#FDECEA' }]} numberOfLines={2}>{a.body}</Text>
            </View>
            <TouchableOpacity onPress={() => handleLongPress(a.id)} style={styles.deleteBtn}>
              <Trash2 size={18} color="#FCA5A5" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

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
  scrollCanvas: { flex: 1, paddingHorizontal: scale(16), paddingTop: verticalScale(12) },
  emptyState: { padding: verticalScale(40), alignItems: 'center' },
  card: { flexDirection: 'row', gap: 12, padding: scale(12), borderRadius: scale(12), marginBottom: verticalScale(10), borderWidth: 1, alignItems: 'center' },
  cardTitle: { fontSize: responsiveFont(14), fontWeight: '800' },
  cardSubtitle: { fontSize: responsiveFont(12), marginTop: verticalScale(6) },
  deleteBtn: { padding: scale(8) },
});
