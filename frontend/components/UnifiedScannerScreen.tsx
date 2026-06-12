import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Animated, Platform, Keyboard, PanResponder, Dimensions, TextInput, Modal, TouchableOpacity } from 'react-native';
import { Camera as NativeCamera, CameraType } from 'react-native-camera-kit';
import { useRouter } from 'expo-router';
import { scale, verticalScale, responsiveFont } from '../utils/layout';
import { useCameraPermissions } from '../hooks/useCameraPermissions';
import { useVerificationRequest, VerificationPayload } from '../hooks/useVerificationRequest';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CameraErrorBanner } from './CameraErrorBanner';
import { CameraViewfinderOverlay } from './CameraViewfinderOverlay';
import { ManualVerificationSheet } from './ManualVerificationSheet';
import { useAlerts } from '../context/AlertsContext';

type FormMode = 'raw' | 'batch' | 'triplet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Camera = React.forwardRef((props: any, ref) => {
  const unfrozenProps = { ...props };
  ['zoom', 'maxZoom', 'scanThrottleDelay', 'faceDetectionThrottleMs', 'allowedBarcodeTypes'].forEach(key => {
    Object.defineProperty(unfrozenProps, key, {
      value: props[key],
      writable: true,
      configurable: true,
      enumerable: true,
    });
  });

  return <NativeCamera ref={ref} {...unfrozenProps} />;
});
Camera.displayName = 'React19CameraKitBypass';

export default function UnifiedScannerScreen() {
  const hasPermission = useCameraPermissions();
  const { executeVerificationRequest } = useVerificationRequest();
  const { telemetryEnabled, setTelemetryEnabled } = useSettings();
  const { t } = useLanguage();
  const { palette } = useTheme();

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchMode, setTorchMode] = useState<'on' | 'off'>('off');
  const [manualVisible, setManualVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('raw');
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const rawInputRef = useRef<TextInput>(null);
  const serialInputRef = useRef<TextInput>(null);
  const batchInputRef = useRef<TextInput>(null);
  const [lastActiveTripletField, setLastActiveTripletField] = useState<'gtin' | 'serial' | 'batch'>('gtin');
  const [code, setCode] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [gtin, setGtin] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [boxWidth, setBoxWidth] = useState(scale(240));
  const [boxHeight, setBoxHeight] = useState(scale(240));

  const [keyboardHeightAnim] = useState(() => new Animated.Value(0));
  const [cameraToastAnim] = useState(() => new Animated.Value(-100));

  const router = useRouter();
  const { addAlert } = useAlerts();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e: any) => {
      Animated.timing(keyboardHeightAnim, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    };

    const onKeyboardHide = (e: any) => {
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration : 200,
        useNativeDriver: false,
      }).start();
    };

    const showSubscription = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardHeightAnim]);

  useEffect(() => {
    if (manualVisible) {
      const timer = setTimeout(() => {
        if (formMode === 'raw' || formMode === 'batch') {
          rawInputRef.current?.focus();
        } else if (formMode === 'triplet') {
          if (lastActiveTripletField === 'gtin') rawInputRef.current?.focus();
          else if (lastActiveTripletField === 'serial') serialInputRef.current?.focus();
          else if (lastActiveTripletField === 'batch') batchInputRef.current?.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [manualVisible, formMode, lastActiveTripletField]);

  useEffect(() => {
    if (scanned && !loading) {
      const timer = setTimeout(() => setScanned(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [scanned, loading]);

  useEffect(() => {
    if (cameraError) {
      Animated.timing(cameraToastAnim, {
        toValue: 50,
        duration: 350,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(cameraToastAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setCameraError(null));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [cameraError, cameraToastAnim]);

  useEffect(() => {
    if (formErrors.length > 0) {
      const timer = setTimeout(() => {
        setFormErrors([]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [formErrors]);

  const resizePanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const nextWidth = boxWidth + gestureState.dx;
      const nextHeight = boxHeight + gestureState.dy;
      const clampedWidth = Math.max(150, Math.min(320, nextWidth));
      const clampedHeight = Math.max(120, Math.min(320, nextHeight));
      setBoxWidth(clampedWidth);
      setBoxHeight(clampedHeight);
    },
    onPanResponderRelease: () => {},
  });

  const toggleFlashlight = () => setTorchMode(prev => (prev === 'off' ? 'on' : 'off'));

  const buildTelemetryPayload = (scanMedium: string | null, entrySource: 'camera' | 'manual') => {
    return {
      platform: Platform.OS,
      entry_source: entrySource,
      scan_medium: scanMedium,
      timestamp: new Date().toISOString(),
    };
  };

  const navigateToResult = (result: any) => {
    Keyboard.dismiss();
    setManualVisible(false);
    // If backend marks suspicious, create a local alert and notify previous scanners via local notification
    if (result && result.suspicious) {
      const title = 'Security Alert: Suspicious Scan';
      const body = result.security_flags && result.security_flags.length > 0 ? `Flags: ${result.security_flags.join(', ')}` : 'This code has been flagged as suspicious.';
      addAlert({ code: result.code || result.serial_number || 'unknown', title, body, payload: result });
    }
    router.push({
      pathname: '/modal',
      params: {
        ...result,
        active_ingredients: result.active_ingredients ? JSON.stringify(result.active_ingredients) : '[]',
        valid: String(result.valid),
        expired: String(result.expired || false),
        suspicious: String(Boolean(result.suspicious)),
        security_flags: result.security_flags ? JSON.stringify(result.security_flags) : '[]',
      },
    });
  };

  const handleBarcodeScanned = async (event: any) => {
    if (scanned || loading || manualVisible) return;

    const data = event?.nativeEvent?.codeStringValue || event?.nativeEvent?.codeString;
    const type = (event?.nativeEvent?.codeType || '').toLowerCase();

    if (!data) return;

    setScanned(true);
    setLoading(true);
    const scanMedium = type.includes('qr') || type.includes('matrix') ? 'QR' : 'Bar';

    const payload: VerificationPayload = {
      code: data,
      scan_medium: scanMedium,
      ...(telemetryEnabled ? { client_telemetry: buildTelemetryPayload(scanMedium, 'camera') } : {}),
    };

    const result = await executeVerificationRequest(payload);
    if (result.ok) {
      navigateToResult(result.result);
    } else {
      setCameraError(result.error || t('verificationRejected'));
      setLoading(false);
    }
  };

  const handleManualVerify = async () => {
    setLoading(true);
    setFormErrors([]);

    const payload: VerificationPayload =
      formMode === 'raw'
        ? { code }
        : formMode === 'batch'
        ? { batch_number: batchNumber }
        : { gtin, serial_number: serialNumber, batch_number: batchNumber };

    if (telemetryEnabled) {
      payload.client_telemetry = buildTelemetryPayload(null, 'manual');
    }

    const result = await executeVerificationRequest(payload);

    if (result.ok) {
      navigateToResult(result.result);
    } else {
      const errorMsg = result.error || t('verificationRejected');
      if (manualVisible) {
        setFormErrors(result.details ?? [{ field: '', message: errorMsg }]);
      } else {
        setCameraError(errorMsg);
      }
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('noCameraAccessPrivileges')}</Text>
      </View>
    );
  }

  const maskTopHeight = (SCREEN_HEIGHT - boxHeight) / 2;
  const maskSideWidth = (SCREEN_WIDTH - boxWidth) / 2;

  return (
    <View style={[styles.container, { backgroundColor: palette.background }] }>
      <CameraErrorBanner cameraError={cameraError} cameraToastAnim={cameraToastAnim} />

      <Modal visible={telemetryEnabled === null} animationType="fade" transparent>
        <View style={styles.consentOverlay}>
          <View style={styles.consentCard}>
            <Text style={styles.consentTitle}>{t('telemetryConsentTitle')}</Text>
            <Text style={styles.consentDescription}>{t('telemetryConsentDescription')}</Text>
            <View style={styles.consentActionRow}>
              <TouchableOpacity
                style={[styles.consentButton, styles.consentDeclineButton]}
                onPress={() => setTelemetryEnabled(false)}
              >
                <Text style={styles.consentButtonText}>{t('decline')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.consentButton, styles.consentAcceptButton]}
                onPress={() => setTelemetryEnabled(true)}
              >
                <Text style={styles.consentButtonText}>{t('accept')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!scanned && (
        <Camera
          style={StyleSheet.absoluteFill}
          cameraType={CameraType.Back}
          torchMode={torchMode}
          scanBarcode={true}
          showFrame={true}
          frameColor="transparent"
          laserColor="transparent"
          barcodeFrameSize={{ width: boxWidth, height: boxHeight }}
          onReadCode={handleBarcodeScanned}
          allowedBarcodeTypes={['qr', 'data-matrix', 'ean-13', 'code-128', 'itf', 'code-39', 'upc-a']}
        />
      )}

      <CameraViewfinderOverlay
        scanned={scanned}
        boxWidth={boxWidth}
        boxHeight={boxHeight}
        maskTopHeight={maskTopHeight}
        maskSideWidth={maskSideWidth}
        resizePanResponder={resizePanResponder}
        setManualVisible={setManualVisible}
        torchMode={torchMode}
        toggleFlashlight={toggleFlashlight}
        router={router}
      />

      <ManualVerificationSheet
        manualVisible={manualVisible}
        setManualVisible={setManualVisible}
        loading={loading}
        formMode={formMode}
        setFormMode={setFormMode}
        code={code}
        setCode={setCode}
        batchNumber={batchNumber}
        setBatchNumber={setBatchNumber}
        gtin={gtin}
        setGtin={setGtin}
        serialNumber={serialNumber}
        setSerialNumber={setSerialNumber}
        lastActiveTripletField={lastActiveTripletField}
        setLastActiveTripletField={setLastActiveTripletField}
        formErrors={formErrors}
        onSubmit={handleManualVerify}
        keyboardHeightAnim={keyboardHeightAnim}
        rawInputRef={rawInputRef}
        serialInputRef={serialInputRef}
        batchInputRef={batchInputRef}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  consentOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  consentCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: scale(18),
    padding: scale(20),
    borderWidth: 1,
    borderColor: '#374151',
  },
  consentTitle: {
    color: '#FFF',
    fontSize: responsiveFont(18),
    fontWeight: '800',
    marginBottom: verticalScale(10),
  },
  consentDescription: {
    color: '#D1D5DB',
    fontSize: responsiveFont(14),
    lineHeight: 20,
    marginBottom: verticalScale(18),
  },
  consentActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(10),
  },
  consentButton: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  consentAcceptButton: {
    backgroundColor: '#10B981',
  },
  consentDeclineButton: {
    backgroundColor: '#374151',
  },
  consentButtonText: {
    color: '#FFF',
    fontSize: responsiveFont(13),
    fontWeight: '700',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  errorText: { color: '#EF4444', fontSize: responsiveFont(16), fontWeight: '600' },
});
