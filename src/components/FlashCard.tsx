'use client';

import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { DeckCard, ReviewStatus } from '@/lib/types';

type SwipeDirection = 'left' | 'right';

interface FlashCardProps {
  card: DeckCard | null;
  isFlipped: boolean;
  onToggle: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
  interactive?: boolean;
  onWordSelect?: (word: string) => void;
  swipeFeedback?: ReviewStatus | null;
}

const SWIPE_THRESHOLD = 80;

export function FlashCard({ card, isFlipped, onToggle, onSwipe, interactive = true, onWordSelect, swipeFeedback = null }: FlashCardProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const dragStart = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [card?.id]);

  useEffect(() => {
    if (isFlipped) {
      setShowHint(false);
    }
  }, [isFlipped]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return undefined;
    }
    const synth = window.speechSynthesis;
    const updateVoices = () => {
      setVoices(synth.getVoices());
    };
    updateVoices();
    synth.addEventListener('voiceschanged', updateVoices);
    return () => {
      synth.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const resetDrag = useCallback(() => {
    setDragOffset(0);
    dragStart.current = null;
    pointerId.current = null;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || !card) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerId.current = event.pointerId;
    dragStart.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [card, interactive]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || pointerId.current !== event.pointerId || dragStart.current === null) return;
    setDragOffset(event.clientX - dragStart.current);
  }, [interactive]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive || pointerId.current !== event.pointerId || dragStart.current === null) {
      resetDrag();
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const delta = event.clientX - dragStart.current;
    const absDelta = Math.abs(delta);

    if (absDelta > SWIPE_THRESHOLD && onSwipe) {
      onSwipe(delta > 0 ? 'right' : 'left');
    } else if (absDelta < 12) {
      onToggle();
    }

    resetDrag();
  }, [interactive, onSwipe, onToggle, resetDrag]);

  const transformStyle = useMemo(() => {
    const translate = `translateX(${dragOffset}px)`;
    const tilt = `rotate(${dragOffset / 40}rad)`;
    return {
      transform: `${translate} ${tilt}`,
      transition: isDragging ? 'none' : 'transform 0.25s ease-out'
    } satisfies CSSProperties;
  }, [dragOffset, isDragging]);

  const feedbackState = useMemo(() => {
    if (isDragging && dragOffset !== 0) {
      const intensity = Math.min(Math.abs(dragOffset) / SWIPE_THRESHOLD, 1);
      const type: ReviewStatus = dragOffset > 0 ? 'success' : 'retry';
      return { type, intensity };
    }
    if (swipeFeedback) {
      return { type: swipeFeedback, intensity: 1 };
    }
    return null;
  }, [dragOffset, isDragging, swipeFeedback]);

  const feedbackOverlayStyle = useMemo(() => {
    if (!feedbackState) {
      return { opacity: 0, backgroundColor: 'transparent' } satisfies CSSProperties;
    }
    const alpha = 0.2 + 0.5 * Math.min(Math.max(feedbackState.intensity, 0), 1);
    const color = feedbackState.type === 'success'
      ? `rgba(16, 185, 129, ${alpha})`
      : `rgba(239, 68, 68, ${alpha})`;
    return {
      opacity: 1,
      backgroundColor: color
    } satisfies CSSProperties;
  }, [feedbackState]);

  const answerTokens = useMemo(() => {
    if (!card?.answer) {
      return [];
    }
    return card.answer.split(/(\s+)/);
  }, [card?.answer]);

  const handleWordSelect = useCallback((raw: string) => {
    if (!onWordSelect || !interactive) return;
    const cleaned = raw.replace(/[^A-Za-z'-]/g, '').trim();
    if (!cleaned) return;
    onWordSelect(cleaned);
  }, [interactive, onWordSelect]);

  const handleHintToggle = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setShowHint((prev) => !prev);
  }, []);

  const englishVoice = useMemo(() => {
    return voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith('en')) ?? null;
  }, [voices]);

  const handleReadAnswer = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!card?.answer) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this environment.');
      return;
    }
    const synth = window.speechSynthesis;
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(card.answer);
    utterance.lang = 'en-US';
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
    };
    setIsSpeaking(true);
    synth.speak(utterance);
  }, [card?.answer, englishVoice, isSpeaking]);

  return (
    <div
      className={classNames(
        'relative h-80 w-full max-w-md select-none overflow-hidden rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200',
        interactive ? 'cursor-pointer' : 'cursor-default opacity-70'
      )}
      role="button"
      tabIndex={interactive ? 0 : -1}
      style={{ ...transformStyle, touchAction: 'pan-y', perspective: '1200px' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetDrag}
      onKeyDown={(event) => {
        if (!interactive) return;
        if (event.key === 'ArrowLeft' && onSwipe) {
          event.preventDefault();
          onSwipe('left');
        }
        if (event.key === 'ArrowRight' && onSwipe) {
          event.preventDefault();
          onSwipe('right');
        }
        if ((event.key === 'Enter' || event.key === ' ') && card) {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      {card ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-20 rounded-3xl transition-opacity duration-150"
            style={feedbackOverlayStyle}
          />
          <div
            className={classNames(
              'absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]',
              { '[transform:rotateY(180deg)]': isFlipped }
            )}
          >
            <div className="absolute inset-0 flex h-full w-full flex-col bg-white/95 px-6 py-6 [backface-visibility:hidden]">
              <div className="flex flex-wrap justify-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {card.cefrLevel}
                </span>
                {card.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium uppercase text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
                <p className="text-2xl font-semibold leading-relaxed text-slate-900">{card.prompt}</p>
                {card.hint && showHint ? (
                  <p className="mt-4 text-sm text-slate-500">ヒント: {card.hint}</p>
                ) : null}
              </div>
              <div className="flex flex-col items-center gap-2">
                {card.hint ? (
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                    onClick={handleHintToggle}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    {showHint ? 'ヒントを隠す' : 'ヒントを表示'}
                  </button>
                ) : null}
                <p className="text-xs text-slate-400">タップすると解答が表示されます</p>
              </div>
            </div>
            <div className="absolute inset-0 flex h-full w-full flex-col bg-white/95 px-6 py-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="flex flex-wrap justify-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {card.cefrLevel}
                </span>
                {card.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium uppercase text-slate-500">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-2">
                <p className="flex flex-wrap justify-center gap-y-1 text-2xl font-semibold leading-relaxed text-emerald-700">
                  {answerTokens.map((token, index) => {
                    if (!token.trim()) {
                      return <span key={`space-${index}`} className="whitespace-pre">{token}</span>;
                    }
                    const isWord = /[A-Za-z]/.test(token);
                    if (!isWord) {
                      return <span key={`token-${index}`}>{token}</span>;
                    }
                    return (
                      <button
                        key={`word-${index}`}
                        type="button"
                        className="rounded-md px-1 text-emerald-700 underline decoration-dotted underline-offset-4 transition hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          handleWordSelect(token);
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        {token}
                      </button>
                    );
                  })}
                </p>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  onClick={handleReadAnswer}
                  onPointerDown={(event) => event.stopPropagation()}
                  disabled={!card?.answer}
                >
                  {isSpeaking ? '再生を停止' : '英文を音声で再生'}
                </button>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-6 left-4 flex items-center text-sm font-semibold text-rose-500/70">
            <span className="hidden sm:inline">← 再挑戦</span>
          </div>
          <div className="pointer-events-none absolute inset-y-6 right-4 flex items-center text-sm font-semibold text-emerald-600/70">
            <span className="hidden sm:inline">正解 →</span>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-white/95 px-6 py-6 text-slate-500">
          <p>学習するカードが読み込まれていません。</p>
          <p className="text-sm">条件を調整するか、データソースを確認してください。</p>
        </div>
      )}
    </div>
  );
}
