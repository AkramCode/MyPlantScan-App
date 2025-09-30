import { getItem, removeItem, setItem } from './storage';

export const ONBOARDING_STORAGE_KEY = 'myplantscan.onboarding.completed';
const FORCE_ONBOARDING_KEY = 'myplantscan.onboarding.force';

export const getHasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const value = await getItem(ONBOARDING_STORAGE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('onboarding-storage:get error', error);
    return false;
  }
};

export const markOnboardingComplete = async (): Promise<void> => {
  try {
    await setItem(ONBOARDING_STORAGE_KEY, 'true');
  } catch (error) {
    console.error('onboarding-storage:set error', error);
  }
};

export const clearOnboardingFlag = async (): Promise<void> => {
  try {
    await removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.error('onboarding-storage:clear error', error);
  }
};

export const getForceOnboardingEnabled = async (): Promise<boolean> => {
  try {
    const value = await getItem(FORCE_ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('onboarding-storage:get force error', error);
    return false;
  }
};

export const setForceOnboardingEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await setItem(FORCE_ONBOARDING_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('onboarding-storage:set force error', error);
  }
};

export const clearForceOnboarding = async (): Promise<void> => {
  try {
    await removeItem(FORCE_ONBOARDING_KEY);
  } catch (error) {
    console.error('onboarding-storage:clear force error', error);
  }
};


