import { useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';

export const TABLET_BREAKPOINT = 768;
export const LARGE_TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1280;

export function useBreakpoints() {
  const { width } = useWindowDimensions();

  return useMemo(() => ({
    width,
    isTablet: width >= TABLET_BREAKPOINT,
    isLargeTablet: width >= LARGE_TABLET_BREAKPOINT,
    isDesktop: width >= DESKTOP_BREAKPOINT,
    isPadDevice: Platform.OS === 'ios' && (Platform as any).isPad === true,
  }), [width]);
}
