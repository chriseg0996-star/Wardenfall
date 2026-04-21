// ============================================================
// Portal.js
// Triggers a map transition when the player overlaps it AND
// presses the interact key (Up / W). A visual pulse indicates
// when the player is inside the activation zone.
// ============================================================

import { drawSprite } from "../systems/Sprite.js";

export class Portal {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.width = def.width;
    this.height = def.height;
    this.targetMap = def.targetMap;
    this.targetX = def.targetX;
    this.targetY = def.targetY;
    this.label = def.label;
    this.frameTimer = 0;
    this.frame = 0;
  }

  update() {
    this.frameTimer++;
    if (this.frameTimer >= 12) {
      this.frame = 1 - this.frame;
      this.frameTimer = 0;
    }
  }

  overlapsPlayer(player) {
    return (
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    );
  }

  render(ctx, playerInside) {
    // Glow when player is inside
    if (playerInside) {
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#c080ff";
    }
    drawSprite(ctx, `portal_${this.frame}`, this.x, this.y, this.width, this.height);
    if (playerInside) ctx.restore();

    // Label floats above if player is inside
    if (playerInside) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      const textW = ctx.measureText(this.label).width + 12;
      const lx = this.x + this.width / 2;
      const ly = this.y - 12;
      ctx.fillRect(lx - textW / 2, ly - 14, textW, 20);
      ctx.fillStyle = "#fff";
      ctx.fillText(this.label, lx, ly);
      ctx.fillStyle = "#c080ff";
      ctx.font = "10px sans-serif";
      ctx.fillText("↑ to enter", lx, ly + 14);
    }
  }
}
