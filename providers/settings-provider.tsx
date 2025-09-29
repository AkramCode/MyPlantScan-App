import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';

import { setAnalyticsConsent } from '@/lib/analytics';
import { getItem, setItem } from '@/lib/storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type MeasurementUnit = 'metric' | 'imperial';

export type SettingsState = {
  pushNotifications: boolean;
  wateringReminders: boolean;
  healthInsights: boolean;
  measurementUnit: MeasurementUnit;
  themePreference: ThemePreference;
  analyticsOptIn: boolean;
};

const SETTINGS_STORAGE_KEY = 'myplantscan.settings.v1';

export const defaultSettings: SettingsState = {
  pushNotifications: true,
  wateringReminders: true,
  healthInsights: true,
  measurementUnit: 'metric',
  themePreference: 'system',
  analyticsOptIn: true,
};

const parseSettings = (raw: string | null): SettingsState => {
  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      pushNotifications: typeof parsed?.pushNotifications === 'boolean' ? parsed.pushNotifications : defaultSettings.pushNotifications,
      wateringReminders: typeof parsed?.wateringReminders === 'boolean' ? parsed.wateringReminders : defaultSettings.wateringReminders,
      healthInsights: typeof parsed?.healthInsights === 'boolean' ? parsed.healthInsights : defaultSettings.healthInsights,
      measurementUnit: parsed?.measurementUnit === 'imperial' ? 'imperial' : 'metric',
      themePreference:
        parsed?.themePreference === 'light' || parsed?.themePreference === 'dark'
          ? parsed.themePreference
          : 'system',
      analyticsOptIn: typeof parsed?.analyticsOptIn === 'boolean' ? parsed.analyticsOptIn : defaultSettings.analyticsOptIn,
    };
  } catch (error) {
    console.error('SettingsProvider: failed to parse stored settings', error);
    return defaultSettings;
  }
};

type SettingsContextValue = {
  settings: SettingsState;
  isLoading: boolean;
  isSaving: boolean;
  updateSettings: (updates: Partial<SettingsState>) => void;
  resetSettings: () => void;
};

export const [SettingsProvider, useSettings] = createContextHook<SettingsContextValue>(() => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const stored = await getItem(SETTINGS_STORAGE_KEY);
        if (!isMounted) {
          return;
        }
        setSettings(parseSettings(stored));
      } catch (error) {
        console.error('SettingsProvider: failed to hydrate settings', error);
        if (isMounted) {
          setSettings(defaultSettings);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setAnalyticsConsent(settings.analyticsOptIn);
  }, [settings.analyticsOptIn]);

  const persistSettings = useCallback(async (next: SettingsState) => {
    setIsSaving(true);
    try {
      await setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('SettingsProvider: failed to persist settings', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<SettingsState>) => {
    setSettings((previous) => {
      const next = { ...previous, ...updates };
      void persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  const resetSettings = useCallback(() => {
    setSettings((previous) => {
      if (previous === defaultSettings) {
        return previous;
      }
      const next = { ...defaultSettings };
      void persistSettings(next);
      return next;
    });
  }, [persistSettings]);

  return useMemo(() => ({
    settings,
    isLoading,
    isSaving,
    updateSettings,
    resetSettings,
  }), [settings, isLoading, isSaving, updateSettings, resetSettings]);
});
