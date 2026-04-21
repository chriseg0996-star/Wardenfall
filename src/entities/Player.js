// ============================================================
// Player.js
// Combat character with movement, jump, attack chain, MP, and
// derived stats from: level + stat points + gear + skill tree.
// Renders as animated sprite with walk cycle.
// ============================================================

import { PLAYER, WORLD, COMBAT } from "../config/Constants.js";
import { applyPhysics } from "../systems/Physics.js";
import { drawSprite } from "../systems/Sprite.js";
import { audio } from "../systems/Audio.js";

export class Player {
  constructor(x, y, progression, stats, inventory) {
    this.x = x;
    this.y = y;
    this.width = PLAYER.WIDTH;
    this.height = PLAYER.HEIGHT;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;

    // References to systems
    this.progression = progression;
    this.stats = stats;
    this.inventory = inventory;

    // Resources
    this.maxHp = PLAYER.BASE_HP;
    this.hp = this.maxHp;
    this.maxMp = PLAYER.BASE_MP;
    this.mp = this.maxMp;

    // Persistent modifiers are applied by systems (skill tree, future buffs/debuffs).
    this.modifiers = new Map();

    // Derived (recalculated via recalcStats)
    this.damage = PLAYER.BASE_DAMAGE;
    this.critChance = PLAYER.BASE_CRIT;
    this.dropRateBonus = 0;

    // Timers
    this.attackCooldown = 0;
    this.attackActive = 0;
    this.invuln = 0;
    this.hitFlash = 0;

    // Combo system
    this.comboCount = 0;
    this.comboWindow = 0;

    this.coins = 0;

    this.hitbox = null;
    this.hitEnemiesThisSwing = new Set();
    this.isFinisher = false;
    this.isJumpAttack = false;

    // Sprite animation
    this.animFrame = 0;      // 0, 1, 2
    this.animTimer = 0;
    this.animDir = 1;        // 0→1→2→1→0 cycle direction
    this.walking = false;

    this.recalcStats();
  }

  recalcStats() {
    const lvl = this.progression.level;
    const statBonuses = this.stats.getBonuses();
    const gearBonuses = this.inventory.getEquippedBonuses();
    const mods = this.getModifierTotals();

    const prevMaxHp = this.maxHp;
    this.maxHp = Math.round(
      PLAYER.BASE_HP + (lvl - 1) * 15
      + statBonuses.maxHp
      + (gearBonuses.maxHp || 0)
      + mods.maxHpFlat
    );
    if (prevMaxHp > 0) this.hp = Math.min(this.maxHp, Math.round(this.hp * (this.maxHp / prevMaxHp)));

    const prevMaxMp = this.maxMp;
    this.maxMp = Math.round(PLAYER.BASE_MP + mods.maxMpFlat);
    if (prevMaxMp > 0) this.mp = Math.min(this.maxMp, Math.round(this.mp * (this.maxMp / prevMaxMp)));

    this.damage = Math.round(
      (PLAYER.BASE_DAMAGE + (lvl - 1) * 3
       + statBonuses.damage
       + (gearBonuses.damage || 0))
      * mods.damageMult
    );

    this.critChance = Math.min(1,
      PLAYER.BASE_CRIT + statBonuses.crit + (gearBonuses.critChance || 0)
      + mods.critBonus
    );

    this.dropRateBonus = statBonuses.dropRate + (gearBonuses.dropRate || 0);
    this.skillDamageMult = mods.skillDamageMult;
    this.hpRegen = mods.hpRegenPerFrame;
  }

  update(input, platforms) {
    // MP regen
    this.mp = Math.min(this.maxMp, this.mp + PLAYER.MP_REGEN_PER_FRAME);

    // HP regen (from skill tree)
    if (this.hpRegen > 0 && this.hp > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen);
    }

    // Horizontal input
    const left = input.isDown("a", "arrowleft");
    const right = input.isDown("d", "arrowright");

    let targetVx = 0;
    if (left)  { targetVx = -PLAYER.MOVE_SPEED; this.facing = -1; }
    if (right) { targetVx =  PLAYER.MOVE_SPEED; this.facing =  1; }

    if (this.attackActive <= 0) {
      this.vx += (targetVx - this.vx) * PLAYER.ACCEL;
      if (!left && !right) this.vx *= WORLD.FRICTION;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    } else {
      this.vx *= 0.9;
    }

    // Jump
    if (input.wasPressed(" ", "w", "arrowup") && this.onGround) {
      this.vy = -PLAYER.JUMP_POWER;
      this.onGround = false;
      audio.jump();
    }

    // Basic attack
    if (input.wasPressed("j", "z", "x") && this.attackCooldown <= 0) {
      this.startAttack();
    }

    // Timers
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.attackActive > 0) {
      this.attackActive--;
      this.updateHitbox();
      if (this.attackActive === 0) {
        this.hitbox = null;
        this.hitEnemiesThisSwing.clear();
        this.isFinisher = false;
        this.isJumpAttack = false;
      }
    }
    if (this.comboWindow > 0) {
      this.comboWindow--;
      if (this.comboWindow === 0) this.comboCount = 0;
    }
    if (this.invuln > 0) this.invuln--;
    if (this.hitFlash > 0) this.hitFlash--;

    // Animation state
    this.walking = Math.abs(this.vx) > 0.5 && this.onGround;
    if (this.walking) {
      this.animTimer++;
      if (this.animTimer >= 7) {
        // Cycle 0→1→2→1→0 for a smoother walk
        this.animFrame += this.animDir;
        if (this.animFrame >= 2) { this.animFrame = 2; this.animDir = -1; }
        else if (this.animFrame <= 0) { this.animFrame = 0; this.animDir = 1; }
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
      this.animDir = 1;
    }

    applyPhysics(this, platforms);
  }

  startAttack() {
    const isFinisher = this.comboCount === 2;
    const isJumpAttack = !this.onGround;

    this.attackCooldown = isFinisher ? PLAYER.ATTACK_COOLDOWN + 6 : PLAYER.ATTACK_COOLDOWN;
    this.attackActive = PLAYER.ATTACK_DURATION;
    this.hitEnemiesThisSwing.clear();
    this.isFinisher = isFinisher;
    this.isJumpAttack = isJumpAttack;
    this.updateHitbox();

    audio.swing();

    if (isFinisher) {
      this.comboCount = 0;
      this.comboWindow = 0;
    } else {
      this.comboCount++;
      this.comboWindow = PLAYER.COMBO_WINDOW;
    }
  }

  updateHitbox() {
    const w = this.isFinisher ? PLAYER.COMBO_FINISHER_WIDTH  : PLAYER.ATTACK_WIDTH;
    const h = this.isFinisher ? PLAYER.COMBO_FINISHER_HEIGHT : PLAYER.ATTACK_HEIGHT;
    const hx = this.facing === 1 ? this.x + this.width : this.x - w;
    this.hitbox = {
      x: hx,
      y: this.y + this.height / 2 - h / 2,
      width: w,
      height: h,
    };
  }

  getAttackMultiplier() {
    let mult = 1;
    if (this.isFinisher)   mult *= PLAYER.COMBO_FINISHER_MULT;
    if (this.isJumpAttack) mult *= PLAYER.JUMP_ATTACK_MULT;
    return mult;
  }

  takeDamage(amount, sourceX) {
    if (this.invuln > 0) return false;
    this.hp -= amount;
    this.invuln = PLAYER.INVULN_FRAMES;
    this.hitFlash = COMBAT.HIT_FLASH_FRAMES;
    const dir = this.x + this.width / 2 < sourceX ? -1 : 1;
    this.vx = dir * 6;
    this.vy = -6;
    this.comboCount = 0;
    this.comboWindow = 0;
    if (this.hp <= 0) {
      this.hp = 0;
      audio.death();
    } else {
      audio.hurt();
    }
    return true;
  }

  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

  setModifier(source, modifier) {
    if (!source) return;
    this.modifiers.set(source, { ...(modifier || {}) });
    this.recalcStats();
  }

  clearModifier(source) {
    if (!source) return;
    this.modifiers.delete(source);
    this.recalcStats();
  }

  clearAllModifiers() {
    this.modifiers.clear();
    this.recalcStats();
  }

  getModifierTotals() {
    const totals = {
      damageMult: 1,
      skillDamageMult: 1,
      critBonus: 0,
      maxHpFlat: 0,
      maxMpFlat: 0,
      hpRegenPerFrame: 0,
    };
    for (const mod of this.modifiers.values()) {
      totals.damageMult *= mod.damageMult ?? 1;
      totals.skillDamageMult *= mod.skillDamageMult ?? 1;
      totals.critBonus += mod.critBonus ?? 0;
      totals.maxHpFlat += mod.maxHpFlat ?? 0;
      totals.maxMpFlat += mod.maxMpFlat ?? 0;
      totals.hpRegenPerFrame += mod.hpRegenPerFrame ?? 0;
    }
    return totals;
  }

  render(ctx) {
    // Flicker during i-frames
    const flickering = this.invuln > 0 && Math.floor(this.invuln / 3) % 2 === 0;
    if (flickering) ctx.globalAlpha = 0.4;

    const dir = this.facing === 1 ? "right" : "left";
    const frame = this.walking ? this.animFrame : 0;
    const spriteKey = `player_${dir}_${frame}`;

    // Sprite is 32×48; our hitbox is 28×48 — offset by -2 to center
    if (this.hitFlash > 0) {
      ctx.save();
      ctx.filter = "brightness(2.5) saturate(0.3)";
      drawSprite(ctx, spriteKey, this.x - 2, this.y, 32, 48);
      ctx.restore();
    } else {
      drawSprite(ctx, spriteKey, this.x - 2, this.y, 32, 48);
    }
    ctx.globalAlpha = 1;

    // Attack hitbox flash
    if (this.attackActive > 0 && this.hitbox) {
      const alpha = this.attackActive / PLAYER.ATTACK_DURATION;
      const fill = this.isFinisher ? "rgba(255,200,120," : "rgba(255,240,180,";
      ctx.fillStyle = fill + (alpha * 0.55) + ")";
      ctx.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = this.isFinisher ? 3 : 2;
      ctx.strokeRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
    }
  }

  get isDead() { return this.hp <= 0; }
}
