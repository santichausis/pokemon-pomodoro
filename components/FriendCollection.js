import PokemonCard from '@/components/PokemonCard';

export default function FriendCollection({ friendCollection, t, lang }) {
  if (friendCollection.length === 0) return null;

  return (
    <section className="collectionSection collectionPanel glass friendSection">
      <div className="collectionHeader">
        <div className="collectionTitleGroup">
          <h2 className="collectionTitle">{t.friendTitle}</h2>
          <span className="collectionBadge friendBadge">{friendCollection.length}</span>
        </div>
      </div>
      <div className="pokemonGrid">
        {[...friendCollection].sort((a, b) => a.id - b.id).map((p, i) => (
          <PokemonCard key={`friend-${p.id}-${p.session}`} pokemon={p} index={i} lang={lang} />
        ))}
      </div>
    </section>
  );
}
