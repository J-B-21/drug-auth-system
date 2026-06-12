import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio'; // 🌟 MODERN AUDIO ENGINE HOOK
import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { scale, verticalScale, responsiveFont } from '../utils/layout';
import { CheckCircle2, AlertTriangle, XCircle, Calendar, Milestone, PackageCheck, Layers, ExternalLink, Columns4, FileText, ShieldAlert, Mail } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

interface ActiveIngredient {
  name: string;
  dosage_per_unit: string;
}

export default function VerificationModalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 🌟 PARAMETER EXTRACTION ENGINE
  const isValid = params.valid === 'true';
  const isExpired = params.expired === 'true';

  // 🌟 INITIALIZE AUDIO PLAYER DIRECTLY AT TOP LEVEL
  // The hook handles memory footprint, instantiation, and automatic unloading natively.
  const player = useAudioPlayer(require('../assets/sounds/authentic.mp3'));

  const { soundEnabled, hapticEnabled } = useSettings();

  useEffect(() => {
    if (isValid && !isExpired) {
      // 🟢 1. PERFECT MEDICATION MATCH: Play/vibrate only if enabled
      if (soundEnabled) player?.play();
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (isValid && isExpired) {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [isValid, isExpired, player, soundEnabled, hapticEnabled]);

  // Cleanly deserialize the active_ingredients array payload
  let activeIngredients: ActiveIngredient[] = [];
  try {
    if (params.active_ingredients) {
      activeIngredients = JSON.parse(params.active_ingredients as string);
    }
  } catch (e) {
    activeIngredients = [];
  }


  // Exact repository maps & service layer overrides
  const brandName = (params.brand as string) || 'Unknown Product';
  const manufacturerName = (params.manufacturer as string) || 'Unknown Manufacturer';
  const manufacturerWebsite = (params.manufacturer_website as string) || null;
  const batchNumber = (params.batch_number as string) || 'N/A';
  const expirationDate = (params.expiry_date as string) || 'N/A';
  const leafletUrl = (params.leaflet_url as string) || null;
  
  // 🌟 FIXED: Natively falls back to 'code' or manual input entries if backend omits it
  const serialNumber = (params.serial_number as string) || (params.code as string) || (params.code_value as string) || 'N/A';
  
  // Captures the structural verification scope depth
  const verificationLevel = (params.verification_level as string) || 'product';

  // Dosage form metrics from the product table
  const drugForm = (params.form as string) || null;
  const drugQuantity = (params.quantity as string) || null;
  const dosageUnit = (params.dosage_unit as string) || null;

  // 🌟 STRATEGIC ENTRY CHANNEL CHECKERS
  const isQrCodeSource = params.verification_source === 'qr_code';
  const isBatchSource = params.verification_source === 'batch_number';
  
  // Capture the raw text code input value passed from the scanner screen
  const scannedRawCode = (params.code as string) || (params.code_value as string) || null;
  const suspicious = (params.suspicious as string) === 'true';
  let securityFlags: string[] = [];
  try {
    securityFlags = params.security_flags ? JSON.parse(params.security_flags as string) : [];
  } catch {
    securityFlags = [];
  }
  
  // Extract explicit components if they arrived parsed via the GS1 parser engine
  const gtinCode = (params.gtin as string) || 'N/A';

  // 🎨 STATUS THEME SELECTOR ENGINE
  let statusColor = '#EF4444'; // Red
  const { t } = useLanguage();
  let statusTitle = t('verificationRejectedTitle');
  let statusSubtitle = t('verificationRejectedSubtitle');
  let StatusIcon = XCircle;

  if (isValid && !isExpired) {
    statusColor = '#10B981'; // Emerald
    statusTitle = t('authenticMedicationTitle');
    statusSubtitle = t('authenticMedicationSubtitle');
    StatusIcon = CheckCircle2;
  } else if (isValid && isExpired) {
    statusColor = '#F59E0B'; // Amber Orange
    statusTitle = t('expiredProductTitle');
    statusSubtitle = t('expiredProductSubtitle');
    StatusIcon = AlertTriangle;
  }

  const handleOpenLink = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (e) {
      // Quietly intercept error conditions
    }
  };

  const handleReportToDPML = async () => {
    const email = 'alertevigilancedpmlcameroon@gmail.com';
    const subject = encodeURIComponent('⚠️ URGENT ALERT: Unauthenticated Medication Report');

    try {
      await Linking.openURL(`mailto:${email}?subject=${subject}`);
    } catch (e) {
      // Intercepts browser or app-switching faults safely
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.scrollCanvas} showsVerticalScrollIndicator={false}>
        
        {/* 1. SEAMLESS RECOGNITION HERO UNIT */}
        <View style={[styles.heroCard, { borderColor: statusColor }]}>
          <View style={[styles.iconWrapper, { backgroundColor: `${statusColor}15` }]}>
            <StatusIcon size={scale(42)} color={statusColor} />
          </View>
          <Text style={[styles.heroTitle, { color: statusColor }]}>{statusTitle}</Text>
          <Text style={styles.heroSubtitle}>{statusSubtitle}</Text>

          {/* VERIFICATION DEPTH LEVEL BADGE TIER */}
          {isValid && (
            <View style={[styles.levelBadge, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.levelBadgeLabel, { color: statusColor }]}>
                {t('scopeLabel')}: {verificationLevel.toUpperCase()} {t('levelLabel')}
              </Text>
            </View>
          )}
        </View>

        {/* 2. SUSPICIOUS SCAN ALERT CARD */}
        {isValid && suspicious && (
          <View style={[styles.sectionCard, { borderColor: '#F59E0B' }]}> 
            <View style={styles.infoRow}>
              <ShieldAlert size={scale(18)} color="#F59E0B" />
              <View style={styles.textStack}>
                <Text style={styles.sectionTitle}>Attention: Suspicious Scan</Text>
                <Text style={styles.sectionSubtitle}>
                  This authentic medication scan has been flagged for additional review.
                </Text>
              </View>
            </View>
            {securityFlags.length > 0 && (
              <Text style={styles.suspiciousNote}>Flags: {securityFlags.join(', ')}</Text>
            )}
          </View>
        )}

        {/* 3. SPECIFIC THERAPEUTIC PRODUCT SPECS CARD */}
        {isValid && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{t('productDossier')}</Text>
            
            <View style={styles.infoRow}>
              <Milestone size={scale(18)} color="#9CA3AF" />
              <View style={styles.textStack}>
                <Text style={styles.label}>{t('tradeName')}</Text>
                <Text style={styles.value}>{brandName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <PackageCheck size={scale(18)} color="#9CA3AF" />
              <View style={styles.textStack}>
                <Text style={styles.label}>{t('manufacturer')}</Text>
                <Text style={styles.value}>{manufacturerName}</Text>
              </View>
              {manufacturerWebsite && (
                <TouchableOpacity 
                  onPress={() => handleOpenLink(manufacturerWebsite)}
                  style={styles.linkActionBtn}
                >
                  <ExternalLink size={scale(16)} color="#10B981" />
                </TouchableOpacity>
              )}
            </View>

            {/* Render secondary dosage metrics from product metadata schema */}
            {(drugForm || drugQuantity) && (
              <View style={[styles.infoRow, { marginTop: verticalScale(4) }]}> 
                <Columns4 size={scale(18)} color="#9CA3AF" />
                <View style={styles.textStack}>
                  <Text style={styles.label}>{t('galenicFormAndVolume')}</Text>
                  <Text style={styles.value}>
                    {drugForm || 'Unknown Form'} • {drugQuantity || '0'} {dosageUnit || 'units'}
                  </Text>
                </View>
              </View>
            )}

            {/* LEAFLET DOWNLOAD / REDIRECT TRIGGER SECTION */}
            {leafletUrl && (
              <TouchableOpacity 
                style={styles.leafletTriggerCard}
                onPress={() => handleOpenLink(leafletUrl)}
              >
                <FileText size={scale(18)} color="#10B981" />
                <Text style={styles.leafletTriggerLabel}>{t('viewPatientLeaflet')}</Text>
                <ExternalLink size={scale(14)} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 3. DYNAMIC INGREDIENT MATRIX */}
        {isValid && activeIngredients.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Layers size={scale(16)} color="#10B981" />
              <Text style={styles.sectionTitle}>Active Composition Matrix</Text>
            </View>
            
            {activeIngredients.map((item, idx) => (
              <View key={idx} style={styles.ingredientBadge}>
                <Text style={styles.ingredientName}>{item.name}</Text>
                <Text style={styles.ingredientStrength}>{item.dosage_per_unit || 'Unspecified'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 🌟 4. THE COMPREHENSIVE IDENTIFICATION METADATA CARD */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {isValid ? 'Identification Metadata' : 'Failed Verification Audit'}
          </Text>

          <View style={styles.gridContainerVertical}>
            
            {/* =========================================================================
                CHANNEL 1: ENTRY VIA QR CODE / TRIPLET COMPONENT FIELDS
                ========================================================================= */}
            {isQrCodeSource && (
              <>
                <View style={styles.gridItemRow}>
                  <Text style={styles.gridLabelInline}>GTIN Code:</Text>
                  <Text style={[styles.gridValueInline, !isValid && { color: '#FCA5A5' }]}>
                    {(params.gtin as string) || 'N/A'}
                  </Text>
                </View>
                <View style={styles.gridItemRow}>
                  <Text style={styles.gridLabelInline}>Batch Number:</Text>
                  <Text style={[styles.gridValueInline, !isValid && { color: '#FCA5A5' }]}>
                    {batchNumber}
                  </Text>
                </View>
                {/* Only render serial sequences for true item-level scans, or any failed triplet sweep */}
                {(verificationLevel === 'item' || !isValid) && (
                  <View style={styles.gridItemRow}>
                    <Text style={styles.gridLabelInline}>Serial Sequence:</Text>
                    <Text style={[styles.gridValueInline, !isValid && { color: '#FCA5A5' }]}>
                      {serialNumber}
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* =========================================================================
                CHANNEL 2: ENTRY VIA STANDALONE BATCH LOOKUPS
                ========================================================================= */}
            {isBatchSource && (
              <View style={styles.gridItemRow}>
                <Text style={styles.gridLabelInline}>Submitted Batch:</Text>
                <Text style={[styles.gridValueInline, !isValid && { color: '#EF4444', fontWeight: '700' }]}>
                  {batchNumber}
                </Text>
              </View>
            )}

            {/* =========================================================================
                CHANNEL 3: ENTRY VIA STANDALONE RAW BARCODES / CODES
                ========================================================================= */}
            {!isQrCodeSource && !isBatchSource && scannedRawCode && (
              <View style={styles.gridItemRow}>
                <Text style={styles.gridLabelInline}>
                  {!isValid ? 'Scanned Code Value:' : verificationLevel === 'product' ? 'Product Code:' : 'Item Code:'}
                </Text>
                <Text style={[styles.gridValueInline, !isValid && { color: '#EF4444', fontWeight: '700' }]}>
                  {scannedRawCode}
                </Text>
              </View>
            )}

          </View>

          {/* =========================================================================
              EXPIRATION TIMELINE TRACKER (Pinned at base ONLY for successfully verified products)
              ========================================================================= */}
          {isValid && (
            <View style={[styles.infoRow, { marginTop: verticalScale(14), borderTopWidth: 1, borderTopColor: '#374151', paddingTop: verticalScale(14) }]}> 
            <Calendar size={scale(18)} color={isExpired ? '#EF4444' : '#9CA3AF'} />
              <View style={styles.textStack}>
                <Text style={styles.label}>Expiration Date</Text>
                <Text style={[styles.value, isExpired && { color: '#EF4444', fontWeight: '700' }]}>
                  {expirationDate} {isExpired && '(EXPIRED)'}
                </Text>
              </View>
            </View>
          )}

          {/* =========================================================================
              🌟 NEW: DPML CAMEROON HEALTH WARNING & DIRECT COMPOSER TRIGGER
              ========================================================================= */}
          {!isValid && (
            <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 16, gap: 12 }}>
              <Text style={{ color: '#FCA5A5', fontSize: responsiveFont(14), fontWeight: '700' }}>
                Sanitary Safety Instructions
              </Text>
              <Text style={{ color: '#D1D5DB', fontSize: responsiveFont(13), lineHeight: 18 }}>
                Warning! This product has not been identified as authentic. You are strongly advised to{' '}
                <Text style={{ color: '#FFF', fontWeight: '700' }}>
                  bring this medication to the nearest health facility immediately
                </Text>{' '}
                for professional medical evaluation.
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: responsiveFont(12), lineHeight: 16 }}>
                Please report this suspect batch to the Direction de la Pharmacie, du Médicament et des Laboratoires (DPML) of Cameroon to preserve public health.
              </Text>
              <TouchableOpacity 
                style={{ backgroundColor: '#EF4444', height: verticalScale(44), borderRadius: scale(10), flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}
                onPress={handleReportToDPML}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: responsiveFont(13) }}>
                  Report via Email to the DPML
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>


        <View style={{ height: verticalScale(40) }} />
      </ScrollView>

      {/* 5. FOOTER */}
      <SafeAreaView edges={['bottom']} style={styles.safeFooterWrapper}>
        <View style={styles.stickyFooter}>
          <TouchableOpacity 
            style={styles.dismissBtn} 
            onPress={() => router.replace('/')}
          >
            <Text style={styles.dismissBtnText}>Return to Viewfinder</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#111827' },
  scrollCanvas: { flex: 1, paddingHorizontal: scale(16), paddingTop: verticalScale(16) },
  heroCard: { backgroundColor: '#1F2937', borderRadius: scale(16), padding: scale(24), alignItems: 'center', borderWidth: 1, marginBottom: verticalScale(16) },
  iconWrapper: { padding: scale(16), borderRadius: scale(50), marginBottom: verticalScale(14) },
  heroTitle: { fontSize: responsiveFont(22), fontWeight: '800', textAlign: 'center', marginBottom: verticalScale(6) },
  heroSubtitle: { color: '#9CA3AF', fontSize: responsiveFont(13), fontWeight: '500', textAlign: 'center', paddingHorizontal: scale(10), marginBottom: verticalScale(14) },
  levelBadge: { paddingVertical: verticalScale(4), paddingHorizontal: scale(12), borderRadius: scale(20) },
  levelBadgeLabel: { fontSize: responsiveFont(11), fontWeight: '700', letterSpacing: 0.8 },
  sectionCard: { backgroundColor: '#1F2937', borderRadius: scale(14), padding: scale(16), marginBottom: verticalScale(14), borderWidth: 1, borderColor: '#2D3748' },
  sectionTitle: { color: '#FFF', fontSize: responsiveFont(13), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionSubtitle: { color: '#D1D5DB', fontSize: responsiveFont(12), marginTop: verticalScale(4), lineHeight: 18 },
  suspiciousNote: { color: '#FBBF24', fontSize: responsiveFont(12), marginTop: verticalScale(10), lineHeight: 18 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: verticalScale(12) },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: verticalScale(12) },
  textStack: { flex: 1 },
  label: { color: '#9CA3AF', fontSize: responsiveFont(10), fontWeight: '600', textTransform: 'uppercase' },
  value: { color: '#FFF', fontSize: responsiveFont(15), fontWeight: '600', marginTop: verticalScale(1) },
  linkActionBtn: { padding: scale(6), backgroundColor: '#111827', borderRadius: scale(6) },
  leafletTriggerCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111827', padding: scale(12), borderRadius: scale(10), marginTop: verticalScale(16), borderWidth: 1, borderColor: '#374151' },
  leafletTriggerLabel: { color: '#FFF', fontSize: responsiveFont(13), fontWeight: '600', flex: 1 },
  ingredientBadge: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111827', paddingVertical: verticalScale(10), paddingHorizontal: scale(12), borderRadius: scale(8), marginTop: verticalScale(8), borderLeftWidth: scale(3), borderLeftColor: '#10B981' },
  ingredientName: { color: '#FFF', fontSize: responsiveFont(14), fontWeight: '600' },
  ingredientStrength: { color: '#10B981', fontSize: responsiveFont(14), fontWeight: '700' },
  gridContainer: { flexDirection: 'row', gap: 12, marginTop: verticalScale(10) },
  gridItem: { flex: 1, backgroundColor: '#111827', padding: scale(12), borderRadius: scale(8) },
  gridLabel: { color: '#9CA3AF', fontSize: responsiveFont(11), fontWeight: '600' },
  gridValue: { color: '#FFF', fontSize: responsiveFont(14), fontWeight: '700', marginTop: verticalScale(2), letterSpacing: 0.5 },
  safeFooterWrapper: {
  backgroundColor: '#1F2937', // Matches the sheet background perfectly
  borderTopWidth: 1,
  borderTopColor: '#2D3748',
  },
  stickyFooter: { 
  backgroundColor: '#1F2937', 
  paddingHorizontal: scale(16), 
  paddingTop: verticalScale(12),
  paddingBottom: verticalScale(16), // Consistent, clean padding above the device safe space
  },
  dismissBtn: { backgroundColor: '#374151', height: verticalScale(48), borderRadius: scale(10), justifyContent: 'center', alignItems: 'center' },
  dismissBtnText: { color: '#FFF', fontWeight: '700', fontSize: responsiveFont(15) },
  gridContainerVertical: {
    gap: 8,
    backgroundColor: '#111827',
    padding: scale(12),
    borderRadius: scale(8),
    marginTop: verticalScale(2),
  },
  gridItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(2),
  },
  gridLabelInline: {
    color: '#9CA3AF',
    fontSize: responsiveFont(13),
    fontWeight: '600',
  },
  gridValueInline: {
    color: '#FFF',
    fontSize: responsiveFont(13),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
