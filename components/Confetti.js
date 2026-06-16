import { useMemo } from 'react';

const COLORS = ['#EE1515', '#FFCB05', '#3D7DCA', '#4ADE80', '#FF69B4', '#FFD700'];

// One-shot confetti burst rendered while a Pokémon is revealed.
export default function Confetti({ count = 70 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rounded: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <div className="confettiLayer" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confettiPiece"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 1.4}px`,
            background: p.color,
            borderRadius: p.rounded ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
