import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Head from 'next/head';

const CIRCUMFERENCE = 2 * Math.PI * 104;

const GENERATIONS = {
  all:  { range: [1, 898] },
  gen1: { range: [1, 151] },
  gen2: { range: [152, 251] },
  gen3: { range: [252, 386] },
  gen4: { range: [387, 493] },
  gen5: { range: [494, 649] },
  gen6: { range: [650, 721] },
  gen7: { range: [722, 809] },
  gen8: { range: [810, 898] },
};

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

const TYPE_CLASSES = {
  normal: 'typeNormal', fire: 'typeFire', water: 'typeWater',
  grass: 'typeGrass', electric: 'typeElectric', ice: 'typeIce',
  fighting: 'typeFighting', poison: 'typePoison', ground: 'typeGround',
  flying: 'typeFlying', psychic: 'typePsychic', bug: 'typeBug',
  rock: 'typeRock', ghost: 'typeGhost', dragon: 'typeDragon',
  dark: 'typeDark', steel: 'typeSteel', fairy: 'typeFairy',
};

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    [523, 659, 784, 1046].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch (_) {}
}

async function fetchRandomPokemon(range = [1, 898]) {
  const [min, max] = range;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const sprite = data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '';
  return { id, name: data.name.charAt(0).toUpperCase() + data.name.slice(1), sprite, types: data.types.map(t => t.type.name) };
}

function getDateStr(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US');
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for environments without clipboard API
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

export default function Home() {
  const [lang, setLang]             = useState('en');
  const t = T[lang];

  // Timer
  const [totalSec, setTotalSec]     = useState(25 * 60);
  const [remaining, setRemaining]   = useState(25 * 60);
  const [running, setRunning]       = useState(false);
  const [goal, setGoal]             = useState('');
  const [statusKey, setStatusKey]   = useState('ready'); // 'ready' | 'focusing' | 'paused' | 'done'
  const [activeDur, setActiveDur]   = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal]   = useState('');
  const [mode, setMode]             = useState('all');

  // Data
  const [collection, setCollection]             = useState([]);
  const [sessions, setSessions]                 = useState([]);
  const [friendCollection, setFriendCollection] = useState([]);

  // Modal
  const [showModal, setShowModal]     = useState(false);
  const [modalPhase, setModalPhase]   = useState('shaking');
  const [captured, setCaptured]       = useState(null);
  const [currentGoal, setCurrentGoal] = useState('');

  // UI
  const [copied, setCopied] = useState(false);

  const intervalRef   = useRef(null);
  const totalSecRef   = useRef(totalSec);
  const modeRef       = useRef(mode);
  const importRef     = useRef(null);
  totalSecRef.current = totalSec;
  modeRef.current     = mode;

  // Status label derived from key + lang
  const statusLabel = {
    ready: t.statusReady, focusing: t.statusFocusing,
    paused: t.statusPaused, done: t.statusDone,
  }[statusKey] ?? t.statusReady;

  // Persist lang preference
  useEffect(() => {
    const saved = localStorage.getItem('poke-lang');
    if (saved === 'en' || saved === 'es') setLang(saved);
  }, []);
  const toggleLang = () => {
    const next = lang === 'en' ? 'es' : 'en';
    setLang(next);
    localStorage.setItem('poke-lang', next);
  };

  // Load data from localStorage
  useEffect(() => {
    const c = localStorage.getItem('poke-collection');
    if (c) setCollection(JSON.parse(c));
    const s = localStorage.getItem('poke-sessions');
    if (s) setSessions(JSON.parse(s));
  }, []);

  // Check share URL (multijugador)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const data = JSON.parse(atob(decodeURIComponent(hash.slice(7))));
        setFriendCollection(data.collection || []);
      } catch (_) {}
    }
  }, []);

  // Stats
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

  // Ring
  const ringOffset = CIRCUMFERENCE * (1 - remaining / totalSec);
  const ringClass  = remaining <= 0 ? 'timerRingDone' : remaining <= 60 ? 'timerRingWarning' : '';
  const fmt = s => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const stopTimer = useCallback(() => { clearInterval(intervalRef.current); intervalRef.current = null; }, []);

  const handleComplete = useCallback(async () => {
    setRunning(false);
    setStatusKey('done');
    playCompletionSound();

    const entry = { date: getDateStr(), duration: totalSecRef.current, goal: currentGoal };
    setSessions(prev => { const next = [entry, ...prev]; localStorage.setItem('poke-sessions', JSON.stringify(next)); return next; });

    setShowModal(true); setModalPhase('shaking'); setCaptured(null);

    let pokemon;
    try { pokemon = await fetchRandomPokemon(GENERATIONS[modeRef.current]?.range || [1, 898]); }
    catch (_) { pokemon = { id: 25, name: 'Pikachu', sprite: '', types: ['electric'] }; }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const tSnap = T[lang] || T.en;
      new Notification(tSnap.notifTitle, { body: tSnap.notifBody(pokemon.name), icon: '/favicon.ico' });
    }

    setTimeout(() => {
      setModalPhase('opening');
      setTimeout(() => {
        setCaptured(pokemon);
        setModalPhase('reveal');
        setCollection(prev => {
          const e = { ...pokemon, goal: currentGoal, date: getDateStr(), session: Date.now() };
          const next = [e, ...prev];
          localStorage.setItem('poke-collection', JSON.stringify(next));
          return next;
        });
      }, 450);
    }, 2200);
  }, [currentGoal, lang]);

  const startPause = useCallback(() => {
    if (running) {
      stopTimer(); setRunning(false); setStatusKey('paused');
    } else {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      setCurrentGoal(goal || 'No goal set');
      setRunning(true); setStatusKey('focusing');
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current); intervalRef.current = null; return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }, [running, goal, stopTimer]);

  useEffect(() => {
    if (remaining === 0 && running) { setRunning(false); handleComplete(); }
  }, [remaining, running, handleComplete]);

  const reset = useCallback(() => {
    stopTimer(); setRunning(false); setRemaining(totalSec); setStatusKey('ready');
  }, [stopTimer, totalSec]);

  const setDuration = min => {
    stopTimer(); setRunning(false); setActiveDur(min);
    setTotalSec(min * 60); setRemaining(min * 60); setStatusKey('ready');
  };

  const applyCustom = () => {
    const val = parseInt(customVal);
    if (!val || val < 1 || val > 180) return;
    stopTimer(); setRunning(false); setActiveDur('custom');
    setTotalSec(val * 60); setRemaining(val * 60); setStatusKey('ready');
    setShowCustom(false); setCustomVal('');
  };

  const closeModal = () => { setShowModal(false); reset(); };

  // Export
  function exportCollection() {
    const blob = new Blob([JSON.stringify({ collection, sessions }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'pokemodoro-backup.json' });
    a.click(); URL.revokeObjectURL(url);
  }

  // Import
  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.collection) { setCollection(data.collection); localStorage.setItem('poke-collection', JSON.stringify(data.collection)); }
        if (data.sessions)   { setSessions(data.sessions);     localStorage.setItem('poke-sessions',    JSON.stringify(data.sessions)); }
      } catch (_) {}
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Share (multijugador)
  async function shareCollection() {
    const encoded = encodeURIComponent(btoa(JSON.stringify({ collection })));
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    try {
      await copyToClipboard(url);
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

        {/* Language toggle */}
        <div className="langBar">
          <button className={`langBtn${lang === 'en' ? ' langBtnActive' : ''}`} onClick={() => { setLang('en'); localStorage.setItem('poke-lang','en'); }}>EN</button>
          <span className="langSep">|</span>
          <button className={`langBtn${lang === 'es' ? ' langBtnActive' : ''}`} onClick={() => { setLang('es'); localStorage.setItem('poke-lang','es'); }}>ES</button>
        </div>

        {/* Header */}
        <header className="appHeader">
          <div className="headerPokeball">
            <div className="hpbTop" /><div className="hpbBand"><div className="hpbBtn" /></div><div className="hpbBottom" />
          </div>
          <h1 className="appTitle">{t.title[0]}<br /><span>{t.title[1]}</span></h1>
          <div className="headerPokeball">
            <div className="hpbTop" /><div className="hpbBand"><div className="hpbBtn" /></div><div className="hpbBottom" />
          </div>
        </header>

        {/* Stats bar */}
        <div className="statsBar">
          <div className="statItem"><span className="statValue">{stats.totalSessions}</span><span className="statLabel">{t.stats[0]}</span></div>
          <div className="statDivider" />
          <div className="statItem"><span className="statValue">{stats.timeStr}</span><span className="statLabel">{t.stats[1]}</span></div>
          <div className="statDivider" />
          <div className="statItem"><span className="statValue">{stats.streak}{stats.streak > 0 ? ' 🔥' : ''}</span><span className="statLabel">{t.stats[2]}</span></div>
          <div className="statDivider" />
          <div className="statItem"><span className="statValue">{stats.uniquePokemon}</span><span className="statLabel">{t.stats[3]}</span></div>
        </div>

        {/* Main card */}
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

        {/* Pokédex */}
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
          <div className="pokemonGrid">
            {collection.length === 0 ? (
              <div className="emptyState">
                <div className="emptyPokeball">
                  <div className="epbTop" /><div className="epbBand"><div className="epbBtn" /></div><div className="epbBottom" />
                </div>
                <p>{t.emptyLine1}<br />{t.emptyLine2}</p>
              </div>
            ) : [...collection].sort((a, b) => a.id - b.id).map(p => (
              <div key={`${p.id}-${p.session}`} className="pokemonCard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pokemonCardSprite" src={p.sprite} alt={p.name} loading="lazy" />
                <span className="pokemonCardNumber">#{String(p.id).padStart(3, '0')}</span>
                <span className="pokemonCardName">{p.name}</span>
                <div className="pokemonCardTypes">
                  {p.types.map(t => <span key={t} className={`typeBadge ${TYPE_CLASSES[t] || ''}`}>{t}</span>)}
                </div>
                <span className="pokemonCardGoal" title={p.goal}>{p.goal}</span>
                <span className="pokemonCardDate">{p.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rival's collection */}
        {friendCollection.length > 0 && (
          <section className="collectionSection friendSection">
            <div className="collectionHeader">
              <div className="collectionTitleGroup">
                <h2 className="collectionTitle">{t.friendTitle}</h2>
                <span className="collectionBadge friendBadge">{friendCollection.length}</span>
              </div>
            </div>
            <div className="pokemonGrid">
              {[...friendCollection].sort((a, b) => a.id - b.id).map(p => (
                <div key={`friend-${p.id}-${p.session}`} className="pokemonCard friendCard">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="pokemonCardSprite" src={p.sprite} alt={p.name} loading="lazy" />
                  <span className="pokemonCardNumber">#{String(p.id).padStart(3, '0')}</span>
                  <span className="pokemonCardName">{p.name}</span>
                  <div className="pokemonCardTypes">
                    {p.types.map(t => <span key={t} className={`typeBadge ${TYPE_CLASSES[t] || ''}`}>{t}</span>)}
                  </div>
                  <span className="pokemonCardDate">{p.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Capture Modal */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalCard">
            <div className="modalHeader">
              <p className="modalStars">{t.modalStars}</p>
              <h2 className="modalTitle">{t.modalTitle}</h2>
              <p className="modalGoal">&ldquo;{currentGoal}&rdquo;</p>
            </div>
            {(modalPhase === 'shaking' || modalPhase === 'opening') && (
              <div className="captureStage">
                <div className={`pokeballAnim${modalPhase === 'opening' ? ' pokeballOpening' : ''}`}>
                  <div className="pbaTop" /><div className="pbaBand"><div className="pbaBtn" /></div><div className="pbaBottom" />
                </div>
              </div>
            )}
            {modalPhase === 'reveal' && captured && (
              <div className="pokemonReveal">
                <div className="revealGlow" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pokemonSprite" src={captured.sprite} alt={captured.name} />
                <span className="revealNumber">#{String(captured.id).padStart(3, '0')}</span>
                <h3 className="revealName">{captured.name}</h3>
                <div className="revealTypes">
                  {captured.types.map(tp => <span key={tp} className={`typeBadge ${TYPE_CLASSES[tp] || ''}`}>{tp}</span>)}
                </div>
                <div className="capturedBanner">{t.capturedBanner}</div>
              </div>
            )}
            {modalPhase === 'reveal' && (
              <button className="ctrlBtn ctrlBtnPrimary" onClick={closeModal} style={{ width: '100%' }}>
                {t.btnContinueModal}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
