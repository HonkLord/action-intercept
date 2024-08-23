import {
  showActionPrompt,
  addActionInterceptIndicators,
  openItemConfig,
  showQuickAccessDialog,
} from "./ui.js";
import { getConfiguredTriggers, getSetting } from "./settings.js";

export function registerHooks() {
  Hooks.on("dnd5e.preUseItem", handleItemUse);
  Hooks.on("ready", onReady);
  Hooks.on("tidy5e-sheet.actorItemUseContextMenu", onActorItemUseContextMenu);
  Hooks.on("midi-qol.preItemRoll", onMidiQolPreItemRoll);
}

async function handleItemUse(item, config, options) {
  const actor = item.actor;
  if (!actor) return true;

  const triggers = getConfiguredTriggers(actor.id);
  if (!triggers || triggers.length === 0) return true;

  const itemType = item.type;
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
          return true;
        },
      };
    })
  );

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

  return true;
}

function onReady() {
  console.log("Action Intercept | Ready hook triggered");

  Hooks.on("tidy5e-sheet.ready", (api) => {
    console.log("Tidy5eSheet API is ready:", api);

    Hooks.on("tidy5e-sheet.renderActorSheet", (sheet, element, data) => {
      console.log("Action Intercept | Tidy5eSheet Render Hook Fired");
      addActionInterceptIndicators(api, data.actor, element);
    });
  });
}

function onActorItemUseContextMenu(item, options) {
  console.log("Action Intercept | Adding option to Tidy5e context menu");
  options.push({
    name: "Configure Action Intercept",
    icon: '<i class="fas fa-bolt"></i>',
    condition: () => true,
    callback: () => openItemConfig(item.actor, item.id),
  });
}

async function onMidiQolPreItemRoll(workflow) {
  console.log("Action Intercept | midi-qol.preItemRoll hook fired", workflow);

  const actor = workflow.actor;
  const item = workflow.item;

  if (!actor || !item) {
    console.log("Action Intercept | No actor or item found in workflow");
    return true;
  }

  console.log("Action Intercept | Item roll detected:", item.name);

  const configurations = getSetting("itemConfigurations");
  const itemConfig = configurations[`${actor.id}-${item.id}`];

  console.log("Action Intercept | Item configuration:", itemConfig);

  if (itemConfig && itemConfig.length > 0) {
    console.log("Action Intercept | Quick access items found, showing dialog");
    const result = await showQuickAccessDialog(actor, itemConfig);
    console.log("Action Intercept | Quick access dialog result:", result);
    if (result === "cancel" || result === "used") {
      console.log("Action Intercept | Roll cancelled or quick items used");
      return false;
    }
  } else {
    console.log(
      "Action Intercept | No quick access items configured for this item"
    );
  }

  return true;
}
