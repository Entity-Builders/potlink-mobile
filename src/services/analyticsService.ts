import { Analytics, PostHogRNProvider } from '@eb-packages/analytics';

/**
 * Singleton analytics instance for Potlink Mobile.
 * Import this in screens/components to track events or errors.
 *
 * Usage:
 *   import { analytics, trackPotCreated } from '../services/analyticsService';
 *   trackPotCreated(pot.id, pot.species, 'manual');
 *   analytics.captureError(error, { screen: 'AuthScreen' });
 */
export const analytics = new Analytics(new PostHogRNProvider());

export function initAnalytics(): void {
  analytics.init({
    apiKey: process.env.EXPO_PUBLIC_POTLINK_POSTHOG_API_KEY ?? '',
    apiHost: process.env.EXPO_PUBLIC_POTLINK_POSTHOG_HOST,
    // Disable in local dev to avoid polluting production data
    disabled: !process.env.EXPO_PUBLIC_POTLINK_POSTHOG_API_KEY,
  });

  // Tag every event with app context so we can filter by app in PostHog dashboard
  analytics.setGlobalProperties({
    app: 'potlink',
    platform: 'ios',
    environment: process.env.EXPO_PUBLIC_POTLINK_POSTHOG_API_KEY
      ? 'production'
      : 'development',
  });
}

// ─── Typed Event Helpers ────────────────────────────────────────────────────
// Use these instead of raw analytics.track() to keep event names consistent.

/** Track when a pot is successfully created. */
export const trackPotCreated = (
  potId: string,
  species: string,
  method: 'manual' | 'ar_camera',
) => {
  analytics.track('pot_created', { pot_id: potId, species, method });
};

/** Track when a pot is deleted. */
export const trackPotDeleted = (potId: string) => {
  analytics.track('pot_deleted', { pot_id: potId });
};

/** Track when a pot is successfully edited/saved. */
export const trackPotEdited = (potId: string) => {
  analytics.track('pot_edited', { pot_id: potId });
};

/** Track when AI plant identification succeeds. */
export const trackPlantIdentified = (
  species: string,
  confidence?: string,
  method?: 'ar_camera' | 'manual_photo',
) => {
  analytics.track('plant_identified', { species, confidence, method });
};

/** Track when a care action (e.g. watering) is logged. */
export const trackCareLogged = (potId: string, careType: string) => {
  analytics.track('care_logged', { pot_id: potId, care_type: careType });
};

/** Track a screen view manually (prefer the useScreenLogger hook). */
export const trackScreenView = (name: string) => {
  analytics.screen(name);
};
