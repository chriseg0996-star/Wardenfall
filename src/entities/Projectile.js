// ============================================================
// Projectile.js
// Player-fired projectile. Pierces multiple enemies but tracks
// which it has hit so each enemy only takes damage once.
// ============================================================

export class Projectile {
  constructor(x, y, vx, damage, lifetime, color = "#c084fc") {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 8;
    this.vx = vx;
    this.vy = 0;
    this.damage = damage;
    this.lifetime = lifetime;
    this.color = color;
    this.dead = false;
    this.hitEnemies = new Set();
    this.trail = [];
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    if (this.lifetime <= 0) this.dead = true;
  }

  render(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i + 1) / this.trail.length * 0.4;
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.fillRect(t.x, t.y, this.width, this.height);
    }
    ctx.globalAlpha = 1;

    // Body with glow
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + 4, this.y + 2, this.width - 8, this.height - 4);
  }
}
