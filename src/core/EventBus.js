// Tiny publish/subscribe hub so gameplay, audio and UI stay decoupled.
export class EventBus {
  #listeners = new Map();

  on(name, listener) {
    if (!this.#listeners.has(name)) this.#listeners.set(name, new Set());
    this.#listeners.get(name).add(listener);
    return () => this.#listeners.get(name).delete(listener);
  }

  emit(name, payload) {
    this.#listeners.get(name)?.forEach(listener => listener(payload));
  }
}
