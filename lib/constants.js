export const TYPE_CLASSES = {
  normal: 'typeNormal', fire: 'typeFire', water: 'typeWater',
  grass: 'typeGrass', electric: 'typeElectric', ice: 'typeIce',
  fighting: 'typeFighting', poison: 'typePoison', ground: 'typeGround',
  flying: 'typeFlying', psychic: 'typePsychic', bug: 'typeBug',
  rock: 'typeRock', ghost: 'typeGhost', dragon: 'typeDragon',
  dark: 'typeDark', steel: 'typeSteel', fairy: 'typeFairy',
};

// PokéAPI always returns type names in English — translate for display.
export const TYPE_NAMES = {
  normal:   { en: 'Normal',   es: 'Normal' },
  fire:     { en: 'Fire',     es: 'Fuego' },
  water:    { en: 'Water',    es: 'Agua' },
  grass:    { en: 'Grass',    es: 'Planta' },
  electric: { en: 'Electric', es: 'Eléctrico' },
  ice:      { en: 'Ice',      es: 'Hielo' },
  fighting: { en: 'Fighting', es: 'Lucha' },
  poison:   { en: 'Poison',   es: 'Veneno' },
  ground:   { en: 'Ground',   es: 'Tierra' },
  flying:   { en: 'Flying',   es: 'Volador' },
  psychic:  { en: 'Psychic',  es: 'Psíquico' },
  bug:      { en: 'Bug',      es: 'Bicho' },
  rock:     { en: 'Rock',     es: 'Roca' },
  ghost:    { en: 'Ghost',    es: 'Fantasma' },
  dragon:   { en: 'Dragon',   es: 'Dragón' },
  dark:     { en: 'Dark',     es: 'Siniestro' },
  steel:    { en: 'Steel',    es: 'Acero' },
  fairy:    { en: 'Fairy',    es: 'Hada' },
};

export function translateType(type, lang = 'en') {
  const key = type?.toLowerCase();
  return TYPE_NAMES[key]?.[lang] || TYPE_NAMES[key]?.en || type;
}

export const GENERATIONS = {
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
