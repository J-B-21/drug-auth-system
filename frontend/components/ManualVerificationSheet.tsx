import React from 'react';
import { Animated, StyleSheet, Text, View, ScrollView, TouchableOpacity, TouchableWithoutFeedback, TextInput, Keyboard, ActivityIndicator, Dimensions } from 'react-native';
import { ShieldAlert, X, KeyRound, Hash, QrCode } from 'lucide-react-native';
import { scale, verticalScale, responsiveFont } from '../utils/layout';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

type FormMode = 'raw' | 'batch' | 'triplet';

interface ManualVerificationSheetProps {
  manualVisible: boolean;
  setManualVisible: (value: boolean) => void;
  loading: boolean;
  formMode: FormMode;
  setFormMode: (mode: FormMode) => void;
  code: string;
  setCode: (value: string) => void;
  batchNumber: string;
  setBatchNumber: (value: string) => void;
  gtin: string;
  setGtin: (value: string) => void;
  serialNumber: string;
  setSerialNumber: (value: string) => void;
  lastActiveTripletField: 'gtin' | 'serial' | 'batch';
  setLastActiveTripletField: (value: 'gtin' | 'serial' | 'batch') => void;
  formErrors: any[];
  onSubmit: () => void;
  keyboardHeightAnim: Animated.Value;
  rawInputRef: React.RefObject<TextInput>;
  serialInputRef: React.RefObject<TextInput>;
  batchInputRef: React.RefObject<TextInput>;
}

export const ManualVerificationSheet: React.FC<ManualVerificationSheetProps> = ({
  manualVisible,
  setManualVisible,
  loading,
  formMode,
  setFormMode,
  code,
  setCode,
  batchNumber,
  setBatchNumber,
  gtin,
  setGtin,
  serialNumber,
  setSerialNumber,
  lastActiveTripletField,
  setLastActiveTripletField,
  formErrors,
  onSubmit,
  keyboardHeightAnim,
  rawInputRef,
  serialInputRef,
  batchInputRef,
}) => {
  if (!manualVisible) {
    return null;
  }

  const { t } = useLanguage();
  const { palette } = useTheme();

  return (
    <>
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setManualVisible(false);
        }}
      >
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.keyboardContainer, { paddingBottom: keyboardHeightAnim }]}> 
        <View style={[styles.slidingSheet, { backgroundColor: palette.card }] }>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('manualIdentification')}</Text>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                setManualVisible(false);
              }}
              style={styles.closeBtn}
            >
              <X size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.segmentRow}>
              <TouchableOpacity style={[styles.seg, formMode === 'raw' && styles.segAct]} onPress={() => setFormMode('raw')}>
                <KeyRound size={scale(14)} color={formMode === 'raw' ? '#FFF' : '#9CA3AF'} />
                <Text style={[styles.segText, formMode === 'raw' && styles.segTextAct]}>{t('rawCode')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.seg, formMode === 'batch' && styles.segAct]} onPress={() => setFormMode('batch')}>
                <Hash size={scale(14)} color={formMode === 'batch' ? '#FFF' : '#9CA3AF'} />
                <Text style={[styles.segText, formMode === 'batch' && styles.segTextAct]}>{t('batch')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.seg, formMode === 'triplet' && styles.segAct]} onPress={() => setFormMode('triplet')}>
                <QrCode size={scale(14)} color={formMode === 'triplet' ? '#FFF' : '#9CA3AF'} />
                <Text style={[styles.segText, formMode === 'triplet' && styles.segTextAct]}>{t('qrTriplet')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {formMode === 'raw' && t('scannedTypedPlainCode')}
                  {formMode === 'batch' && t('drugBatchIdentifier')}
                  {formMode === 'triplet' && t('gtinCodeProduct')}
                </Text>
                <TextInput
                  ref={rawInputRef}
                  style={styles.input}
                  placeholder={
                    formMode === 'raw'
                      ? t('typePlainString')
                      : formMode === 'batch'
                      ? t('typeBatchID')
                      : t('gtinProductCode')
                  }
                  placeholderTextColor="#6B7280"
                  value={formMode === 'raw' ? code : formMode === 'batch' ? batchNumber : gtin}
                  onChangeText={text => {
                    if (formMode === 'raw') setCode(text);
                    else if (formMode === 'batch') setBatchNumber(text);
                    else setGtin(text);
                  }}
                  onFocus={() => {
                    if (formMode === 'triplet') setLastActiveTripletField('gtin');
                  }}
                  autoCapitalize={formMode === 'batch' ? 'characters' : 'none'}
                  autoCorrect={false}
                  keyboardType={formMode === 'triplet' ? 'numeric' : 'default'}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    opacity: formMode === 'triplet' ? 1 : 0,
                    height: formMode === 'triplet' ? 'auto' : 0,
                    marginTop: formMode === 'triplet' ? 14 : 0,
                    overflow: 'hidden',
                  },
                ]}
                pointerEvents={formMode === 'triplet' ? 'auto' : 'none'}
              >
                <Text style={styles.inputLabel}>{t('serialNumberLabel')}</Text>
                <TextInput
                  ref={serialInputRef}
                  style={styles.input}
                  placeholder="Serial Number (Item Code)"
                  placeholderTextColor="#6B7280"
                  value={serialNumber}
                  onChangeText={setSerialNumber}
                  onFocus={() => setLastActiveTripletField('serial')}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View
                style={[
                  styles.inputGroup,
                  {
                    opacity: formMode === 'triplet' ? 1 : 0,
                    height: formMode === 'triplet' ? 'auto' : 0,
                    marginTop: formMode === 'triplet' ? 14 : 0,
                    overflow: 'hidden',
                  },
                ]}
                pointerEvents={formMode === 'triplet' ? 'auto' : 'none'}
              >
                <Text style={styles.inputLabel}>{t('batchNumberLabel')}</Text>
                <TextInput
                  ref={batchInputRef}
                  style={styles.input}
                  placeholder="Batch Number"
                  placeholderTextColor="#6B7280"
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                  onFocus={() => setLastActiveTripletField('batch')}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              {formErrors.length > 0 && (
                <View style={[styles.errorBox, { marginTop: verticalScale(14) }]}> 
                  <ShieldAlert size={16} color="#EF4444" />
                  <Text style={styles.errorBoxText}>{formErrors[0]?.message || t('invalidVerificationRequest')}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={onSubmit} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.submitBtnText}>{t('verifyParameters')}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  slidingSheet: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    padding: scale(24),
    paddingBottom: verticalScale(50),
    maxHeight: Dimensions.get('window').height * 0.7,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 20,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: verticalScale(20) },
  sheetTitle: { color: '#FFF', fontSize: responsiveFont(18), fontWeight: '700' },
  closeBtn: { padding: scale(4) },
  sheetScroll: { marginBottom: scale(10) },
  segmentRow: { flexDirection: 'row', backgroundColor: '#111827', padding: scale(4), borderRadius: scale(10), marginBottom: verticalScale(16) },
  seg: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: verticalScale(8), borderRadius: scale(8) },
  segAct: { backgroundColor: '#10B981' },
  segText: { color: '#9CA3AF', fontSize: responsiveFont(12), fontWeight: '600' },
  segTextAct: { color: '#FFF' },
  cardForm: { marginBottom: scale(20) },
  inputGroup: { gap: scale(6) },
  inputLabel: { color: '#9CA3AF', fontSize: responsiveFont(13), fontWeight: '600', paddingLeft: scale(2) },
  input: { backgroundColor: '#111827', height: verticalScale(48), borderRadius: scale(10), borderWidth: 1, borderColor: '#374151', paddingHorizontal: scale(14), color: '#FFF' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: scale(8), backgroundColor: 'rgba(239,68,68,0.08)', padding: scale(12), borderRadius: scale(8) },
  errorBoxText: { color: '#FCA5A5', fontSize: responsiveFont(13), fontWeight: '500', flex: 1 },
  submitBtn: { backgroundColor: '#10B981', height: verticalScale(50), borderRadius: scale(12), justifyContent: 'center', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5, backgroundColor: '#374151' },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: responsiveFont(15) },
});
