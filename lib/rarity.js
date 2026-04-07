// Pokémon rarity classification based on actual rarity in the Pokédex

const LEGENDARY_IDS = new Set([
  // Kanto legendaries
  144, 145, 146, 150, 151,
  // Johto legendaries
  243, 244, 245, 249, 250,
  // Hoenn legendaries
  377, 378, 379, 380, 381, 383, 384, 385, 386,
  // Sinnoh legendaries
  487, 488, 489, 490, 491, 492, 493, 494,
  // Unova legendaries
  640, 641, 642, 643, 644, 645, 646,
  // Kalos legendaries
  716, 717, 718, 719, 720,
  // Alola legendaries
  785, 786, 787, 788, 789, 800, 801, 802,
  // Galar legendaries
  888, 889, 890, 891, 892, 893,
  // Paldea legendaries
  990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000,
]);

const ULTRA_RARE_IDS = new Set([
  3, 6, 9, // Starter final evos
  25, // Pikachu
  35, // Clefairy
  39, // Jigglypuff
  54, 58, 60, 66, 86, 88, 90, 92, 100, 104, 116, 118, 120, 123, 127, 129, 133, 138, 140, 147, 152, 155, 158, // Gen 1 uncommon
]);

const COMMON_IDS = new Set([
  1, 2, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 36, 37, 41, 42, 43, 44, 48, 49,
  50, 51, 52, 53, 56, 57, 59, 61, 62, 63, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
  87, 89, 91, 93, 94, 95, 96, 97, 98, 99, 101, 102, 103, 109, 110, 111, 112, 113, 114, 115, 117, 119, 121, 122,
  124, 125, 126, 128, 130, 131, 132, 134, 135, 136, 137, 139, 141, 142, 143,
]);

export const getRarity = (pokemonId) => {
  if (LEGENDARY_IDS.has(pokemonId)) {
    return {
      tier: 'legendary',
      name: 'Legendary',
      color: '#FFD700',
      borderColor: '#FFD700',
      dropRate: 0.001,
    };
  }

  if (ULTRA_RARE_IDS.has(pokemonId)) {
    return {
      tier: 'ultra-rare',
      name: 'Ultra Rare',
      color: '#FF69B4',
      borderColor: '#FF1493',
      dropRate: 0.05,
    };
  }

  if (COMMON_IDS.has(pokemonId)) {
    return {
      tier: 'common',
      name: 'Common',
      color: '#9E9E9E',
      borderColor: '#757575',
      dropRate: 0.4,
    };
  }

  return {
    tier: 'uncommon',
    name: 'Uncommon',
    color: '#4CAF50',
    borderColor: '#388E3C',
    dropRate: 0.3,
  };
};

export const getRarityChance = (pokemonId) => {
  return getRarity(pokemonId).dropRate;
};
