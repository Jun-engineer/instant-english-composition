'use client';

import { useEffect } from 'react';
import { initNativePlugins } from '@/lib/native';
import { initMonetization } from '@/state/usePremiumStore';

export function NativeInit() {
  useEffect(() => {
    initNativePlugins();
    initMonetization();
  }, []);

  return null;
}
