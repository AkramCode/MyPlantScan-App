/* eslint-disable unicode-bom */
import React from 'react';
import { ScrollView, ScrollViewProps, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResponsiveScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  /** Maximum width applied to the inner content wrapper once tablet breakpoints are reached. */
  maxContentWidth?: number;
  /** Ensure a minimum horizontal padding regardless of screen size. */
  minHorizontalPadding?: number;
  /** Additional style overrides for the inner content wrapper. */
  innerStyle?: StyleProp<ViewStyle>;
  /**
   * Provide a top component (e.g. hero image) that should span full width edge-to-edge.
   * When provided with fullBleedTop, this renders above the padded content area.
   */
  topComponent?: React.ReactNode;
  /** If true, removes horizontal padding for the topComponent so it bleeds to the edges. */
  fullBleedTop?: boolean;
}

const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;
const DEFAULT_MIN_PADDING = 20;

export default function ResponsiveScrollView({
  children,
  contentContainerStyle,
  style,
  maxContentWidth,
  minHorizontalPadding = DEFAULT_MIN_PADDING,
  innerStyle,
  topComponent,
  fullBleedTop = false,
  ...rest
}: ResponsiveScrollViewProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isTablet = width >= TABLET_BREAKPOINT;
  const isLargeTablet = width >= LARGE_TABLET_BREAKPOINT;
  const horizontalPadding = isLargeTablet ? 48 : isTablet ? 32 : minHorizontalPadding;
  const computedMaxWidth = maxContentWidth ?? (isLargeTablet ? 900 : isTablet ? 760 : width);

  const combinedContentContainerStyle = [
    styles.baseContentContainer,
    {
      paddingLeft: fullBleedTop ? 0 : horizontalPadding + insets.left,
      paddingRight: fullBleedTop ? 0 : horizontalPadding + insets.right,
      paddingBottom: insets.bottom + (isTablet ? 48 : 80),
    },
    contentContainerStyle,
  ];

  return (
    <ScrollView
      {...rest}
      style={[{ backgroundColor: 'transparent' }, style]}
      contentContainerStyle={combinedContentContainerStyle}
    >
      {topComponent && (
        <View style={fullBleedTop ? styles.fullBleedWrapper : undefined}>
          {topComponent}
        </View>
      )}
      <View
        style={[
          styles.innerContentWrapper,
          { maxWidth: computedMaxWidth, paddingLeft: fullBleedTop ? horizontalPadding + insets.left : 0, paddingRight: fullBleedTop ? horizontalPadding + insets.right : 0 },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  baseContentContainer: {
    flexGrow: 1,
  },
  innerContentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  fullBleedWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
});
