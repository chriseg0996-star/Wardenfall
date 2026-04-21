// ============================================================
// Loot.js
// Dropped entities: coins or items. Both arc on spawn, fall to
// ground, magnetize toward the player when close, then pickup.
// ============================================================

import { LOOT, RARITY } from "../config/Constants.js";
import { ITEMS } from "../config/Items.js";
import { applyPhysics } from "../systems/Physics.js";

export class Loot {
  // kind: "coin" | "item"
  // payload: { value } for coin, { itemId, rarity } for item
  constructor(x, y, kind, payload) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = -5 - Math.random() * 2;
    this.onGround = false;
    this.kind = kind;
    this.payload = payload;
    this.lifetime = LOOT.LIFETIME;
    this.dead = false;
    this.bob = Math.random() * Math.PI * 2;
  }

  update(player, platforms, onPickup) {
    this.lifetime--;
    if (this.lifetime <= 0) { this.dead = true; return; }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    const dx = pcx - cx;
    const dy = pcy - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < LOOT.MAGNET_RADIUS) {
      const speed = LOOT.MAGNET_SPEED;
      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;
      this.x += this.vx;
      this.y += this.vy;
    } else {
      applyPhysics(this, platforms);
      if (this.onGround) this.vx *= 0.9;
    }

    if (dist < LOOT.PICKUP_RADIUS) {
      if (onPickup) onPickup(this);
      this.dead = true;
    }

    this.bob += 0.1;
  }

  render(ctx) {
    if (this.lifetime < 60 && Math.floor(this.lifetime / 4) % 2 === 0) return;
    if (this.kind === "coin") this.renderCoin(ctx);
    else this.renderItem(ctx);
  }

  renderCoin(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2 + Math.sin(this.bob) * 1.5;
    ctx.fillStyle = "#ffd23f";
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c98a00";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#fff5c0";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  renderItem(ctx) {
    const rarity = RARITY[this.payload.rarity] || RARITY.COMMON;
    const tpl = ITEMS[this.payload.itemId];
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2 + Math.sin(this.bob) * 1.5;

    // Rarity glow
    ctx.shadowBlur = 14;
    ctx.shadowColor = rarity.color;
    ctx.fillStyle = rarity.color;
    ctx.fillRect(this.x, this.y - 3, this.width, this.height);
    ctx.shadowBlur = 0;

    // Icon
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tpl?.icon || "?", cx, cy + 1);
    ctx.textBaseline = "alphabetic";
  }
}
