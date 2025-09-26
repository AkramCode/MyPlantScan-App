import type { ParamListBase } from '@react-navigation/native';
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

const DEEP_LINK_PREFIXES = [
  Linking.createURL('/'),
  'myplantscan://',
  'https://myplantscan.com',
  'https://www.myplantscan.com',
] as const;

const AUTH_SCREEN_PATHS = {
  confirm: 'confirm',
  resetPassword: 'reset-password',
} as const;

type AuthRouteConfig = {
  type: 'auth_confirm' | 'reset_password';
  token: string;
  params: Record<string, string>;
};

export const linking: LinkingOptions<ParamListBase> = {
  prefixes: [...DEEP_LINK_PREFIXES],
  config: {
    screens: {
      '(tabs)': {
        path: '',
        screens: {
          index: '',
          health: 'health',
          camera: 'camera',
          garden: 'garden',
          more: 'more',
        },
      } as any,
      auth: {
        path: 'auth',
        screens: {
          confirm: AUTH_SCREEN_PATHS.confirm,
          'reset-password': AUTH_SCREEN_PATHS.resetPassword,
        },
      } as any,
      'plant-details': 'plant-details/:id',
      'health-report': 'health-report/:id',
      'water-calculator': 'water-calculator',
      'light-meter': 'light-meter',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL();
    return url ?? null;
  },
  subscribe(listener) {
    const onReceiveURL = ({ url }: { url: string }) => listener(url);
    const subscription = Linking.addEventListener('url', onReceiveURL);
    return () => {
      subscription.remove();
    };
  },
};

export const handleAuthDeepLink = (url: string): AuthRouteConfig | null => {
  if (!url) {
    return null;
  }

  const { path, queryParams } = Linking.parse(url);
  const normalisedPath = (path ?? '').replace(/^\//, '');
  const token = (queryParams?.token ?? queryParams?.code ?? '') as string;

  if (!token) {
    return null;
  }

  if (
    normalisedPath === `auth/${AUTH_SCREEN_PATHS.confirm}` ||
    normalisedPath === AUTH_SCREEN_PATHS.confirm
  ) {
    return {
      type: 'auth_confirm',
      token,
      params: (queryParams as Record<string, string>) ?? {},
    };
  }

  if (
    normalisedPath === `auth/${AUTH_SCREEN_PATHS.resetPassword}` ||
    normalisedPath === AUTH_SCREEN_PATHS.resetPassword
  ) {
    return {
      type: 'reset_password',
      token,
      params: (queryParams as Record<string, string>) ?? {},
    };
  }

  return null;
};

export const createDeepLink = (
  path: string,
  params?: Record<string, string>
): string => {
  const trimmedPath = path.replace(/^\//, '');
  const queryString = params
    ? `?${Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')}`
    : '';

  return `myplantscan://${trimmedPath}${queryString}`;
};


