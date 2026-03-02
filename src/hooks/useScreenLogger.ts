import { useEffect } from 'react';
import { analytics } from '../services/analyticsService';

/**
 * Tracks a screen view in PostHog when the component mounts.
 *
 * Usage:
 *   useScreenLogger('PotsListScreen');
 */
export const useScreenLogger = (screenName: string): void => {
  useEffect(() => {
    analytics.screen(screenName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
