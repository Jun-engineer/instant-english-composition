'use client';

import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import { ENTITLEMENT_ID } from '@/lib/premium';

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  /** Set after RevenueCat / AdMob initialisation completes */
  initialized: boolean;
  setPremium: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setInitialized: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  isPremium: false,
  isLoading: true,
  initialized: false,
  setPremium: (value) => set({ isPremium: value }),
  setLoading: (value) => set({ isLoading: value }),
  setInitialized: () => set({ initialized: true, isLoading: false }),
}));

const packageCache = new Map<string, any>();

/**
 * Initialise RevenueCat and AdMob.
 * Should be called once on app start (NativeInit).
 */
export async function initMonetization() {
  if (!Capacitor.isNativePlatform()) {
    usePremiumStore.getState().setInitialized();
    return;
  }

  const { setPremium, setInitialized } = usePremiumStore.getState();

  try {
    // --- RevenueCat ---
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { REVENUECAT_API_KEY_IOS } = await import('@/lib/premium');

    if (REVENUECAT_API_KEY_IOS) {
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });

      const { customerInfo } = await Purchases.getCustomerInfo();
      const hasEntitlement =
        customerInfo.entitlements.active?.[ENTITLEMENT_ID] !== undefined;
      setPremium(hasEntitlement);

      // Listen for subscription changes
      Purchases.addCustomerInfoUpdateListener((info) => {
        const active = info.entitlements.active?.[ENTITLEMENT_ID] !== undefined;
        setPremium(active);
      });
    }
  } catch (error) {
    console.warn('RevenueCat init failed:', error);
  }

  try {
    // --- AdMob ---
    const { AdMob } = await import('@capacitor-community/admob');
    const { USE_TEST_ADS } = await import('@/lib/premium');

    // Request App Tracking Transparency permission (iOS 14.5+).
    // Without this, AdMob can only serve non-personalized ads (or none at all).
    try {
      const trackingInfo = await AdMob.trackingAuthorizationStatus();
      if (trackingInfo.status === 'notDetermined') {
        await AdMob.requestTrackingAuthorization();
      }
    } catch (attError) {
      console.warn('ATT request failed:', attError);
    }

    await AdMob.initialize({
      initializeForTesting: USE_TEST_ADS,
    });
  } catch (error) {
    console.warn('AdMob init failed:', error);
  }

  setInitialized();
}

/**
 * Show an interstitial ad (after training session).
 * No-ops if premium or not on native.
 */
export async function showInterstitialAd() {
  if (!Capacitor.isNativePlatform()) return;
  if (usePremiumStore.getState().isPremium) return;

  try {
    const { AdMob } = await import('@capacitor-community/admob');
    const { ADMOB_IDS } = await import('@/lib/premium');

    await AdMob.prepareInterstitial({ adId: ADMOB_IDS.INTERSTITIAL });
    await AdMob.showInterstitial();
  } catch (error) {
    console.warn('Interstitial ad error:', error);
  }
}

/**
 * Purchase or restore a subscription.
 */
export async function purchaseSubscription(packageId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    let targetPackage = packageCache.get(packageId);

    if (!targetPackage) {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current as any;
      const availablePackages = current?.availablePackages ?? [];
      targetPackage = availablePackages.find((pkg: any) => pkg?.identifier === packageId);
    }

    if (!targetPackage) {
      throw new Error(`Package not found: ${packageId}`);
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: targetPackage });
    const active = customerInfo.entitlements.active?.[ENTITLEMENT_ID] !== undefined;
    usePremiumStore.getState().setPremium(active);
    return active;
  } catch (error: any) {
    if (error?.userCancelled) return false;
    console.error('Purchase failed:', error);
    throw error;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const { customerInfo } = await Purchases.restorePurchases();
    const active = customerInfo.entitlements.active?.[ENTITLEMENT_ID] !== undefined;
    usePremiumStore.getState().setPremium(active);
    return active;
  } catch (error) {
    console.error('Restore failed:', error);
    throw error;
  }
}

export interface PackageInfo {
  identifier: string;
  priceString: string;
  title: string;
  description: string;
  period: 'monthly' | 'annual';
}

export async function getAvailablePackages(): Promise<PackageInfo[]> {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor');
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];

    const packages: PackageInfo[] = [];
    packageCache.clear();

    if (current.monthly) {
      packageCache.set(current.monthly.identifier, current.monthly);
      packages.push({
        identifier: current.monthly.identifier,
        priceString: current.monthly.product.priceString,
        title: '月額プラン',
        description: '毎月自動更新',
        period: 'monthly',
      });
    }

    if (current.annual) {
      packageCache.set(current.annual.identifier, current.annual);
      packages.push({
        identifier: current.annual.identifier,
        priceString: current.annual.product.priceString,
        title: '年額プラン',
        description: '31%お得！',
        period: 'annual',
      });
    }

    return packages;
  } catch (error) {
    console.error('Failed to get packages:', error);
    return [];
  }
}
