'use client';

import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePremiumStore } from '@/state/usePremiumStore';

/**
 * Renders a banner ad at the bottom of the training screen.
 * Auto-hides for premium users or when not on native.
 */
export function BannerAd() {
  const isPremium = usePremiumStore((s) => s.isPremium);
  const initialized = usePremiumStore((s) => s.initialized);
  const shown = useRef(false);

  useEffect(() => {
    if (!initialized || isPremium || !Capacitor.isNativePlatform()) return;
    if (shown.current) return;

    let disposed = false;

    (async () => {
      try {
        const { AdMob, BannerAdSize, BannerAdPosition } = await import(
          '@capacitor-community/admob'
        );
        const { ADMOB_IDS } = await import('@/lib/premium');

        if (disposed) return;

        await AdMob.showBanner({
          adId: ADMOB_IDS.BANNER,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
        });
        shown.current = true;
      } catch (error) {
        console.warn('Banner ad error:', error);
      }
    })();

    return () => {
      disposed = true;
      if (shown.current) {
        import('@capacitor-community/admob').then(({ AdMob }) => {
          AdMob.removeBanner().catch(() => {});
        });
        shown.current = false;
      }
    };
  }, [initialized, isPremium]);

  // Banner is rendered natively; return spacer so content doesn't overlap
  if (!initialized || isPremium || !Capacitor.isNativePlatform()) return null;
  return <div className="h-14 w-full shrink-0" aria-hidden />;
}
