import { Platform } from 'react-native';

const APP_SHARE_LINKS = {
  ios: 'https://apps.apple.com/app/myplantscan',
  android: 'https://play.google.com/store/apps/details?id=com.myplantscan',
  web: 'https://www.myplantscan.com',
} as const;

export type SharePayload = {
  title?: string;
  message: string;
};

export type BuiltSharePayload = SharePayload & { url: string };

// Toggle this to hide share UI across the app while keeping share logic intact.
// The product team wanted the share UI hidden for the next update but preserved
// so it can be re-enabled easily. Set to `true` to show buttons again.
export const ENABLE_SHARE_BUTTONS = false;

export const getAppShareUrl = () =>
  Platform.select({ ios: APP_SHARE_LINKS.ios, android: APP_SHARE_LINKS.android, default: APP_SHARE_LINKS.web }) ??
  APP_SHARE_LINKS.web;

export const buildSharePayload = ({ title, message }: SharePayload): BuiltSharePayload => {
  const url = getAppShareUrl();
  const trimmed = message.trim();
  const callToAction = `Discover more with MyPlantScan. Download the app: ${url}`;
  const combined = trimmed.length ? `${trimmed}\n\n${callToAction}` : callToAction;

  return {
    title,
    message: combined,
    url,
  };
};
