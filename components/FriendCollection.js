import { TYPE_CLASSES } from '@/lib/constants';

export default function FriendCollection({ friendCollection, t }) {
  if (friendCollection.length === 0) return null;

  return (
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
              {p.types.map(t => (
                <span key={t} className={`typeBadge ${TYPE_CLASSES[t] || ''}`}>{t}</span>
              ))}
            </div>
            <span className="pokemonCardDate">{p.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
