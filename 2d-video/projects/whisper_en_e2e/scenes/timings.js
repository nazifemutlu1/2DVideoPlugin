// scenes/timings.js — every visible word time comes from timeline/words.json at runtime.
import { E } from '/engine/core.js';

const norm = (s) => String(s).toLowerCase().replace(/[^\w']/g, '');

export function findWord(word, afterGlobal = 0, occurrence = 0) {
  const needle = norm(word);
  const hits = E.words.filter((w) => w.start >= afterGlobal - 0.05 && norm(w.word) === needle);
  if (hits[occurrence]) return hits[occurrence];
  const prefix = E.words.filter((w) => w.start >= afterGlobal - 0.05 && norm(w.word).startsWith(needle));
  if (prefix[occurrence]) return prefix[occurrence];
  throw new Error(`timing not found for "${word}" after ${afterGlobal.toFixed(2)}s`);
}

export const localStart = (word, shotStart) => word.start - shotStart;
export const stamp = (seconds) => `${seconds.toFixed(2)}s`;
