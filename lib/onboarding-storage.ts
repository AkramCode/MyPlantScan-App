import { getItem, removeItem, setItem } from './storage';

export const ONBOARDING_STORAGE_KEY = 'myplantscan.onboarding.completed';

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


