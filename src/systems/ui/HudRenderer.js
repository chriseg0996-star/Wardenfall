import { COLORS, SKILLS } from "../../config/Constants.js";
import { ITEMS } from "../../config/Items.js";
import { MAPS } from "../../config/Maps.js";
import { countItem, renderBar } from "./UiPrimitives.js";

export function renderHud(ctx, game) {
  const { player, progression, stats, inventory, skills, canvas } = game;
  renderHUDPanel(ctx, player, progression, stats);
  renderComboCounter(ctx, player, canvas);
  renderSkillBar(ctx, player, skills, canvas);
  renderPotionQuickbar(ctx, inventory, canvas);
  renderMapName(ctx, game, canvas);
  if (game.boss && !game.boss.dead) renderBossBar(ctx, game.boss, canvas);
  renderMuteIndicator(ctx, game, canvas);
  renderDebugOverlay(ctx, game, canvas);
}

export function renderTransientUi(ctx, ui, game) {
  renderMessage(ctx, ui, game.canvas);
  renderSaveFlash(ctx, ui, game.canvas);
  if (game.player.isDead) renderDeathOverlay(ctx, game.canvas);
}

function renderHUDPanel(ctx, player, progression, stats) {
  const pad = 12;
  const panelW = 280;
  const panelH = 112;
  ctx.fillStyle = COLORS.UI_BG;
  ctx.fillRect(pad, pad, panelW, panelH);

  ctx.fillStyle = COLORS.UI_TEXT;
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Lv. ${progression.level}`, pad + 10, pad + 22);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#ffd23f";
  ctx.fillText(`🪙 ${player.coins}`, pad + 80, pad + 22);

  if (stats.availablePoints > 0) {
    ctx.fillStyle = "#4ade80";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`+${stats.availablePoints} pts (C)`, pad + 160, pad + 22);
  }
  if (progression.skillPoints > 0) {
    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`+${progression.skillPoints} SP (T)`, pad + 160, pad + 38);
  }

  const barX = pad + 10;
  const barW = panelW - 20;

  renderBar(ctx, barX, pad + 42, barW, 14, player.hp / player.maxHp, COLORS.UI_HP, "#3a0a0a");
  ctx.fillStyle = COLORS.UI_TEXT;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`HP  ${Math.ceil(player.hp)} / ${player.maxHp}`, barX + barW / 2, pad + 53);

  renderBar(ctx, barX, pad + 60, barW, 12, player.mp / player.maxMp, COLORS.UI_MP, "#0a1a3a");
  ctx.fillStyle = COLORS.UI_TEXT;
  ctx.fillText(`MP  ${Math.floor(player.mp)} / ${player.maxMp}`, barX + barW / 2, pad + 69);

  renderBar(ctx, barX, pad + 76, barW, 10, progression.progress, COLORS.UI_EXP, "#3a2a0a");
  ctx.fillStyle = COLORS.UI_TEXT;
  ctx.font = "10px sans-serif";
  ctx.fillText(`EXP ${progression.exp} / ${progression.expToNext}`, barX + barW / 2, pad + 84);

  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = "#aaa";
  ctx.fillText(
    `DMG ${player.damage}  •  CRIT ${Math.round(player.critChance * 100)}%`,
    pad + 10, pad + 102
  );
}

function renderComboCounter(ctx, player, canvas) {
  if (player.comboCount <= 0) return;
  const alpha = Math.min(1, player.comboWindow / 20);
  ctx.globalAlpha = alpha;
  ctx.font = "bold 42px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.fillStyle = player.comboCount >= 2 ? "#ffd23f" : "#ffffff";
  const text = `${player.comboCount + 1} HIT${player.comboCount >= 1 ? "S" : ""}`;
  ctx.strokeText(text, canvas.width / 2, 140);
  ctx.fillText(text, canvas.width / 2, 140);
  ctx.globalAlpha = 1;
}

function renderSkillBar(ctx, player, skills, canvas) {
  const slots = [SKILLS.PROJECTILE, SKILLS.DASH_SLASH, SKILLS.AOE_SLAM];
  const size = 44;
  const gap = 6;
  const totalW = slots.length * size + (slots.length - 1) * gap;
  const startX = canvas.width / 2 - totalW / 2;
  const y = canvas.height - size - 12;

  for (let i = 0; i < slots.length; i++) {
    const def = slots[i];
    const x = startX + i * (size + gap);
    const unlocked = skills.unlocked.has(def.id);
    const cd = skills.cooldowns[def.id] || 0;
    const ready = unlocked && cd <= 0 && player.mp >= def.mpCost;

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = unlocked ? def.color : "#444";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    if (cd > 0 && unlocked) {
      const pct = cd / def.cooldown;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(x, y, size, size * pct);
    }
    if (!unlocked) {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(x, y, size, size);
    }

    ctx.fillStyle = unlocked ? def.color : "#666";
    ctx.globalAlpha = ready ? 1 : 0.45;
    ctx.fillRect(x + 12, y + 12, size - 24, size - 24);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(def.hotkey, x + 3, y + 11);

    ctx.fillStyle = COLORS.UI_MP;
    ctx.font = "9px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${def.mpCost}`, x + size - 3, y + size - 3);
  }
}

function renderPotionQuickbar(ctx, inventory, canvas) {
  const size = 36;
  const gap = 6;
  const pad = 12;
  const slots = [
    { key: "1", itemId: "hp_potion", color: "#e63946" },
    { key: "2", itemId: "mp_potion", color: "#3b82f6" },
    { key: "3", itemId: "greater_hp_potion", color: "#ff8080" },
  ];
  const y = canvas.height - size - pad;

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const x = pad + i * (size + gap);
    const count = countItem(inventory, s.itemId);

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = count > 0 ? s.color : "#444";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

    const tpl = ITEMS[s.itemId];
    if (tpl) {
      ctx.globalAlpha = count > 0 ? 1 : 0.35;
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tpl.icon, x + size / 2, y + size / 2);
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(s.key, x + 3, y + 11);

    if (count > 0) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`×${count}`, x + size - 3, y + size - 3);
    }
  }
}

function renderMapName(ctx, game, canvas) {
  const mapId = game.maps?.currentId;
  if (!mapId) return;
  const name = MAPS[mapId]?.name || mapId;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const w = ctx.measureText(name).width + 24;
  ctx.fillRect(canvas.width - w - 12, 12, w, 24);
  ctx.fillStyle = "#ccc";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(name, canvas.width - 24, 29);
}

function renderBossBar(ctx, boss, canvas) {
  const barW = 480;
  const barH = 18;
  const x = canvas.width / 2 - barW / 2;
  const y = 24;

  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(x - 6, y - 20, barW + 12, barH + 28);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${boss.type.name}   —   Phase ${boss.phase}`, x + barW / 2, y - 5);

  ctx.fillStyle = "#3a0a0a";
  ctx.fillRect(x, y, barW, barH);
  const pct = boss.hp / boss.maxHp;
  const color = boss.phase >= 2 ? "#ff4060" : "#c040ff";
  ctx.fillStyle = color;
  ctx.fillRect(x, y, barW * pct, barH);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x + barW * 0.5 - 1, y, 2, barH);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, barW - 1, barH - 1);

  ctx.fillStyle = "#fff";
  ctx.font = "11px sans-serif";
  ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, x + barW / 2, y + 13);
}

function renderMuteIndicator(ctx, game, canvas) {
  if (game.audio.enabled) return;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(canvas.width - 60, canvas.height - 30, 48, 20);
  ctx.fillStyle = "#888";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🔇 (M)", canvas.width - 36, canvas.height - 16);
}

function renderMessage(ctx, ui, canvas) {
  if (!ui.message) return;
  const alpha = Math.min(1, ui.messageTimer / 20);
  ctx.globalAlpha = alpha;
  ctx.font = "bold 40px sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.fillStyle = "#ffd23f";
  ctx.strokeText(ui.message, canvas.width / 2, canvas.height / 2 - 100);
  ctx.fillText(ui.message, canvas.width / 2, canvas.height / 2 - 100);
  ctx.globalAlpha = 1;
}

function renderSaveFlash(ctx, ui, canvas) {
  if (ui.saveFlashTimer <= 0) return;
  const a = Math.min(1, ui.saveFlashTimer / 30);
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(canvas.width - 140, 40, 128, 28);
  ctx.fillStyle = "#4ade80";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✓ Saved", canvas.width - 76, 59);
  ctx.globalAlpha = 1;
}

function renderDeathOverlay(ctx, canvas) {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ff6b6b";
  ctx.font = "bold 48px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillStyle = "#ddd";
  ctx.font = "18px sans-serif";
  ctx.fillText("Press R to respawn", canvas.width / 2, canvas.height / 2 + 30);
}

function renderDebugOverlay(ctx, game, canvas) {
  if (!game.showDebugOverlay) return;
  const enemyCount = game.enemies?.length || 0;
  const lootCount = game.loot?.length || 0;
  const particleCount = game.particles?.particles?.length || 0;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(10, canvas.height - 90, 250, 78);
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`upd ${game.metrics.updateMs.toFixed(2)}ms`, 18, canvas.height - 64);
  ctx.fillText(`rnd ${game.metrics.renderMs.toFixed(2)}ms`, 18, canvas.height - 48);
  ctx.fillText(`ent e:${enemyCount} l:${lootCount} p:${particleCount}`, 18, canvas.height - 32);
  ctx.fillText("toggle F3", 18, canvas.height - 16);
}
