import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

export async function hapticsImpactLight() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticsImpactMedium() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticsNotificationSuccess() {
  if (!isNative) return;
  await Haptics.notification({ type: NotificationType.Success });
}

export async function hapticsNotificationError() {
  if (!isNative) return;
  await Haptics.notification({ type: NotificationType.Error });
}

export async function hapticsSelectionChanged() {
  if (!isNative) return;
  await Haptics.selectionChanged();
}
