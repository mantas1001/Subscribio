import { useEffect } from 'react';
import { ChartLineUp } from '@phosphor-icons/react';
import Button from '../ui/Button';
import { analyticsAvailable, initAnalytics, reopenConsent, setConsent, useConsent } from '../../analytics/clarity';

/**
 * Asks once whether Microsoft Clarity may record how the app is used. Nothing loads until
 * "Allow analytics". Both buttons look equally weighted, as EU guidance asks.
 * Only shown when Clarity is configured (VITE_CLARITY_ID).
 */
export default function ConsentBanner() {
  const consent = useConsent();

  useEffect(() => {
    initAnalytics(); // visitor agreed on an earlier visit
  }, []);

  if (!analyticsAvailable || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      aria-describedby="consent-text"
      className="fixed inset-x-3 bottom-[calc(theme(spacing.tabbar)+12px)] z-40 mx-auto max-w-[416px] rounded-xl border border-line bg-surface p-4 shadow-overlay lg:inset-x-auto lg:bottom-6 lg:right-6 lg:mx-0 lg:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
        >
          <ChartLineUp size={18} weight="bold" />
        </span>
        <div className="min-w-0">
          <h2 id="consent-title" className="text-small font-semibold text-brand-ink">
            Help us improve Subscribio
          </h2>
          <p id="consent-text" className="mt-1 text-caption text-muted">
            We would like to use Microsoft Clarity to see how the app is used: clicks, scrolling and
            anonymous session recordings. It sets cookies, so it only starts if you allow it.{' '}
            <a
              href="https://privacy.microsoft.com/privacystatement"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand underline underline-offset-2 hover:text-brand-ink"
            >
              Microsoft privacy statement
            </a>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="w-full" onClick={() => setConsent('denied')}>
          Decline
        </Button>
        <Button variant="secondary" className="w-full" onClick={() => setConsent('granted')}>
          Allow analytics
        </Button>
      </div>
    </div>
  );
}

/** Small link that reopens the choice, so people can withdraw consent as easily as they gave it. */
export function PrivacySettingsLink({ className = '' }: { className?: string }) {
  if (!analyticsAvailable) return null;
  return (
    <button
      type="button"
      onClick={reopenConsent}
      className={`rounded-sm px-2 py-1 text-caption text-muted underline underline-offset-2 transition-[color] duration-150 hover:text-brand-ink ${className}`}
    >
      Privacy settings
    </button>
  );
}
