'use client';

import { useEffect } from 'react';
import { initNativePlugins } from '@/lib/native';

export function NativeInit() {
  useEffect(() => {
    initNativePlugins();
  }, []);

  return null;
}
