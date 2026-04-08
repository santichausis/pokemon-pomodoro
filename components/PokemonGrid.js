import { TYPE_CLASSES } from '@/lib/constants';
import { getRarity } from '@/lib/rarity';

// Panel background color per primary type (matches type color family)
const TYPE_PANEL_COLORS = {
  normal:   '#A8A890', fire:     '#F07840',
  water:    '#4A90D9', grass:    '#58B058',
  electric: '#D4A017', psychic:  '#E0507A',
  ice:      '#40B4D8', fighting: '#C04040',
  poison:   '#9848B8', ground:   '#C07830',
  flying:   '#5A8FD0', bug:      '#789030',
  rock:     '#888050', ghost:    '#505090',
  dragon:   '#4848D0', dark:     '#505058',
  steel:    '#7898B0', fairy:    '#D860B0',
};

// Emoji icon per type to match the pill badge style
const TYPE_ICONS = {
  normal: '⭕', fire: '🔥', water: '💧', grass: '🌿',
  electric: '⚡', psychic: '🔮', ice: '❄️', fighting: '🥊',
  poison: '☠️', ground: '🌍', flying: '🌀', bug: '🐛',
  rock: '🪨', ghost: '👻', dragon: '🐉', dark: '🌑',
  steel: '⚙️', fairy: '✨',
};

export default function PokemonGrid({ collection, lang, t }) {
  const getRarityClass = (pokemonId) => {
    const rarity = getRarity(pokemonId);
    const rarityMap = {
      'common':     'pokemonCard',
      'uncommon':   'pokemonCard pokemonCardRare',
      'ultra-rare': 'pokemonCard pokemonCardUltraRare',
      'legendary':  'pokemonCard pokemonCardLegendary',
    };
    return rarityMap[rarity.tier] || 'pokemonCard';
  };

  return (
    <div className="pokemonGrid">
      {collection.length === 0 ? (
        <div className="emptyState">
          <div className="emptyPokeball">
            <div className="epbTop" />
            <div className="epbBand"><div className="epbBtn" /></div>
            <div className="epbBottom" />
          </div>
          <p>{t.emptyLine1}<br />{t.emptyLine2}</p>
        </div>
      ) : [...collection].sort((a, b) => a.id - b.id).map(p => {
        const rarity = getRarity(p.id);
        const primaryType = p.types[0]?.toLowerCase();
        const panelBg = TYPE_PANEL_COLORS[primaryType] || '#9E9E9E';

        return (
          <div key={`${p.id}-${p.session}`} className={getRarityClass(p.id)}>

            {/* ── Left: info ── */}
            <div className="pokemonCardInfo">
              <span className="pokemonCardNumber">
                Nº{String(p.id).padStart(3, '0')}
              </span>
              <span className="pokemonCardName">{p.name}</span>
              <div className="pokemonCardTypes">
                {p.types.map(type => (
                  <span key={type} className={`typePill ${TYPE_CLASSES[type] || ''}`}>
                    <span className="typePillIcon">
                      {TYPE_ICONS[type?.toLowerCase()] || '●'}
                    </span>
                    {type}
                  </span>
                ))}
              </div>
              {(p.goal || p.date) && (
                <div className="pokemonCardMeta">
                  {p.goal && (
                    <span className="pokemonCardGoal" title={p.goal}>{p.goal}</span>
                  )}
                  <span className="pokemonCardDate">{p.date}</span>
                </div>
              )}
            </div>

            {/* ── Right: sprite panel ── */}
            <div className="pokemonCardSpritePanel" style={{ background: panelBg }}>
              <div className="pokemonCardPanelGlow" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="pokemonCardSprite"
                src={p.sprite}
                alt={p.name}
                loading="lazy"
              />
              <span className={`rarityPip rarityPip${rarity.tier.charAt(0).toUpperCase() + rarity.tier.slice(1).replace('-', '')}`}>
                {rarity.tier === 'legendary' ? '★' : rarity.tier === 'ultra-rare' ? '◆' : rarity.tier === 'uncommon' ? '●' : ''}
              </span>
            </div>

          </div>
        );
      })}
    </div>
  );
}
