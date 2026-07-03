export function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    [523, 659, 784, 1046].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t); osc.stop(t + 0.3);
    });
  } catch (_) {}
}

// PokéAPI sprites/artwork are always served from this GitHub-hosted CDN.
// Data that arrives via a shared URL or an imported JSON file is untrusted —
// only render <img src> when it matches this prefix, to avoid an attacker
// pointing the sprite at an arbitrary/oversized/data: URL.
const TRUSTED_SPRITE_PREFIX = 'https://raw.githubusercontent.com/PokeAPI/';

export function isTrustedSpriteUrl(url) {
  return typeof url === 'string' && url.startsWith(TRUSTED_SPRITE_PREFIX);
}

// Aborts the PokéAPI request after `timeoutMs` so a slow/hung connection
// can't leave the capture modal stuck on the shaking Pokéball forever.
export async function fetchRandomPokemon(range = [1, 898], timeoutMs = 8000) {
  const [min, max] = range;
  const id = Math.floor(Math.random() * (max - min + 1)) + min;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`PokeAPI responded ${res.status}`);
    const data = await res.json();
    const sprite = data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default || '';
    const cry = data.cries?.latest || data.cries?.legacy || '';
    return { id, name: data.name.charAt(0).toUpperCase() + data.name.slice(1), sprite, types: data.types.map(t => t.type.name), cry };
  } finally {
    clearTimeout(timer);
  }
}

// Plays the official Pokémon cry (mp3/ogg URL from PokéAPI) at a gentle
// volume. Cries live under the same trusted CDN prefix as sprites, so the
// same whitelist check applies — untrusted collection data (share/import)
// shouldn't be able to point this at an arbitrary URL.
export function playPokemonCry(cryUrl, enabled = true) {
  if (!enabled || !isTrustedSpriteUrl(cryUrl) || typeof Audio === 'undefined') return;
  try {
    const audio = new Audio(cryUrl);
    audio.volume = 0.35;
    audio.play().catch(() => {});
  } catch (_) {}
}

export function getDateStr(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US');
}

// Unicode-safe base64 (btoa throws on non-Latin1 chars like accents/emoji).
export function encodeShare(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

// Caps the encoded payload size so a crafted #share= link can't force the
// browser to decode/parse/render a multi-megabyte JSON blob (client-side DoS).
const MAX_SHARE_LEN = 200_000;

export function decodeShare(str) {
  if (typeof str !== 'string' || str.length === 0 || str.length > MAX_SHARE_LEN) {
    throw new Error('Share payload missing or too large');
  }
  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Safe JSON read from localStorage — never throws on corrupt/missing data.
export function readStored(key, fallback = null) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
