let analyticsEnabled = true;

export type AnalyticsEventPayload = Record<string, unknown>;

export const setAnalyticsConsent = (enabled: boolean) => {
  analyticsEnabled = enabled;
};

export const isAnalyticsEnabled = () => analyticsEnabled;

export const trackEvent = (name: string, payload: AnalyticsEventPayload = {}) => {
  if (!analyticsEnabled) {
    return;
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[analytics] ${name}`, payload);
    }
    // TODO: integrate with analytics SDK here when available.
  } catch (error) {
    console.error('Analytics tracking failed', error);
  }
};
