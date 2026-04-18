'use client';

import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  getAvailablePackages,
  purchaseSubscription,
  restorePurchases,
  type PackageInfo,
} from '@/state/usePremiumStore';
import { usePremiumStore } from '@/state/usePremiumStore';
import { FREE_LIMITS } from '@/lib/premium';

const APP_STORE_URL = 'https://apps.apple.com/app/speedspeak/id6762238764';

interface PaywallProps {
  onClose: () => void;
  /** Optional reason shown at the top */
  reason?: string;
}

export function Paywall({ onClose, reason }: PaywallProps) {
  const isPremium = usePremiumStore((s) => s.isPremium);
  const isNative = Capacitor.isNativePlatform();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(isNative);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isNative) return;
    getAvailablePackages()
      .then((pkgs) => {
        setPackages(pkgs);
        // Default to annual if available
        const annual = pkgs.find((p) => p.period === 'annual');
        setSelectedPkg(annual?.identifier ?? pkgs[0]?.identifier ?? null);
      })
      .catch(() => setError('プランの取得に失敗しました。'))
      .finally(() => setLoading(false));
  }, [isNative]);

  useEffect(() => {
    if (isPremium) onClose();
  }, [isPremium, onClose]);

  const handlePurchase = useCallback(async () => {
    if (!selectedPkg) return;
    setPurchasing(true);
    setError(null);
    try {
      await purchaseSubscription(selectedPkg);
    } catch {
      setError('購入処理に失敗しました。もう一度お試しください。');
    } finally {
      setPurchasing(false);
    }
  }, [selectedPkg]);

  const handleRestore = useCallback(async () => {
    setPurchasing(true);
    setError(null);
    try {
      const restored = await restorePurchases();
      if (!restored) {
        setError('有効なサブスクリプションが見つかりませんでした。');
      }
    } catch {
      setError('復元に失敗しました。');
    } finally {
      setPurchasing(false);
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-900">
            SpeedSpeak Premium
          </h2>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            onClick={onClose}
          >
            閉じる
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Reason banner */}
          {reason && (
            <p className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              {reason}
            </p>
          )}

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Premium でできること
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>広告を完全に非表示</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>
                  全CEFRレベル（A1〜C2）のカードにアクセス
                  <span className="text-xs text-slate-400 ml-1">
                    （無料版はA1〜B2のみ）
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>
                  AI単語検索が無制限
                  <span className="text-xs text-slate-400 ml-1">
                    （無料版は{FREE_LIMITS.AI_LOOKUPS_PER_DAY}回/日）
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>
                  お気に入り登録が300件まで
                  <span className="text-xs text-slate-400 ml-1">
                    （無料版は{FREE_LIMITS.WORD_FAVORITES}件）
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>
                  1セッションあたり最大100枚
                  <span className="text-xs text-slate-400 ml-1">
                    （無料版は{FREE_LIMITS.CARDS_PER_SESSION}枚）
                  </span>
                </span>
              </li>
            </ul>
          </div>

          {/* Package selection / Web CTA */}
          {!isNative ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-blue-50 border border-blue-200 px-5 py-4 text-center space-y-2">
                <p className="text-sm font-semibold text-blue-800">
                  Premium はiOSアプリ限定の機能です
                </p>
                <p className="text-xs text-blue-600 leading-relaxed">
                  App StoreからSpeedSpeakアプリをインストールし、アプリ内でサブスクリプションに登録してください。
                </p>
              </div>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-blue-600 px-6 py-3 text-center text-base font-semibold text-white transition hover:bg-blue-500"
              >
                App Store でダウンロード
              </a>
            </div>
          ) : loading ? (
            <p className="text-center text-sm text-slate-500">
              プランを読み込み中…
            </p>
          ) : packages.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              現在利用可能なプランがありません。
            </p>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg) => (
                <button
                  key={pkg.identifier}
                  type="button"
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    selectedPkg === pkg.identifier
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                  onClick={() => setSelectedPkg(pkg.identifier)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {pkg.title}
                      </p>
                      <p className="text-xs text-slate-500">{pkg.description}</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">
                      {pkg.priceString}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-rose-600">{error}</p>
          )}

          {/* Actions (native only) */}
          {isNative && (
          <div className="space-y-3">
            <button
              type="button"
              className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handlePurchase}
              disabled={purchasing || !selectedPkg || loading}
            >
              {purchasing ? '処理中…' : 'Premium に登録する'}
            </button>
            <button
              type="button"
              className="w-full text-center text-sm font-medium text-slate-500 underline decoration-slate-300 hover:text-slate-700"
              onClick={handleRestore}
              disabled={purchasing}
            >
              以前の購入を復元する
            </button>
          </div>
          )}

          {/* Legal */}
          {isNative && (
          <p className="text-center text-xs text-slate-400 leading-relaxed">
            サブスクリプションは自動更新されます。次回の請求日の24時間前までにキャンセルしない限り自動的に更新されます。
            購入確定時にApple IDアカウントに課金されます。
          </p>
          )}
        </div>
      </div>
    </div>
  );
}
