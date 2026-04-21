import { RARITY } from "../../config/Constants.js";
import { ITEMS } from "../../config/Items.js";
import {
  formatStats,
  renderModalBg,
  scaledStats,
  slotLabel,
  statLabel,
} from "./UiPrimitives.js";

export function renderInventoryMenu(ui, ctx, game) {
  const { inventory, canvas } = game;
  renderModalBg(ctx, canvas);

  const w = 580;
  const h = 400;
  const x = canvas.width / 2 - w / 2;
  const y = canvas.height / 2 - h / 2;
  ctx.fillStyle = "rgba(20,20,40,0.95)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("INVENTORY", x + w / 2, y + 30);

  ctx.textAlign = "left";
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#ccc";
  ctx.fillText("Equipped", x + 20, y + 60);

  const slots = [
    { slot: "weapon", key: "7", label: "Weapon" },
    { slot: "armor", key: "8", label: "Armor" },
    { slot: "accessory", key: "9", label: "Accessory" },
  ];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const sy = y + 90 + i * 60;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x + 20, sy, 220, 48);
    ctx.fillStyle = "#888";
    ctx.font = "11px sans-serif";
    ctx.fillText(`[${s.key}] ${s.label}`, x + 28, sy + 14);
    const inst = inventory.equipped[s.slot];
    if (inst) {
      const tpl = ITEMS[inst.itemId];
      const rarity = RARITY[inst.rarity] || RARITY.COMMON;
      ctx.fillStyle = rarity.color;
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`${tpl.icon} ${tpl.name}`, x + 28, sy + 32);
      ctx.fillStyle = "#aaa";
      ctx.font = "10px sans-serif";
      ctx.fillText(formatStats(tpl.stats, rarity.mult), x + 28, sy + 44);
    } else {
      ctx.fillStyle = "#555";
      ctx.font = "italic 13px sans-serif";
      ctx.fillText("— empty —", x + 28, sy + 34);
    }
  }

  ctx.fillStyle = "#ccc";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText(`Bag (${inventory.items.length}/${inventory.capacity})`, x + 280, y + 60);

  const listX = x + 280;
  const listY = y + 78;
  const rowH = 26;
  const visibleRows = 11;
  const startIdx = Math.max(0, Math.min(
    inventory.items.length - visibleRows,
    ui.inventoryCursor - Math.floor(visibleRows / 2)
  ));
  for (let i = 0; i < visibleRows; i++) {
    const idx = startIdx + i;
    const inst = inventory.items[idx];
    if (!inst) break;
    const ry = listY + i * rowH;
    const tpl = ITEMS[inst.itemId];
    const rarity = RARITY[inst.rarity] || RARITY.COMMON;

    if (idx === ui.inventoryCursor) {
      ctx.fillStyle = "rgba(96,165,250,0.25)";
      ctx.fillRect(listX, ry - 2, 270, rowH - 2);
    }
    ctx.fillStyle = rarity.color;
    ctx.font = "bold 13px sans-serif";
    const countStr = inst.count > 1 ? ` ×${inst.count}` : "";
    ctx.fillText(`${tpl.icon} ${tpl.name}${countStr}`, listX + 6, ry + 14);
    ctx.fillStyle = "#777";
    ctx.font = "10px sans-serif";
    ctx.fillText(tpl.consumable ? "Use" : rarity.name, listX + 210, ry + 14);
  }

  if (inventory.items.length === 0) {
    ctx.fillStyle = "#555";
    ctx.font = "italic 13px sans-serif";
    ctx.fillText("Your bag is empty. Kill stuff!", listX + 6, listY + 18);
  }

  const hovered = inventory.items[ui.inventoryCursor];
  if (hovered) renderItemTooltip(hovered, inventory, ctx, x + w + 8, y + 78, canvas);

  ctx.fillStyle = "#666";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("↑/↓ • Enter = Equip/Use • 7/8/9 unequip • B to close", x + w / 2, y + h - 18);
}

function renderItemTooltip(inst, inventory, ctx, anchorX, anchorY, canvas) {
  const tpl = ITEMS[inst.itemId];
  if (!tpl) return;
  const rarity = RARITY[inst.rarity] || RARITY.COMMON;

  const lines = [];
  lines.push({ text: `${tpl.icon} ${tpl.name}`, color: rarity.color, font: "bold 14px sans-serif" });

  if (tpl.consumable) {
    lines.push({ text: "Consumable", color: "#aaa", font: "11px sans-serif" });
    if (tpl.effect?.heal) lines.push({ text: `Restores ${tpl.effect.heal} HP`, color: "#ff9898", font: "12px sans-serif" });
    if (tpl.effect?.restoreMp) lines.push({ text: `Restores ${tpl.effect.restoreMp} MP`, color: "#7ab8ff", font: "12px sans-serif" });
    if (inst.count > 1) lines.push({ text: `Stack: ${inst.count}`, color: "#888", font: "11px sans-serif" });
    lines.push({ text: "", color: "#000", font: "11px sans-serif" });
    lines.push({ text: "Enter to use", color: "#4ade80", font: "11px sans-serif" });
  } else {
    lines.push({ text: `${rarity.name} ${slotLabel(tpl.slot)}`, color: "#aaa", font: "11px sans-serif" });
    lines.push({ text: "", color: "#000", font: "11px sans-serif" });

    const hoveredStats = scaledStats(tpl.stats, rarity.mult);
    const equippedInst = inventory.equipped[tpl.slot];
    let equippedStats = null;
    if (equippedInst) {
      const eTpl = ITEMS[equippedInst.itemId];
      const eRar = RARITY[equippedInst.rarity] || RARITY.COMMON;
      equippedStats = scaledStats(eTpl?.stats || {}, eRar.mult);
    }

    const hoveredPower = Object.values(hoveredStats).reduce((s, v) => s + v, 0);
    const equippedPower = equippedStats ? Object.values(equippedStats).reduce((s, v) => s + v, 0) : 0;
    const keys = new Set([...Object.keys(hoveredStats), ...Object.keys(equippedStats || {})]);
    for (const k of keys) {
      const newVal = hoveredStats[k] || 0;
      const curVal = (equippedStats && equippedStats[k]) || 0;
      const delta = newVal - curVal;
      const label = statLabel(k);
      const fmt = (v) => k === "critChance" || k === "dropRate" ? `${(v * 100).toFixed(1)}%` : `${Math.round(v)}`;
      const main = `+${fmt(newVal)} ${label}`;

      let deltaText = "";
      let deltaColor = "#888";
      if (equippedInst) {
        if (delta > 0.001) { deltaText = ` (+${fmt(Math.abs(delta))})`; deltaColor = "#4ade80"; }
        else if (delta < -0.001) { deltaText = ` (-${fmt(Math.abs(delta))})`; deltaColor = "#ef4444"; }
        else { deltaText = " (=)"; deltaColor = "#888"; }
      }

      lines.push({
        text: main,
        color: "#ddd",
        font: "12px sans-serif",
        extra: deltaText,
        extraColor: deltaColor,
      });
    }

    lines.push({ text: "", color: "#000", font: "11px sans-serif" });
    if (!equippedInst) lines.push({ text: "(no item equipped)", color: "#666", font: "italic 11px sans-serif" });
    else if (hoveredPower > equippedPower + 0.01) lines.push({ text: "▲ UPGRADE", color: "#4ade80", font: "bold 12px sans-serif" });
    else if (hoveredPower < equippedPower - 0.01) lines.push({ text: "▼ WORSE", color: "#ef4444", font: "bold 12px sans-serif" });
    else lines.push({ text: "= Sidegrade", color: "#888", font: "bold 12px sans-serif" });

    lines.push({ text: "", color: "#000", font: "11px sans-serif" });
    lines.push({ text: "Enter to equip", color: "#4ade80", font: "11px sans-serif" });
  }

  const padX = 10;
  const padY = 10;
  const lineH = 16;
  let maxW = 0;
  for (const line of lines) {
    ctx.font = line.font;
    const w = ctx.measureText(line.text + (line.extra || "")).width;
    if (w > maxW) maxW = w;
  }
  const panelW = Math.max(180, maxW + padX * 2);
  const panelH = lines.length * lineH + padY * 2;

  let px = anchorX;
  let py = anchorY;
  if (px + panelW > canvas.width - 8) {
    const invLeft = (canvas.width - 580) / 2;
    px = invLeft - panelW - 8;
  }
  if (px < 8) px = 8;
  if (py + panelH > canvas.height - 8) py = canvas.height - panelH - 8;

  ctx.fillStyle = "rgba(10,10,20,0.96)";
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = rarity.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 0.5, py + 0.5, panelW - 1, panelH - 1);

  ctx.textAlign = "left";
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.text && !line.extra) continue;
    const ly = py + padY + i * lineH + 12;
    ctx.font = line.font;
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, px + padX, ly);
    if (line.extra) {
      const base = ctx.measureText(line.text).width;
      ctx.fillStyle = line.extraColor;
      ctx.fillText(line.extra, px + padX + base, ly);
    }
  }
}
