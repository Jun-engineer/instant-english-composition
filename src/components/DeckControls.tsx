'use client';

import { useCallback, useEffect } from 'react';
import classNames from 'classnames';
import { useDeckStore } from '@/state/useDeckStore';

interface DeckControlsProps {
  disabled?: boolean;
}

const baseButtonClasses =
  'flex-1 rounded-2xl px-6 py-4 text-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export function DeckControls({ disabled }: DeckControlsProps) {
  const markResult = useDeckStore((state) => state.markResult);
  const toggleFlip = useDeckStore((state) => state.toggleFlip);
  const isFlipped = useDeckStore((state) => state.isFlipped);

  const handleSuccess = useCallback(() => {
    markResult('success');
  }, [markResult]);

  const handleRetry = useCallback(() => {
    markResult('retry');
  }, [markResult]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (disabled) return;
      if (event.key === ' ') {
        event.preventDefault();
        toggleFlip();
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        handleSuccess();
      }
      if (event.key.toLowerCase() === 'j') {
        event.preventDefault();
        handleRetry();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [disabled, handleRetry, handleSuccess, toggleFlip]);

  return (
    <div className="mt-10 flex w-full max-w-xl flex-col gap-4 sm:flex-row">
      <button
        type="button"
        className={classNames(baseButtonClasses, 'bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50')}
        onClick={handleSuccess}
        disabled={disabled || !isFlipped}
      >
        正解 (F)
      </button>
      <button
        type="button"
        className={classNames(baseButtonClasses, 'bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-50')}
        onClick={handleRetry}
        disabled={disabled || !isFlipped}
      >
        再挑戦 (J)
      </button>
    </div>
  );
}
