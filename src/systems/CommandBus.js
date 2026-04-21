// ============================================================
// CommandBus.js
// Multiplayer-ready boundary: records local input commands and
// world events so simulation can be replayed/synchronized later.
// ============================================================

export class CommandBus {
  constructor() {
    this.commands = [];
    this.events = [];
    this.tick = 0;
  }

  beginTick() {
    this.tick++;
  }

  pushCommand(type, payload = {}) {
    this.commands.push({ tick: this.tick, type, payload });
  }

  pushEvent(type, payload = {}) {
    this.events.push({ tick: this.tick, type, payload });
  }

  drain() {
    const out = {
      tick: this.tick,
      commands: this.commands.slice(),
      events: this.events.slice(),
    };
    this.commands.length = 0;
    this.events.length = 0;
    return out;
  }
}
