// ============================================================
// BossProjectile.js
// Fireball/dark orb fired by the boss. Damages the player
// on contact and despawns on hit or lifetime expiration.
// ============================================================

export class BossProjectile {
  constructor(x, y, vx, vy, damage, lifetime = 180, color = "#ff4060") {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.lifetime = lifetime;
    this.color = color;
    this.dead = false;
    this.trail = [];
    this.hitPlayer = false;
  }

  update(player) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    if (this.lifetime <= 0) this.dead = true;

    // Damage player on contact
    if (!this.hitPlayer && !player.isDead) {
      const overlap =
        this.x < player.x + player.width &&
        this.x + this.width > player.x &&
        this.y < player.y + player.height &&
        this.y + this.height > player.y;
      if (overlap) {
        const hit = player.takeDamage(this.damage, this.x);
        if (hit) {
          this.hitPlayer = true;
          this.dead = true;
        }
      }
    }
  }

  render(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i + 1) / this.trail.length * 0.5;
      const s = this.width * (0.4 + 0.6 * (i / this.trail.length));
      ctx.globalAlpha = a;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x + this.width / 2, t.y + this.height / 2, s / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Core
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x + this.width / 2 - 2, this.y + this.height / 2 - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
