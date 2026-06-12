import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { Settings, Zap, ZapOff, Bell } from 'lucide-react-native';
import { useAlerts } from '../context/AlertsContext';
import { scale, verticalScale, responsiveFont } from '../utils/layout';

type FormMode = 'raw' | 'batch' | 'triplet';

interface CameraViewfinderOverlayProps {
  scanned: boolean;
  boxWidth: number;
  boxHeight: number;
  maskTopHeight: number;
  maskSideWidth: number;
  resizePanResponder: any;
  setManualVisible: (value: boolean) => void;
  torchMode: 'on' | 'off';
  toggleFlashlight: () => void;
  router: any;
}

export const CameraViewfinderOverlay: React.FC<CameraViewfinderOverlayProps> = ({
  scanned,
  boxWidth,
  boxHeight,
  maskTopHeight,
  maskSideWidth,
  resizePanResponder,
  setManualVisible,
  torchMode,
  toggleFlashlight,
  router,
}) => {
  if (scanned) {
    return null;
  }

  const { t } = useLanguage();
  const { unreadCount } = useAlerts();

  return (
    <View style={styles.absoluteFill} pointerEvents="box-none">
      <View style={[styles.maskBackground, { top: 0, left: 0, right: 0, height: maskTopHeight }]} />
      <View style={[styles.maskBackground, { bottom: 0, left: 0, right: 0, height: maskTopHeight }]} />
      <View style={[styles.maskBackground, { top: maskTopHeight, bottom: maskTopHeight, left: 0, width: maskSideWidth }]} />
      <View style={[styles.maskBackground, { top: maskTopHeight, bottom: maskTopHeight, right: 0, width: maskSideWidth }]} />

      <View style={[styles.viewfinder, { width: boxWidth, height: boxHeight, top: maskTopHeight, left: maskSideWidth }]} pointerEvents="box-none">
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <View style={styles.invisibleGrabTarget} {...resizePanResponder.panHandlers} />
      </View>

      <Text style={[styles.scanHint, { top: verticalScale(150), bottom: undefined }]}>{t('scanAlignHint')}</Text>
      <TouchableOpacity style={[styles.floatingSettingsBtn, styles.leftAlignedBtn]} onPress={() => router.push('/settings')}>
        <Settings size={scale(20)} color="#FFF" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.floatingSettingsBtn, styles.rightAlignedBtn]} onPress={() => router.push('/alerts')}>
        <Bell size={scale(20)} color="#FFF" />
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>{String(unreadCount)}</Text></View>
        )}
      </TouchableOpacity>
      <Text style={[styles.scanHint, { bottom: verticalScale(132), top: undefined }]}>{t('scanDragHint')}</Text>

      <View style={styles.controlActionBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={toggleFlashlight}>
          {torchMode === 'on' ? <Zap size={24} color="#10B981" /> : <ZapOff size={24} color="#FFF" />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.manualTextTriggerBtn} onPress={() => setManualVisible(true)}>
          <Text style={styles.manualTextTriggerLabel}>{t('enterBarcodeManually')}</Text>
        </TouchableOpacity>

        <View style={{ width: scale(50) }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  maskBackground: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  viewfinder: { position: 'absolute', minWidth: scale(150), minHeight: scale(120) },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: responsiveFont(12), fontWeight: '600', position: 'absolute', alignSelf: 'center', textAlign: 'center', letterSpacing: 0.3 },
  floatingSettingsBtn: {
    position: 'absolute',
    top: verticalScale(50),
    right: scale(20),
    width: scale(44),
    height: scale(44),
    backgroundColor: 'rgba(31,41,55,0.85)',
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 1000,
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: scale(24), height: scale(24), borderTopWidth: scale(3), borderLeftWidth: scale(3), borderColor: '#10B981' },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: scale(24), height: scale(24), borderTopWidth: scale(3), borderRightWidth: scale(3), borderColor: '#10B981' },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: scale(24), height: scale(24), borderBottomWidth: scale(3), borderLeftWidth: scale(3), borderColor: '#10B981' },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: scale(24), height: scale(24), borderBottomWidth: scale(3), borderRightWidth: scale(3), borderColor: '#10B981' },
  invisibleGrabTarget: { position: 'absolute', bottom: verticalScale(-20), right: verticalScale(-20), width: scale(50), height: scale(50), backgroundColor: 'transparent' },
  controlActionBar: { position: 'absolute', bottom: verticalScale(70), left: scale(20), right: scale(20), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { width: scale(50), height: scale(50), backgroundColor: 'rgba(31,41,55,0.85)', borderRadius: scale(25), justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  manualTextTriggerBtn: { flex: 1, height: verticalScale(50), backgroundColor: 'rgba(31,41,55,0.85)', marginLeft: scale(16), borderRadius: scale(25), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  manualTextTriggerLabel: { color: '#FFF', fontWeight: '600', fontSize: responsiveFont(14), textAlign: 'center' },
  leftAlignedBtn: { left: scale(20), right: undefined },
  rightAlignedBtn: { right: scale(20), left: undefined },
  unreadBadge: { position: 'absolute', top: -6, left: -6, backgroundColor: '#EF4444', minWidth: scale(20), height: scale(20), borderRadius: scale(10), justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(4) },
  unreadBadgeText: { color: '#FFF', fontSize: responsiveFont(11), fontWeight: '800' },
});
