import React from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { scale, responsiveFont } from '../utils/layout';

interface CameraErrorBannerProps {
  cameraError: string | null;
  cameraToastAnim: Animated.Value;
}

export const CameraErrorBanner: React.FC<CameraErrorBannerProps> = ({ cameraError, cameraToastAnim }) => {
  if (!cameraError) {
    return null;
  }

  return (
    <Animated.View style={[styles.cameraToastBanner, { transform: [{ translateY: cameraToastAnim }] }]}> 
      <Text style={styles.cameraToastText}>{cameraError}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cameraToastBanner: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    zIndex: 9999,
    elevation: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cameraToastText: {
    color: '#FCA5A5',
    fontSize: responsiveFont(13),
    fontWeight: '500',
    textAlign: 'center',
  },
});
