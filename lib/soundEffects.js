// Sound effect management with Web Audio API synthesis

const generateBeep = (frequency = 800, duration = 200) => {
  if (typeof window === 'undefined' || !window.AudioContext && !window.webkitAudioContext) {
    return null;
  }

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);

  return audioContext;
};

const soundGenerators = {
  'timer-complete': () => {
    generateBeep(523, 150); // C5
    setTimeout(() => generateBeep(659, 150), 100); // E5
    setTimeout(() => generateBeep(783, 300), 200); // G5
  },
  'pokemon-catch': () => {
    generateBeep(600, 100);
    setTimeout(() => generateBeep(800, 100), 120);
    setTimeout(() => generateBeep(1000, 200), 240);
  },
  'achievement': () => {
    generateBeep(880, 80);
    setTimeout(() => generateBeep(1046, 80), 100);
    setTimeout(() => generateBeep(1318, 150), 200);
  },
  'level-up': () => {
    generateBeep(523, 100);
    setTimeout(() => generateBeep(659, 100), 120);
    setTimeout(() => generateBeep(783, 100), 240);
    setTimeout(() => generateBeep(1046, 200), 360);
  },
};

export const playSoundEffect = (soundType, enabled = true) => {
  if (!enabled) return;

  const generator = soundGenerators[soundType];
  if (generator) {
    try {
      generator();
    } catch (error) {
      console.debug(`Error playing sound: ${soundType}`, error);
    }
  }
};

export const getSoundSettings = () => {
  if (typeof localStorage === 'undefined') return { soundsEnabled: true };
  const saved = localStorage.getItem('poke-sounds-enabled');
  return {
    soundsEnabled: saved !== 'false',
  };
};

export const setSoundSettings = (enabled) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('poke-sounds-enabled', enabled ? 'true' : 'false');
};
