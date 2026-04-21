// ============================================================
// Effect.js
// Transient visual-only effects. They don't deal damage —
// damage is applied at spawn time by the Skills system.
// ============================================================

export class ShockwaveEffect {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.life = 24;
    this.maxLife = 24;
    this.dead = false;
  }
  update() {
    this.life--;
    if (this.life <= 0) this.dead = true;
  }
  render(ctx) {
    const t = 1 - this.life / this.maxLife;    // 0 -> 1
    const r = this.radius * t;
    const alpha = 1 - t;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export class DashStreakEffect {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.life = 14;
    this.maxLife = 14;
    this.dead = false;
  }
  update() {
    this.life--;
    if (this.life <= 0) this.dead = true;
  }
  render(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.globalAlpha = 1;
  }
}
