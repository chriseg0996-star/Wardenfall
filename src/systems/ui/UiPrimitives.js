import { ITEMS } from "../../config/Items.js";

export function renderBar(ctx, x, y, w, h, pct, color, bgColor) {
  pct = Math.max(0, Math.min(1, pct));
  ctx.fillStyle = bgColor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

export function renderModalBg(ctx, canvas) {
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW && line.length > 0) {
      lines.push(line.trim());
      line = w + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  const show = lines.slice(0, 2);
  for (let i = 0; i < show.length; i++) {
    ctx.fillText(show[i], x, y + i * lineH);
  }
}

export function scaledStats(stats, mult = 1) {
  const out = {};
  for (const [k, v] of Object.entries(stats || {})) out[k] = v * mult;
  return out;
}

export function statLabel(k) {
  return {
    damage: "DMG",
    maxHp: "HP",
    critChance: "CRIT",
    dropRate: "DROP",
  }[k] || k;
}

export function slotLabel(slot) {
  return {
    weapon: "Weapon",
    armor: "Armor",
    accessory: "Accessory",
    consumable: "Consumable",
  }[slot] || slot;
}

export function formatStats(stats, mult = 1) {
  if (!stats) return "";
  return Object.entries(stats).map(([k, v]) => {
    const val = v * mult;
    const formatted = (val >= 1 ? Math.round(val) : (val * 100).toFixed(1) + "%");
    const label = statLabel(k);
    return `+${formatted} ${label}`;
  }).join("  ");
}

export function countItem(inventory, itemId) {
  let total = 0;
  for (const inst of inventory.items) {
    if (inst.itemId === itemId) total += (inst.count || 1);
  }
  return total;
}

export function getItemTemplate(itemId) {
  return ITEMS[itemId];
}
