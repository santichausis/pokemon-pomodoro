import { useEffect, useState } from 'react';
import { T } from '@/lib/i18n';

// `??` (not `||`) so an explicit empty string can intentionally disable GA.
// No hardcoded fallback ID: a fork without its own NEXT_PUBLIC_GA_ID should
// simply not send analytics anywhere, not silently report to the original
// author's account.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';

export default function CookieConsent({ lang = 'en' }) {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('poke-analytics-consent');
    if (!consent) {
      setShowConsent(true);
    } else if (consent === 'accepted') {
      initializeGA();
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('poke-analytics-consent', 'accepted');
    setShowConsent(false);
    initializeGA();
  };

  const rejectCookies = () => {
    localStorage.setItem('poke-analytics-consent', 'rejected');
    setShowConsent(false);
  };

  const t = T[lang] || T.en;

  if (!showConsent) return null;

  return (
    <div className="cookieConsent" role="dialog" aria-label="Cookie consent">
      <div className="cookieContent">
        <p className="cookieText">{t.cookieText}</p>
        <div className="cookieButtons">
          <button className="cookieBtn cookieBtnReject" onClick={rejectCookies}>
            {t.cookieReject}
          </button>
          <button className="cookieBtn cookieBtnAccept" onClick={acceptCookies}>
            {t.cookieAccept}
          </button>
        </div>
      </div>
    </div>
  );
}

function initializeGA() {
  if (typeof window === 'undefined' || !GA_ID) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA_ID, {
    page_path: window.location.pathname,
  });

  window.gtag = gtag;
}
