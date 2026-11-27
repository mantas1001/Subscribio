import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import { clarityAvailable, readConsent, setConsent, type Consent } from './clarity';

/**
 * "Allow analytics?" banner for Microsoft Clarity. Shown until the visitor chooses; Clarity is
 * not loaded before "Allow". "Analytics settings" (resetConsent) brings it back.
 */
export default function ConsentBanner() {
  const [choice, setChoice] = useState<Consent | null>(() => readConsent());

  useEffect(() => {
    const onReset = () => setChoice(readConsent());
    window.addEventListener('subscribio:analytics-consent', onReset);
    return () => window.removeEventListener('subscribio:analytics-consent', onReset);
  }, []);

  if (!clarityAvailable || choice) return null;

  const choose = (consent: Consent) => {
    setConsent(consent);
    setChoice(consent);
  };

  return (
    <section
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-0 bottom-[calc(theme(spacing.tabbar)+12px)] z-40 mx-auto w-full max-w-app px-gutter lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0 lg:max-w-[400px] lg:px-0"
    >
      <div className="rounded-xl border border-line bg-surface p-4 shadow-overlay">
        <h2 id="analytics-consent-title" className="text-small font-semibold text-brand-ink">
          Help improve Subscribio?
        </h2>
        <p className="mt-1 text-caption text-muted">
          With your permission we use Microsoft Clarity to see how the app is used: clicks, scrolling
          and session recordings. Text you type is hidden. You can change this any time in Analytics
          settings.{' '}
          <a
            href="https://privacy.microsoft.com/privacystatement"
            target="_blank"
            rel="noreferrer"
            className="text-brand underline underline-offset-2"
          >
            Microsoft privacy statement
          </a>
        </p>
        <div className="mt-3 flex gap-2">
          <Button className="flex-1" onClick={() => choose('granted')}>
            Allow
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => choose('denied')}>
            No thanks
          </Button>
        </div>
      </div>
    </section>
  );
}
