import { Analytics, PostHogRNProvider } from '@eb-packages/analytics';

/**
 * Singleton analytics instance for Potlink Mobile.
 * Import this in screens/components to track events or errors.
 *
 * Usage:
 *   import { analytics } from '../services/analyticsService';
 *   analytics.captureError(error, { screen: 'AuthScreen' });
 *   analytics.captureNetworkError(url, status, message, { screen: 'PotsListScreen' });
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
