import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { GENERATIONS, translateType } from '@/lib/constants';
import { playCompletionSound, fetchRandomPokemon, getDateStr, copyToClipboard, playPokemonCry, encodeShare, decodeShare, readStored } from '@/lib/utils';
import { sanitizeCollection, sanitizeSessions } from '@/lib/sanitize';
import { checkAchievements, checkTimeBasedAchievements, mergeAchievements } from '@/lib/achievements';
import { getRarity } from '@/lib/rarity';
import { playSoundEffect } from '@/lib/soundEffects';
import { T, detectLang } from '@/lib/i18n';
import { useTheme } from '@/hooks/useTheme';
import { useTimer } from '@/hooks/useTimer';
import { usePersistentState } from '@/hooks/usePersistentState';
import Pokeball from '@/components/Pokeball';
import TickUpNumber from '@/components/TickUpNumber';

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
  const [importMessage, setImportMessage] = useState('');
  const [notifPermission, setNotifPermission] = useState('default');
  const [pokedexQuery, setPokedexQuery] = useState('');
  const [pokedexTypeFilter, setPokedexTypeFilter] = useState('all');

  const modeRef          = useRef(mode);
  const importRef        = useRef(null);
  const soundsRef        = useRef(soundsEnabled);
  const achievementsRef  = useRef(achievements);
  const modalPhaseRef    = useRef(modalPhase);
  const pendingPokemonRef = useRef(null);
  const revealPendingRef = useRef(false);
  modeRef.current        = mode;
  soundsRef.current      = soundsEnabled;
  achievementsRef.current = achievements;
  modalPhaseRef.current  = modalPhase;

  const trackEvent = useCallback((eventName, eventParams = {}) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventParams);
    }
  }, []);

  // Called once the capture reveal animation has actually started (not on a
  // guessed timeout) — commits the catch to the collection/achievements.
  const revealCapturedPokemon = useCallback(() => {
    const pokemon = pendingPokemonRef.current;
    if (!pokemon) return;
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
    // moment of capture — everything else is derived reactively (see the
    // effect watching `stats`).
    const timeBasedUnlocks = checkTimeBasedAchievements();
    if (timeBasedUnlocks.length > 0) {
      const merged = mergeAchievements(achievementsRef.current, timeBasedUnlocks);
      if (merged !== achievementsRef.current) {
        setAchievements(merged);
        playSoundEffect('achievement', soundsRef.current);
      }
    }
  }, [currentGoal]);

  // Passed to CaptureModal as onPhaseComplete — called by Motion once the
  // current phase's animation genuinely finishes (shake, then the pop-open
  // burst), advancing shaking -> opening -> reveal without hardcoded
  // setTimeout durations that had to be kept in sync with CSS by hand.
  const advanceCapturePhase = useCallback(() => {
    if (modalPhaseRef.current === 'shaking') setModalPhase('opening');
    else if (modalPhaseRef.current === 'opening') {
      // The pop-open burst can finish before the PokéAPI fetch resolves
      // (fetch allows up to 8s). Rather than reveal a still-null pokemon,
      // mark the reveal as pending — handleComplete fires it itself once
      // the fetch actually resolves.
      if (pendingPokemonRef.current) revealCapturedPokemon();
      else revealPendingRef.current = true;
    }
  }, [revealCapturedPokemon]);

  // Fetches a Pokémon and drives the modal through shaking -> reveal/error.
  // Shared by the initial catch (handleComplete) and a manual retry after a
  // failed fetch (retryCapture) — same logic, just triggered differently.
  const attemptCapture = useCallback(async () => {
    pendingPokemonRef.current = null;
    revealPendingRef.current = false;

    let pokemon = null;
    try { pokemon = await fetchRandomPokemon(GENERATIONS[modeRef.current]?.range || [1, 898]); }
    catch (_) { pokemon = null; }

    // Couldn't reach PokéAPI (offline, timeout, or an error response) — be
    // honest about it instead of silently substituting a fake Pikachu catch.
    // The focus session is already saved either way. Give the shake a brief
    // beat before delivering the bad news instead of an instant cut.
    if (!pokemon) {
      setTimeout(() => setModalPhase('error'), 1200);
      return;
    }

    pokemon = { ...pokemon, rarity: getRarity(pokemon.id) };
    pendingPokemonRef.current = pokemon;
    if (revealPendingRef.current) {
      revealPendingRef.current = false;
      revealCapturedPokemon();
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const tSnap = T[lang] || T.en;
        new Notification(tSnap.notifTitle, { body: tSnap.notifBody(pokemon.name), icon: '/favicon.ico' });
      } else if (Notification.permission === 'default') {
        // Ask right after the first successful catch, not when the timer
        // starts — a much less disruptive moment to interrupt with a
        // permission prompt.
        Notification.requestPermission().then(setNotifPermission);
      }
    }
    // Phase now advances via CaptureModal's Motion onAnimationComplete
    // callbacks (see advanceCapturePhase) once the ball finishes shaking,
    // then once it finishes popping open.
  }, [lang, revealCapturedPokemon]);

  // Runs when the timer reaches zero: log the session and roll a Pokémon.
  const handleComplete = useCallback(async (durationSec) => {
    trackEvent('timer_complete', { duration_min: durationSec / 60, goal: currentGoal });
    playCompletionSound();

    const entry = { date: getDateStr(), duration: durationSec, goal: currentGoal };
    setSessions(prev => { const next = [entry, ...prev]; localStorage.setItem('poke-sessions', JSON.stringify(next)); return next; });

    setShowModal(true); setModalPhase('shaking'); setCaptured(null);
    await attemptCapture();
  }, [currentGoal, trackEvent, attemptCapture]);

  // Lets the user retry just the catch (not the whole focus session) after
  // a failed fetch — the session was already saved, no need to redo it.
  const retryCapture = useCallback(() => {
    trackEvent('capture_retry', {});
    setCaptured(null);
    setModalPhase('shaking');
    attemptCapture();
  }, [attemptCapture, trackEvent]);

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

  // Reflect the current notification permission (so a denied state can show
  // a visible hint instead of silently never notifying).
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Keep <html lang> in sync with the active language
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Hydrate persisted data. Sanitized like the share/import paths — a
  // previous app version, a partial write, or manual localStorage edits
  // could otherwise load a malformed shape straight into rendering.
  useEffect(() => {
    const c = readStored('poke-collection');
    if (Array.isArray(c)) setCollection(sanitizeCollection(c));
    const s = readStored('poke-sessions');
    if (Array.isArray(s)) setSessions(sanitizeSessions(s));
  }, []);

  // Load a shared rival collection from the URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const data = decodeShare(decodeURIComponent(hash.slice(7)));
        setFriendCollection(sanitizeCollection(data.collection));
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

  // Types actually present in the collection, for the filter dropdown —
  // only offer choices that would return results.
  const availableTypes = useMemo(() => {
    const types = new Set();
    collection.forEach(p => p.types.forEach(tp => types.add(tp.toLowerCase())));
    return [...types].sort();
  }, [collection]);

  const pokedexFiltered = pokedexQuery.trim() !== '' || pokedexTypeFilter !== 'all';
  const filteredCollection = useMemo(() => {
    if (!pokedexFiltered) return collection;
    const q = pokedexQuery.trim().toLowerCase();
    return collection.filter(p => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      const matchesType = pokedexTypeFilter === 'all' || p.types.some(tp => tp.toLowerCase() === pokedexTypeFilter);
      return matchesQuery && matchesType;
    });
  }, [collection, pokedexQuery, pokedexTypeFilter, pokedexFiltered]);

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
    setCurrentGoal(goal || t.goalNotSet);
    trackEvent('timer_start', { duration_min: totalSec / 60 });
    start();
  }, [running, pause, start, goal, totalSec, trackEvent, t]);

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

  function flashImportMessage(msg) {
    setImportMessage(msg);
    setTimeout(() => setImportMessage(''), 3500);
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      let data;
      try { data = JSON.parse(ev.target.result); }
      catch (_) { flashImportMessage(t.importInvalid); e.target.value = ''; return; }

      // Only touch collection/sessions that were actually present in the file
      // — a sessions-only (or collection-only) backup shouldn't silently wipe
      // the other half of the user's data.
      const hasCollection = Array.isArray(data.collection);
      const hasSessions = Array.isArray(data.sessions);
      if (!hasCollection && !hasSessions) {
        flashImportMessage(t.importInvalid);
        e.target.value = '';
        return;
      }
      const importedCollection = hasCollection ? sanitizeCollection(data.collection) : null;
      const importedSessions = hasSessions ? sanitizeSessions(data.sessions) : null;

      const confirmed = window.confirm(t.importConfirm(importedCollection?.length ?? 0, collection.length));
      if (!confirmed) {
        flashImportMessage(t.importCancelled);
        e.target.value = '';
        return;
      }

      if (importedCollection) {
        setCollection(importedCollection);
        localStorage.setItem('poke-collection', JSON.stringify(importedCollection));
      }
      if (importedSessions) {
        setSessions(importedSessions);
        localStorage.setItem('poke-sessions', JSON.stringify(importedSessions));
      }
      trackEvent('import_collection', { pokemon_count: importedCollection?.length ?? 0 });
      flashImportMessage(t.importSuccess(importedCollection?.length ?? 0));
      e.target.value = '';
    };
    reader.onerror = () => flashImportMessage(t.importInvalid);
    reader.readAsText(file);
  }

  const deletePokemonEntry = useCallback(entry => {
    if (!window.confirm(t.deleteConfirm(entry.name))) return;
    setCollection(prev => {
      const next = prev.filter(p => p.session !== entry.session);
      localStorage.setItem('poke-collection', JSON.stringify(next));
      return next;
    });
  }, [t]);

  async function shareCollection() {
    const encoded = encodeURIComponent(encodeShare({ collection }));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    try {
      await copyToClipboard(url);
      trackEvent('share_collection', { pokemon_count: collection.length });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      window.prompt(t.shareFallbackPrompt, url);
    }
  }

  const durations = [25, 45, 60];
  const description = 'A Pokémon-themed Pomodoro timer. Complete focus sessions, catch surprise Pokémon, and build your Pokédex.';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Pokémon Pomodoro',
    description,
    url: SITE_URL,
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

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
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      </Head>

      <Background />

      <div className={`app${zenMode ? ' zen' : ''}`}>
        <a href="#main-content" className="skipLink">{t.skipToContent}</a>
        {/* Hidden from assistive tech while the capture modal is open, so a
            screen reader in browse mode can't wander into the Pokédex/timer
            behind it — the modal already traps keyboard focus separately. */}
        <div aria-hidden={showModal || undefined}>
        <div className="topBar">
          <div className="langBar">
            <button className={`langBtn${lang === 'en' ? ' langBtnActive' : ''}`} aria-label="English" aria-pressed={lang === 'en'} onClick={() => { setLang('en'); localStorage.setItem('poke-lang','en'); }}>EN</button>
            <span className="langSep">|</span>
            <button className={`langBtn${lang === 'es' ? ' langBtnActive' : ''}`} aria-label="Español" aria-pressed={lang === 'es'} onClick={() => { setLang('es'); localStorage.setItem('poke-lang','es'); }}>ES</button>
          </div>
          <div className="themeBar">
            <button className={`themeBtn${themeMode === 'light' ? ' themeBtnActive' : ''}`} onClick={() => chooseTheme('light')} title="Light mode" aria-label="Light mode" aria-pressed={themeMode === 'light'}>☀️</button>
            <button className={`themeBtn${themeMode === 'dark' ? ' themeBtnActive' : ''}`} onClick={() => chooseTheme('dark')} title="Dark mode" aria-label="Dark mode" aria-pressed={themeMode === 'dark'}>🌙</button>
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
          {notifPermission === 'denied' && (
            <span className="notifDenied" title={t.notifDeniedHint} aria-label={t.notifDeniedHint}>🔕</span>
          )}
        </div>

        <div className="dashboard">
          <div className="leftPanel">
            <header className="appHeader">
              <div className="headerPokeball">
                <Pokeball prefix="hpb" />
              </div>
              <h1 className="appTitle">{t.title[0]}<br /><span>{t.title[1]}</span></h1>
              <div className="headerPokeball">
                <Pokeball prefix="hpb" />
              </div>
            </header>
            <p className="appTagline">{description}</p>

            <div className="statsBar glass">
              <div className="statItem"><span className="statValue"><TickUpNumber value={stats.totalSessions} /></span><span className="statLabel">{t.stats[0]}</span></div>
              <div className="statDivider" />
              <div className="statItem"><span className="statValue">{stats.timeStr}</span><span className="statLabel">{t.stats[1]}</span></div>
              <div className="statDivider" />
              <div className="statItem"><span className="statValue"><TickUpNumber value={stats.streak} suffix={stats.streak > 0 ? ' 🔥' : ''} /></span><span className="statLabel">{t.stats[2]}</span></div>
              <div className="statDivider" />
              <div className="statItem"><span className="statValue"><TickUpNumber value={stats.uniquePokemon} /></span><span className="statLabel">{t.stats[3]}</span></div>
            </div>

            {achievements.length > 0 && (
              <div className="achievementsBar glass">
                {achievements.map(achId => (
                  <AchievementBadge key={achId} achievementId={achId} size="small" />
                ))}
              </div>
            )}

            <main className="mainCard glass" id="main-content" tabIndex={-1}>
              <div className="goalWrapper">
                <div className="goalLabelRow">
                  <label className="goalLabel" htmlFor="goal-input">{t.goalLabel}</label>
                  <span className="goalCounter" aria-hidden="true">{goal.length}/80</span>
                </div>
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
              {importMessage && <p className="importMessage">{importMessage}</p>}
              {collection.length > 0 && (
                <div className="pokedexFilters">
                  <input
                    type="text"
                    className="pokedexSearch"
                    placeholder={t.pokedexSearchPlaceholder}
                    value={pokedexQuery}
                    onChange={e => setPokedexQuery(e.target.value)}
                    aria-label={t.pokedexSearchPlaceholder}
                  />
                  {availableTypes.length > 1 && (
                    <select
                      className="pokedexTypeSelect"
                      value={pokedexTypeFilter}
                      onChange={e => setPokedexTypeFilter(e.target.value)}
                      aria-label={t.pokedexFilterAllTypes}
                    >
                      <option value="all">{t.pokedexFilterAllTypes}</option>
                      {availableTypes.map(tp => (
                        <option key={tp} value={tp}>{translateType(tp, lang)}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div className="collectionScroll">
                <PokemonGrid
                  collection={filteredCollection}
                  t={t}
                  lang={lang}
                  onDelete={deletePokemonEntry}
                  isFiltered={pokedexFiltered}
                />
              </div>
            </section>

            <FriendCollection friendCollection={friendCollection} t={t} lang={lang} />
          </div>
        </div>
        </div>

        <CaptureModal
          showModal={showModal}
          modalPhase={modalPhase}
          captured={captured}
          currentGoal={currentGoal}
          t={t}
          lang={lang}
          onPhaseComplete={advanceCapturePhase}
          onRetry={retryCapture}
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
