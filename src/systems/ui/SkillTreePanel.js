import { canUnlock, TREE_CATEGORIES, allNodes } from "../../config/SkillTree.js";
import { renderModalBg, wrapText } from "./UiPrimitives.js";

export function renderTreeMenu(ctx, game) {
  const { canvas, progression } = game;
  renderModalBg(ctx, canvas);

  const w = 720;
  const h = 440;
  const x = canvas.width / 2 - w / 2;
  const y = canvas.height / 2 - h / 2;
  ctx.fillStyle = "rgba(20,15,35,0.96)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SKILL TREE", x + w / 2, y + 34);

  ctx.font = "14px sans-serif";
  ctx.fillStyle = "#c084fc";
  ctx.fillText(`Skill Points: ${progression.skillPoints}`, x + w / 2, y + 56);

  let legendX = x + 24;
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  for (const cat of TREE_CATEGORIES) {
    ctx.fillStyle = cat.color;
    ctx.fillRect(legendX, y + 68, 10, 10);
    ctx.fillStyle = "#bbb";
    ctx.fillText(cat.name, legendX + 14, y + 77);
    legendX += ctx.measureText(cat.name).width + 40;
  }

  const colW = 120;
  const rowH = 110;
  const gridX = x + 40;
  const gridY = y + 110;
  const nodes = allNodes();
  const nodeRects = new Map();

  nodes.forEach((node, i) => {
    const nx = gridX + node.position.col * colW;
    const ny = gridY + node.position.row * rowH;
    nodeRects.set(node.id, { x: nx, y: ny, w: 105, h: 75, hotkey: i + 1 });
  });

  ctx.lineWidth = 2;
  for (const node of nodes) {
    const childRect = nodeRects.get(node.id);
    for (const reqId of node.requires) {
      const parent = nodeRects.get(reqId);
      if (!parent) continue;
      const unlocked = game.unlockedTreeNodes.has(reqId);
      ctx.strokeStyle = unlocked ? "rgba(192, 132, 252, 0.6)" : "rgba(100,100,100,0.4)";
      ctx.beginPath();
      ctx.moveTo(parent.x + parent.w / 2, parent.y + parent.h);
      ctx.lineTo(childRect.x + childRect.w / 2, childRect.y);
      ctx.stroke();
    }
  }

  for (const node of nodes) {
    const rect = nodeRects.get(node.id);
    const unlocked = game.unlockedTreeNodes.has(node.id);
    const affordable = canUnlock(node.id, game.unlockedTreeNodes, progression.skillPoints);
    const prereqsMet = node.requires.every((r) => game.unlockedTreeNodes.has(r));

    const cat = TREE_CATEGORIES.find((c) => c.id === node.category);
    let bgColor = "#1a1020";
    let borderColor = cat?.color || "#888";
    let textColor = "#fff";
    let opacity = 1;

    if (unlocked) {
      bgColor = cat?.color || "#888";
      borderColor = "#4ade80";
    } else if (!prereqsMet) {
      borderColor = "#444";
      textColor = "#666";
      opacity = 0.5;
    } else if (!affordable) {
      textColor = "#aaa";
      opacity = 0.75;
    }

    ctx.globalAlpha = opacity;
    ctx.fillStyle = bgColor;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = unlocked ? 3 : 2;
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);

    ctx.fillStyle = affordable ? "#4ade80" : "#444";
    ctx.fillRect(rect.x + 3, rect.y + 3, 16, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(rect.hotkey), rect.x + 11, rect.y + 13);

    ctx.textAlign = "center";
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = textColor;
    ctx.fillText(node.name, rect.x + rect.w / 2, rect.y + 28);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = textColor;
    wrapText(ctx, node.description, rect.x + rect.w / 2, rect.y + 42, rect.w - 8, 11);

    ctx.font = "bold 10px sans-serif";
    if (unlocked) {
      ctx.fillStyle = "#4ade80";
      ctx.fillText("✓ UNLOCKED", rect.x + rect.w / 2, rect.y + rect.h - 6);
    } else if (!prereqsMet) {
      ctx.fillStyle = "#888";
      ctx.fillText("🔒 LOCKED", rect.x + rect.w / 2, rect.y + rect.h - 6);
    } else {
      ctx.fillStyle = "#c084fc";
      ctx.fillText(`${node.cost} SP`, rect.x + rect.w / 2, rect.y + rect.h - 6);
    }
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = "#666";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Press 1–8 to unlock nodes • T to close", x + w / 2, y + h - 16);
}
