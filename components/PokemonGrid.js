import { TYPE_CLASSES } from '@/lib/constants';
import { getRarity } from '@/lib/rarity';

export default function PokemonGrid({ collection, lang, t }) {
  const getRarityClass = (pokemonId) => {
    const rarity = getRarity(pokemonId);
    const rarityMap = {
      'common': 'pokemonCard',
      'uncommon': 'pokemonCardRare',
      'ultra-rare': 'pokemonCardUltraRare',
      'legendary': 'pokemonCardLegendary',
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
        return (
          <div key={`${p.id}-${p.session}`} className={getRarityClass(p.id)}>
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pokemonCardSprite" src={p.sprite} alt={p.name} loading="lazy" />
              <span className={`rarityBadge rarityBadge${rarity.tier.charAt(0).toUpperCase() + rarity.tier.slice(1).replace('-', '')}`}>
                {rarity.name}
              </span>
            </div>
            <span className="pokemonCardNumber">#{String(p.id).padStart(3, '0')}</span>
            <span className="pokemonCardName">{p.name}</span>
            <div className="pokemonCardTypes">
              {p.types.map(t => <span key={t} className={`typeBadge ${TYPE_CLASSES[t] || ''}`}>{t}</span>)}
            </div>
            <span className="pokemonCardGoal" title={p.goal}>{p.goal}</span>
            <span className="pokemonCardDate">{p.date}</span>
          </div>
        );
      })}
    </div>
  );
}
