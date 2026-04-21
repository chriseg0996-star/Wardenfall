// ============================================================
// UI.js
// Screen-space UI facade. Keeps the same external API while
// delegating rendering and input handling to focused modules.
// ============================================================

import { renderHud, renderTransientUi } from "./ui/HudRenderer.js";
import { handleMenuInput } from "./ui/MenuController.js";
import { renderStatsMenu } from "./ui/StatsPanel.js";
import { renderInventoryMenu } from "./ui/InventoryPanel.js";
import { renderTreeMenu } from "./ui/SkillTreePanel.js";

export class UI {
  constructor() {
    this.message = null;
    this.messageTimer = 0;
    this.openMenu = null; // null | "stats" | "inventory" | "tree"
    this.inventoryCursor = 0;
    this.saveFlashTimer = 0;
  }

  showMessage(text, frames = 120) {
    this.message = text;
    this.messageTimer = frames;
  }

  flashSave() {
    this.saveFlashTimer = 90;
  }

  toggleMenu(name) {
    this.openMenu = this.openMenu === name ? null : name;
    this.inventoryCursor = 0;
  }

  update() {
    if (this.messageTimer > 0) this.messageTimer--;
    if (this.messageTimer <= 0) this.message = null;
    if (this.saveFlashTimer > 0) this.saveFlashTimer--;
  }

  handleMenuInput(input, game) {
    handleMenuInput(this, input, game);
  }

  render(ctx, game) {
    renderHud(ctx, game);
    renderTransientUi(ctx, this, game);

    if (this.openMenu === "stats") renderStatsMenu(ctx, game);
    if (this.openMenu === "inventory") renderInventoryMenu(this, ctx, game);
    if (this.openMenu === "tree") renderTreeMenu(ctx, game);
  }
}
