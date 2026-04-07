import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const consent = localStorage.getItem('poke-analytics-consent');
    const savedLanguage = localStorage.getItem('poke-language') || 'en';
    setLanguage(savedLanguage);

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

  const translations = {
    en: {
      text: 'We use analytics to understand how you use our app and improve it. No personal data is collected.',
      reject: 'Reject',
      accept: 'Accept Analytics'
    },
    es: {
      text: 'Usamos análisis para entender cómo usas nuestra app y mejorarla. No se recopilan datos personales.',
      reject: 'Rechazar',
      accept: 'Aceptar Análisis'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <>
      {showConsent && (
        <div className="cookieConsent">
          <div className="cookieContent">
            <p className="cookieText">
              {t.text}
            </p>
            <div className="cookieButtons">
              <button className="cookieBtn cookieBtnReject" onClick={rejectCookies}>
                {t.reject}
              </button>
              <button className="cookieBtn cookieBtnAccept" onClick={acceptCookies}>
                {t.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function initializeGA() {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-08Q8TZKBRM';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', 'G-08Q8TZKBRM', {
    page_path: window.location.pathname,
  });

  window.gtag = gtag;
}
