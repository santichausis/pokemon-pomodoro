import { isTrustedSpriteUrl } from '@/lib/utils';

// Shared validation for collection/session data coming from untrusted
// sources: a shared #share= URL or an imported JSON backup file. Both are
// attacker-controllable (the user can be sent a crafted link, or open a
// crafted file), so neither shape nor size can be trusted before use.
const MAX_COLLECTION_SIZE = 500;
const MAX_SESSIONS_SIZE = 2000;
const MAX_STRING_LEN = 200;

function safeString(value, maxLen = MAX_STRING_LEN) {
  return typeof value === 'string' ? value.slice(0, maxLen) : '';
}

function sanitizePokemonEntry(entry, index) {
  if (!entry || typeof entry !== 'object') return null;
  const id = Number(entry.id);
  if (!Number.isFinite(id) || id < 1 || id > 100000) return null;
  const name = safeString(entry.name, 50);
  if (!name) return null;
  const types = Array.isArray(entry.types)
    ? entry.types.filter(t => typeof t === 'string').slice(0, 4)
    : [];
  return {
    id,
    name,
    types,
    sprite: isTrustedSpriteUrl(entry.sprite) ? entry.sprite : '',
    goal: safeString(entry.goal),
    date: safeString(entry.date, 30),
    // `session` is used as a unique key (React list key, delete-by-session
    // filter) — offset the Date.now() fallback by index so multiple entries
    // missing `session` in the same batch don't collide on one timestamp.
    session: Number.isFinite(Number(entry.session)) ? Number(entry.session) : Date.now() + index,
  };
}

export function sanitizeCollection(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_COLLECTION_SIZE).map(sanitizePokemonEntry).filter(Boolean);
}

function sanitizeSessionEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const date = safeString(entry.date, 30);
  if (!date) return null;
  const duration = Number(entry.duration);
  return {
    date,
    duration: Number.isFinite(duration) && duration >= 0 ? duration : 0,
    goal: safeString(entry.goal),
  };
}

export function sanitizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_SESSIONS_SIZE).map(sanitizeSessionEntry).filter(Boolean);
}
