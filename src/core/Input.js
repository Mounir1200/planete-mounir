// Keyboard, mouse and touch input folded into one movement/look state.
// Physical key codes make ZQSD (AZERTY) and WASD (QWERTY) work alike.
const MOVE_KEYS = {
  KeyW: [0, 1], ArrowUp: [0, 1],
  KeyS: [0, -1], ArrowDown: [0, -1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};
const ACTION_KEYS = {
  KeyE: 'interact', Enter: 'interact',
  KeyM: 'map', KeyJ: 'journal', KeyN: 'daynight', Escape: 'back',
};
const JOYSTICK_RADIUS = 56;

export class Input {
  constructor(canvas, events) {
    this.canvas = canvas;
    this.events = events;
    this.pressed = new Set();
    this.jumpQueued = false;
    this.lookDelta = { x: 0, y: 0 };
    this.zoomDelta = 0;
    this.touchMove = { x: 0, y: 0 };
    this.enabled = true;
    this.hasMoved = false;
    this.#bindKeyboard();
    this.#bindPointer();
  }

  set enabled(value) {
    if (this._enabled && !value) this.releaseAll();
    this._enabled = Boolean(value);
  }

  get enabled() {
    return this._enabled;
  }

  // Movement this frame, relative to the camera: x = right, y = forward.
  movement() {
    let x = this.touchMove.x;
    let y = this.touchMove.y;
    for (const code of this.pressed) {
      const vector = MOVE_KEYS[code];
      if (vector) { x += vector[0]; y += vector[1]; }
    }
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    if (length > 0.1) this.hasMoved = true;
    const run = this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight') || Math.hypot(this.touchMove.x, this.touchMove.y) > 0.92;
    return { x, y, run };
  }

  consumeJump() {
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return jump;
  }

  consumeLook() {
    const delta = { ...this.lookDelta };
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    return delta;
  }

  consumeZoom() {
    const zoom = this.zoomDelta;
    this.zoomDelta = 0;
    return zoom;
  }

  queueJump() {
    if (this.enabled) this.jumpQueued = true;
  }

  setTouchMove(x, y) {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  releaseAll() {
    this.pressed.clear();
    this.touchMove.x = 0;
    this.touchMove.y = 0;
    this.jumpQueued = false;
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    this.zoomDelta = 0;
  }

  #isTyping(event) {
    const element = event.target;
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element?.tagName === 'SELECT' || element?.isContentEditable;
  }

  #bindKeyboard() {
    window.addEventListener('keydown', event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (this.#isTyping(event) && event.code !== 'Escape') return;
      // Enter and Space belong to focused controls, even when the game is listening globally.
      const nativeControl = event.target?.closest?.('button, a[href], summary, [role="button"], [role="link"]');
      if (nativeControl && (event.code === 'Enter' || event.code === 'Space')) return;
      const action = ACTION_KEYS[event.code];
      if (action) {
        if (!event.repeat) this.events.emit('action', action);
        if (action !== 'back') event.preventDefault();
        return;
      }
      if (!this.enabled) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) this.jumpQueued = true;
        return;
      }
      if (MOVE_KEYS[event.code] || event.code.startsWith('Shift')) {
        this.pressed.add(event.code);
        if (event.code.startsWith('Arrow')) event.preventDefault();
      }
    });
    window.addEventListener('keyup', event => this.pressed.delete(event.code));
    window.addEventListener('blur', () => this.releaseAll());
  }

  #bindPointer() {
    let dragPointer = null;
    let last = { x: 0, y: 0 };
    let travelled = 0;
    this.canvas.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch' && event.clientX < window.innerWidth * 0.45 && this.joystickActive) return;
      dragPointer = event.pointerId;
      last = { x: event.clientX, y: event.clientY };
      travelled = 0;
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', event => {
      if (event.pointerId !== dragPointer) return;
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      travelled += Math.abs(dx) + Math.abs(dy);
      this.lookDelta.x += dx;
      this.lookDelta.y += dy;
      last = { x: event.clientX, y: event.clientY };
    });
    const release = event => {
      if (event.pointerId !== dragPointer) return;
      dragPointer = null;
      if (travelled < 6) this.events.emit('tap', { x: event.clientX, y: event.clientY });
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
    this.canvas.addEventListener('wheel', event => {
      event.preventDefault();
      this.zoomDelta += Math.sign(event.deltaY) * 0.1;
    }, { passive: false });
  }

  // On-screen joystick for touch devices.
  attachJoystick(base, knob) {
    this.joystickActive = true;
    let pointer = null;
    let origin = { x: 0, y: 0 };
    const move = event => {
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      const distance = Math.min(JOYSTICK_RADIUS, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      knob.style.transform = `translate(${x}px, ${y}px)`;
      this.setTouchMove(x / JOYSTICK_RADIUS, -y / JOYSTICK_RADIUS);
    };
    base.addEventListener('pointerdown', event => {
      pointer = event.pointerId;
      const rect = base.getBoundingClientRect();
      origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      base.setPointerCapture(event.pointerId);
      move(event);
    });
    base.addEventListener('pointermove', event => { if (event.pointerId === pointer) move(event); });
    const end = event => {
      if (event.pointerId !== pointer) return;
      pointer = null;
      knob.style.transform = '';
      this.setTouchMove(0, 0);
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }
}
