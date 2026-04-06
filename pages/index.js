import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';

const CIRCUMFERENCE = 2 * Math.PI * 104; // r=104 → 653.45

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
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch (_) {}
}

async function fetchRandomPokemon() {
  const id = Math.floor(Math.random() * 898) + 1;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const sprite =
    data.sprites?.other?.['official-artwork']?.front_default ||
    data.sprites?.front_default || '';
  return {
    id,
    name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
    sprite,
    types: data.types.map(t => t.type.name),
  };
}

export default function Home() {
  const [totalSec, setTotalSec]   = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning]     = useState(false);
  const [goal, setGoal]           = useState('');
  const [status, setStatus]       = useState('Listo');
  const [activeDur, setActiveDur] = useState(25);
  const [showCustom, setShowCustom] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const [collection, setCollection] = useState([]);
  const [showModal, setShowModal]   = useState(false);
  const [modalPhase, setModalPhase] = useState('shaking'); // 'shaking' | 'opening' | 'reveal'
  const [captured, setCaptured]     = useState(null);
  const [currentGoal, setCurrentGoal] = useState('');

  const intervalRef = useRef(null);
  const totalSecRef = useRef(totalSec);
  totalSecRef.current = totalSec;

  // Load collection from localStorage (client only)
  useEffect(() => {
    const saved = localStorage.getItem('poke-collection');
    if (saved) setCollection(JSON.parse(saved));
  }, []);

  const ringOffset = CIRCUMFERENCE * (1 - remaining / totalSec);
  const ringClass = remaining <= 0
    ? 'timerRingDone'
    : remaining <= 60
    ? 'timerRingWarning'
    : '';

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const handleComplete = useCallback(async () => {
    setRunning(false);
    setStatus('¡Completado!');
    playCompletionSound();

    setShowModal(true);
    setModalPhase('shaking');
    setCaptured(null);

    let pokemon;
    try {
      pokemon = await fetchRandomPokemon();
    } catch (_) {
      pokemon = { id: 25, name: 'Pikachu', sprite: '', types: ['electric'] };
    }

    // After 2.2s shake → open
    setTimeout(() => {
      setModalPhase('opening');
      setTimeout(() => {
        setCaptured(pokemon);
        setModalPhase('reveal');

        // Save to collection
        setCollection(prev => {
          const entry = { ...pokemon, goal: currentGoal, date: new Date().toLocaleDateString('es-AR'), session: Date.now() };
          const next = [entry, ...prev];
          localStorage.setItem('poke-collection', JSON.stringify(next));
          return next;
        });
      }, 450);
    }, 2200);
  }, [currentGoal]);

  const startPause = useCallback(() => {
    if (running) {
      stopTimer();
      setRunning(false);
      setStatus('Pausado');
    } else {
      setCurrentGoal(goal || 'Sin objetivo');
      setRunning(true);
      setStatus('Concentrándote...');
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [running, goal, stopTimer]);

  // Watch for timer hitting 0
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      handleComplete();
    }
  }, [remaining, running, handleComplete]);

  const reset = useCallback(() => {
    stopTimer();
    setRunning(false);
    setRemaining(totalSec);
    setStatus('Listo');
  }, [stopTimer, totalSec]);

  const setDuration = (min) => {
    stopTimer();
    setRunning(false);
    setActiveDur(min);
    const secs = min * 60;
    setTotalSec(secs);
    setRemaining(secs);
    setStatus('Listo');
  };

  const applyCustom = () => {
    const val = parseInt(customVal);
    if (!val || val < 1 || val > 180) return;
    setDuration(val);
    setActiveDur('custom');
    setShowCustom(false);
    setCustomVal('');
  };

  const closeModal = () => {
    setShowModal(false);
    reset();
  };

  const durations = [25, 45, 60];

  return (
    <>
      <Head>
        <title>Pokémon Pomodoro</title>
        <meta name="description" content="Pomodoro con temática Pokémon" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app">
        {/* Header */}
        <header className="appHeader">
          <div className="headerPokeball">
            <div className="hpbTop" />
            <div className="hpbBand"><div className="hpbBtn" /></div>
            <div className="hpbBottom" />
          </div>
          <h1 className="appTitle">Pokémon<br /><span>Pomodoro</span></h1>
          <div className="headerPokeball">
            <div className="hpbTop" />
            <div className="hpbBand"><div className="hpbBtn" /></div>
            <div className="hpbBottom" />
          </div>
        </header>

        {/* Main card */}
        <main className="mainCard">
          {/* Goal */}
          <div className="goalWrapper">
            <label className="goalLabel" htmlFor="goal-input">¿Cuál es tu objetivo?</label>
            <input
              id="goal-input"
              className="goalInput"
              type="text"
              placeholder="Ej: Terminar el capítulo 3..."
              maxLength={80}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Timer ring */}
          <div className="timerWrapper">
            <svg className="timerSvg" viewBox="0 0 240 240">
              <circle className="timerTrack" cx="120" cy="120" r="104" />
              <circle
                className={`timerRing ${ringClass}`}
                cx="120" cy="120" r="104"
                transform="rotate(-90 120 120)"
                style={{ strokeDashoffset: ringOffset }}
              />
            </svg>
            <div className="timerFace">
              <div className="timerTime">{fmt(remaining)}</div>
              <div className="timerStatus">{status}</div>
            </div>
          </div>

          {/* Duration buttons */}
          <div className="durationRow">
            {durations.map(d => (
              <button
                key={d}
                className={`durBtn${activeDur === d ? ' durBtnActive' : ''}`}
                onClick={() => setDuration(d)}
                disabled={running}
              >
                {d} min
              </button>
            ))}
            <button
              className={`durBtn${activeDur === 'custom' ? ' durBtnActive' : ''}`}
              onClick={() => setShowCustom(v => !v)}
              disabled={running}
            >
              Custom
            </button>
          </div>

          {showCustom && (
            <div className="customRow">
              <input
                className="customInput"
                type="number"
                min={1} max={180}
                placeholder="min"
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyCustom()}
                autoFocus
              />
              <button className="durBtn durBtnActive" onClick={applyCustom}>OK</button>
            </div>
          )}

          {/* Controls */}
          <div className="controlsRow">
            <button className="ctrlBtn ctrlBtnSecondary" onClick={reset}>↩ Reset</button>
            <button className="ctrlBtn ctrlBtnPrimary" onClick={startPause}>
              {running ? '⏸ Pausar' : '▶ Iniciar'}
            </button>
          </div>
        </main>

        {/* Collection */}
        <section className="collectionSection">
          <div className="collectionHeader">
            <h2 className="collectionTitle">Tu Pokédex</h2>
            <span className="collectionBadge">{collection.length}</span>
          </div>
          <div className="pokemonGrid">
            {collection.length === 0 ? (
              <div className="emptyState">
                <div className="emptyPokeball">
                  <div className="epbTop" />
                  <div className="epbBand"><div className="epbBtn" /></div>
                  <div className="epbBottom" />
                </div>
                <p>Completá tu primera sesión<br />para capturar tu primer Pokémon</p>
              </div>
            ) : [...collection].sort((a, b) => a.id - b.id).map((p) => (
              <div key={`${p.id}-${p.session}`} className="pokemonCard">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="pokemonCardSprite" src={p.sprite} alt={p.name} loading="lazy" />
                <span className="pokemonCardNumber">#{String(p.id).padStart(3, '0')}</span>
                <span className="pokemonCardName">{p.name}</span>
                <div className="pokemonCardTypes">
                  {p.types.map(t => (
                    <span key={t} className={`typeBadge ${TYPE_CLASSES[t] || ''}`}>{t}</span>
                  ))}
                </div>
                <span className="pokemonCardGoal" title={p.goal}>{p.goal}</span>
                <span className="pokemonCardDate">{p.date}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Capture Modal */}
      {showModal && (
        <div className="modalOverlay">
          <div className="modalCard">
            <div className="modalHeader">
              <p className="modalStars">✦ ✦ ✦</p>
              <h2 className="modalTitle">¡Objetivo Cumplido!</h2>
              <p className="modalGoal">&ldquo;{currentGoal}&rdquo;</p>
            </div>

            {(modalPhase === 'shaking' || modalPhase === 'opening') && (
              <div className="captureStage">
                <div className={`pokeballAnim${modalPhase === 'opening' ? ' pokeballOpening' : ''}`}>
                  <div className="pbaTop" />
                  <div className="pbaBand"><div className="pbaBtn" /></div>
                  <div className="pbaBottom" />
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
                  {captured.types.map(t => (
                    <span key={t} className={`typeBadge ${TYPE_CLASSES[t] || ''}`}>{t}</span>
                  ))}
                </div>
                <div className="capturedBanner">¡Capturado! ⭐</div>
              </div>
            )}

            {modalPhase === 'reveal' && (
              <button className="ctrlBtn ctrlBtnPrimary" onClick={closeModal} style={{ width: '100%' }}>
                ¡Continuar!
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
