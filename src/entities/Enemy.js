// ============================================================
// Enemy.js
// Patrol/chase AI with stagger (hitstun) on damage.
// Renders as animated sprite based on type.id.
// ============================================================

import { applyPhysics } from "../systems/Physics.js";
import { COMBAT } from "../config/Constants.js";
import { drawSprite } from "../systems/Sprite.js";

export class Enemy {
  constructor(x, y, type) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = type.width;
    this.height = type.height;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;

    this.maxHp = type.hp;
    this.hp = type.hp;
    this.damage = type.damage;
    this.exp = type.exp;

    this.dir = Math.random() < 0.5 ? -1 : 1;
    this.state = "patrol";
    this.patrolTimer = 60 + Math.floor(Math.random() * 120);
    this.attackCooldown = 0;
    this.attackWindup = 0;

    this.hitFlash = 0;
    this.knockbackX = 0;
    this.stagger = 0;
    this.dead = false;

    // Sprite animation
    this.animFrame = 0;
    this.animTimer = 0;
  }

  update(player, platforms) {
    // Advance animation regardless of state
    this.animTimer++;
    if (this.animTimer >= 20) {
      this.animFrame = 1 - this.animFrame;
      this.animTimer = 0;
    }

    if (this.stagger > 0) {
      this.stagger--;
      this.vx = 0;
      this.vx += this.knockbackX;
      this.knockbackX *= COMBAT.KNOCKBACK_DECAY;
      if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;
      if (this.hitFlash > 0) this.hitFlash--;
      if (this.attackCooldown > 0) this.attackCooldown--;
      applyPhysics(this, platforms);
      return;
    }

    const px = player.x + player.width / 2;
    const ex = this.x + this.width / 2;
    const dist = Math.abs(px - ex);
    this.state = (!player.isDead && dist < this.type.detectRange) ? "chase" : "patrol";

    if (this.state === "patrol") {
      this.patrolTimer--;
      if (this.patrolTimer <= 0) {
        this.dir *= -1;
        this.patrolTimer = 60 + Math.floor(Math.random() * 120);
      }
      this.vx = this.dir * this.type.moveSpeed * 0.6;
      if (this.onGround && this.willFall(platforms)) this.dir *= -1;
    } else {
      this.dir = px < ex ? -1 : 1;
      this.vx = this.dir * this.type.moveSpeed;
    }

    this.vx += this.knockbackX;
    this.knockbackX *= COMBAT.KNOCKBACK_DECAY;
    if (Math.abs(this.knockbackX) < 0.1) this.knockbackX = 0;

    if (this.hitFlash > 0) this.hitFlash--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    applyPhysics(this, platforms);
    this.tryDamagePlayer(player);
  }

  willFall(platforms) {
    const lookX = this.dir === 1 ? this.x + this.width + 4 : this.x - 4;
    const lookY = this.y + this.height + 6;
    for (const p of platforms) {
      if (lookX >= p.x && lookX <= p.x + p.width &&
          lookY >= p.y && lookY <= p.y + p.height) return false;
    }
    return true;
  }

  tryDamagePlayer(player) {
    if (this.attackCooldown > 0) return;
    if (player.isDead) return;
    const overlap =
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y;
    if (!overlap) {
      this.attackWindup = 0;
      return;
    }

    // Short windup improves readability and dodgeability.
    if (this.attackWindup <= 0) {
      this.attackWindup = 10;
      return;
    }
    this.attackWindup--;
    if (this.attackWindup <= 0) {
      const didHit = player.takeDamage(this.damage, this.x + this.width / 2);
      if (didHit) this.attackCooldown = this.type.attackCooldown;
    }
  }

  takeDamage(amount, sourceX) {
    this.hp -= amount;
    this.hitFlash = COMBAT.HIT_FLASH_FRAMES;
    const dir = sourceX < this.x + this.width / 2 ? 1 : -1;
    this.knockbackX = dir * this.type.knockback;
    this.vy = -3;
    if (Math.random() > this.type.staggerResist) {
      this.stagger = COMBAT.STAGGER_FRAMES;
    }
    if (this.hp <= 0) this.dead = true;
  }

  render(ctx) {
    // Pick sprite key based on type.id
    const id = this.type.id;
    let spriteKey;
    if (id === "slime") {
      spriteKey = `slime_${this.animFrame}`;
    } else if (id === "mushroom") {
      spriteKey = `mushroom_${this.animFrame}`;
    } else if (id === "wolf" || id === "alpha_wolf") {
      const d = this.dir === 1 ? "right" : "left";
      spriteKey = `wolf_${d}_${this.animFrame}`;
    }

    // Sprites are rendered at collision-box size. Wolf sprite is 48×34
    // while hitbox is 44×30, so small offset looks natural.
    const pad = id === "wolf" ? 2 : 2;
    const sx = this.x - pad;
    const sy = this.y - pad;
    const sw = this.width + pad * 2;
    const sh = this.height + pad * 2;

    if (this.hitFlash > 0) {
      ctx.save();
      ctx.filter = "brightness(3) saturate(0.2)";
      drawSprite(ctx, spriteKey, sx, sy, sw, sh);
      ctx.restore();
    } else {
      drawSprite(ctx, spriteKey, sx, sy, sw, sh);
    }

    // Stagger indicator
    if (this.stagger > 0) {
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", this.x + this.width / 2, this.y - 10);
    }

    // HP bar
    if (this.hp < this.maxHp) {
      const barW = this.width, barH = 4;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(this.x, this.y - 8, barW, barH);
      ctx.fillStyle = "#e63946";
      ctx.fillRect(this.x, this.y - 8, barW * (this.hp / this.maxHp), barH);
    }

    if (this.attackWindup > 0) {
      const pulse = 0.45 + 0.45 * Math.sin(Date.now() / 60);
      ctx.fillStyle = `rgba(255, 80, 80, ${pulse})`;
      ctx.fillRect(this.x, this.y - 14, this.width, 4);
    }
  }
}
