/** One-shot signal from the preloader that the page is revealed. */
let fired = false;
const listeners = new Set<() => void>();

export function fireIntro() {
  if (fired) return;
  fired = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Runs `callback` when the intro starts; returns false if it already happened. */
export function onIntro(callback: () => void): { pending: boolean; cancel: () => void } {
  if (fired) return { pending: false, cancel: () => {} };
  listeners.add(callback);
  return { pending: true, cancel: () => listeners.delete(callback) };
}
