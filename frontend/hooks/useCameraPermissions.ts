import { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const useCameraPermissions = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const requestPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Access Needed',
              message: 'This application requires camera privileges to scan medication barcodes.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
        } else {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
        }
      } catch {
        setHasPermission(false);
      }
    };

    requestPermission();
  }, []);

  return hasPermission;
};
