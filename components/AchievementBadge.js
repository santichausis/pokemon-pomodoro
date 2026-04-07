import { getAchievementData } from '@/lib/achievements';

export default function AchievementBadge({ achievementId, size = 'small' }) {
  const achievement = getAchievementData(achievementId);

  if (!achievement) return null;

  const sizeClass = size === 'large' ? 'achievementBadgeLarge' : 'achievementBadge';

  return (
    <div className={sizeClass} title={achievement.description}>
      <span className="achievementIcon">{achievement.icon}</span>
      {size === 'large' && <span className="achievementName">{achievement.name}</span>}
    </div>
  );
}
