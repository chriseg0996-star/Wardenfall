// ============================================================
// DamageNumber.js
// Floating text that rises and fades. Used for hit feedback.
// Crits render larger and yellow for extra juice.
// ============================================================

export class DamageNumber {
  constructor(x, y, value, isCrit = false) {
    this.x = x + (Math.random() - 0.5) * 20;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = -2.5 - Math.random();
    this.life = 40;
    this.maxLife = 40;
    this.value = value;
    this.isCrit = isCrit;
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12; // gravity on text
    this.life--;
    if (this.life <= 0) this.dead = true;
  }

  render(ctx) {
    const alpha = Math.min(1, this.life / 20);
    const size = this.isCrit ? 22 : 16;
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.fillStyle = this.isCrit ? "#ffd23f" : "#ffffff";
    const text = this.isCrit ? `${this.value}!` : String(this.value);
    ctx.strokeText(text, this.x, this.y);
    ctx.fillText(text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}
