import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Initialise native Capacitor plugins.
 * Call once from the root layout on mount.
 */
export async function initNativePlugins() {
  if (!Capacitor.isNativePlatform()) return;

  await StatusBar.setStyle({ style: Style.Light });
  await StatusBar.setBackgroundColor({ color: '#f59e0b' });

  // Hide splash screen after the web view has rendered
  await SplashScreen.hide();
}
