import { renderModalBg } from "./UiPrimitives.js";

export function renderStatsMenu(ctx, game) {
  const { stats, player, canvas } = game;
  renderModalBg(ctx, canvas);

  const w = 440;
  const h = 320;
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
  ctx.fillText("STATS", x + w / 2, y + 34);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#4ade80";
  ctx.fillText(`Points Available: ${stats.availablePoints}`, x + w / 2, y + 58);

  const rows = [
    { k: "1", label: "STR", v: stats.str, hint: "+damage" },
    { k: "2", label: "DEX", v: stats.dex, hint: "+crit %" },
    { k: "3", label: "VIT", v: stats.vit, hint: "+max HP" },
    { k: "4", label: "LUK", v: stats.luk, hint: "+drop rate" },
  ];
  ctx.textAlign = "left";
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const ry = y + 96 + i * 34;
    ctx.fillStyle = stats.availablePoints > 0 ? "#4ade80" : "#666";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`[${r.k}]`, x + 28, ry);
    ctx.fillStyle = "#fff";
    ctx.fillText(r.label, x + 64, ry);
    ctx.fillStyle = "#ffd23f";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${r.v}`, x + 130, ry);
    ctx.fillStyle = "#888";
    ctx.font = "12px sans-serif";
    ctx.fillText(r.hint, x + 180, ry);
  }

  ctx.fillStyle = "#aaa";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `Derived: DMG ${player.damage} • CRIT ${Math.round(player.critChance * 100)}% • HP ${player.maxHp}`,
    x + w / 2, y + h - 40
  );
  ctx.fillStyle = "#666";
  ctx.fillText("Press 1–4 to allocate • C to close", x + w / 2, y + h - 18);
}
