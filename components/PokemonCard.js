import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { TYPE_CLASSES } from '@/lib/constants';
import { getRarity } from '@/lib/rarity';

// Duotone gradient per primary type for the sprite panel
const TYPE_PANEL_COLORS = {
  normal:   ['#B5B59C', '#8C8C72'], fire:     ['#FF8A50', '#E0521F'],
  water:    ['#56A0E6', '#2E6FBE'], grass:    ['#67C267', '#3C8C3C'],
  electric: ['#E6BE2E', '#C99410'], psychic:  ['#F06699', '#D43F73'],
  ice:      ['#5AC8E6', '#2E9FC9'], fighting: ['#D45656', '#A53030'],
  poison:   ['#B25AD4', '#8C36B0'], ground:   ['#D49150', '#B06E28'],
  flying:   ['#74A8E0', '#4A80C2'], bug:      ['#9CB23C', '#6E8C28'],
  rock:     ['#A89C66', '#7C7048'], ghost:    ['#6E6EB0', '#48487C'],
  dragon:   ['#6A6AE6', '#4040C2'], dark:     ['#6E6E78', '#48484E'],
  steel:    ['#94B2C9', '#6A8CA8'], fairy:    ['#F088CC', '#D45AB0'],
};

const TYPE_ICONS = {
  normal: '⭕', fire: '🔥', water: '💧', grass: '🌿',
  electric: '⚡', psychic: '🔮', ice: '❄️', fighting: '🥊',
  poison: '☠️', ground: '🌍', flying: '🌀', bug: '🐛',
  rock: '🪨', ghost: '👻', dragon: '🐉', dark: '🌑',
  steel: '⚙️', fairy: '✨',
};

const RARITY_CLASS = {
  'common':     'pokemonCard',
  'uncommon':   'pokemonCard pokemonCardRare',
  'ultra-rare': 'pokemonCard pokemonCardUltraRare',
  'legendary':  'pokemonCard pokemonCardLegendary',
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PokemonCard({ pokemon: p, index = 0 }) {
  const rarity = getRarity(p.id);
  const primaryType = p.types[0]?.toLowerCase();
  const [c1, c2] = TYPE_PANEL_COLORS[primaryType] || ['#9E9E9E', '#757575'];
  const hasHolo = rarity.tier !== 'common';

  const ref = useRef(null);

  // Pointer position 0..1 across the card
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  // 3D tilt (spring-smoothed)
  const rotateY = useSpring(useTransform(px, [0, 1], [-10, 10]), { stiffness: 220, damping: 18 });
  const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 220, damping: 18 });

  // Glare + holo follow the pointer via CSS variables
  const mxPct = useTransform(px, v => `${v * 100}%`);
  const myPct = useTransform(py, v => `${v * 100}%`);

  function handleMove(e) {
    if (prefersReducedMotion() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  }
  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      className={`${RARITY_CLASS[rarity.tier] || 'pokemonCard'} pcard`}
      layout
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.32, delay: Math.min(index * 0.025, 0.4), ease: [0.2, 0.8, 0.3, 1] }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        ['--mx']: mxPct,
        ['--my']: myPct,
      }}
    >
      {/* Holographic foil (rare+) */}
      {hasHolo && <div className="pcardHolo" />}
      {/* Pointer-tracked glare */}
      <div className="pcardGlare" />

      {/* ── Left: info ── */}
      <div className="pokemonCardInfo">
        <span className="pokemonCardNumber">Nº{String(p.id).padStart(3, '0')}</span>
        <span className="pokemonCardName">{p.name}</span>
        <div className="pokemonCardTypes">
          {p.types.map(type => (
            <span key={type} className={`typePill ${TYPE_CLASSES[type] || ''}`}>
              <span className="typePillIcon">{TYPE_ICONS[type?.toLowerCase()] || '●'}</span>
              {type}
            </span>
          ))}
        </div>
        {(p.goal || p.date) && (
          <div className="pokemonCardMeta">
            {p.goal && <span className="pokemonCardGoal" title={p.goal}>{p.goal}</span>}
            <span className="pokemonCardDate">{p.date}</span>
          </div>
        )}
      </div>

      {/* ── Right: sprite panel ── */}
      <div
        className="pokemonCardSpritePanel"
        style={{ background: `radial-gradient(circle at 50% 30%, ${c1}, ${c2})` }}
      >
        <span className="pokemonCardWatermark">{String(p.id).padStart(3, '0')}</span>
        <div className="pokemonCardPokeballMark" />
        <div className="pokemonCardPanelGlow" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pokemonCardSprite" src={p.sprite} alt={p.name} loading="lazy" />
        <span className={`rarityPip rarityPip${rarity.tier.charAt(0).toUpperCase() + rarity.tier.slice(1).replace('-', '')}`}>
          {rarity.tier === 'legendary' ? '★' : rarity.tier === 'ultra-rare' ? '◆' : rarity.tier === 'uncommon' ? '●' : ''}
        </span>
      </div>
    </motion.div>
  );
}
