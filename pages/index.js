import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { GENERATIONS } from '@/lib/constants';
import { playCompletionSound, fetchRandomPokemon, getDateStr, copyToClipboard, playPokemonCry, encodeShare, decodeShare, readStored } from '@/lib/utils';
import { checkAchievements, checkTimeBasedAchievements, mergeAchievements } from '@/lib/achievements';
import { getRarity } from '@/lib/rarity';
import { playSoundEffect } from '@/lib/soundEffects';
import { T, detectLang } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { useTimer } from '@/hooks/useTimer';
import { usePersistentState } from '@/hooks/usePersistentState';

// Dynamic imports
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });
const CaptureModal = dynamic(() => import('@/components/CaptureModal'), { ssr: false });
const PokemonGrid = dynamic(() => import('@/components/PokemonGrid'), { ssr: false });
const FriendCollection = dynamic(() => import('@/components/FriendCollection'), { ssr: false });
const Footer = dynamic(() => import('@/components/Footer'), { ssr: false });
const AchievementBadge = dynamic(() => import('@/components/AchievementBadge'), { ssr: false });
const Background = dynamic(() => import('@/components/Background'), { ssr: false });
const Confetti = dynamic(() => import('@/components/Confetti'), { ssr: false });

const CIRCUMFERENCE = 2 * Math.PI * 104;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pokemon-pomodoro.vercel.app';

export default function Home() {
  const [lang, setLang] = useState('en');
  const { themeMode, chooseTheme } = useTheme();
  const t = T[lang];

  const [goal, setGoal]             = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal]   = useState('');
  const [mode, setMode]             = useState('all');
  const [zenMode, setZenMode]       = useState(false);

  const [collection, setCollection]             = useState([]);
  const [sessions, setSessions]                 = useState([]);
  const [friendCollection, setFriendCollection] = useState([]);

  const [showModal, setShowModal]     = useState(false);
  const [modalPhase, setModalPhase]   = useState('shaking');
  const [captured, setCaptured]       = useState(null);
  const [currentGoal, setCurrentGoal] = useState('');

  const [copied, setCopied] = useState(false);
  const [achievements, setAchievements] = usePersistentState('poke-achievements', []);
  const [soundsEnabled, setSoundsEnabled] = usePersistentState('poke-sounds-enabled', true);

  const modeRef         = useRef(mode);
  const importRef       = useRef(null);
  const soundsRef       = useRef(soundsEnabled);
  const achievementsRef = useRef(achievements);
  modeRef.current       = mode;
  soundsRef.current     = soundsEnabled;
  achievementsRef.current = achievements;

  const trackEvent = useCallback((eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  }, []);

  // Runs when the timer reaches zero: log the session and roll a Pokémon.
  const handleComplete = useCallback(async (durationSec) => {
    trackEvent('timer_complete', { duration_min: durationSec / 60, goal: currentGoal });
    playCompletionSound();

    const entry = { date: getDateStr(), duration: durationSec, goal: currentGoal };
    setSessions(prev => { const next = [entry, ...prev]; localStorage.setItem('poke-sessions', JSON.stringify(next)); return next; });

    setShowModal(true); setModalPhase('shaking'); setCaptured(null);

    let pokemon;
    try { pokemon = await fetchRandomPokemon(GENERATIONS[modeRef.current]?.range || [1, 898]); }
    catch (_) { pokemon = { id: 25, name: 'Pikachu', sprite: '', types: ['electric'], cry: '' }; }

    pokemon = { ...pokemon, rarity: getRarity(pokemon.id) };

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const tSnap = T[lang] || T.en;
      new Notification(tSnap.notifTitle, { body: tSnap.notifBody(pokemon.name), icon: '/favicon.ico' });
    }

    setTimeout(() => {
      setModalPhase('opening');
      setTimeout(() => {
        setCaptured(pokemon);
        setModalPhase('reveal');
        playSoundEffect('pokemon-catch', soundsRef.current);
        playPokemonCry(pokemon.cry, soundsRef.current);

        setCollection(prev => {
          const e = { ...pokemon, goal: currentGoal, date: getDateStr(), session: Date.now(), achievements: [] };
          const next = [e, ...prev];
          localStorage.setItem('poke-collection', JSON.stringify(next));
          return next;
        });

        // Time-of-day achievements only make sense evaluated right now, at the
        // moment of capture — everything else is derived reactively below from
        // the updated collection/sessions (see the effect watching `stats`).
        const timeBasedUnlocks = checkTimeBasedAchievements();
        if (timeBasedUnlocks.length > 0) {
          const merged = mergeAchievements(achievementsRef.current, timeBasedUnlocks);
          if (merged !== achievementsRef.current) {
            setAchievements(merged);
            playSoundEffect('achievement', soundsRef.current);
          }
        }
      }, 450);
    }, 2200);
  }, [currentGoal, lang, trackEvent]);

  const timer = useTimer({ initialMinutes: 25, onComplete: handleComplete });
  const { totalSec, remaining, running, statusKey, activeDur, timerState, start, pause, reset: resetTimer, applyDuration } = timer;

  const statusLabel = {
    ready: t.statusReady, focusing: t.statusFocusing,
    paused: t.statusPaused, done: t.statusDone,
  }[statusKey] ?? t.statusReady;

  // Detect / restore language
  useEffect(() => {
    const saved = localStorage.getItem('poke-lang');
    if (saved === 'en' || saved === 'es') {
      setLang(saved);
    } else {
      const detected = detectLang();
      setLang(detected);
      localStorage.setItem('poke-lang', detected);
    }
  }, []);

  // Keep <html lang> in sync with the active language
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Hydrate persisted data
  useEffect(() => {
    const c = readStored('poke-collection');
    if (Array.isArray(c)) setCollection(c);
    const s = readStored('poke-sessions');
    if (Array.isArray(s)) setSessions(s);
  }, []);

  // Load a shared rival collection from the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const data = decodeShare(decodeURIComponent(hash.slice(7)));
        setFriendCollection(data.collection || []);
      } catch (_) {}
    }
  }, []);

  // Drive the dynamic ambient background via timer state
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('data-timer', timerState);
  }, [timerState]);

  // Focus (zen) mode only makes sense during an active session
  const sessionActive = running || statusKey === 'paused';
  useEffect(() => {
    if (!sessionActive && zenMode) setZenMode(false);
  }, [sessionActive, zenMode]);

  // Allow exiting zen mode with the Escape key
  useEffect(() => {
    if (!zenMode) return;
    const onKey = e => { if (e.key === 'Escape') setZenMode(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zenMode]);

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

  // Keep unlocked achievements in sync with real progress — runs on first
  // load (fixing already-unlocked achievements not showing until the next
  // catch), after import, and whenever stats/collection/sessions change.
  // Achievements are only ever added, never removed (see mergeAchievements).
  useEffect(() => {
    if (collection.length === 0 && sessions.length === 0) return;
    const unlocked = checkAchievements(stats, collection, sessions, { includeTimeBased: false });
    const merged = mergeAchievements(achievements, unlocked);
    if (merged !== achievements) {
      setAchievements(merged);
      if (merged.length > achievements.length) playSoundEffect('achievement', soundsRef.current);
    }
  }, [stats, collection, sessions, achievements, setAchievements]);

  const ringOffset = CIRCUMFERENCE * (1 - remaining / totalSec);
  const ringClass  = remaining <= 0 ? 'timerRingDone' : remaining <= 60 ? 'timerRingWarning' : '';
  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const onToggle = useCallback(() => {
    if (running) { pause(); return; }
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setCurrentGoal(goal || 'No goal set');
    trackEvent('timer_start', { duration_min: totalSec / 60 });
    start();
  }, [running, pause, start, goal, totalSec, trackEvent]);

  const onReset = useCallback(() => { resetTimer(); setZenMode(false); }, [resetTimer]);

  const onSetDuration = min => { applyDuration(min); trackEvent('duration_selected', { duration_min: min }); };

  const applyCustom = () => {
    const val = parseInt(customVal);
    if (!val || val < 1 || val > 180) return;
    applyDuration(val, 'custom');
    setShowCustom(false); setCustomVal('');
  };

  const closeModal = () => { setShowModal(false); onReset(); };

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
    const encoded = encodeURIComponent(encodeShare({ collection }));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    try {
      await copyToClipboard(url);
      trackEvent('share_collection', { pokemon_count: collection.length });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  }

  const durations = [25, 45, 60];
  const description = 'A Pokémon-themed Pomodoro timer. Complete focus sessions, catch surprise Pokémon, and build your Pokédex.';

  return (
    <>
      <Head>
        <title>{statusKey === 'ready' ? 'Pokémon Pomodoro — Focus & Catch' : `${fmt(remaining)} · Pokémon Pomodoro`}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#EE1515" />
        <link rel="canonical" href={SITE_URL} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="alternate icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pokémon Pomodoro" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pokémon Pomodoro" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />
      </Head>

      <Background />

      <div className={`app${zenMode ? ' zen' : ''}`}>
        <div className="topBar">
          <div className="langBar">
            <button className={`langBtn${lang === 'en' ? ' langBtnActive' : ''}`} aria-label="English" aria-pressed={lang === 'en'} onClick={() => { setLang('en'); localStorage.setItem('poke-lang','en'); }}>EN</button>
            <span className="langSep">|</span>
            <button className={`langBtn${lang === 'es' ? ' langBtnActive' : ''}`} aria-label="Español" aria-pressed={lang === 'es'} onClick={() => { setLang('es'); localStorage.setItem('poke-lang','es'); }}>ES</button>
          </div>
          <div className="themeBar">
            <button className={`themeBtn${themeMode === 'light' ? ' themeBtnActive' : ''}`} onClick={() => chooseTheme('light')} title="Light mode" aria-label="Light mode" aria-pressed={themeMode === 'light'}>☀️</button>
            <button className={`themeBtn${themeMode === 'dark' ? ' themeBtnActive' : ''}`} onClick={() => chooseTheme('dark')} title="Dark mode" aria-label="Dark mode" aria-pressed={themeMode === 'dark'}>🌙</button>
            <button className={`themeBtn${themeMode === 'auto' ? ' themeBtnActive' : ''}`} onClick={() => chooseTheme('auto')} title="Auto (system)" aria-label="Auto theme (system)" aria-pressed={themeMode === 'auto'}>🖥️</button>
          </div>
          <button
            className={`soundToggle${soundsEnabled ? ' enabled' : ''}`}
            onClick={() => {
              const next = !soundsEnabled;
              setSoundsEnabled(next);
              playSoundEffect('achievement', next);
            }}
            title={soundsEnabled ? 'Sounds on' : 'Sounds off'}
            aria-label={soundsEnabled ? 'Sounds on' : 'Sounds off'}
            aria-pressed={soundsEnabled}
          >
            {soundsEnabled ? '🔊' : '🔇'}
          </button>
          {sessionActive && (
            <button
              className={`zenToggle${zenMode ? ' active' : ''}`}
              onClick={() => setZenMode(z => !z)}
              title={t.zenTitle}
              aria-label={t.zenTitle}
              aria-pressed={zenMode}
            >
              🧘
            </button>
          )}
        </div>

        <div className="dashboard">
          <div className="leftPanel">
            <header className="appHeader">
              <div className="headerPokeball">
                <div className="hpbTop" /><div className="hpbBand"><div className="hpbBtn" /></div><div className="hpbBottom" />
              </div>
              <h1 className="appTitle">{t.title[0]}<br /><span>{t.title[1]}</span></h1>
              <div className="headerPokeball">
                <div className="hpbTop" /><div className="hpbBand"><div className="hpbBtn" /></div><div className="hpbBottom" />
              </div>
            </header>

            <div className="statsBar glass">
              <div className="statItem"><span className="statValue">{stats.totalSessions}</span><span className="statLabel">{t.stats[0]}</span></div>
              <div className="statDivider" />
              <div className="statItem"><span className="statValue">{stats.timeStr}</span><span className="statLabel">{t.stats[1]}</span></div>
              <div className="statDivider" />
              <div className="statItem"><span className="statValue">{stats.streak}{stats.streak > 0 ? ' 🔥' : ''}</span><span className="statLabel">{t.stats[2]}</span></div>
              <div className="statDivider" />
              <div className="statItem"><span className="statValue">{stats.uniquePokemon}</span><span className="statLabel">{t.stats[3]}</span></div>
            </div>

            {achievements.length > 0 && (
              <div className="achievementsBar glass">
                {achievements.map(achId => (
                  <AchievementBadge key={achId} achievementId={achId} size="small" />
                ))}
              </div>
            )}

            <main className="mainCard glass">
              <div className="goalWrapper">
                <label className="goalLabel" htmlFor="goal-input">{t.goalLabel}</label>
                <input id="goal-input" className="goalInput" type="text"
                  placeholder={t.goalPlaceholder} maxLength={80}
                  value={goal} onChange={e => setGoal(e.target.value)} autoComplete="off" />
              </div>

              <div className="timerWrapper" role="timer" aria-label={`${fmt(remaining)} — ${statusLabel}`}>
                <div className="timerGlow" aria-hidden="true" />
                <svg className="timerSvg" viewBox="0 0 240 240" aria-hidden="true">
                  <circle className="timerTrack" cx="120" cy="120" r="104" />
                  <circle className={`timerRing ${ringClass}`} cx="120" cy="120" r="104"
                    transform="rotate(-90 120 120)" style={{ strokeDashoffset: ringOffset }} />
                </svg>
                <div className="timerFace">
                  <div className="timerTime">{fmt(remaining)}</div>
                  <div className="timerStatus" aria-live="polite">{statusLabel}</div>
                </div>
              </div>

              <div className="durationRow">
                {durations.map(d => (
                  <button key={d} className={`durBtn${activeDur === d ? ' durBtnActive' : ''}`}
                    onClick={() => onSetDuration(d)} disabled={running}>{d} min</button>
                ))}
                <button className={`durBtn${activeDur === 'custom' ? ' durBtnActive' : ''}`}
                  onClick={() => setShowCustom(v => !v)} disabled={running}>Custom</button>
              </div>

              {showCustom && (
                <div className="customRow">
                  <input className="customInput" type="number" min={1} max={180}
                    placeholder={t.customPlaceholder} value={customVal}
                    onChange={e => setCustomVal(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') applyCustom();
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') e.preventDefault();
                    }} autoFocus />
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
                <button className="ctrlBtn ctrlBtnSecondary" onClick={onReset}>{t.btnReset}</button>
                <button className="ctrlBtn ctrlBtnPrimary" onClick={onToggle}>
                  {running ? t.btnPause : statusKey === 'paused' ? t.btnContinue : t.btnStart}
                </button>
              </div>
            </main>
          </div>

          <div className="rightPanel">
            <section className="collectionSection collectionPanel glass">
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
              <div className="collectionScroll">
                <PokemonGrid collection={collection} t={t} lang={lang} />
              </div>
            </section>

            <FriendCollection friendCollection={friendCollection} t={t} lang={lang} />
          </div>
        </div>

        <CaptureModal
          showModal={showModal}
          modalPhase={modalPhase}
          captured={captured}
          currentGoal={currentGoal}
          t={t}
          lang={lang}
          closeModal={closeModal}
        />
        {showModal && modalPhase === 'reveal' && <Confetti />}
        {zenMode && <div className="zenHint">{t.zenHint}</div>}

        <Footer />
        <CookieConsent lang={lang} />
      </div>
    </>
  );
}
