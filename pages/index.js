import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { GENERATIONS, TYPE_CLASSES } from '@/lib/constants';
import { playCompletionSound, fetchRandomPokemon, getDateStr, copyToClipboard } from '@/lib/utils';
import { checkAchievements } from '@/lib/achievements';
import { getRarity } from '@/lib/rarity';
import { playSoundEffect, getSoundSettings } from '@/lib/soundEffects';

// Dynamic imports
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const CaptureModal = dynamic(() => import('@/components/CaptureModal'), { ssr: false });
const PokemonGrid = dynamic(() => import('@/components/PokemonGrid'), { ssr: false });
const FriendCollection = dynamic(() => import('@/components/FriendCollection'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const AchievementBadge = dynamic(() => import('@/components/AchievementBadge'), { ssr: false });

const CIRCUMFERENCE = 2 * Math.PI * 104;

const T = {
  en: {
    title:           ['Pokémon', 'Pomodoro'],
    goalLabel:       "What's your goal?",
    goalPlaceholder: 'E.g.: Finish chapter 3...',
    stats:           ['sessions', 'focused', 'day streak', 'unique'],
    generationLabel: 'Generation',
    genLabels:       { all: 'All', gen1: 'Gen I', gen2: 'Gen II', gen3: 'Gen III', gen4: 'Gen IV', gen5: 'Gen V', gen6: 'Gen VI', gen7: 'Gen VII', gen8: 'Gen VIII' },
    customPlaceholder: 'min',
    btnReset:        '↩ Reset',
    btnStart:        '▶ Start',
    btnPause:        '⏸ Pause',
    btnContinue:     '▶ Continue',
    statusReady:     'Ready',
    statusFocusing:  'Focusing...',
    statusPaused:    'Paused',
    statusDone:      'Done!',
    pokedexTitle:    'Your Pokédex',
    btnExport:       '↓ Export',
    btnImport:       '↑ Import',
    btnShare:        '🔗 Share',
    btnCopied:       '✓ Copied!',
    emptyLine1:      'Complete your first session',
    emptyLine2:      'to catch your first Pokémon',
    modalStars:      '✦ ✦ ✦',
    modalTitle:      'Goal Complete!',
    capturedBanner:  'Caught! ⭐',
    btnContinueModal:'Continue!',
    notifTitle:      'Pokémon Pomodoro!',
    notifBody:       name => `Session complete! You caught ${name} 🎉`,
    friendTitle:     "Rival's Collection",
  },
  es: {
    title:           ['Pokémon', 'Pomodoro'],
    goalLabel:       '¿Cuál es tu objetivo?',
    goalPlaceholder: 'Ej: Terminar el capítulo 3...',
    stats:           ['sesiones', 'concentrado', 'días seguidos', 'únicos'],
    generationLabel: 'Generación',
    genLabels:       { all: 'Todos', gen1: 'Gen I', gen2: 'Gen II', gen3: 'Gen III', gen4: 'Gen IV', gen5: 'Gen V', gen6: 'Gen VI', gen7: 'Gen VII', gen8: 'Gen VIII' },
    customPlaceholder: 'min',
    btnReset:        '↩ Reset',
    btnStart:        '▶ Iniciar',
    btnPause:        '⏸ Pausar',
    btnContinue:     '▶ Continuar',
    statusReady:     'Listo',
    statusFocusing:  'Concentrándote...',
    statusPaused:    'Pausado',
    statusDone:      '¡Completado!',
    pokedexTitle:    'Tu Pokédex',
    btnExport:       '↓ Exportar',
    btnImport:       '↑ Importar',
    btnShare:        '🔗 Compartir',
    btnCopied:       '✓ Copiado!',
    emptyLine1:      'Completá tu primera sesión',
    emptyLine2:      'para capturar tu primer Pokémon',
    modalStars:      '✦ ✦ ✦',
    modalTitle:      '¡Objetivo Cumplido!',
    capturedBanner:  '¡Capturado! ⭐',
    btnContinueModal:'¡Continuar!',
    notifTitle:      '¡Pokémon Pomodoro!',
    notifBody:       name => `¡Sesión completada! Capturaste a ${name} 🎉`,
    friendTitle:     'Colección de tu rival',
  },
};

export default function Home() {
  const [lang, setLang]             = useState('en');
  const [theme, setTheme]           = useState('light');
  const t = T[lang];

  const [totalSec, setTotalSec]     = useState(25 * 60);
  const [remaining, setRemaining]   = useState(25 * 60);
  const [running, setRunning]       = useState(false);
  const [goal, setGoal]             = useState('');
  const [statusKey, setStatusKey]   = useState('ready');
  const [activeDur, setActiveDur]   = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal]   = useState('');
  const [mode, setMode]             = useState('all');

  const [collection, setCollection]             = useState([]);
  const [sessions, setSessions]                 = useState([]);
  const [friendCollection, setFriendCollection] = useState([]);

  const [showModal, setShowModal]     = useState(false);
  const [modalPhase, setModalPhase]   = useState('shaking');
  const [captured, setCaptured]       = useState(null);
  const [currentGoal, setCurrentGoal] = useState('');

  const [copied, setCopied] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  const intervalRef   = useRef(null);
  const totalSecRef   = useRef(totalSec);
  const modeRef       = useRef(mode);
  const importRef     = useRef(null);
  totalSecRef.current = totalSec;
  modeRef.current     = mode;

  // Load sound settings on mount
  useEffect(() => {
    const settings = getSoundSettings();
    setSoundsEnabled(settings.soundsEnabled);
  }, []);

  const statusLabel = {
    ready: t.statusReady, focusing: t.statusFocusing,
    paused: t.statusPaused, done: t.statusDone,
  }[statusKey] ?? t.statusReady;

  useEffect(() => {
    const saved = localStorage.getItem('poke-lang');
    if (saved === 'en' || saved === 'es') {
      setLang(saved);
    } else {
      // Auto-detect browser language
      if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language || navigator.userLanguage;
        const detectedLang = browserLang.startsWith('es') ? 'es' : 'en';
        setLang(detectedLang);
        localStorage.setItem('poke-lang', detectedLang);
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('poke-theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    } else {
      // Auto-detect system preference
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const detected = prefersDark ? 'dark' : 'light';
        setTheme(detected);
        localStorage.setItem('poke-theme', detected);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('poke-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    const c = localStorage.getItem('poke-collection');
    if (c) setCollection(JSON.parse(c));
    const s = localStorage.getItem('poke-sessions');
    if (s) setSessions(JSON.parse(s));
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const data = JSON.parse(atob(decodeURIComponent(hash.slice(7))));
        setFriendCollection(data.collection || []);
      } catch (_) {}
    }
  }, []);

  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalSeconds  = sessions.reduce((a, s) => a + (s.duration || 0), 0);
    const hours   = Math.floor(totalSeconds / 3600);
    const mins    = Math.floor((totalSeconds % 3600) / 60);
    const timeStr = totalSeconds === 0 ? '0m' : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    const uniquePokemon = new Set(collection.map(p => p.id)).size;
    const sessionDays   = new Set(sessions.map(s => s.date));
    let streak = 0, daysAgo = 0;
    while (sessionDays.has(getDateStr(daysAgo))) { streak++; daysAgo++; }
    return { totalSessions, timeStr, streak, uniquePokemon };
  }, [sessions, collection]);

  const ringOffset = CIRCUMFERENCE * (1 - remaining / totalSec);
  const ringClass  = remaining <= 0 ? 'timerRingDone' : remaining <= 60 ? 'timerRingWarning' : '';
  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const stopTimer = useCallback(() => { clearInterval(intervalRef.current); intervalRef.current = null; }, []);

  const handleComplete = useCallback(async () => {
    setRunning(false);
    setStatusKey('done');
    trackEvent('timer_complete', { duration_min: totalSec / 60, goal: currentGoal });
    playCompletionSound();

    const entry = { date: getDateStr(), duration: totalSecRef.current, goal: currentGoal };
    setSessions(prev => { const next = [entry, ...prev]; localStorage.setItem('poke-sessions', JSON.stringify(next)); return next; });

    setShowModal(true); setModalPhase('shaking'); setCaptured(null);

    let pokemon;
    try { pokemon = await fetchRandomPokemon(GENERATIONS[modeRef.current]?.range || [1, 898]); }
    catch (_) { pokemon = { id: 25, name: 'Pikachu', sprite: '', types: ['electric'] }; }

    // Add rarity to pokemon
    const rarity = getRarity(pokemon.id);
    pokemon = { ...pokemon, rarity };

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const tSnap = T[lang] || T.en;
      new Notification(tSnap.notifTitle, { body: tSnap.notifBody(pokemon.name), icon: '/favicon.ico' });
    }

    setTimeout(() => {
      setModalPhase('opening');
      setTimeout(() => {
        setCaptured(pokemon);
        setModalPhase('reveal');
        playSoundEffect('pokemon-catch', soundsEnabled);

        setCollection(prev => {
          const e = { ...pokemon, goal: currentGoal, date: getDateStr(), session: Date.now(), achievements: [] };
          const next = [e, ...prev];

          // Check for new achievements
          const stats = { totalSessions: sessions.length + 1, timeStr: '0m', streak: 0, uniquePokemon: new Set(next.map(p => p.id)).size };
          const newAchievements = checkAchievements(stats, next, sessions);
          setAchievements(newAchievements);

          if (newAchievements.length > 0) {
            playSoundEffect('achievement', soundsEnabled);
          }

          localStorage.setItem('poke-collection', JSON.stringify(next));
          return next;
        });
      }, 450);
    }, 2200);
  }, [currentGoal, lang, sessions, soundsEnabled]);

  const trackEvent = useCallback((eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  }, []);

  const startPause = useCallback(() => {
    if (running) {
      stopTimer(); setRunning(false); setStatusKey('paused');
    } else {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setCurrentGoal(goal || 'No goal set');
      setRunning(true); setStatusKey('focusing');
      trackEvent('timer_start', { duration_min: totalSec / 60 });
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); intervalRef.current = null; return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }, [running, goal, stopTimer, totalSec, trackEvent]);

  useEffect(() => {
    if (remaining === 0 && running) { setRunning(false); handleComplete(); }
  }, [remaining, running, handleComplete]);

  const reset = useCallback(() => {
    stopTimer(); setRunning(false); setRemaining(totalSec); setStatusKey('ready');
  }, [stopTimer, totalSec]);

  const setDuration = min => {
    stopTimer(); setRunning(false); setActiveDur(min);
    setTotalSec(min * 60); setRemaining(min * 60); setStatusKey('ready');
    trackEvent('duration_selected', { duration_min: min });
  };

  const applyCustom = () => {
    const val = parseInt(customVal);
    if (!val || val < 1 || val > 180) return;
    stopTimer(); setRunning(false); setActiveDur('custom');
    setTotalSec(val * 60); setRemaining(val * 60); setStatusKey('ready');
    setShowCustom(false); setCustomVal('');
  };

  const closeModal = () => { setShowModal(false); reset(); };

  function exportCollection() {
    const blob = new Blob([JSON.stringify({ collection, sessions }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'pokemodoro-backup.json' });
    trackEvent('export_collection', { pokemon_count: collection.length, sessions_count: sessions.length });
    a.click(); URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.collection) {
          setCollection(data.collection);
          localStorage.setItem('poke-collection', JSON.stringify(data.collection));
          trackEvent('import_collection', { pokemon_count: data.collection.length });
        }
        if (data.sessions) {
          setSessions(data.sessions);
          localStorage.setItem('poke-sessions', JSON.stringify(data.sessions));
        }
      } catch (_) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function shareCollection() {
    const encoded = encodeURIComponent(btoa(JSON.stringify({ collection })));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    try {
      await copyToClipboard(url);
      trackEvent('share_collection', { pokemon_count: collection.length });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  }

  const durations = [25, 45, 60];

  return (
    <>
      <Head>
        <title>Pokémon Pomodoro</title>
        <meta name="description" content="Pokémon-themed Pomodoro timer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app">
        <div className="langBar">
          <button className={`langBtn${lang === 'en' ? ' langBtnActive' : ''}`} onClick={() => { setLang('en'); localStorage.setItem('poke-lang','en'); }}>EN</button>
          <span className="langSep">|</span>
          <button className={`langBtn${lang === 'es' ? ' langBtnActive' : ''}`} onClick={() => { setLang('es'); localStorage.setItem('poke-lang','es'); }}>ES</button>
          <div className="themeBar">
            <button className={`themeBtn${theme === 'light' ? ' themeBtnActive' : ''}`} onClick={() => setTheme('light')} title="Light mode">☀️</button>
            <span className="themeSep">|</span>
            <button className={`themeBtn${theme === 'dark' ? ' themeBtnActive' : ''}`} onClick={() => setTheme('dark')} title="Dark mode">🌙</button>
          </div>
          <button
            className={`soundToggle${soundsEnabled ? ' enabled' : ''}`}
            onClick={() => {
              setSoundsEnabled(!soundsEnabled);
              localStorage.setItem('poke-sounds-enabled', !soundsEnabled ? 'true' : 'false');
              playSoundEffect('achievement', !soundsEnabled);
            }}
            title={soundsEnabled ? 'Sounds on' : 'Sounds off'}
          >
            {soundsEnabled ? '🔊' : '🔇'}
          </button>
        </div>

        <header className="appHeader">
          <div className="headerPokeball">
            <div className="hpbTop" /><div className="hpbBand"><div className="hpbBtn" /></div><div className="hpbBottom" />
          </div>
          <h1 className="appTitle">{t.title[0]}<br /><span>{t.title[1]}</span></h1>
          <div className="headerPokeball">
            <div className="hpbTop" /><div className="hpbBand"><div className="hpbBtn" /></div><div className="hpbBottom" />
          </div>
        </header>

        <div className="statsBar">
          <div className="statItem"><span className="statValue">{stats.totalSessions}</span><span className="statLabel">{t.stats[0]}</span></div>
          <div className="statDivider" />
          <div className="statItem"><span className="statValue">{stats.timeStr}</span><span className="statLabel">{t.stats[1]}</span></div>
          <div className="statDivider" />
          <div className="statItem"><span className="statValue">{stats.streak}{stats.streak > 0 ? ' 🔥' : ''}</span><span className="statLabel">{t.stats[2]}</span></div>
          <div className="statDivider" />
          <div className="statItem"><span className="statValue">{stats.uniquePokemon}</span><span className="statLabel">{t.stats[3]}</span></div>
        </div>

        {achievements.length > 0 && (
          <div className="achievementsBar" style={{ padding: '14px 20px', background: 'var(--card)', borderRadius: 'var(--radius)', marginBottom: '14px', boxShadow: 'var(--shadow)', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {achievements.map(achId => (
              <AchievementBadge key={achId} achievementId={achId} size="small" />
            ))}
          </div>
        )}

        <main className="mainCard">
          <div className="goalWrapper">
            <label className="goalLabel" htmlFor="goal-input">{t.goalLabel}</label>
            <input id="goal-input" className="goalInput" type="text"
              placeholder={t.goalPlaceholder} maxLength={80}
              value={goal} onChange={e => setGoal(e.target.value)} autoComplete="off" />
          </div>

          <div className="timerWrapper">
            <svg className="timerSvg" viewBox="0 0 240 240">
              <circle className="timerTrack" cx="120" cy="120" r="104" />
              <circle className={`timerRing ${ringClass}`} cx="120" cy="120" r="104"
                transform="rotate(-90 120 120)" style={{ strokeDashoffset: ringOffset }} />
            </svg>
            <div className="timerFace">
              <div className="timerTime">{fmt(remaining)}</div>
              <div className="timerStatus">{statusLabel}</div>
            </div>
          </div>

          <div className="durationRow">
            {durations.map(d => (
              <button key={d} className={`durBtn${activeDur === d ? ' durBtnActive' : ''}`}
                onClick={() => setDuration(d)} disabled={running}>{d} min</button>
            ))}
            <button className={`durBtn${activeDur === 'custom' ? ' durBtnActive' : ''}`}
              onClick={() => setShowCustom(v => !v)} disabled={running}>Custom</button>
          </div>

          {showCustom && (
            <div className="customRow">
              <input className="customInput" type="number" min={1} max={180}
                placeholder={t.customPlaceholder} value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCustom()} autoFocus />
              <button className="durBtn durBtnActive" onClick={applyCustom}>OK</button>
            </div>
          )}

          <div className="modeWrapper">
            <span className="modeLabel">{t.generationLabel}</span>
            <div className="modeRow">
              {Object.entries(GENERATIONS).map(([key]) => (
                <button key={key} className={`modeBtn${mode === key ? ' modeBtnActive' : ''}`}
                  onClick={() => setMode(key)} disabled={running}>{t.genLabels[key]}</button>
              ))}
            </div>
          </div>

          <div className="controlsRow">
            <button className="ctrlBtn ctrlBtnSecondary" onClick={reset}>{t.btnReset}</button>
            <button className="ctrlBtn ctrlBtnPrimary" onClick={startPause}>
              {running ? t.btnPause : statusKey === 'paused' ? t.btnContinue : t.btnStart}
            </button>
          </div>
        </main>

        <section className="collectionSection">
          <div className="collectionHeader">
            <div className="collectionTitleGroup">
              <h2 className="collectionTitle">{t.pokedexTitle}</h2>
              <span className="collectionBadge">{collection.length}</span>
            </div>
            <div className="collectionActions">
              <button className="actionBtn" onClick={exportCollection}>{t.btnExport}</button>
              <button className="actionBtn" onClick={() => importRef.current?.click()}>{t.btnImport}</button>
              <button className={`actionBtn${copied ? ' actionBtnSuccess' : ''}`} onClick={shareCollection}>
                {copied ? t.btnCopied : t.btnShare}
              </button>
              <input type="file" ref={importRef} accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </div>
          </div>
          <PokemonGrid collection={collection} lang={lang} t={t} />
        </section>

        <FriendCollection friendCollection={friendCollection} t={t} />

        <CaptureModal
          showModal={showModal}
          modalPhase={modalPhase}
          captured={captured}
          currentGoal={currentGoal}
          t={t}
          closeModal={closeModal}
        />

        <Footer />
        <CookieConsent />
      </div>
    </>
  );
}
