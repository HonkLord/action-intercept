import { showActionPrompt } from "./ui.js";
import { getConfiguredTriggers } from "./settings.js";

export function registerHooks() {
  Hooks.on("dnd5e.preUseItem", handleItemUse);
}

async function handleItemUse(item, config, options) {
  const actor = item.actor;
  if (!actor) return true;

  const triggers = getConfiguredTriggers(actor.id);
  if (!triggers || triggers.length === 0) return true;

  const itemType = item.type; // 'weapon', 'spell', 'feat', etc.
  const matchingTriggers = triggers.filter(
    (t) => t.itemType === itemType || t.itemType === "any"
  );

  if (matchingTriggers.length === 0) return true;

  const macroOptions = matchingTriggers.flatMap((trigger) =>
    trigger.macros.map((macroId) => {
      const macro = game.macros.get(macroId);
      return {
        id: macroId,
        name: macro.name,
        img: macro.data.img,
        execute: async () => {
          await macro.execute({ item, config, options });
          // After executing the macro, we continue with the original item use
          return true;
        },
      };
    })
  );

  // Add an option to proceed without using any macro
  macroOptions.push({
    id: "proceed",
    name: "Proceed without modification",
    img: "icons/svg/d20-black.svg",
    execute: async () => true,
  });

  const selectedOption = await showActionPrompt(macroOptions);
  if (selectedOption) {
    return selectedOption.execute();
  }

  return true; // If no option was selected, proceed with the original action
}
