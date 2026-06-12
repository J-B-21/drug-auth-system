import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~iPhone 11 / 375x812 baseline
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export function scale(size: number) {
  return Math.round((width / guidelineBaseWidth) * size);
}

export function verticalScale(size: number) {
  return Math.round((height / guidelineBaseHeight) * size);
}

export function moderateScale(size: number, factor = 0.5) {
  return Math.round(size + (scale(size) - size) * factor);
}

export function responsiveFont(size: number) {
  return moderateScale(size, 0.6);
}

export default { scale, verticalScale, moderateScale, responsiveFont };
