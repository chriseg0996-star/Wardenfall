import { ITEMS } from "../../config/Items.js";
import { allNodes } from "../../config/SkillTree.js";

export function handleMenuInput(ui, input, game) {
  if (ui.openMenu === "stats") {
    if (input.wasPressed("1")) game.stats.allocate("str") && game.player.recalcStats();
    if (input.wasPressed("2")) game.stats.allocate("dex") && game.player.recalcStats();
    if (input.wasPressed("3")) game.stats.allocate("vit") && game.player.recalcStats();
    if (input.wasPressed("4")) game.stats.allocate("luk") && game.player.recalcStats();
    return;
  }

  if (ui.openMenu === "inventory") {
    const items = game.inventory.items;
    if (items.length > 0) {
      if (input.wasPressed("arrowup", "w")) ui.inventoryCursor = (ui.inventoryCursor - 1 + items.length) % items.length;
      if (input.wasPressed("arrowdown", "s")) ui.inventoryCursor = (ui.inventoryCursor + 1) % items.length;
      if (input.wasPressed("enter", "e")) {
        const inst = items[ui.inventoryCursor];
        if (inst) {
          const tpl = ITEMS[inst.itemId];
          if (tpl?.consumable) {
            game.tryUsePotion(inst.itemId);
          } else {
            game.inventory.equip(inst.uid);
            game.player.recalcStats();
          }
          if (ui.inventoryCursor >= game.inventory.items.length) {
            ui.inventoryCursor = Math.max(0, game.inventory.items.length - 1);
          }
        }
      }
    }
    if (input.wasPressed("7")) { game.inventory.unequip("weapon"); game.player.recalcStats(); }
    if (input.wasPressed("8")) { game.inventory.unequip("armor"); game.player.recalcStats(); }
    if (input.wasPressed("9")) { game.inventory.unequip("accessory"); game.player.recalcStats(); }
    return;
  }

  if (ui.openMenu === "tree") {
    const nodes = allNodes();
    for (let i = 0; i < Math.min(nodes.length, 9); i++) {
      if (input.wasPressed(String(i + 1))) game.tryUnlockNode(nodes[i].id);
    }
  }
}
