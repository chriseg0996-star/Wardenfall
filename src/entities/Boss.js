// ============================================================
// Boss.js
// Two-phase boss: Ancient Warden.
//   Phase 1 (100-50% HP): slow chase + telegraphed slam + fireballs
//   Phase 2 (<50% HP):    faster + triple-shot + dash charge
// Attacks are TELEGRAPHED — a warning indicator appears before
// the hit lands so skilled play can dodge.
//
// AI is a simple state machine:
//   IDLE -> CHOOSE_ATTACK -> TELEGRAPH -> EXECUTE -> RECOVER -> IDLE
// ============================================================

import { applyPhysics } from "../systems/Physics.js";
import { COMBAT } from "../config/Constants.js";
import { drawSprite } from "../systems/Sprite.js";
import { BossProjectile } from "./BossProjectile.js";

export class Boss {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 96;
    this.height = 96;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;

    this.maxHp = 1200;
    this.hp = this.maxHp;
    this.contactDamage = 22;
    this.exp = 500;

    this.facing = -1;
    this.phase = 1;
    this.state = "idle";
    this.stateTimer = 90;   // initial idle
    this.attackCooldown = 0;

    this.knockbackX = 0;
    this.hitFlash = 0;
    this.stagger = 0;
    this.dead = false;

    this.frame = 0;
    this.frameTimer = 0;

    // Current attack data
    this.currentAttack = null;
    this.telegraphZone = null;  // { x, y, width, height } to warn player

    // Spawn reference resolved by Game when creating
    this.type = { id: "boss", name: "Ancient Warden", color: "#c040ff", staggerResist: 0.75, knockback: 3 };
  }

  update(player, platforms, game) {
    // Phase transition
    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.stateTimer = 60;
      this.state = "phase_transition";
      game.audio.bossRoar();
      game.camera.shake(12, 30);
      game.particles.spawn(this.x + this.width / 2, this.y + this.height / 2, {
        count: 30, color: "#ff4060",
        speedMin: 3, speedMax: 8, life: 40, size: 5,
      });
      game.ui.showMessage("ENRAGED!", 80);
    }

    // Frame animation
    this.frameTimer++;
    if (this.frameTimer >= 18) {
      this.frame = 1 - this.frame;
      this.frameTimer = 0;
    }

    // Face player
    const pcx = player.x + player.width / 2;
    const mcx = this.x + this.width / 2;
    if (this.state === "idle" || this.state === "chase") {
      this.facing = pcx < mcx ? -1 : 1;
    }

    // Stagger
    if (this.stagger > 0) {
      this.stagger--;
      this.vx = 0;
      this.vx += this.knockbackX * 0.3;   // boss resists knockback
      this.knockbackX *= COMBAT.KNOCKBACK_DECAY;
      if (this.hitFlash > 0) this.hitFlash--;
      applyPhysics(this, platforms);
      return;
    }

    // State machine
    this.stateTimer--;

    switch (this.state) {
      case "phase_transition":
        this.vx = 0;
        if (this.stateTimer <= 0) {
          this.state = "idle";
          this.stateTimer = 40;
        }
        break;

      case "idle":
        // Walk slowly toward player
        const dist = Math.abs(pcx - mcx);
        this.vx = this.facing * (this.phase === 2 ? 1.5 : 0.9);
        if (this.stateTimer <= 0) {
          this.chooseAttack(dist, player, game);
        }
        break;

      case "telegraph":
        this.vx = 0;
        if (this.stateTimer <= 0) this.executeAttack(player, game);
        break;

      case "execute":
        this.vx = 0;
        if (this.stateTimer <= 0) {
          this.state = "recover";
          this.stateTimer = this.phase === 2 ? 30 : 50;
          this.telegraphZone = null;
          this.currentAttack = null;
        }
        break;

      case "recover":
        this.vx = 0;
        if (this.stateTimer <= 0) {
          this.state = "idle";
          this.stateTimer = this.phase === 2 ? 40 : 70;
        }
        break;

      case "dashing":
        // Dash continues, damage on contact
        this.checkDashHit(player);
        if (this.stateTimer <= 0 || this.onGround === false) {
          this.state = "recover";
          this.stateTimer = 40;
          this.vx = 0;
        }
        break;
    }

    this.knockbackX *= COMBAT.KNOCKBACK_DECAY;
    this.vx += this.knockbackX;
    if (this.hitFlash > 0) this.hitFlash--;

    applyPhysics(this, platforms);

    // Contact damage (only when idle/chasing — not during telegraph/recover)
    if (this.state === "idle") this.tryDamagePlayer(player);
  }

  chooseAttack(dist, player, game) {
    const roll = Math.random();
    const attacks = this.phase === 1
      ? ["slam", "fireball"]
      : ["slam", "triple_shot", "dash"];
    const choice = attacks[Math.floor(Math.random() * attacks.length)];

    this.currentAttack = choice;
    this.state = "telegraph";

    if (choice === "slam") {
      // Warn with a ground zone in front of boss
      const dir = this.facing;
      const zoneW = 160;
      this.telegraphZone = {
        x: dir === 1 ? this.x + this.width : this.x - zoneW,
        y: this.y + this.height - 30,
        width: zoneW,
        height: 30,
      };
      this.stateTimer = 50;  // telegraph frames
    } else if (choice === "fireball") {
      this.telegraphZone = null;
      this.stateTimer = 40;
    } else if (choice === "triple_shot") {
      this.telegraphZone = null;
      this.stateTimer = 45;
    } else if (choice === "dash") {
      // Face player before dashing
      this.facing = (player.x + player.width / 2 < this.x + this.width / 2) ? -1 : 1;
      // Warn with a horizontal strip
      this.telegraphZone = {
        x: this.facing === 1 ? this.x : this.x - 400,
        y: this.y + 20,
        width: this.width + 400,
        height: this.height - 30,
      };
      this.stateTimer = 60;
    }

    game.audio.bossCharge();
  }

  executeAttack(player, game) {
    const dir = this.facing;

    if (this.currentAttack === "slam") {
      // Damage anyone in the telegraph zone
      if (this.telegraphZone && this.overlapsBox(this.telegraphZone, player)) {
        player.takeDamage(28, this.x + this.width / 2);
      }
      game.camera.shake(10, 20);
      game.particles.spawn(
        this.telegraphZone.x + this.telegraphZone.width / 2,
        this.telegraphZone.y + this.telegraphZone.height / 2,
        { count: 18, color: "#ff4060", speedMin: 3, speedMax: 7, life: 30, size: 4, gravity: 0.2 }
      );
      game.audio.skillCast("slam");
      this.state = "execute";
      this.stateTimer = 10;
    } else if (this.currentAttack === "fireball") {
      const px = dir === 1 ? this.x + this.width : this.x;
      const py = this.y + this.height / 2;
      game.bossProjectiles.push(new BossProjectile(
        px, py, dir * 6, 0, 20, 150, "#ff4060"
      ));
      game.audio.skillCast("projectile");
      this.state = "execute";
      this.stateTimer = 10;
    } else if (this.currentAttack === "triple_shot") {
      const px = dir === 1 ? this.x + this.width : this.x;
      const py = this.y + this.height / 2;
      // Spread of 3
      for (let i = -1; i <= 1; i++) {
        game.bossProjectiles.push(new BossProjectile(
          px, py, dir * 6, i * 2, 18, 140, "#ff4060"
        ));
      }
      game.audio.skillCast("projectile");
      this.state = "execute";
      this.stateTimer = 10;
    } else if (this.currentAttack === "dash") {
      this.vx = dir * 11;
      this.state = "dashing";
      this.stateTimer = 22;
      game.audio.skillCast("dash");
    }
  }

  checkDashHit(player) {
    if (player.isDead) return;
    const overlap =
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y;
    if (overlap) {
      player.takeDamage(32, this.x + this.width / 2);
    }
  }

  overlapsBox(box, player) {
    return (
      box.x < player.x + player.width &&
      box.x + box.width > player.x &&
      box.y < player.y + player.height &&
      box.y + box.height > player.y
    );
  }

  tryDamagePlayer(player) {
    if (player.isDead) return;
    const overlap =
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y;
    if (overlap) player.takeDamage(this.contactDamage, this.x + this.width / 2);
  }

  takeDamage(amount, sourceX) {
    this.hp -= amount;
    this.hitFlash = COMBAT.HIT_FLASH_FRAMES;
    const dir = sourceX < this.x + this.width / 2 ? 1 : -1;
    this.knockbackX = dir * this.type.knockback;
    if (Math.random() > this.type.staggerResist) {
      this.stagger = Math.floor(COMBAT.STAGGER_FRAMES * 0.5);
    }
    if (this.hp <= 0) this.dead = true;
  }

  render(ctx) {
    // Telegraph warning indicator
    if (this.telegraphZone && this.state === "telegraph") {
      const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 80);
      ctx.fillStyle = `rgba(255, 64, 96, ${pulse * 0.6})`;
      ctx.fillRect(
        this.telegraphZone.x, this.telegraphZone.y,
        this.telegraphZone.width, this.telegraphZone.height
      );
      ctx.strokeStyle = `rgba(255, 200, 50, ${pulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(
        this.telegraphZone.x + 1.5, this.telegraphZone.y + 1.5,
        this.telegraphZone.width - 3, this.telegraphZone.height - 3
      );
    }

    // Sprite
    const dir = this.facing === 1 ? "right" : "left";
    const key = `boss_${dir}_p${this.phase}_${this.frame}`;
    if (this.hitFlash > 0) {
      // Flash white overlay
      ctx.save();
      ctx.filter = "brightness(3)";
      drawSprite(ctx, key, this.x, this.y, this.width, this.height);
      ctx.restore();
    } else {
      drawSprite(ctx, key, this.x, this.y, this.width, this.height);
    }

    // Stagger indicator
    if (this.stagger > 0) {
      ctx.fillStyle = "#ffd23f";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!!", this.x + this.width / 2, this.y - 10);
    }
  }
}
