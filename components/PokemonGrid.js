import { motion } from 'motion/react';
import PokemonCard from '@/components/PokemonCard';

export default function PokemonGrid({ collection, t }) {
  if (collection.length === 0) {
    return (
      <div className="pokemonGrid">
        <div className="emptyState">
          <div className="emptyPokeball">
            <div className="epbTop" />
            <div className="epbBand"><div className="epbBtn" /></div>
            <div className="epbBottom" />
          </div>
          <p>{t.emptyLine1}<br />{t.emptyLine2}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="pokemonGrid" layout>
      {[...collection].sort((a, b) => a.id - b.id).map((p, i) => (
        <PokemonCard key={`${p.id}-${p.session}`} pokemon={p} index={i} />
      ))}
    </motion.div>
  );
}
