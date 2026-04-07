// Achievement definitions and logic

export const ACHIEVEMENTS = {
  'first-catch': {
    id: 'first-catch',
    name: 'First Catch',
    description: 'Catch your first Pokémon',
    icon: '🎯',
    condition: (stats) => stats.uniquePokemon >= 1,
  },
  'ten-catch': {
    id: 'ten-catch',
    name: 'Pokémon Trainer',
    description: 'Catch 10 Pokémon',
    icon: '⚡',
    condition: (stats) => stats.uniquePokemon >= 10,
  },
  'hundred-catch': {
    id: 'hundred-catch',
    name: 'Master Collector',
    description: 'Catch 100 Pokémon',
    icon: '🏆',
    condition: (stats) => stats.uniquePokemon >= 100,
  },
  'five-session': {
    id: 'five-session',
    name: 'Getting Started',
    description: 'Complete 5 focus sessions',
    icon: '🚀',
    condition: (stats) => stats.totalSessions >= 5,
  },
  'fifty-session': {
    id: 'fifty-session',
    name: 'Focus Master',
    description: 'Complete 50 focus sessions',
    icon: '🎪',
    condition: (stats) => stats.totalSessions >= 50,
  },
  'hundred-session': {
    id: 'hundred-session',
    name: 'Legendary Trainer',
    description: 'Complete 100 focus sessions',
    icon: '👑',
    condition: (stats) => stats.totalSessions >= 100,
  },
  'three-day-streak': {
    id: 'three-day-streak',
    name: 'On Fire',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    condition: (stats) => stats.streak >= 3,
  },
  'week-warrior': {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🌟',
    condition: (stats) => stats.streak >= 7,
  },
  'month-champion': {
    id: 'month-champion',
    name: 'Champion',
    description: 'Maintain a 30-day streak',
    icon: '💎',
    condition: (stats) => stats.streak >= 30,
  },
  'all-types': {
    id: 'all-types',
    name: 'Type Master',
    description: 'Catch Pokémon from all 18 types',
    icon: '🌈',
    condition: (stats, collection) => {
      const types = new Set();
      collection.forEach(p => p.types.forEach(t => types.add(t)));
      return types.size >= 18;
    },
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete a session after 10 PM',
    icon: '🌙',
    condition: () => {
      const hour = new Date().getHours();
      return hour >= 22 || hour <= 5;
    },
  },
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Complete a session before 7 AM',
    icon: '🌅',
    condition: () => {
      const hour = new Date().getHours();
      return hour >= 5 && hour < 7;
    },
  },
};

export const checkAchievements = (stats, collection, sessions) => {
  const newAchievements = [];

  Object.values(ACHIEVEMENTS).forEach((achievement) => {
    const isUnlocked = achievement.condition(stats, collection, sessions);
    if (isUnlocked) {
      newAchievements.push(achievement.id);
    }
  });

  return newAchievements;
};

export const getAchievementData = (achievementId) => {
  return ACHIEVEMENTS[achievementId] || null;
};
