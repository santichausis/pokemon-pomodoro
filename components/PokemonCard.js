import { motion } from 'motion/react';
import { getRarity } from '@/lib/rarity';

// One vivid color per type — used to build the full-card gradient
const TYPE_COLOR = {
  normal:   '#9A9A82', fire:     '#F2651F',
  water:    '#3A8FE0', grass:    '#46B552',
  electric: '#E6B800', psychic:  '#EE4F8B',
  ice:      '#54C0DB', fighting: '#CF3F3F',
  poison:   '#9B3FC4', ground:   '#CF9248',
  flying:   '#6F9EE0', bug:      '#8AA61F',
  rock:     '#A89856', ghost:    '#5E5499',
  dragon:   '#5A52E0', dark:     '#55505C',
  steel:    '#6F93A8', fairy:    '#EE7AC9',
};

const TYPE_ICONS = {
  normal: '⭕', fire: '🔥', water: '💧', grass: '🌿',
  electric: '⚡', psychic: '🔮', ice: '❄️', fighting: '🥊',
  poison: '☠️', ground: '🌍', flying: '🌀', bug: '🐛',
  rock: '🪨', ghost: '👻', dragon: '🐉', dark: '🌑',
  steel: '⚙️', fairy: '✨',
};

// Darken a hex color toward black by a 0..1 amount
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * (1 - amount));
  const g = Math.round(((n >> 8) & 255) * (1 - amount));
  const b = Math.round((n & 255) * (1 - amount));
  return `rgb(${r}, ${g}, ${b})`;
}

export default function PokemonCard({ pokemon: p, index = 0 }) {
  const rarity = getRarity(p.id);
  const tier = rarity.tier; // common | uncommon | ultra-rare | legendary
  const num = String(p.id).padStart(3, '0');

  const types = p.types.map(tp => tp.toLowerCase());
  const c1 = TYPE_COLOR[types[0]] || '#9E9E9E';
  const c2 = types[1] ? (TYPE_COLOR[types[1]] || shade(c1, 0.35)) : shade(c1, 0.4);
  const gradient = `linear-gradient(125deg, ${c1} 0%, ${c2} 100%)`;

  const rarityLabel = tier === 'legendary' ? 'Legendary' : tier === 'ultra-rare' ? 'Ultra Rare' : null;
  const rarityClass = tier === 'legendary' ? 'pcRarity--legendary' : 'pcRarity--ultrarare';

  return (
    <motion.div
      className={`pcCard pcCard--${tier}`}
      style={{ background: gradient }}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.04, ease: [0.2, 0.8, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.015, transition: { type: 'spring', stiffness: 300, damping: 26 } }}
    >
      <span className="pcWatermark">{num}</span>
      <div className="pcPokeball" />
      {tier === 'legendary' && <div className="pcShimmer" />}

      <div className="pcContent">
        <div className="pcInfo">
          <span className="pcNumber">N°{num}</span>
          <h3 className="pcName">{p.name}</h3>
          <div className="pcTypes">
            {p.types.map(type => (
              <span key={type} className="pcType">
                <span className="pcTypeIcon">{TYPE_ICONS[type?.toLowerCase()] || '●'}</span>
                {type}
              </span>
            ))}
          </div>
          {(p.goal || p.date) && (
            <div className="pcMeta">
              {p.goal && <span className="pcGoal" title={p.goal}>{p.goal}</span>}
              {p.date && <span className="pcDate">{p.date}</span>}
            </div>
          )}
        </div>

        <div className="pcArt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pcSprite" src={p.sprite} alt={p.name} width={154} height={154} loading="lazy" decoding="async" />
        </div>
      </div>

      {rarityLabel && <span className={`pcRarity ${rarityClass}`}>{rarityLabel}</span>}
    </motion.div>
  );
}
