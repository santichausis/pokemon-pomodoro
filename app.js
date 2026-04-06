/* =====================
   State
   ===================== */
const state = {
    totalSeconds:  25 * 60,
    remaining:     25 * 60,
    running:       false,
    interval:      null,
    goal:          '',
    collection:    JSON.parse(localStorage.getItem('poke-collection') || '[]'),
};

/* =====================
   DOM refs
   ===================== */
const timerTimeEl    = document.getElementById('timer-time');
const timerStatusEl  = document.getElementById('timer-status');
const timerRingEl    = document.getElementById('timer-ring');
const startBtn       = document.getElementById('start-btn');
const resetBtn       = document.getElementById('reset-btn');
const goalInput      = document.getElementById('goal-input');
const pokemonGrid    = document.getElementById('pokemon-grid');
const collectionCount = document.getElementById('collection-count');

/* =====================
   Ring math  (r = 104)
   ===================== */
const CIRCUMFERENCE = 2 * Math.PI * 104; // ≈ 653.45

function updateRing() {
    const progress = state.remaining / state.totalSeconds;
    const offset   = CIRCUMFERENCE * (1 - progress);
    timerRingEl.style.strokeDasharray  = CIRCUMFERENCE;
    timerRingEl.style.strokeDashoffset = offset;

    timerRingEl.classList.remove('warning', 'done');
    if (state.remaining <= 0) {
        timerRingEl.classList.add('done');
    } else if (state.remaining <= 60) {
        timerRingEl.classList.add('warning');
    }
}

/* =====================
   Display
   ===================== */
function updateDisplay() {
    const m = Math.floor(state.remaining / 60).toString().padStart(2, '0');
    const s = (state.remaining % 60).toString().padStart(2, '0');
    timerTimeEl.textContent = `${m}:${s}`;
}

/* =====================
   Timer controls
   ===================== */
function setDuration(minutes) {
    state.totalSeconds = minutes * 60;
    state.remaining    = state.totalSeconds;
    updateDisplay();
    updateRing();
}

function tick() {
    state.remaining--;
    updateDisplay();
    updateRing();
    if (state.remaining <= 0) {
        clearInterval(state.interval);
        state.running  = false;
        timerStatusEl.textContent = '¡Completado!';
        startBtn.textContent = '▶ Iniciar';
        playCompletionSound();
        showCaptureModal();
    }
}

function startPause() {
    if (state.running) {
        // Pause
        clearInterval(state.interval);
        state.running = false;
        startBtn.textContent = '▶ Continuar';
        timerStatusEl.textContent = 'Pausado';
    } else {
        // Start / Resume
        state.goal    = goalInput.value.trim() || 'Sin objetivo';
        state.running = true;
        startBtn.textContent = '⏸ Pausar';
        timerStatusEl.textContent = 'Concentrándote...';
        state.interval = setInterval(tick, 1000);
    }
}

function reset() {
    clearInterval(state.interval);
    state.running   = false;
    state.remaining = state.totalSeconds;
    startBtn.textContent    = '▶ Iniciar';
    timerStatusEl.textContent = 'Listo';
    updateDisplay();
    updateRing();
}

/* =====================
   Duration buttons
   ===================== */
document.querySelectorAll('.dur-btn[data-min]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (state.running) return;
        const min = parseInt(btn.dataset.min);
        if (!min) return;
        document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setDuration(min);
    });
});

const customBtn = document.getElementById('custom-btn');
const customRow = document.getElementById('custom-row');
const customInput = document.getElementById('custom-input');
const customOk  = document.getElementById('custom-ok');

customBtn.addEventListener('click', () => {
    customRow.classList.toggle('hidden');
    customInput.focus();
});

customOk.addEventListener('click', applyCustom);
customInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyCustom(); });

function applyCustom() {
    const val = parseInt(customInput.value);
    if (!val || val < 1 || val > 180) return;
    document.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
    customBtn.classList.add('active');
    setDuration(val);
    customRow.classList.add('hidden');
    customInput.value = '';
}

/* =====================
   Sound (Web Audio)
   ===================== */
function playCompletionSound() {
    try {
        const ctx = new AudioContext();
        const notes = [523, 659, 784, 1046]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
            osc.start(ctx.currentTime + i * 0.15);
            osc.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
    } catch (_) { /* audio not available */ }
}

/* =====================
   PokéAPI
   ===================== */
async function fetchRandomPokemon() {
    const id = Math.floor(Math.random() * 898) + 1;
    const res  = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    const sprite =
        data.sprites?.other?.['official-artwork']?.front_default ||
        data.sprites?.front_default ||
        '';
    return {
        id,
        name:   capitalize(data.name),
        sprite,
        types:  data.types.map(t => t.type.name),
    };
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* =====================
   Capture Modal
   ===================== */
const modalOverlay   = document.getElementById('modal-overlay');
const modalGoalEl    = document.getElementById('modal-goal-display');
const pokeballAnim   = document.getElementById('pokeball-anim');
const pokemonReveal  = document.getElementById('pokemon-reveal');
const pokemonSpriteEl = document.getElementById('pokemon-sprite');
const pokemonNumberEl = document.getElementById('pokemon-number');
const pokemonNameEl  = document.getElementById('pokemon-name');
const pokemonTypesEl = document.getElementById('pokemon-types');
const revealGlowEl   = document.getElementById('reveal-glow');
const modalContinue  = document.getElementById('modal-continue');
const captureStage   = document.getElementById('capture-stage');

async function showCaptureModal() {
    // Reset modal state
    pokeballAnim.classList.remove('opening');
    pokeballAnim.style.display = '';
    pokemonReveal.classList.add('hidden');
    modalContinue.classList.add('hidden');
    captureStage.style.display = '';

    modalGoalEl.textContent = `"${state.goal}"`;
    modalOverlay.classList.remove('hidden');

    // Fetch while ball is shaking
    let pokemon;
    try {
        pokemon = await fetchRandomPokemon();
    } catch (_) {
        pokemon = { id: 25, name: 'Pikachu', sprite: '', types: ['electric'] };
    }

    // Shake for 2 seconds, then open
    setTimeout(() => {
        pokeballAnim.classList.add('opening');
        setTimeout(() => {
            // Hide ball, show Pokémon
            captureStage.style.display = 'none';

            pokemonSpriteEl.src = pokemon.sprite;
            pokemonNameEl.textContent = pokemon.name;
            pokemonNumberEl.textContent = `#${String(pokemon.id).padStart(3, '0')}`;

            pokemonTypesEl.innerHTML = pokemon.types
                .map(t => `<span class="type-badge type-${t}">${t}</span>`)
                .join('');

            // Glow color based on first type
            revealGlowEl.style.background = typeGlow(pokemon.types[0]);

            pokemonReveal.classList.remove('hidden');
            modalContinue.classList.remove('hidden');

            addToCollection(pokemon);
        }, 450);
    }, 2200);
}

function typeGlow(type) {
    const colors = {
        fire: 'rgba(230,40,41,0.3)', water: 'rgba(41,128,239,0.3)',
        grass: 'rgba(63,161,41,0.3)', electric: 'rgba(250,192,0,0.4)',
        psychic: 'rgba(239,65,121,0.3)', ice: 'rgba(61,206,243,0.3)',
        dragon: 'rgba(80,96,225,0.3)', fairy: 'rgba(239,112,239,0.3)',
        ghost: 'rgba(112,65,112,0.3)', dark: 'rgba(98,77,78,0.3)',
        steel: 'rgba(96,161,184,0.3)', fighting: 'rgba(255,128,0,0.3)',
    };
    return colors[type] || 'rgba(255,203,5,0.3)';
}

modalContinue.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    reset();
});

/* =====================
   Collection
   ===================== */
function addToCollection(pokemon) {
    const entry = {
        ...pokemon,
        goal:    state.goal,
        date:    new Date().toLocaleDateString('es-AR'),
        session: Date.now(),
    };
    state.collection.unshift(entry);
    localStorage.setItem('poke-collection', JSON.stringify(state.collection));
    renderCollection();
}

function renderCollection() {
    collectionCount.textContent = state.collection.length;

    if (state.collection.length === 0) {
        pokemonGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-pokeball">
                    <div class="epb-top"></div>
                    <div class="epb-band"><div class="epb-btn"></div></div>
                    <div class="epb-bottom"></div>
                </div>
                <p>Completá tu primera sesión<br>para capturar tu primer Pokémon</p>
            </div>`;
        return;
    }

    pokemonGrid.innerHTML = state.collection.map(p => `
        <div class="pokemon-card">
            <img class="pokemon-card-sprite" src="${p.sprite}" alt="${p.name}" loading="lazy">
            <span class="pokemon-card-number">#${String(p.id).padStart(3, '0')}</span>
            <span class="pokemon-card-name">${p.name}</span>
            <div class="pokemon-card-types">
                ${p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('')}
            </div>
            <span class="pokemon-card-goal" title="${p.goal}">${p.goal}</span>
        </div>
    `).join('');
}

/* =====================
   Event listeners
   ===================== */
startBtn.addEventListener('click', startPause);
resetBtn.addEventListener('click', reset);

/* =====================
   Init
   ===================== */
updateDisplay();
updateRing();
renderCollection();
