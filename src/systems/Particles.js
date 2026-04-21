// ============================================================
// Particles.js
// Tiny particle system for game feel (hit sparks, pickups,
// level-up bursts, death puffs). Pure data + one render pass.
// ============================================================

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(x, y, opts = {}) {
    const {
      count = 6,
      color = "#ffffff",
      speedMin = 1,
      speedMax = 4,
      life = 25,
      size = 3,
      gravity = 0.1,
      spread = Math.PI * 2,   // full circle by default
      angle = 0,              // center angle
    } = opts;

    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speedMin + Math.random() * (speedMax - speedMin);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life + Math.random() * life * 0.3,
        maxLife: life,
        color,
        size: size * (0.7 + Math.random() * 0.6),
        gravity,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.95;
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
